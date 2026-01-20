const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Applicant = require('../models/Applicant');
const { verifyToken } = require('./auth');
const mongoose = require('mongoose');

// Get analytics dashboard data
router.get('/dashboard', verifyToken, async (req, res) => {
    try {
        const employerId = req.employerId;

        // Get all jobs for this employer
        const jobs = await Job.find({ employerId }).select('_id');
        const jobIds = jobs.map(job => job._id);

        // Total job views
        const totalViews = await Job.aggregate([
            { $match: { employerId: new mongoose.Types.ObjectId(employerId) } },
            { $group: { _id: null, total: { $sum: '$views' } } }
        ]);

        // Total applications
        const totalApplications = await Applicant.countDocuments({
            'applications.jobId': { $in: jobIds }
        });

        // Successful hires
        const successfulHires = await Applicant.countDocuments({
            'applications.jobId': { $in: jobIds },
            'applications.status': 'hired'
        });

        // Conversion rate
        const conversionRate = totalApplications > 0 
            ? (successfulHires / totalApplications * 100).toFixed(1)
            : 0;

        // Applications by location
        const applicationsByLocation = await Applicant.aggregate([
            { $match: { 'applications.jobId': { $in: jobIds } } },
            { $group: { _id: '$location', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Skill demand analysis
        const skillDemand = await Job.aggregate([
            { $match: { employerId: new mongoose.Types.ObjectId(employerId) } },
            { $unwind: '$requiredSkills' },
            { $group: { _id: '$requiredSkills', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            totalViews: totalViews[0]?.total || 0,
            totalApplications,
            successfulHires,
            conversionRate: parseFloat(conversionRate),
            applicationsByLocation,
            skillDemand
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get prescriptive insights with filtering
router.get('/insights', verifyToken, async (req, res) => {
    try {
        const employerId = req.employerId;
        const { jobId, startDate, endDate, department } = req.query;
        
        let jobQuery = { employerId };
        if (jobId) jobQuery._id = jobId;
        if (department) jobQuery.department = department;
        
        const jobs = await Job.find(jobQuery).select('_id requiredSkills department');
        const jobIds = jobs.map(job => job._id);

        let applicantQuery = { 'applications.jobId': { $in: jobIds } };
        if (startDate || endDate) {
            applicantQuery['applications.appliedAt'] = {};
            if (startDate) applicantQuery['applications.appliedAt'].$gte = new Date(startDate);
            if (endDate) applicantQuery['applications.appliedAt'].$lte = new Date(endDate);
        }

        // Get all applicants
        const applicants = await Applicant.find(applicantQuery);

        // Analyze skill gaps
        const skillGaps = [];
        const requiredSkills = new Set();
        jobs.forEach(job => {
            job.requiredSkills.forEach(skill => requiredSkills.add(skill));
        });

        requiredSkills.forEach(skill => {
            const jobsRequiringSkill = jobs.filter(job => 
                job.requiredSkills.includes(skill)
            ).length;
            const applicantsWithSkill = applicants.filter(applicant =>
                applicant.skills.some(s => s.skill === skill)
            ).length;

            const demandPercentage = (jobsRequiringSkill / jobs.length * 100).toFixed(0);
            const supplyPercentage = applicants.length > 0
                ? (applicantsWithSkill / applicants.length * 100).toFixed(0)
                : 0;

            skillGaps.push({
                skill,
                demandPercentage: parseInt(demandPercentage),
                supplyPercentage: parseInt(supplyPercentage),
                gap: parseInt(demandPercentage) - parseInt(supplyPercentage)
            });
        });

        // Get hiring trends
        const applicationsByDate = await Applicant.aggregate([
            { $match: applicantQuery },
            { $unwind: '$applications' },
            { $match: { 'applications.jobId': { $in: jobIds } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$applications.appliedAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            skillGaps: skillGaps.sort((a, b) => b.gap - a.gap),
            hiringTrends: applicationsByDate
        });
    } catch (error) {
        console.error('Get insights error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get time-to-hire metrics
router.get('/time-to-hire', verifyToken, async (req, res) => {
    try {
        const employerId = req.employerId;
        const { jobId, startDate, endDate } = req.query;
        
        let jobQuery = { employerId };
        if (jobId) jobQuery._id = jobId;
        
        const jobs = await Job.find(jobQuery).select('_id');
        const jobIds = jobs.map(job => job._id);

        let applicantQuery = {
            'applications.jobId': { $in: jobIds },
            'applications.status': 'hired'
        };
        
        if (startDate || endDate) {
            applicantQuery['applications.hiredAt'] = {};
            if (startDate) applicantQuery['applications.hiredAt'].$gte = new Date(startDate);
            if (endDate) applicantQuery['applications.hiredAt'].$lte = new Date(endDate);
        }

        const hiredApplicants = await Applicant.find(applicantQuery);

        const timeToHireData = hiredApplicants.map(applicant => {
            const application = applicant.applications.find(app => 
                app.status === 'hired' && jobIds.includes(app.jobId.toString())
            );
            
            if (application && application.appliedAt && application.hiredAt) {
                const appliedDate = new Date(application.appliedAt);
                const hiredDate = new Date(application.hiredAt);
                const daysToHire = Math.ceil((hiredDate - appliedDate) / (1000 * 60 * 60 * 24));
                
                return {
                    applicantId: applicant._id,
                    applicantName: `${applicant.firstName} ${applicant.lastName}`,
                    jobId: application.jobId,
                    appliedAt: application.appliedAt,
                    hiredAt: application.hiredAt,
                    daysToHire
                };
            }
            return null;
        }).filter(item => item !== null);

        const avgTimeToHire = timeToHireData.length > 0
            ? timeToHireData.reduce((sum, item) => sum + item.daysToHire, 0) / timeToHireData.length
            : 0;

        res.json({
            averageDaysToHire: Math.round(avgTimeToHire * 10) / 10,
            totalHires: timeToHireData.length,
            timeToHireData
        });
    } catch (error) {
        console.error('Get time-to-hire error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Export reports (CSV format)
router.get('/export', verifyToken, async (req, res) => {
    try {
        const { type = 'applicants', format = 'csv', jobId, startDate, endDate } = req.query;
        const employerId = req.employerId;
        
        let jobQuery = { employerId };
        if (jobId) jobQuery._id = jobId;
        
        const jobs = await Job.find(jobQuery).select('_id title');
        const jobIds = jobs.map(job => job._id);

        if (type === 'applicants') {
            let applicantQuery = { 'applications.jobId': { $in: jobIds } };
            if (startDate || endDate) {
                applicantQuery['applications.appliedAt'] = {};
                if (startDate) applicantQuery['applications.appliedAt'].$gte = new Date(startDate);
                if (endDate) applicantQuery['applications.appliedAt'].$lte = new Date(endDate);
            }

            const applicants = await Applicant.find(applicantQuery)
                .populate('applications.jobId', 'title');

            // Generate CSV
            const csvHeaders = 'Name,Email,Phone,Location,Job Title,Match Score,Status,Applied Date\n';
            const csvRows = applicants.map(applicant => {
                const application = applicant.applications.find(app => 
                    jobIds.includes(app.jobId._id.toString())
                );
                if (!application) return '';
                
                const appliedDate = application.appliedAt 
                    ? new Date(application.appliedAt).toLocaleDateString()
                    : '';
                
                return `"${applicant.firstName} ${applicant.lastName}","${applicant.email}","${applicant.phone || ''}","${applicant.location || ''}","${application.jobId.title}","${application.matchScore || 0}%","${application.status}","${appliedDate}"`;
            }).filter(row => row !== '').join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=applicants-report-${Date.now()}.csv`);
            res.send(csvHeaders + csvRows);
        } else if (type === 'jobs') {
            const jobsData = await Job.find(jobQuery)
                .populate('applications', 'firstName lastName');

            const csvHeaders = 'Title,Department,Location,Status,Applicants,Posted Date\n';
            const csvRows = jobsData.map(job => {
                const postedDate = job.createdAt 
                    ? new Date(job.createdAt).toLocaleDateString()
                    : '';
                
                return `"${job.title}","${job.department || ''}","${job.location || ''}","${job.status}","${job.applications.length}","${postedDate}"`;
            }).join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=jobs-report-${Date.now()}.csv`);
            res.send(csvHeaders + csvRows);
        } else {
            res.status(400).json({ error: 'Invalid report type' });
        }
    } catch (error) {
        console.error('Export report error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;


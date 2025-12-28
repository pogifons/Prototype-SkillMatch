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

// Get prescriptive insights
router.get('/insights', verifyToken, async (req, res) => {
    try {
        const employerId = req.employerId;
        const jobs = await Job.find({ employerId }).select('_id requiredSkills');
        const jobIds = jobs.map(job => job._id);

        // Get all applicants
        const applicants = await Applicant.find({
            'applications.jobId': { $in: jobIds }
        });

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
            { $match: { 'applications.jobId': { $in: jobIds } } },
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

module.exports = router;


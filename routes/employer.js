const express = require('express');
const router = express.Router();
const Employer = require('../models/Employer');
const Job = require('../models/Job');
const Applicant = require('../models/Applicant');
const { verifyToken } = require('./auth');

// Get employer dashboard data
router.get('/dashboard', verifyToken, async (req, res) => {
    try {
        const employerId = req.employerId;

        // Get statistics
        const activeJobs = await Job.countDocuments({ 
            employerId, 
            status: 'active' 
        });

        const jobs = await Job.find({ employerId }).select('_id');
        const jobIds = jobs.map(job => job._id);

        const newApplicants = await Applicant.countDocuments({
            'applications.jobId': { $in: jobIds },
            'applications.status': 'new',
            'applications.appliedAt': {
                $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
        });

        const interviewsScheduled = await Applicant.countDocuments({
            'applications.jobId': { $in: jobIds },
            'applications.status': 'interview'
        });

        // Calculate AI match accuracy (placeholder - would need actual matching algorithm)
        const aiMatchAccuracy = 89; // This would be calculated based on actual matches

        // Get recent applicants
        const recentApplicants = await Applicant.find({
            'applications.jobId': { $in: jobIds }
        })
        .populate('applications.jobId', 'title location')
        .sort({ 'applications.appliedAt': -1 })
        .limit(10);

        // Get recent jobs
        const recentJobs = await Job.find({ employerId })
            .populate('applications', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            stats: {
                activeJobs,
                newApplicants,
                interviewsScheduled,
                aiMatchAccuracy
            },
            recentApplicants,
            recentJobs
        });
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const Applicant = require('../models/Applicant');
const Job = require('../models/Job');
const { verifyToken } = require('./auth');

// Get all applicants for employer's jobs
router.get('/', verifyToken, async (req, res) => {
    try {
        // Get all jobs for this employer
        const jobs = await Job.find({ employerId: req.employerId }).select('_id');
        const jobIds = jobs.map(job => job._id);

        // Get all applicants who applied to these jobs
        const applicants = await Applicant.find({
            'applications.jobId': { $in: jobIds }
        }).populate('applications.jobId', 'title');

        res.json(applicants);
    } catch (error) {
        console.error('Get applicants error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get applicants for a specific job
router.get('/job/:jobId', verifyToken, async (req, res) => {
    try {
        // Verify job belongs to employer
        const job = await Job.findOne({
            _id: req.params.jobId,
            employerId: req.employerId
        });

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const applicants = await Applicant.find({
            'applications.jobId': req.params.jobId
        });

        res.json(applicants);
    } catch (error) {
        console.error('Get job applicants error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single applicant details
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const applicant = await Applicant.findById(req.params.id)
            .populate('applications.jobId', 'title department location');

        if (!applicant) {
            return res.status(404).json({ error: 'Applicant not found' });
        }

        res.json(applicant);
    } catch (error) {
        console.error('Get applicant error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update applicant status
router.put('/:id/status', verifyToken, async (req, res) => {
    try {
        const { jobId, status } = req.body;

        const applicant = await Applicant.findById(req.params.id);
        if (!applicant) {
            return res.status(404).json({ error: 'Applicant not found' });
        }

        // Update application status
        const application = applicant.applications.find(
            app => app.jobId.toString() === jobId
        );

        if (application) {
            application.status = status;
            await applicant.save();
        }

        res.json(applicant);
    } catch (error) {
        console.error('Update applicant status error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get applicant statistics
router.get('/stats/summary', verifyToken, async (req, res) => {
    try {
        const jobs = await Job.find({ employerId: req.employerId }).select('_id');
        const jobIds = jobs.map(job => job._id);

        const totalApplicants = await Applicant.countDocuments({
            'applications.jobId': { $in: jobIds }
        });

        const newApplicants = await Applicant.countDocuments({
            'applications.jobId': { $in: jobIds },
            'applications.status': 'new'
        });

        const shortlisted = await Applicant.countDocuments({
            'applications.jobId': { $in: jobIds },
            'applications.status': 'shortlisted'
        });

        const interviews = await Applicant.countDocuments({
            'applications.jobId': { $in: jobIds },
            'applications.status': 'interview'
        });

        const hired = await Applicant.countDocuments({
            'applications.jobId': { $in: jobIds },
            'applications.status': 'hired'
        });

        res.json({
            totalApplicants,
            newApplicants,
            shortlisted,
            interviews,
            hired
        });
    } catch (error) {
        console.error('Get applicant stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;


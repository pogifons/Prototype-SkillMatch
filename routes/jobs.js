const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const { verifyToken } = require('./auth');

// Get all jobs for an employer
router.get('/', verifyToken, async (req, res) => {
    try {
        const jobs = await Job.find({ employerId: req.employerId })
            .populate('applications', 'firstName lastName email')
            .sort({ createdAt: -1 });
        res.json(jobs);
    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single job
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const job = await Job.findOne({
            _id: req.params.id,
            employerId: req.employerId
        }).populate('applications');
        
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json(job);
    } catch (error) {
        console.error('Get job error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new job
router.post('/', verifyToken, async (req, res) => {
    try {
        const jobData = {
            ...req.body,
            employerId: req.employerId
        };

        const job = new Job(jobData);
        await job.save();
        res.status(201).json(job);
    } catch (error) {
        console.error('Create job error:', error);
        res.status(500).json({ error: 'Server error creating job' });
    }
});

// Update job
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const job = await Job.findOneAndUpdate(
            { _id: req.params.id, employerId: req.employerId },
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json(job);
    } catch (error) {
        console.error('Update job error:', error);
        res.status(500).json({ error: 'Server error updating job' });
    }
});

// Delete job
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const job = await Job.findOneAndDelete({
            _id: req.params.id,
            employerId: req.employerId
        });

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        console.error('Delete job error:', error);
        res.status(500).json({ error: 'Server error deleting job' });
    }
});

// Get job statistics
router.get('/stats/summary', verifyToken, async (req, res) => {
    try {
        const totalJobs = await Job.countDocuments({ employerId: req.employerId });
        const activeJobs = await Job.countDocuments({ 
            employerId: req.employerId, 
            status: 'active' 
        });
        const totalApplications = await Job.aggregate([
            { $match: { employerId: new mongoose.Types.ObjectId(req.employerId) } },
            { $project: { applicationCount: { $size: '$applications' } } },
            { $group: { _id: null, total: { $sum: '$applicationCount' } } }
        ]);

        res.json({
            totalJobs,
            activeJobs,
            totalApplications: totalApplications[0]?.total || 0
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const Training = require('../models/Training');
const { verifyToken } = require('./auth');

// Get all training programs
router.get('/', async (req, res) => {
    try {
        const trainings = await Training.find()
            .populate('enrollees', 'firstName lastName email')
            .sort({ createdAt: -1 });
        res.json(trainings);
    } catch (error) {
        console.error('Get trainings error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single training program
router.get('/:id', async (req, res) => {
    try {
        const training = await Training.findById(req.params.id)
            .populate('enrollees');
        
        if (!training) {
            return res.status(404).json({ error: 'Training program not found' });
        }
        res.json(training);
    } catch (error) {
        console.error('Get training error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create new training program
router.post('/', verifyToken, async (req, res) => {
    try {
        const training = new Training(req.body);
        await training.save();
        res.status(201).json(training);
    } catch (error) {
        console.error('Create training error:', error);
        res.status(500).json({ error: 'Server error creating training program' });
    }
});

// Update training program
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const training = await Training.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!training) {
            return res.status(404).json({ error: 'Training program not found' });
        }
        res.json(training);
    } catch (error) {
        console.error('Update training error:', error);
        res.status(500).json({ error: 'Server error updating training program' });
    }
});

// Delete training program
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const training = await Training.findByIdAndDelete(req.params.id);

        if (!training) {
            return res.status(404).json({ error: 'Training program not found' });
        }
        res.json({ message: 'Training program deleted successfully' });
    } catch (error) {
        console.error('Delete training error:', error);
        res.status(500).json({ error: 'Server error deleting training program' });
    }
});

// Get training statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const activePrograms = await Training.countDocuments({ status: 'active' });
        const totalEnrollees = await Training.aggregate([
            { $project: { enrolleeCount: { $size: '$enrollees' } } },
            { $group: { _id: null, total: { $sum: '$enrolleeCount' } } }
        ]);

        const totalCertifications = await Training.aggregate([
            { $group: { _id: null, total: { $sum: '$certificationsIssued' } } }
        ]);

        const avgCompletionRate = await Training.aggregate([
            { $group: { _id: null, avg: { $avg: '$completionRate' } } }
        ]);

        res.json({
            activePrograms,
            totalEnrollees: totalEnrollees[0]?.total || 0,
            totalCertifications: totalCertifications[0]?.total || 0,
            avgCompletionRate: avgCompletionRate[0]?.avg || 0
        });
    } catch (error) {
        console.error('Get training stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;


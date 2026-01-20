const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
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

// Update employer profile
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { companyName, industry, address, description, phone, website, logo } = req.body;
        
        const updateData = {};
        if (companyName) updateData.companyName = companyName;
        if (industry !== undefined) updateData.industry = industry;
        if (address !== undefined) updateData.address = address;
        if (description !== undefined) updateData.description = description;
        if (phone !== undefined) updateData.phone = phone;
        if (website !== undefined) updateData.website = website;
        if (logo !== undefined) updateData.logo = logo;
        updateData.updatedAt = Date.now();

        const employer = await Employer.findByIdAndUpdate(
            req.employerId,
            updateData,
            { new: true }
        ).select('-password');

        res.json(employer);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Change password
router.put('/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const employer = await Employer.findById(req.employerId);
        if (!employer) {
            return res.status(404).json({ error: 'Employer not found' });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, employer.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        employer.password = hashedPassword;
        employer.updatedAt = Date.now();
        await employer.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get team members
router.get('/team', verifyToken, async (req, res) => {
    try {
        const employer = await Employer.findById(req.employerId).select('teamMembers');
        res.json({ teamMembers: employer.teamMembers || [] });
    } catch (error) {
        console.error('Get team error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add team member
router.post('/team', verifyToken, async (req, res) => {
    try {
        const { email, role = 'recruiter' } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const employer = await Employer.findById(req.employerId);
        if (!employer) {
            return res.status(404).json({ error: 'Employer not found' });
        }

        // Check if team member already exists
        const existingMember = employer.teamMembers.find(m => m.email === email);
        if (existingMember) {
            return res.status(400).json({ error: 'Team member already exists' });
        }

        employer.teamMembers.push({
            email,
            role,
            addedAt: new Date()
        });

        await employer.save();

        res.json({ message: 'Team member added successfully', teamMembers: employer.teamMembers });
    } catch (error) {
        console.error('Add team member error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Remove team member
router.delete('/team/:email', verifyToken, async (req, res) => {
    try {
        const employer = await Employer.findById(req.employerId);
        if (!employer) {
            return res.status(404).json({ error: 'Employer not found' });
        }

        employer.teamMembers = employer.teamMembers.filter(m => m.email !== req.params.email);
        await employer.save();

        res.json({ message: 'Team member removed successfully', teamMembers: employer.teamMembers });
    } catch (error) {
        console.error('Remove team member error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update team member role
router.put('/team/:email', verifyToken, async (req, res) => {
    try {
        const { role } = req.body;

        const employer = await Employer.findById(req.employerId);
        if (!employer) {
            return res.status(404).json({ error: 'Employer not found' });
        }

        const member = employer.teamMembers.find(m => m.email === req.params.email);
        if (!member) {
            return res.status(404).json({ error: 'Team member not found' });
        }

        member.role = role;
        await employer.save();

        res.json({ message: 'Team member role updated successfully', teamMembers: employer.teamMembers });
    } catch (error) {
        console.error('Update team member role error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update notification preferences
router.put('/notifications', verifyToken, async (req, res) => {
    try {
        const { emailNotifications, newApplicantAlert, interviewReminders, weeklyReports } = req.body;

        const employer = await Employer.findById(req.employerId);
        if (!employer) {
            return res.status(404).json({ error: 'Employer not found' });
        }

        if (!employer.notificationPreferences) {
            employer.notificationPreferences = {};
        }

        if (emailNotifications !== undefined) employer.notificationPreferences.emailNotifications = emailNotifications;
        if (newApplicantAlert !== undefined) employer.notificationPreferences.newApplicantAlert = newApplicantAlert;
        if (interviewReminders !== undefined) employer.notificationPreferences.interviewReminders = interviewReminders;
        if (weeklyReports !== undefined) employer.notificationPreferences.weeklyReports = weeklyReports;

        await employer.save();

        res.json({ 
            message: 'Notification preferences updated successfully',
            notificationPreferences: employer.notificationPreferences
        });
    } catch (error) {
        console.error('Update notifications error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get notification preferences
router.get('/notifications', verifyToken, async (req, res) => {
    try {
        const employer = await Employer.findById(req.employerId).select('notificationPreferences');
        res.json({ notificationPreferences: employer.notificationPreferences || {} });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;


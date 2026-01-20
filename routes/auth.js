const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Employer = require('../models/Employer');

// Register new employer
router.post('/register', async (req, res) => {
    try {
        console.log('Registration request received:', { 
            body: req.body,
            hasCompanyName: !!req.body.companyName,
            hasEmail: !!req.body.email,
            hasPassword: !!req.body.password
        });

        // Check MongoDB connection
        if (mongoose.connection.readyState !== 1) {
            console.error('MongoDB not connected. Ready state:', mongoose.connection.readyState);
            return res.status(503).json({ error: 'Database connection not available. Please try again in a moment.' });
        }

        const { companyName, email, password, industry, address } = req.body;

        // Validate required fields
        if (!companyName || !email || !password) {
            return res.status(400).json({ error: 'Company name, email, and password are required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Check if employer already exists
        const existingEmployer = await Employer.findOne({ email: email.toLowerCase().trim() });
        if (existingEmployer) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new employer
        const employer = new Employer({
            companyName: companyName.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            industry: industry ? industry.trim() : undefined,
            address: address ? address.trim() : undefined
        });

        await employer.save();

        // Generate JWT token
        const token = jwt.sign(
            { employerId: employer._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Employer registered successfully. Account pending verification.',
            token,
            employer: {
                id: employer._id,
                companyName: employer.companyName,
                email: employer.email,
                isVerified: employer.isVerified
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Provide more detailed error messages
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ error: errors.join(', ') });
        }
        
        if (error.code === 11000 || error.codeName === 'DuplicateKey') {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Handle database name case sensitivity error
        if (error.code === 13297) {
            console.error('Database name case mismatch. Please check your MongoDB connection string.');
            return res.status(500).json({ error: 'Database configuration error. Please contact support.' });
        }
        
        if (error.name === 'MongoServerError' || error.name === 'MongoError') {
            return res.status(500).json({ error: 'Database connection error. Please try again.' });
        }
        
        // In development, show more details
        const errorMessage = process.env.NODE_ENV === 'development' 
            ? `Server error: ${error.message}` 
            : 'Server error during registration';
        
        res.status(500).json({ 
            error: errorMessage,
            ...(process.env.NODE_ENV === 'development' && { details: error.stack })
        });
    }
});

// Login employer
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find employer
        const employer = await Employer.findOne({ email });
        if (!employer) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, employer.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { employerId: employer._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            employer: {
                id: employer._id,
                companyName: employer.companyName,
                email: employer.email,
                isVerified: employer.isVerified
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Forgot Password - request reset code
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const employer = await Employer.findOne({ email: email.toLowerCase().trim() });
        if (!employer) {
            // Do not reveal that the email does not exist
            return res.status(200).json({
                message: 'If this email is registered, a reset code has been generated.'
            });
        }

        // Generate a 6-digit numeric reset code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

        employer.resetPasswordToken = resetCode;
        // Code valid for 15 minutes
        employer.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
        await employer.save();

        // NOTE: In a production system, you would send this code via email/SMS.
        // For the capstone prototype, we return the code in the response so it can be tested easily.
        res.json({
            message: 'Password reset code generated successfully.',
            resetCode
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Server error during password reset request' });
    }
});

// Reset Password - verify code and set new password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({ error: 'Email, code, and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const employer = await Employer.findOne({
            email: email.toLowerCase().trim(),
            resetPasswordToken: code,
            resetPasswordExpires: { $gt: new Date() } // not expired
        });

        if (!employer) {
            return res.status(400).json({ error: 'Invalid or expired reset code' });
        }

        // Hash new password and clear reset fields
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        employer.password = hashedPassword;
        employer.resetPasswordToken = null;
        employer.resetPasswordExpires = null;
        await employer.save();

        res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error during password reset' });
    }
});

// Verify token (middleware helper)
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.employerId = decoded.employerId;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Get current employer
router.get('/me', verifyToken, async (req, res) => {
    try {
        const employer = await Employer.findById(req.employerId).select('-password');
        if (!employer) {
            return res.status(404).json({ error: 'Employer not found' });
        }
        res.json(employer);
    } catch (error) {
        console.error('Get employer error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
module.exports.verifyToken = verifyToken;


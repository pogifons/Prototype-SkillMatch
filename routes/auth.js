const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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


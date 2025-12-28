const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Employer = require('../models/Employer');

// Register new employer
router.post('/register', async (req, res) => {
    try {
        const { companyName, email, password, industry, address } = req.body;

        // Check if employer already exists
        const existingEmployer = await Employer.findOne({ email });
        if (existingEmployer) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new employer
        const employer = new Employer({
            companyName,
            email,
            password: hashedPassword,
            industry,
            address
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
        res.status(500).json({ error: 'Server error during registration' });
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


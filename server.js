const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the SkillMatch/public directory
app.use(express.static(path.join(__dirname, 'SkillMatch', 'public')));
app.use('/css', express.static(path.join(__dirname, 'SkillMatch', 'css')));
app.use('/js', express.static(path.join(__dirname, 'SkillMatch', 'public', 'js')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://skillmatchdb:5killm4tch@skillmatch-cluster.rt9ysnv.mongodb.net/skillmatch?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Connected to MongoDB Atlas');
})
.catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
});

// Import routes
const authRoutes = require('./routes/auth');
const employerRoutes = require('./routes/employer');
const jobRoutes = require('./routes/jobs');
const applicantRoutes = require('./routes/applicants');
const trainingRoutes = require('./routes/training');
const analyticsRoutes = require('./routes/analytics');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applicants', applicantRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve HTML files (these routes take precedence over static files)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'SkillMatch', 'public', 'login.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'SkillMatch', 'public', 'login.html'));
});

app.get('/employer', (req, res) => {
    res.sendFile(path.join(__dirname, 'SkillMatch', 'public', 'employer.html'));
});

app.get('/employer.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'SkillMatch', 'public', 'employer.html'));
});

app.get('/jobs', (req, res) => {
    res.sendFile(path.join(__dirname, 'SkillMatch', 'public', 'jobs.html'));
});

app.get('/jobs.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'SkillMatch', 'public', 'jobs.html'));
});

app.get('/applicants', (req, res) => {
    res.sendFile(path.join(__dirname, 'SkillMatch', 'public', 'applicants.html'));
});

app.get('/applicants.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'SkillMatch', 'public', 'applicants.html'));
});

app.get('/training', (req, res) => {
    res.sendFile(path.join(__dirname, 'SkillMatch', 'public', 'training.html'));
});

app.get('/training.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'SkillMatch', 'public', 'training.html'));
});

app.get('/analytics', (req, res) => {
    res.sendFile(path.join(__dirname, 'SkillMatch', 'public', 'analytics.html'));
});

app.get('/analytics.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'SkillMatch', 'public', 'analytics.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});


const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    location: {
        type: String,
        trim: true
    },
    skills: [{
        skill: String,
        level: {
            type: String,
            enum: ['basic', 'intermediate', 'advanced', 'expert']
        },
        yearsOfExperience: Number
    }],
    certifications: [{
        name: String,
        issuer: String,
        date: Date,
        expiryDate: Date
    }],
    experience: [{
        position: String,
        company: String,
        startDate: Date,
        endDate: Date,
        description: String
    }],
    education: [{
        degree: String,
        institution: String,
        year: Number
    }],
    applications: [{
        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job'
        },
        matchScore: Number,
        status: {
            type: String,
            enum: ['new', 'shortlisted', 'interview', 'hired', 'rejected'],
            default: 'new'
        },
        appliedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Applicant', applicantSchema);


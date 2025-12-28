const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    employerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employer',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: String,
        required: true
    },
    employmentType: {
        type: String,
        required: true,
        enum: ['fulltime', 'parttime', 'contract', 'internship']
    },
    location: {
        type: String,
        required: true
    },
    salaryRange: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    requiredSkills: [{
        type: String,
        trim: true
    }],
    experienceLevel: {
        type: String,
        enum: ['entry', 'mid', 'senior', 'lead']
    },
    applicationDeadline: {
        type: Date
    },
    benefits: {
        type: String
    },
    status: {
        type: String,
        enum: ['draft', 'pending', 'active', 'closed'],
        default: 'draft'
    },
    views: {
        type: Number,
        default: 0
    },
    applications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Applicant'
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

module.exports = mongoose.model('Job', jobSchema);


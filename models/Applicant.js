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
        },
        notes: [{
            note: String,
            addedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Employer'
            },
            addedAt: {
                type: Date,
                default: Date.now
            }
        }],
        interviewDate: Date,
        hiredAt: Date
    }],
    assignedTrainings: [{
        trainingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Training'
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employer'
        },
        assignedAt: {
            type: Date,
            default: Date.now
        },
        targetCompletionDate: Date,
        status: {
            type: String,
            enum: ['assigned', 'in-progress', 'completed', 'failed'],
            default: 'assigned'
        },
        completionDate: Date,
        assessmentScore: Number
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


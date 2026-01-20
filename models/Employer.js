const mongoose = require('mongoose');

const employerSchema = new mongoose.Schema({
    companyName: {
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
    password: {
        type: String,
        required: true
    },
    industry: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    // Fields for Account Recovery / Forgot Password flow
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    logo: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    website: {
        type: String,
        trim: true
    },
    teamMembers: [{
        email: String,
        role: {
            type: String,
            enum: ['admin', 'recruiter', 'viewer'],
            default: 'recruiter'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    notificationPreferences: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        newApplicantAlert: {
            type: Boolean,
            default: true
        },
        interviewReminders: {
            type: Boolean,
            default: true
        },
        weeklyReports: {
            type: Boolean,
            default: false
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Employer', employerSchema);


const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['TESDA Certified', 'OWWA Program', 'Technology', 'Design', 'Business']
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number, // in hours
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    locationType: {
        type: String,
        enum: ['Online', 'In-Person', 'Hybrid'],
        required: true
    },
    location: {
        type: String,
        trim: true
    },
    provider: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'completed', 'cancelled'],
        default: 'active'
    },
    enrollees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Applicant'
    }],
    certificationsIssued: {
        type: Number,
        default: 0
    },
    completionRate: {
        type: Number,
        default: 0
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

module.exports = mongoose.model('Training', trainingSchema);


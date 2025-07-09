const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
    vehicleId: {
        type: String,
        required: true
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        latitude: Number,
        longitude: Number,
        address: String
    },
    wasteType: {
        type: String,
        enum: ['organic', 'recyclable', 'hazardous', 'general'],
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'in_progress', 'completed', 'skipped'],
        default: 'scheduled'
    },
    scheduledTime: {
        type: Date,
        required: true
    },
    actualTime: Date,
    notes: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Collection', collectionSchema);
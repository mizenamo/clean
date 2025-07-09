const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    vehicleId: {
        type: String,
        required: true,
        unique: true
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    currentLocation: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    status: {
        type: String,
        enum: ['idle', 'on_route', 'collecting', 'completed', 'maintenance'],
        default: 'idle'
    },
    route: {
        ward: String,
        area: String,
        totalStops: Number,
        completedStops: { type: Number, default: 0 }
    },
    wasteType: {
        type: String,
        enum: ['organic', 'recyclable', 'hazardous', 'general']
    },
    capacity: {
        current: { type: Number, default: 0 },
        maximum: { type: Number, default: 100 }
    },
    schedule: {
        startTime: Date,
        estimatedEndTime: Date,
        actualEndTime: Date
    }
}, {
    timestamps: true
});

// Index for geospatial queries
vehicleSchema.index({ "currentLocation.latitude": 1, "currentLocation.longitude": 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
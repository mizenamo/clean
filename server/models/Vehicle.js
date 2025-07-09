const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    vehicleId: {
        type: String,
        required: [true, 'Vehicle ID is required'],
        unique: true,
        uppercase: true,
        match: [/^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/, 'Invalid vehicle ID format']
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Driver ID is required']
    },
    currentLocation: {
        latitude: {
            type: Number,
            required: [true, 'Latitude is required'],
            min: [-90, 'Latitude must be between -90 and 90'],
            max: [90, 'Latitude must be between -90 and 90']
        },
        longitude: {
            type: Number,
            required: [true, 'Longitude is required'],
            min: [-180, 'Longitude must be between -180 and 180'],
            max: [180, 'Longitude must be between -180 and 180']
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        accuracy: {
            type: Number,
            default: 0
        }
    },
    status: {
        type: String,
        enum: {
            values: ['idle', 'on_route', 'collecting', 'completed', 'maintenance', 'emergency'],
            message: 'Status must be one of: idle, on_route, collecting, completed, maintenance, emergency'
        },
        default: 'idle'
    },
    route: {
        ward: {
            type: String,
            required: [true, 'Ward is required']
        },
        area: {
            type: String,
            required: [true, 'Area is required']
        },
        totalStops: {
            type: Number,
            required: [true, 'Total stops is required'],
            min: [1, 'Total stops must be at least 1']
        },
        completedStops: {
            type: Number,
            default: 0,
            min: [0, 'Completed stops cannot be negative']
        },
        routePoints: [{
            latitude: Number,
            longitude: Number,
            address: String,
            completed: { type: Boolean, default: false },
            completedAt: Date
        }]
    },
    wasteType: {
        type: String,
        enum: {
            values: ['organic', 'recyclable', 'hazardous', 'general'],
            message: 'Waste type must be one of: organic, recyclable, hazardous, general'
        },
        required: [true, 'Waste type is required']
    },
    capacity: {
        current: {
            type: Number,
            default: 0,
            min: [0, 'Current capacity cannot be negative'],
            max: [100, 'Current capacity cannot exceed 100%']
        },
        maximum: {
            type: Number,
            default: 100,
            min: [1, 'Maximum capacity must be at least 1']
        }
    },
    schedule: {
        startTime: {
            type: Date,
            required: [true, 'Start time is required']
        },
        estimatedEndTime: {
            type: Date,
            required: [true, 'Estimated end time is required']
        },
        actualEndTime: Date
    },
    specifications: {
        model: String,
        year: Number,
        fuelType: {
            type: String,
            enum: ['petrol', 'diesel', 'electric', 'hybrid']
        },
        capacity: String,
        lastMaintenance: Date,
        nextMaintenance: Date
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
vehicleSchema.index({ 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ driverId: 1 });
vehicleSchema.index({ wasteType: 1 });
vehicleSchema.index({ 'route.ward': 1 });

// Virtual for route completion percentage
vehicleSchema.virtual('routeCompletionPercentage').get(function() {
    if (!this.route.totalStops) return 0;
    return Math.round((this.route.completedStops / this.route.totalStops) * 100);
});

// Method to update location
vehicleSchema.methods.updateLocation = function(latitude, longitude, accuracy = 0) {
    this.currentLocation = {
        latitude,
        longitude,
        timestamp: new Date(),
        accuracy
    };
    return this.save();
};

// Method to update status
vehicleSchema.methods.updateStatus = function(status) {
    this.status = status;
    if (status === 'completed') {
        this.schedule.actualEndTime = new Date();
    }
    return this.save();
};

module.exports = mongoose.model('Vehicle', vehicleSchema);
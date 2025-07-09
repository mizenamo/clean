const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const LocationHistory = require('../models/LocationHistory');
const User = require('../models/User');

// Get all active vehicles with real-time tracking
router.get('/vehicles', async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ status: { $ne: 'maintenance' } })
            .populate('driverId', 'username')
            .sort({ 'currentLocation.timestamp': -1 });

        const trackingData = vehicles.map(vehicle => ({
            vehicleId: vehicle.vehicleId,
            driverName: vehicle.driverId?.username || 'Unknown',
            lat: vehicle.currentLocation.latitude,
            lng: vehicle.currentLocation.longitude,
            status: vehicle.status,
            wasteType: vehicle.wasteType,
            route: vehicle.route,
            capacity: vehicle.capacity,
            lastUpdate: vehicle.currentLocation.timestamp,
            schedule: vehicle.schedule
        }));

        res.json(trackingData);
    } catch (error) {
        console.error('Error fetching vehicle tracking:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update vehicle location (called by driver mobile app)
router.post('/update-location', async (req, res) => {
    try {
        const { vehicleId, latitude, longitude, speed, heading, accuracy } = req.body;

        if (!vehicleId || !latitude || !longitude) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Update vehicle current location
        const vehicle = await Vehicle.findOneAndUpdate(
            { vehicleId },
            {
                currentLocation: {
                    latitude,
                    longitude,
                    timestamp: new Date()
                }
            },
            { new: true, upsert: true }
        );

        // Save location history
        const locationHistory = new LocationHistory({
            vehicleId,
            driverId: vehicle.driverId,
            location: { latitude, longitude },
            speed: speed || 0,
            heading: heading || 0,
            accuracy: accuracy || 0
        });

        await locationHistory.save();

        // Emit real-time update via Socket.IO
        req.io.emit('locationUpdate', {
            vehicleId,
            latitude,
            longitude,
            speed,
            timestamp: new Date()
        });

        res.json({ message: 'Location updated successfully' });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update vehicle status
router.post('/update-status', async (req, res) => {
    try {
        const { vehicleId, status, completedStops } = req.body;

        const updateData = { status };
        if (completedStops !== undefined) {
            updateData['route.completedStops'] = completedStops;
        }

        const vehicle = await Vehicle.findOneAndUpdate(
            { vehicleId },
            updateData,
            { new: true }
        );

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        // Emit status update
        req.io.emit('statusUpdate', {
            vehicleId,
            status,
            completedStops
        });

        res.json({ message: 'Status updated successfully', vehicle });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get vehicle location history
router.get('/history/:vehicleId', async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const { startDate, endDate } = req.query;

        const query = { vehicleId };
        if (startDate && endDate) {
            query.timestamp = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const history = await LocationHistory.find(query)
            .sort({ timestamp: -1 })
            .limit(1000);

        res.json(history);
    } catch (error) {
        console.error('Error fetching location history:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get nearby vehicles (for emergency or optimization)
router.get('/nearby', async (req, res) => {
    try {
        const { latitude, longitude, radius = 5 } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Latitude and longitude required' });
        }

        const vehicles = await Vehicle.find({
            'currentLocation.latitude': {
                $gte: parseFloat(latitude) - radius / 111,
                $lte: parseFloat(latitude) + radius / 111
            },
            'currentLocation.longitude': {
                $gte: parseFloat(longitude) - radius / (111 * Math.cos(parseFloat(latitude) * Math.PI / 180)),
                $lte: parseFloat(longitude) + radius / (111 * Math.cos(parseFloat(latitude) * Math.PI / 180))
            }
        }).populate('driverId', 'username');

        res.json(vehicles);
    } catch (error) {
        console.error('Error finding nearby vehicles:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
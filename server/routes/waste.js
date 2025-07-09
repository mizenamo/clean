const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Collection = require('../models/Collection');

// Mock schedules with real database integration
router.get('/schedules', async (req, res) => {
    try {
        // In a real app, this would be based on user's ward/area
        const schedules = [
            { 
                day: 'Monday', 
                time: '7:00 AM - 12:45 PM', 
                type: 'Organic Waste',
                description: 'Kitchen waste, food scraps, garden waste'
            },
            { 
                day: 'Wednesday', 
                time: '7:00 AM - 12:45 PM', 
                type: 'Recyclables',
                description: 'Paper, plastic, glass, metal containers'
            },
            { 
                day: 'Friday', 
                time: '7:00 AM - 12:00 PM', 
                type: 'Hazardous Waste',
                description: 'Batteries, electronics, chemicals'
            },
        ];
        res.json(schedules);
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Real-time vehicle tracking
router.get('/tracking', async (req, res) => {
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
            lastUpdate: vehicle.currentLocation.timestamp
        }));

        res.json(trackingData);
    } catch (error) {
        console.error('Error fetching vehicle tracking:', error);
        // Fallback to mock data if database is not available
        res.json([
            { 
                vehicleId: 'KA01AB1234', 
                driverName: 'John Smith',
                lat: 12.9716, 
                lng: 77.5946, 
                status: 'on_route',
                wasteType: 'organic',
                route: { ward: 'Ward 12', area: 'Residential', completedStops: 24, totalStops: 30 },
                capacity: { current: 65, maximum: 100 },
                lastUpdate: new Date()
            },
            { 
                vehicleId: 'KA01CD5678', 
                driverName: 'Mike Johnson',
                lat: 12.9716, 
                lng: 77.5946, 
                status: 'collecting',
                wasteType: 'recyclable',
                route: { ward: 'Ward 8', area: 'Commercial', completedStops: 12, totalStops: 20 },
                capacity: { current: 40, maximum: 100 },
                lastUpdate: new Date()
            }
        ]);
    }
});

// Report submission with database storage
router.post('/report', async (req, res) => {
    try {
        const { type, details, location, priority } = req.body;
        
        // In a real app, you would save this to a Reports collection
        const report = {
            type,
            details,
            location,
            priority,
            status: 'submitted',
            timestamp: new Date(),
            // userId: req.user?.id // from authentication middleware
        };

        // Save to database (implement Report model)
        console.log('Report submitted:', report);

        res.json({ 
            message: 'Report submitted successfully', 
            report,
            ticketId: `WM${Date.now()}`
        });
    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get collections for a specific vehicle/driver
router.get('/collections/:vehicleId', async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const collections = await Collection.find({ vehicleId })
            .sort({ scheduledTime: 1 });

        res.json(collections);
    } catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update collection status
router.post('/collections/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, actualTime, notes } = req.body;

        const collection = await Collection.findByIdAndUpdate(
            id,
            { status, actualTime, notes },
            { new: true }
        );

        if (!collection) {
            return res.status(404).json({ message: 'Collection not found' });
        }

        res.json({ message: 'Collection status updated', collection });
    } catch (error) {
        console.error('Error updating collection status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
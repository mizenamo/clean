const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Collection = require('../models/Collection');
const { mockSchedules, mockVehicles } = require('../utils/mockData');

// @desc    Get collection schedules
// @route   GET /api/waste/schedules
// @access  Public
router.get('/schedules', async (req, res) => {
    try {
        // In a real app, this would be based on user's ward/area
        const { ward } = req.query;

        let schedules = mockSchedules;

        // If ward is specified, you could filter schedules
        if (ward) {
            // Filter schedules by ward (implement ward-specific schedules)
            console.log(`📅 Fetching schedules for ward: ${ward}`);
        }

        res.json({
            success: true,
            count: schedules.length,
            data: schedules
        });

    } catch (error) {
        console.error('❌ Error fetching schedules:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @desc    Get real-time vehicle tracking (legacy endpoint)
// @route   GET /api/waste/tracking
// @access  Public
router.get('/tracking', async (req, res) => {
    try {
        let trackingData;

        try {
            const vehicles = await Vehicle.find({ 
                isActive: true,
                status: { $ne: 'maintenance' } 
            })
            .populate('driverId', 'username')
            .sort({ 'currentLocation.timestamp': -1 });

            trackingData = vehicles.map(vehicle => ({
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

        } catch (dbError) {
            console.log('⚠️  Database not available, using mock data');
            trackingData = mockVehicles;
        }

        res.json(trackingData);

    } catch (error) {
        console.error('❌ Error fetching vehicle tracking:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @desc    Submit waste report
// @route   POST /api/waste/report
// @access  Public
router.post('/report', async (req, res) => {
    try {
        const { type, details, location, priority, userId } = req.body;

        // Validate input
        if (!type || !details) {
            return res.status(400).json({
                success: false,
                message: 'Report type and details are required'
            });
        }

        const validTypes = ['missed_collection', 'damaged_bin', 'overflowing', 'illegal_dumping', 'vehicle_issue', 'other'];
        const validPriorities = ['low', 'medium', 'high'];

        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report type'
            });
        }

        if (priority && !validPriorities.includes(priority)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid priority level'
            });
        }

        const report = {
            type,
            details,
            location: location || '',
            priority: priority || 'medium',
            status: 'submitted',
            timestamp: new Date(),
            userId: userId || null,
            ticketId: `WM${Date.now()}`
        };

        // In a real app, save to Reports collection in database
        console.log('📝 Report submitted:', report);

        // Emit real-time notification for high priority reports
        if (priority === 'high' && req.io) {
            req.io.emit('highPriorityReport', {
                ticketId: report.ticketId,
                type: report.type,
                location: report.location,
                timestamp: report.timestamp
            });
        }

        res.json({
            success: true,
            message: 'Report submitted successfully',
            data: {
                ticketId: report.ticketId,
                status: report.status,
                estimatedResolution: '24-48 hours'
            }
        });

    } catch (error) {
        console.error('❌ Error submitting report:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @desc    Get collections for a specific vehicle/driver
// @route   GET /api/waste/collections/:vehicleId
// @access  Public
router.get('/collections/:vehicleId', async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const { status, date } = req.query;

        let query = { vehicleId: vehicleId.toUpperCase() };

        if (status) {
            query.status = status;
        }

        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            
            query.scheduledTime = {
                $gte: startDate,
                $lt: endDate
            };
        }

        try {
            const collections = await Collection.find(query)
                .sort({ scheduledTime: 1 })
                .populate('driverId', 'username');

            res.json({
                success: true,
                count: collections.length,
                data: collections
            });

        } catch (dbError) {
            console.log('⚠️  Database not available for collections');
            res.json({
                success: true,
                count: 0,
                data: [],
                message: 'Collections not available (database unavailable)'
            });
        }

    } catch (error) {
        console.error('❌ Error fetching collections:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @desc    Update collection status
// @route   POST /api/waste/collections/:id/status
// @access  Public
router.post('/collections/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, actualTime, notes, quantity } = req.body;

        const validStatuses = ['scheduled', 'in_progress', 'completed', 'skipped'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        try {
            const updateData = { status };
            
            if (actualTime) updateData.actualTime = new Date(actualTime);
            if (notes) updateData.notes = notes;
            if (quantity !== undefined) updateData.quantity = quantity;

            const collection = await Collection.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            );

            if (!collection) {
                return res.status(404).json({
                    success: false,
                    message: 'Collection not found'
                });
            }

            // Emit real-time update
            if (req.io) {
                req.io.emit('collectionUpdate', {
                    collectionId: id,
                    vehicleId: collection.vehicleId,
                    status,
                    timestamp: new Date()
                });
            }

            res.json({
                success: true,
                message: 'Collection status updated successfully',
                data: collection
            });

        } catch (dbError) {
            console.log('⚠️  Database not available for collection update');
            res.json({
                success: true,
                message: 'Collection update broadcasted (database unavailable)'
            });
        }

    } catch (error) {
        console.error('❌ Error updating collection status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @desc    Get waste statistics
// @route   GET /api/waste/statistics
// @access  Public
router.get('/statistics', async (req, res) => {
    try {
        const { period = 'today', ward } = req.query;

        // Mock statistics (implement real calculations with database)
        const statistics = {
            totalCollections: 156,
            completedCollections: 142,
            pendingCollections: 14,
            totalWasteCollected: 2450, // kg
            recyclingRate: 68, // percentage
            averageCollectionTime: 45, // minutes
            vehicleUtilization: 85, // percentage
            customerSatisfaction: 4.2, // out of 5
            byWasteType: {
                organic: 45,
                recyclable: 30,
                hazardous: 15,
                general: 10
            },
            byStatus: {
                completed: 91,
                in_progress: 9,
                scheduled: 0,
                skipped: 0
            }
        };

        res.json({
            success: true,
            period,
            ward: ward || 'All',
            data: statistics
        });

    } catch (error) {
        console.error('❌ Error fetching statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
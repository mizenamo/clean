const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const LocationHistory = require('../models/LocationHistory');
const User = require('../models/User');
const { mockVehicles } = require('../utils/mockData');

// @desc    Get all active vehicles with real-time tracking
// @route   GET /api/tracking/vehicles
// @access  Public
router.get('/vehicles', async (req, res) => {
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
                schedule: vehicle.schedule,
                routeCompletionPercentage: vehicle.routeCompletionPercentage
            }));

        } catch (dbError) {
            console.log('⚠️  Database not available, using mock data');
            trackingData = mockVehicles;
        }

        res.json({
            success: true,
            count: trackingData.length,
            data: trackingData
        });

    } catch (error) {
        console.error('❌ Error fetching vehicle tracking:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @desc    Update vehicle location (called by driver mobile app)
// @route   POST /api/tracking/update-location
// @access  Public (should be protected in production)
router.post('/update-location', async (req, res) => {
    try {
        const { vehicleId, latitude, longitude, speed, heading, accuracy } = req.body;

        // Validate required fields
        if (!vehicleId || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle ID, latitude, and longitude are required'
            });
        }

        // Validate coordinate ranges
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({
                success: false,
                message: 'Invalid coordinates'
            });
        }

        try {
            // Update vehicle current location
            const vehicle = await Vehicle.findOneAndUpdate(
                { vehicleId: vehicleId.toUpperCase() },
                {
                    currentLocation: {
                        latitude: parseFloat(latitude),
                        longitude: parseFloat(longitude),
                        timestamp: new Date(),
                        accuracy: accuracy || 0
                    }
                },
                { new: true, upsert: false }
            );

            if (!vehicle) {
                return res.status(404).json({
                    success: false,
                    message: 'Vehicle not found'
                });
            }

            // Save location history
            const locationHistory = new LocationHistory({
                vehicleId: vehicle.vehicleId,
                driverId: vehicle.driverId,
                location: { 
                    latitude: parseFloat(latitude), 
                    longitude: parseFloat(longitude) 
                },
                speed: speed || 0,
                heading: heading || 0,
                accuracy: accuracy || 0
            });

            await locationHistory.save();

            // Emit real-time update via Socket.IO
            if (req.io) {
                req.io.emit('locationUpdate', {
                    vehicleId: vehicle.vehicleId,
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    speed: speed || 0,
                    heading: heading || 0,
                    timestamp: new Date()
                });
            }

            console.log(`📍 Location updated for vehicle ${vehicleId}: ${latitude}, ${longitude}`);

            res.json({
                success: true,
                message: 'Location updated successfully',
                data: {
                    vehicleId: vehicle.vehicleId,
                    location: vehicle.currentLocation
                }
            });

        } catch (dbError) {
            console.log('⚠️  Database not available for location update');
            
            // Still emit socket update for real-time functionality
            if (req.io) {
                req.io.emit('locationUpdate', {
                    vehicleId: vehicleId.toUpperCase(),
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    speed: speed || 0,
                    timestamp: new Date()
                });
            }

            res.json({
                success: true,
                message: 'Location update broadcasted (database unavailable)'
            });
        }

    } catch (error) {
        console.error('❌ Error updating location:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @desc    Update vehicle status
// @route   POST /api/tracking/update-status
// @access  Public (should be protected in production)
router.post('/update-status', async (req, res) => {
    try {
        const { vehicleId, status, completedStops } = req.body;

        if (!vehicleId || !status) {
            return res.status(400).json({
                success: false,
                message: 'Vehicle ID and status are required'
            });
        }

        const validStatuses = ['idle', 'on_route', 'collecting', 'completed', 'maintenance', 'emergency'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        try {
            const updateData = { status };
            if (completedStops !== undefined) {
                updateData['route.completedStops'] = parseInt(completedStops);
            }
            if (status === 'completed') {
                updateData['schedule.actualEndTime'] = new Date();
            }

            const vehicle = await Vehicle.findOneAndUpdate(
                { vehicleId: vehicleId.toUpperCase() },
                updateData,
                { new: true }
            );

            if (!vehicle) {
                return res.status(404).json({
                    success: false,
                    message: 'Vehicle not found'
                });
            }

            // Emit status update
            if (req.io) {
                req.io.emit('statusUpdate', {
                    vehicleId: vehicle.vehicleId,
                    status,
                    completedStops: completedStops || vehicle.route.completedStops,
                    timestamp: new Date()
                });
            }

            console.log(`🔄 Status updated for vehicle ${vehicleId}: ${status}`);

            res.json({
                success: true,
                message: 'Status updated successfully',
                data: vehicle
            });

        } catch (dbError) {
            console.log('⚠️  Database not available for status update');
            
            // Still emit socket update
            if (req.io) {
                req.io.emit('statusUpdate', {
                    vehicleId: vehicleId.toUpperCase(),
                    status,
                    completedStops,
                    timestamp: new Date()
                });
            }

            res.json({
                success: true,
                message: 'Status update broadcasted (database unavailable)'
            });
        }

    } catch (error) {
        console.error('❌ Error updating status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @desc    Get vehicle location history
// @route   GET /api/tracking/history/:vehicleId
// @access  Public
router.get('/history/:vehicleId', async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const { startDate, endDate, limit = 100 } = req.query;

        const query = { vehicleId: vehicleId.toUpperCase() };
        
        if (startDate && endDate) {
            query.timestamp = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        try {
            const history = await LocationHistory.find(query)
                .sort({ timestamp: -1 })
                .limit(parseInt(limit))
                .populate('driverId', 'username');

            res.json({
                success: true,
                count: history.length,
                data: history
            });

        } catch (dbError) {
            console.log('⚠️  Database not available for history');
            res.json({
                success: true,
                count: 0,
                data: [],
                message: 'History not available (database unavailable)'
            });
        }

    } catch (error) {
        console.error('❌ Error fetching location history:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @desc    Get nearby vehicles
// @route   GET /api/tracking/nearby
// @access  Public
router.get('/nearby', async (req, res) => {
    try {
        const { latitude, longitude, radius = 5 } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const radiusKm = parseFloat(radius);

        try {
            // Simple bounding box calculation (approximate)
            const latDelta = radiusKm / 111; // 1 degree lat ≈ 111 km
            const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

            const vehicles = await Vehicle.find({
                isActive: true,
                'currentLocation.latitude': {
                    $gte: lat - latDelta,
                    $lte: lat + latDelta
                },
                'currentLocation.longitude': {
                    $gte: lng - lngDelta,
                    $lte: lng + lngDelta
                }
            }).populate('driverId', 'username');

            res.json({
                success: true,
                count: vehicles.length,
                data: vehicles
            });

        } catch (dbError) {
            console.log('⚠️  Database not available for nearby search');
            res.json({
                success: true,
                count: 0,
                data: [],
                message: 'Nearby search not available (database unavailable)'
            });
        }

    } catch (error) {
        console.error('❌ Error finding nearby vehicles:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @desc    Get vehicle details
// @route   GET /api/tracking/vehicle/:vehicleId
// @access  Public
router.get('/vehicle/:vehicleId', async (req, res) => {
    try {
        const { vehicleId } = req.params;

        try {
            const vehicle = await Vehicle.findOne({ 
                vehicleId: vehicleId.toUpperCase() 
            }).populate('driverId', 'username email phone');

            if (!vehicle) {
                return res.status(404).json({
                    success: false,
                    message: 'Vehicle not found'
                });
            }

            res.json({
                success: true,
                data: vehicle
            });

        } catch (dbError) {
            console.log('⚠️  Database not available for vehicle details');
            const mockVehicle = mockVehicles.find(v => v.vehicleId === vehicleId.toUpperCase());
            
            if (mockVehicle) {
                res.json({
                    success: true,
                    data: mockVehicle,
                    message: 'Mock data (database unavailable)'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Vehicle not found'
                });
            }
        }

    } catch (error) {
        console.error('❌ Error fetching vehicle details:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
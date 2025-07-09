require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const wasteRoutes = require('./routes/waste');
const trackingRoutes = require('./routes/tracking');

// Import models for initialization
const Vehicle = require('./models/Vehicle');
const User = require('./models/User');
const { mockVehicles } = require('./utils/mockData');

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Make io available to routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Initialize sample data
const initializeSampleData = async () => {
    try {
        // Check if sample data already exists
        const vehicleCount = await Vehicle.countDocuments();
        if (vehicleCount > 0) {
            console.log('📊 Sample data already exists');
            return;
        }

        console.log('🔄 Initializing sample data...');

        // Create sample users (drivers)
        const sampleUsers = [
            { username: 'driver1', password: 'driver123', role: 'driver', ward: 'Ward 12' },
            { username: 'driver2', password: 'driver123', role: 'driver', ward: 'Ward 8' },
            { username: 'driver3', password: 'driver123', role: 'driver', ward: 'Ward 5' }
        ];

        const createdUsers = [];
        for (const userData of sampleUsers) {
            try {
                const existingUser = await User.findOne({ username: userData.username });
                if (!existingUser) {
                    const user = new User(userData);
                    await user.save();
                    createdUsers.push(user);
                    console.log(`👤 Created user: ${userData.username}`);
                } else {
                    createdUsers.push(existingUser);
                }
            } catch (userError) {
                console.error(`❌ Error creating user ${userData.username}:`, userError.message);
            }
        }

        // Create sample vehicles
        const sampleVehicles = [
            {
                vehicleId: 'KA01AB1234',
                driverId: createdUsers[0]?._id,
                currentLocation: {
                    latitude: 12.9716,
                    longitude: 77.5946,
                    timestamp: new Date()
                },
                status: 'on_route',
                route: {
                    ward: 'Ward 12',
                    area: 'Residential Area',
                    totalStops: 30,
                    completedStops: 24
                },
                wasteType: 'organic',
                capacity: {
                    current: 65,
                    maximum: 100
                },
                schedule: {
                    startTime: new Date(),
                    estimatedEndTime: new Date(Date.now() + 5 * 60 * 60 * 1000)
                }
            },
            {
                vehicleId: 'KA01CD5678',
                driverId: createdUsers[1]?._id,
                currentLocation: {
                    latitude: 12.9800,
                    longitude: 77.6000,
                    timestamp: new Date()
                },
                status: 'collecting',
                route: {
                    ward: 'Ward 8',
                    area: 'Commercial Area',
                    totalStops: 20,
                    completedStops: 12
                },
                wasteType: 'recyclable',
                capacity: {
                    current: 40,
                    maximum: 100
                },
                schedule: {
                    startTime: new Date(),
                    estimatedEndTime: new Date(Date.now() + 4 * 60 * 60 * 1000)
                }
            },
            {
                vehicleId: 'KA01EF9012',
                driverId: createdUsers[2]?._id,
                currentLocation: {
                    latitude: 12.9500,
                    longitude: 77.5800,
                    timestamp: new Date()
                },
                status: 'completed',
                route: {
                    ward: 'Ward 5',
                    area: 'Industrial Area',
                    totalStops: 15,
                    completedStops: 15
                },
                wasteType: 'hazardous',
                capacity: {
                    current: 90,
                    maximum: 100
                },
                schedule: {
                    startTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
                    estimatedEndTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
                    actualEndTime: new Date(Date.now() - 30 * 60 * 1000)
                }
            }
        ];

        for (const vehicleData of sampleVehicles) {
            try {
                if (vehicleData.driverId) {
                    const vehicle = new Vehicle(vehicleData);
                    await vehicle.save();
                    console.log(`🚛 Created vehicle: ${vehicleData.vehicleId}`);
                }
            } catch (vehicleError) {
                console.error(`❌ Error creating vehicle ${vehicleData.vehicleId}:`, vehicleError.message);
            }
        }

        console.log('✅ Sample data initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing sample data:', error.message);
    }
};

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('📱 Client connected:', socket.id);

    // Handle driver joining a room for their vehicle
    socket.on('joinVehicle', (vehicleId) => {
        socket.join(`vehicle_${vehicleId}`);
        console.log(`🚛 Driver joined vehicle room: ${vehicleId}`);
        
        // Send confirmation
        socket.emit('joinedVehicle', { vehicleId, status: 'connected' });
    });

    // Handle location updates from mobile app
    socket.on('locationUpdate', async (data) => {
        try {
            const { vehicleId, latitude, longitude, speed, heading, accuracy } = data;
            
            console.log(`📍 Received location update for ${vehicleId}: ${latitude}, ${longitude}`);

            // Validate data
            if (!vehicleId || latitude === undefined || longitude === undefined) {
                socket.emit('error', { message: 'Invalid location data' });
                return;
            }

            // Update database if available
            try {
                await Vehicle.findOneAndUpdate(
                    { vehicleId: vehicleId.toUpperCase() },
                    {
                        currentLocation: {
                            latitude: parseFloat(latitude),
                            longitude: parseFloat(longitude),
                            timestamp: new Date(),
                            accuracy: accuracy || 0
                        }
                    }
                );
            } catch (dbError) {
                console.log('⚠️  Database not available for socket location update');
            }

            // Broadcast to all clients
            socket.broadcast.emit('vehicleLocationUpdate', {
                vehicleId: vehicleId.toUpperCase(),
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                speed: speed || 0,
                heading: heading || 0,
                timestamp: new Date()
            });

            // Send confirmation to sender
            socket.emit('locationUpdateConfirmed', { vehicleId, timestamp: new Date() });

        } catch (error) {
            console.error('❌ Error handling location update:', error);
            socket.emit('error', { message: 'Failed to process location update' });
        }
    });

    // Handle status updates
    socket.on('statusUpdate', async (data) => {
        try {
            const { vehicleId, status, completedStops } = data;

            console.log(`🔄 Received status update for ${vehicleId}: ${status}`);

            // Update database if available
            try {
                const updateData = { status };
                if (completedStops !== undefined) {
                    updateData['route.completedStops'] = parseInt(completedStops);
                }

                await Vehicle.findOneAndUpdate(
                    { vehicleId: vehicleId.toUpperCase() },
                    updateData
                );
            } catch (dbError) {
                console.log('⚠️  Database not available for socket status update');
            }

            // Broadcast to all clients
            socket.broadcast.emit('vehicleStatusUpdate', {
                vehicleId: vehicleId.toUpperCase(),
                status,
                completedStops,
                timestamp: new Date()
            });

            // Send confirmation
            socket.emit('statusUpdateConfirmed', { vehicleId, status, timestamp: new Date() });

        } catch (error) {
            console.error('❌ Error handling status update:', error);
            socket.emit('error', { message: 'Failed to process status update' });
        }
    });

    // Handle emergency alerts
    socket.on('emergencyAlert', (data) => {
        const { vehicleId, type, message, location } = data;
        
        console.log(`🚨 Emergency alert from ${vehicleId}: ${type}`);

        // Broadcast emergency to all clients
        io.emit('emergencyAlert', {
            vehicleId: vehicleId.toUpperCase(),
            type,
            message,
            location,
            timestamp: new Date()
        });
    });

    socket.on('disconnect', () => {
        console.log('📱 Client disconnected:', socket.id);
    });

    socket.on('error', (error) => {
        console.error('🔌 Socket error:', error);
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/tracking', trackingRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
    const dbStatus = require('mongoose').connection.readyState;
    const dbStatusText = {
        0: 'Disconnected',
        1: 'Connected',
        2: 'Connecting',
        3: 'Disconnecting'
    };

    res.json({ 
        success: true,
        status: 'OK', 
        timestamp: new Date(),
        database: dbStatusText[dbStatus] || 'Unknown',
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
    res.json({
        success: true,
        message: 'Waste Management API Documentation',
        endpoints: {
            auth: {
                'POST /api/auth/login': 'User login',
                'POST /api/auth/register': 'User registration',
                'GET /api/auth/me': 'Get current user'
            },
            tracking: {
                'GET /api/tracking/vehicles': 'Get all active vehicles',
                'POST /api/tracking/update-location': 'Update vehicle location',
                'POST /api/tracking/update-status': 'Update vehicle status',
                'GET /api/tracking/history/:vehicleId': 'Get location history',
                'GET /api/tracking/nearby': 'Find nearby vehicles',
                'GET /api/tracking/vehicle/:vehicleId': 'Get vehicle details'
            },
            waste: {
                'GET /api/waste/schedules': 'Get collection schedules',
                'GET /api/waste/tracking': 'Get vehicle tracking (legacy)',
                'POST /api/waste/report': 'Submit waste report',
                'GET /api/waste/collections/:vehicleId': 'Get vehicle collections',
                'POST /api/waste/collections/:id/status': 'Update collection status',
                'GET /api/waste/statistics': 'Get waste statistics'
            },
            system: {
                'GET /api/health': 'System health check',
                'GET /api/docs': 'API documentation'
            }
        },
        socketEvents: {
            client_to_server: [
                'joinVehicle',
                'locationUpdate',
                'statusUpdate',
                'emergencyAlert'
            ],
            server_to_client: [
                'vehicleLocationUpdate',
                'vehicleStatusUpdate',
                'emergencyAlert',
                'locationUpdateConfirmed',
                'statusUpdateConfirmed'
            ]
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Error handling middleware
app.use(errorHandler);

// Database connection and server startup
const startServer = async () => {
    try {
        // Connect to database
        const dbConnection = await connectDB();
        
        if (dbConnection) {
            // Initialize sample data only if database is connected
            await initializeSampleData();
        }

        const PORT = process.env.PORT || 3001;
        server.listen(PORT, () => {
            console.log('\n🚀 ================================');
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
            console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
            console.log(`📚 API docs: http://localhost:${PORT}/api/docs`);
            console.log('🚀 ================================\n');
            
            console.log('🔐 Available demo accounts:');
            console.log('   - Username: test, Password: password (works for all roles)');
            console.log('   - Username: admin, Password: admin123 (admin role)');
            console.log('   - Username: driver1, Password: driver123 (driver role)');
            console.log('   - Username: resident1, Password: resident123 (resident role)\n');
            
            console.log('📱 Real-time features:');
            console.log('   - Vehicle GPS tracking via Socket.IO');
            console.log('   - Live status updates');
            console.log('   - Emergency alerts');
            console.log('   - Location history with 30-day TTL\n');
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Process terminated');
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('✅ Process terminated');
    });
});

// Start the server
startServer();

module.exports = app;
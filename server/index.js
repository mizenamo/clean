require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

// Import routes
const authRoutes = require('./routes/auth');
const wasteRoutes = require('./routes/waste');
const trackingRoutes = require('./routes/tracking');

// Import models
const Vehicle = require('./models/Vehicle');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Make io available to routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/waste-management', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB connected successfully');
        
        // Initialize sample data
        await initializeSampleData();
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        console.log('⚠️  Running without database - using mock data');
    }
};

// Initialize sample data
const initializeSampleData = async () => {
    try {
        // Check if sample data already exists
        const vehicleCount = await Vehicle.countDocuments();
        if (vehicleCount > 0) {
            console.log('📊 Sample data already exists');
            return;
        }

        // Create sample users (drivers)
        const sampleUsers = [
            { username: 'driver1', password: 'driver123', role: 'driver', ward: 'Ward 12' },
            { username: 'driver2', password: 'driver123', role: 'driver', ward: 'Ward 8' }
        ];

        const createdUsers = [];
        for (const userData of sampleUsers) {
            const existingUser = await User.findOne({ username: userData.username });
            if (!existingUser) {
                const user = new User(userData);
                await user.save();
                createdUsers.push(user);
            } else {
                createdUsers.push(existingUser);
            }
        }

        // Create sample vehicles
        const sampleVehicles = [
            {
                vehicleId: 'KA01AB1234',
                driverId: createdUsers[0]._id,
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
                    estimatedEndTime: new Date(Date.now() + 5 * 60 * 60 * 1000) // 5 hours from now
                }
            },
            {
                vehicleId: 'KA01CD5678',
                driverId: createdUsers[1]._id,
                currentLocation: {
                    latitude: 12.9716,
                    longitude: 77.5946,
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
                    estimatedEndTime: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours from now
                }
            }
        ];

        await Vehicle.insertMany(sampleVehicles);
        console.log('✅ Sample data initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing sample data:', error);
    }
};

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('📱 Client connected:', socket.id);

    // Handle driver joining a room for their vehicle
    socket.on('joinVehicle', (vehicleId) => {
        socket.join(`vehicle_${vehicleId}`);
        console.log(`🚛 Driver joined vehicle room: ${vehicleId}`);
    });

    // Handle location updates from mobile app
    socket.on('locationUpdate', async (data) => {
        try {
            const { vehicleId, latitude, longitude, speed, heading } = data;
            
            // Update database
            await Vehicle.findOneAndUpdate(
                { vehicleId },
                {
                    currentLocation: {
                        latitude,
                        longitude,
                        timestamp: new Date()
                    }
                }
            );

            // Broadcast to all clients
            socket.broadcast.emit('vehicleLocationUpdate', {
                vehicleId,
                latitude,
                longitude,
                speed,
                heading,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Error handling location update:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('📱 Client disconnected:', socket.id);
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/tracking', trackingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// Connect to database
connectDB();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log('🔐 Available demo accounts:');
    console.log('   - Username: test, Password: password (works for all roles)');
    console.log('   - Username: admin, Password: admin123 (admin role)');
    console.log('   - Username: driver1, Password: driver123 (driver role)');
    console.log('   - Username: resident1, Password: resident123 (resident role)');
});

module.exports = app;
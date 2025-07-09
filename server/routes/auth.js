const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

// Mock users for demo (fallback when database is not available)
const mockUsers = [
    { username: 'test', password: 'password', role: 'resident' },
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'driver1', password: 'driver123', role: 'driver', ward: 'Ward 12' },
    { username: 'driver2', password: 'driver123', role: 'driver', ward: 'Ward 8' },
    { username: 'resident1', password: 'resident123', role: 'resident', ward: 'Ward 5' }
];

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { role, username, password } = req.body;
        
        console.log('🔐 Login attempt:', { role, username });

        // Validate input
        if (!role || !username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide role, username and password'
            });
        }

        let user;
        let isValidPassword = false;

        try {
            // Try database first
            user = await User.findOne({ username, role });
            if (user) {
                isValidPassword = await user.matchPassword(password);
            }
        } catch (dbError) {
            console.log('⚠️  Database not available, using mock authentication');
            // Fallback to mock users
            const mockUser = mockUsers.find(u => 
                u.username === username && 
                u.password === password && 
                u.role === role
            );
            
            if (mockUser) {
                user = mockUser;
                isValidPassword = true;
            }
        }

        if (!user || !isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials or role mismatch'
            });
        }

        // Update last login (only for database users)
        if (user.save) {
            user.lastLogin = new Date();
            await user.save();
        }

        // Generate token
        const token = generateToken(user._id || user.username);

        console.log('✅ Login successful for:', username, 'as', role);

        res.json({
            success: true,
            role: user.role,
            username: user.username,
            ward: user.ward,
            token
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// @desc    Register user (for future use)
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { username, password, role, ward, email, phone } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Create user
        const user = await User.create({
            username,
            password,
            role,
            ward,
            email,
            phone
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            role: user.role,
            username: user.username,
            ward: user.ward,
            token
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error during registration'
        });
    }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});

module.exports = router;
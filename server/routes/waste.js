const express = require('express');
const router = express.Router();

// Mock schedules
router.get('/schedules', (req, res) => {
    res.json([
        { day: 'Monday', time: '7:00 AM - 12:45 PM', type: 'Organic Waste' },
        { day: 'Wednesday', time: '7:00 AM - 12:45 PM', type: 'Recyclables' },
        { day: 'Friday', time: '7:00 AM - 12:00 PM', type: 'Hazardous Waste' },
    ]);
});

// Mock tracking
router.get('/tracking', (req, res) => {
    res.json([
        { vehicleId: 'KA01AB1234', lat: 12.9716, lng: 77.5946, status: 'On Route' },
    ]);
});

// Report submission
router.post('/report', (req, res) => {
    const { type, details } = req.body;
    res.json({ message: 'Report submitted successfully', report: { type, details } });
});

module.exports = router;
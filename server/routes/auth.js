const express = require('express');
const router = express.Router();

// Mock user database
const users = [
    { username: 'test', password: 'password', role: 'resident' },
    { username: 'test', password: 'password', role: 'driver' },
    { username: 'test', password: 'password', role: 'admin' },
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'driver1', password: 'driver123', role: 'driver' },
    { username: 'resident1', password: 'resident123', role: 'resident' }
];

router.post('/login', (req, res) => {
    const { role, username, password } = req.body;
    
    console.log('Login attempt:', { role, username, password });
    
    // Find user with matching credentials and role
    const user = users.find(u => 
        u.username === username && 
        u.password === password && 
        u.role === role
    );
    
    if (user) {
        const token = 'mock-jwt-token-' + Date.now();
        res.json({ 
            role: user.role, 
            username: user.username, 
            token 
        });
        console.log('Login successful for:', username, 'as', role);
    } else {
        res.status(401).json({ message: 'Invalid credentials or role mismatch' });
        console.log('Login failed for:', username, 'as', role);
    }
});

module.exports = router;
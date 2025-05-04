const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
    const { role, username, password } = req.body;
    // Mock authentication (replace with real logic)
    if (username === 'test' && password === 'password') {
        res.json({ role, username, token: 'mock-jwt-token' });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

module.exports = router;
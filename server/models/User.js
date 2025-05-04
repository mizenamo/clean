const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    role: { type: String, enum: ['resident', 'driver', 'admin'], required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // In production, hash this!
    ward: { type: String } // For residents and drivers
});

module.exports = mongoose.model('User', userSchema);
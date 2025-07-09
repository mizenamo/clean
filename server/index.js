const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const wasteRoutes = require('./routes/waste');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/waste', wasteRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Available demo accounts:');
    console.log('- Username: test, Password: password (works for all roles)');
});
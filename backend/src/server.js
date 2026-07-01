require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const websiteRoutes = require('./routes/websiteRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
connectDB();

// Routes
app.use('/api', authRoutes);
app.use('/api/websites', websiteRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        port: process.env.PORT || 5005
    });
});

// Start server
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
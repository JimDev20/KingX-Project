const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Helper: Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ==================== REGISTER ====================
router.post('/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = new User({
            username,
            password: hashedPassword,
            email: email || '',
            emailRecipients: email ? [email] : []
        });
        
        await user.save();
        
        // Generate token
        const token = generateToken(user._id);
        
        res.status(201).json({
            token,
            username: user.username,
            email: user.email
        });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate token
        const token = generateToken(user._id);
        
        res.json({
            token,
            username: user.username,
            email: user.email
        });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
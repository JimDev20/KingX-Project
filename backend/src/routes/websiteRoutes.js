const express = require('express');
const User = require('../models/User');
const History = require('../models/History');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ==================== GET ALL WEBSITES ====================
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user.websites);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== ADD WEBSITE ====================
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL required' });
        
        const user = await User.findById(req.userId);
        if (user.websites.some(w => w.url === url)) {
            return res.status(400).json({ error: 'URL already exists' });
        }
        
        user.websites.push({ url, status: 'pending', lastChecked: new Date() });
        await user.save();
        res.json(user.websites);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== DELETE WEBSITE ====================
router.delete('/:url', authMiddleware, async (req, res) => {
    try {
        const url = decodeURIComponent(req.params.url);
        const user = await User.findById(req.userId);
        user.websites = user.websites.filter(w => w.url !== url);
        await user.save();
        await History.deleteMany({ userId: req.userId, url });
        res.json(user.websites);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== UPDATE STATUS (called by monitor) ====================
router.post('/update-status', async (req, res) => {
    try {
        const { url, status } = req.body;
        const users = await User.find({ 'websites.url': url });
        
        for (let user of users) {
            const site = user.websites.find(w => w.url === url);
            if (site) {
                site.status = status;
                site.lastChecked = new Date();
                await user.save();
            }
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== GET WEBSITE STATS ====================
router.get('/stats/:url', authMiddleware, async (req, res) => {
    try {
        const url = decodeURIComponent(req.params.url);
        const history = await History.find({ 
            userId: req.userId, 
            url: url 
        }).sort({ timestamp: -1 });
        
        if (history.length === 0) {
            return res.json({ 
                uptime: 100, 
                downCount: 0, 
                avgResponseTime: 0,
                totalChecks: 0,
                lastCheck: null
            });
        }
        
        const totalChecks = history.length;
        const downCount = history.filter(h => h.status === 'down').length;
        const upCount = totalChecks - downCount;
        const uptime = (upCount / totalChecks) * 100;
        
        const responseTimes = history
            .filter(h => h.responseTime !== null)
            .map(h => h.responseTime);
        const avgResponseTime = responseTimes.length > 0 
            ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) 
            : 0;
        
        res.json({
            uptime: Math.round(uptime * 10) / 10,
            downCount,
            avgResponseTime,
            totalChecks,
            lastCheck: history[0]?.timestamp || null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== GET ALL STATS ====================
router.get('/all-stats', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const stats = {};
        
        for (const site of user.websites) {
            const history = await History.find({ 
                userId: req.userId, 
                url: site.url 
            }).sort({ timestamp: -1 });
            
            if (history.length > 0) {
                const downCount = history.filter(h => h.status === 'down').length;
                const upCount = history.length - downCount;
                const uptime = (upCount / history.length) * 100;
                
                const responseTimes = history
                    .filter(h => h.responseTime !== null)
                    .map(h => h.responseTime);
                const avgResponseTime = responseTimes.length > 0 
                    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) 
                    : 0;
                
                stats[site.url] = {
                    uptime: Math.round(uptime * 10) / 10,
                    downCount,
                    avgResponseTime,
                    totalChecks: history.length,
                    status: site.status,
                    lastCheck: history[0]?.timestamp || null
                };
            } else {
                stats[site.url] = {
                    uptime: 100,
                    downCount: 0,
                    avgResponseTime: 0,
                    totalChecks: 0,
                    status: site.status,
                    lastCheck: null
                };
            }
        }
        
        res.json(stats);
    } catch (err) {
        console.error('Error in /all-stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==================== GET WEBSITE HISTORY ====================
router.get('/history/:url', authMiddleware, async (req, res) => {
    try {
        const url = decodeURIComponent(req.params.url);
        const history = await History.find({ 
            userId: req.userId, 
            url: url 
        })
        .sort({ timestamp: -1 })
        .limit(100);
        
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
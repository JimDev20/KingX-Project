const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        // Kunin ang token mula sa Authorization header
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        // I-verify ang token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // I-save ang userId sa request para magamit ng susunod na routes
        req.userId = decoded.id;
        
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = authMiddleware;
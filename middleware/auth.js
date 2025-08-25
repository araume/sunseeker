const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        const cookieName = process.env.ADMIN_SESSION_COOKIE_NAME || 'admin_session';
        const token = req.cookies?.[cookieName] || req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
    }
};

module.exports = auth;

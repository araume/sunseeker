const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');

const router = express.Router();

// Input validation helper
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input.trim();
};

const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

// Register admin (first time setup)
router.post('/register', async (req, res) => {
    try {
        // Check if any admin already exists
        const existingAdmin = await Admin.findOne();
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists. Cannot register multiple admins.' });
        }

        const { username, password } = req.body;

        // Input validation
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const sanitizedUsername = sanitizeInput(username);
        
        if (sanitizedUsername.length < 3 || sanitizedUsername.length > 50) {
            return res.status(400).json({ message: 'Username must be between 3 and 50 characters' });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({ 
                message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number' 
            });
        }

        const admin = new Admin({ username: sanitizedUsername, password });
        await admin.save();

        const token = jwt.sign(
            { adminId: admin._id, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Admin created successfully',
            token,
            admin: {
                id: admin._id,
                username: admin.username,
                createdAt: admin.createdAt
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login admin
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Input validation
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const sanitizedUsername = sanitizeInput(username);
        
        if (sanitizedUsername.length < 3 || sanitizedUsername.length > 50) {
            return res.status(400).json({ message: 'Invalid username format' });
        }

        const admin = await Admin.findOne({ username: sanitizedUsername });
        if (!admin) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { adminId: admin._id, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            admin: {
                id: admin._id,
                username: admin.username,
                createdAt: admin.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get admin profile (protected route)
router.get('/profile', auth, async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.adminId).select('-password');
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        res.json(admin);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;

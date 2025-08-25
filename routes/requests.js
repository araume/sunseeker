const express = require('express');
const Request = require('../models/Request');
const auth = require('../middleware/auth');
const { sendNotificationEmail, sendReplyEmail } = require('../utils/emailService');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const rateLimit = require('express-rate-limit');

const router = express.Router();
// Add a rate limiter for verification submissions to mitigate abuse
const verifyLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false
});

// Multer setup for in-memory uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
        if (allowed.includes(file.mimetype)) return cb(null, true);
        cb(new Error('Only image files are allowed (png, jpg, jpeg, gif, webp)'));
    }
});

// Input validation helper
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, ''); // Basic XSS prevention
};

// Submit a new request (public route)
router.post('/', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Input validation
        if (!name || !email || !message) {
            return res.status(400).json({ message: 'Name, email, and message are required' });
        }

        // Sanitize inputs
        const sanitizedName = sanitizeInput(name);
        const sanitizedEmail = sanitizeInput(email).toLowerCase();
        const sanitizedMessage = sanitizeInput(message);

        // Validate email format
        if (!validateEmail(sanitizedEmail)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Validate input lengths
        if (sanitizedName.length < 1 || sanitizedName.length > 100) {
            return res.status(400).json({ message: 'Name must be between 1 and 100 characters' });
        }

        if (sanitizedMessage.length < 1 || sanitizedMessage.length > 2000) {
            return res.status(400).json({ message: 'Message must be between 1 and 2000 characters' });
        }

        const request = new Request({ 
            name: sanitizedName, 
            email: sanitizedEmail, 
            message: sanitizedMessage 
        });
        await request.save();

        res.status(201).json({
            message: 'Request submitted successfully',
            request: {
                id: request._id,
                name: request.name,
                email: request.email,
                message: request.message,
                createdAt: request.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all requests (protected route - admin only)
router.get('/', auth, async (req, res) => {
    try {
        const requests = await Request.find().sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get a specific request (protected route - admin only)
router.get('/:id', auth, async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        res.json(request);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete a request (protected route - admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        const request = await Request.findByIdAndDelete(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Send notification email (protected route - admin only)
// Supports optional multipart/form-data with fields: caption (text) and image (file)
router.post('/:id/notify', auth, upload.single('image'), async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.notificationSent) {
            return res.status(400).json({ message: 'Notification already sent for this request' });
        }

        // Generate one-time verification token (valid 24h) and save immediately
        const token = crypto.randomBytes(24).toString('hex');
        request.verificationToken = token;
        request.verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        request.verificationUsed = false;
        await request.save();

        const captionText = sanitizeInput(req.body.caption || '');

        let imageOption;
        if (req.file) {
            imageOption = {
                buffer: req.file.buffer,
                mimetype: req.file.mimetype,
                filename: req.file.originalname
            };
        }

        const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
        const verifyLink = `${baseUrl}/verify/${request._id}/${token}`;

        const result = await sendNotificationEmail(
            request.email,
            request.name,
            request,
            { image: imageOption, captionText, verifyLink }
        );

        if (result.success) {
            // Update request to mark notification as sent
            request.notificationSent = true;
            request.notificationSentAt = new Date();
            await request.save();

            res.json({
                message: 'Notification email sent successfully',
                messageId: result.messageId,
                verifyLink
            });
        } else {
            res.status(500).json({
                message: 'Failed to send notification email',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Serve one-time verification page is handled in server.js at /verify/:id/:token

// Handle verification submission
router.post('/:id/verify', upload.single('receipt'), async (req, res) => {
    try {
        const { id } = req.params;
        const { token, reference } = req.body;

        const request = await Request.findById(id);
        if (!request) return res.status(404).json({ message: 'Not found' });
        if (request.verificationUsed) return res.status(400).json({ message: 'You have already verified this request' });
        if (!request.verificationToken || request.verificationToken !== token) return res.status(400).json({ message: 'Invalid token' });
        if (request.verificationTokenExpiresAt && request.verificationTokenExpiresAt < new Date()) return res.status(400).json({ message: 'Link expired' });

        const ref = sanitizeInput(reference || '');
        if (!ref) return res.status(400).json({ message: 'Reference number is required' });
        if (!req.file) return res.status(400).json({ message: 'Receipt screenshot is required' });

        request.paymentReference = ref;
        request.receiptImage = req.file.buffer;
        request.receiptImageContentType = req.file.mimetype;
        request.verifiedAt = new Date();
        request.verificationUsed = true;
        await request.save();

        res.json({ message: 'Verification submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Send reply email (protected route - admin only)
router.post('/:id/reply', auth, async (req, res) => {
    try {
        const { replyMessage } = req.body;
        
        if (!replyMessage || replyMessage.trim() === '') {
            return res.status(400).json({ message: 'Reply message is required' });
        }

        // Sanitize and validate reply message
        const sanitizedReply = sanitizeInput(replyMessage);
        
        if (sanitizedReply.length < 1 || sanitizedReply.length > 5000) {
            return res.status(400).json({ message: 'Reply message must be between 1 and 5000 characters' });
        }

        const request = await Request.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const result = await sendReplyEmail(
            request.email,
            request.name,
            sanitizedReply,
            request
        );

        if (result.success) {
            // Update request to mark as replied
            request.repliedTo = true;
            request.replySentAt = new Date();
            await request.save();

            res.json({
                message: 'Reply email sent successfully',
                messageId: result.messageId
            });
        } else {
            res.status(500).json({
                message: 'Failed to send reply email',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get request statistics (protected route - admin only)
router.get('/stats/overview', auth, async (req, res) => {
    try {
        const totalRequests = await Request.countDocuments();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayRequests = await Request.countDocuments({
            createdAt: { $gte: today }
        });
        
        const thisWeek = new Date();
        thisWeek.setDate(thisWeek.getDate() - 7);
        const weekRequests = await Request.countDocuments({
            createdAt: { $gte: thisWeek }
        });

        res.json({
            total: totalRequests,
            today: todayRequests,
            thisWeek: weekRequests
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// List verified requests (protected)
router.get('/verified/list', auth, async (req, res) => {
    try {
        const verified = await Request.find({ verifiedAt: { $ne: null } })
            .sort({ verifiedAt: -1 })
            .select('_id name email paymentReference verifiedAt createdAt');
        res.json(verified);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete a request's verification (protected)
router.delete('/:id/verification', auth, async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        request.paymentReference = undefined;
        request.receiptImage = undefined;
        request.receiptImageContentType = undefined;
        request.verifiedAt = undefined;
        request.verificationUsed = false;
        request.verificationToken = undefined;
        request.verificationTokenExpiresAt = undefined;
        await request.save();
        res.json({ message: 'Verification deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Serve receipt image (protected)
router.get('/:id/receipt', auth, async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request || !request.receiptImage) return res.status(404).send('Not found');
        res.setHeader('Content-Type', request.receiptImageContentType || 'application/octet-stream');
        res.send(request.receiptImage);
    } catch (error) {
        res.status(500).send('Server error');
    }
});

// Logs endpoint (protected): returns requests with computed status and supports filters
router.get('/logs', auth, async (req, res) => {
    try {
        const { status, from, to, sort = 'date_desc' } = req.query;
        const query = {};
        // Date filter on createdAt
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to) query.createdAt.$lte = new Date(to);
        }
        const items = await Request.find(query).sort({ createdAt: -1 });
        const computeStatus = (r) => {
            if (r.verifiedAt) return 'paid';
            if (r.notificationSent) return 'notified';
            return 'pending';
        };
        let results = items.map(r => ({
            id: r._id,
            name: r.name,
            email: r.email,
            message: r.message,
            createdAt: r.createdAt,
            notificationSentAt: r.notificationSentAt,
            verifiedAt: r.verifiedAt,
            paymentReference: r.paymentReference,
            status: computeStatus(r)
        }));
        if (status) {
            const allowed = ['pending', 'notified', 'paid', 'complete'];
            const filterVal = String(status).toLowerCase();
            if (allowed.includes(filterVal)) {
                results = results.filter(r => {
                    if (filterVal === 'complete') {
                        return Boolean(r.verifiedAt) && Boolean(r.notificationSentAt);
                    }
                    return r.status === filterVal;
                });
            }
        }
        if (sort === 'date_asc') {
            results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sort === 'date_desc') {
            results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Logs endpoint alias to avoid conflict with '/:id'
router.get('/logs/list', auth, async (req, res) => {
    try {
        const { status, from, to, sort = 'date_desc' } = req.query;
        const query = {};
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to) query.createdAt.$lte = new Date(to);
        }
        const items = await Request.find(query).sort({ createdAt: -1 });
        const computeStatus = (r) => {
            if (r.verifiedAt) return 'paid';
            if (r.notificationSent) return 'notified';
            return 'pending';
        };
        let results = items.map(r => ({
            id: r._id,
            name: r.name,
            email: r.email,
            message: r.message,
            createdAt: r.createdAt,
            notificationSentAt: r.notificationSentAt,
            verifiedAt: r.verifiedAt,
            paymentReference: r.paymentReference,
            status: computeStatus(r)
        }));
        if (status) {
            const allowed = ['pending', 'notified', 'paid', 'complete'];
            const filterVal = String(status).toLowerCase();
            if (allowed.includes(filterVal)) {
                results = results.filter(r => {
                    if (filterVal === 'complete') {
                        return Boolean(r.verifiedAt) && Boolean(r.notificationSentAt);
                    }
                    return r.status === filterVal;
                });
            }
        }
        if (sort === 'date_asc') {
            results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sort === 'date_desc') {
            results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;

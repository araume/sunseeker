const express = require('express');
const Request = require('../models/Request');
const auth = require('../middleware/auth');
const { sendNotificationEmail, sendReplyEmail } = require('../utils/emailService');

const router = express.Router();

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
router.post('/:id/notify', auth, async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.notificationSent) {
            return res.status(400).json({ message: 'Notification already sent for this request' });
        }

        const result = await sendNotificationEmail(
            request.email,
            request.name,
            request
        );

        if (result.success) {
            // Update request to mark notification as sent
            request.notificationSent = true;
            request.notificationSentAt = new Date();
            await request.save();

            res.json({
                message: 'Notification email sent successfully',
                messageId: result.messageId
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

module.exports = router;

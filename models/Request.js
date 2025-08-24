const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    notificationSent: {
        type: Boolean,
        default: false
    },
    notificationSentAt: {
        type: Date
    },
    repliedTo: {
        type: Boolean,
        default: false
    },
    replySentAt: {
        type: Date
    },
    // One-time verification
    verificationToken: {
        type: String
    },
    verificationTokenExpiresAt: {
        type: Date
    },
    verificationUsed: {
        type: Boolean,
        default: false
    },
    paymentReference: {
        type: String
    },
    receiptImage: {
        type: Buffer
    },
    receiptImageContentType: {
        type: String
    },
    verifiedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Request', requestSchema);

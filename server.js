const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;
app.disable('x-powered-by');
app.set('trust proxy', 1);

// Validate required environment variables
if (!process.env.JWT_SECRET) {
    console.error('CRITICAL: JWT_SECRET environment variable is not set!');
    process.exit(1);
}

if (!process.env.MONGODB_URI) {
    console.error('CRITICAL: MONGODB_URI environment variable is not set!');
    process.exit(1);
}

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'blob:'],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"]
        }
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
if (process.env.NODE_ENV === 'production') {
    app.use(helmet.hsts({ maxAge: 15552000 })); // 180 days
}

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? ['https://yourdomain.com'] : true,
    credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
// Block access to sensitive files/directories when serving static content
app.use((req, res, next) => {
    const blocked = [
        /^\/(?:server\.js|package(?:-lock)?\.json|env\.txt|\.env)(?:$|\?)/i,
        /^\/(?:routes|models|middleware|utils)\//i
    ];
    if (blocked.some(rx => rx.test(req.path))) {
        return res.status(404).end();
    }
    next();
});
app.use(express.static('.'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Specific rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 5 : 50, // relax in dev
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            message: 'Too many authentication attempts, please try again later.'
        });
    }
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const requestRoutes = require('./routes/requests');

// Use routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/requests', requestRoutes);

// Basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve verify page
app.get('/verify/:id/:token', (req, res) => {
    res.sendFile(path.join(__dirname, 'verify.html'));
});

// Remove debug route for production
// app.get('/debug-admin', (req, res) => {
//     res.sendFile(__dirname + '/debug-admin.html');
// });

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

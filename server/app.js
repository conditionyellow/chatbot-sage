const express = require('express');
const cors = require('cors');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:8080',
        process.env.ADMIN_URL || 'http://localhost:8081'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: 'API rate limit exceeded',
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Import routes one by one to identify the issue
let authRoutes, youtubeRoutes, configRoutes, logsRoutes;

try {
    authRoutes = require('./routes/auth');
    console.log('✅ Auth routes loaded');
} catch (error) {
    console.error('❌ Failed to load auth routes:', error.message);
}

try {
    youtubeRoutes = require('./routes/youtube');
    console.log('✅ YouTube routes loaded');
} catch (error) {
    console.error('❌ Failed to load YouTube routes:', error.message);
}

try {
    configRoutes = require('./routes/config');
    console.log('✅ Config routes loaded');
} catch (error) {
    console.error('❌ Failed to load config routes:', error.message);
}

try {
    logsRoutes = require('./routes/logs');
    console.log('✅ Logs routes loaded');
} catch (error) {
    console.error('❌ Failed to load logs routes:', error.message);
}

// API Routes
if (authRoutes) app.use('/api/auth', authRoutes);
if (youtubeRoutes) app.use('/api/youtube', youtubeRoutes);
if (configRoutes) app.use('/api/config', configRoutes);
if (logsRoutes) app.use('/api/logs', logsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.originalUrl} not found`
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 ChatBot Sage Backend Server started on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
    console.log(`⚙️ Admin URL: ${process.env.ADMIN_URL || 'http://localhost:8081'}`);
});

module.exports = app;

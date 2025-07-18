const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const categoriesRouter = require('./routes/categories');
const upcomingRouter = require('./routes/upcoming');
const contentRouter = require('./routes/content');
const searchRouter = require('./routes/search');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { 
  generalRateLimit, 
  searchRateLimit, 
  contentRateLimit,
  securityHeaders,
  additionalSecurityHeaders,
  validateRequestSize,
  validateUserAgent,
  securityLogger
} = require('./middleware/security');
const { sanitizeQuery, sanitizeParams } = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware (applied first)
app.use(securityHeaders);
app.use(additionalSecurityHeaders);
app.use(validateRequestSize);
app.use(validateUserAgent);
app.use(securityLogger);

// CORS configuration with enhanced security
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGIN ? 
      process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : 
      ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080'];
    
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Body parsing middleware with security limits
app.use(express.json({ 
  limit: '1mb',
  strict: true,
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: false, 
  limit: '1mb',
  parameterLimit: 20
}));

// Input sanitization middleware
app.use(sanitizeQuery);
app.use(sanitizeParams);

// General rate limiting
app.use(generalRateLimit);

// Request logging middleware (simple version)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Movie TV Tracking API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes with specific rate limiting
app.use('/api/search', searchRateLimit, searchRouter);
app.use('/api/movie', contentRateLimit);
app.use('/api/tv', contentRateLimit);
app.use('/api/categories', categoriesRouter);
app.use('/api/upcoming', upcomingRouter);
app.use('/api', contentRouter);

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server only if this file is run directly (not imported)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('Available endpoints:');
    console.log('  GET /health - Health check');
    console.log('  GET /api/categories - Categories overview');
    console.log('  GET /api/categories/trending/movies - Trending movies');
    console.log('  GET /api/categories/trending/tv - Hot TV shows');
    console.log('  GET /api/categories/upcoming/movies - Anticipated movies');
    console.log('  GET /api/categories/streaming/now - Films now streaming');
    console.log('  GET /api/upcoming - Combined upcoming content');
    console.log('  GET /api/upcoming/movies - Upcoming movies');
    console.log('  GET /api/upcoming/tv - Upcoming TV shows');
    console.log('  GET /api/movie/:id - Movie details');
    console.log('  GET /api/tv/:id - TV show details');
    console.log('  GET /api/search/multi?query=... - Multi search');
    console.log('  GET /api/search/movies?query=... - Movie search');
    console.log('  GET /api/search/tv?query=... - TV search');
  });
}

module.exports = app;
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

/**
 * General rate limiting for all API endpoints
 */
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    timestamp: new Date().toISOString()
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Stricter rate limiting for search endpoints
 */
const searchRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit each IP to 100 search requests per 5 minutes
  message: {
    success: false,
    error: {
      code: 'SEARCH_RATE_LIMIT_EXCEEDED',
      message: 'Too many search requests from this IP, please try again later.',
      retryAfter: '5 minutes'
    },
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'SEARCH_RATE_LIMIT_EXCEEDED',
        message: 'Too many search requests from this IP, please try again later.',
        retryAfter: '5 minutes'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Very strict rate limiting for content detail endpoints
 */
const contentRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 content requests per minute
  message: {
    success: false,
    error: {
      code: 'CONTENT_RATE_LIMIT_EXCEEDED',
      message: 'Too many content requests from this IP, please try again later.',
      retryAfter: '1 minute'
    },
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'CONTENT_RATE_LIMIT_EXCEEDED',
        message: 'Too many content requests from this IP, please try again later.',
        retryAfter: '1 minute'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Configure helmet for security headers
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.themoviedb.org"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API usage
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'same-origin' }
});

/**
 * Custom middleware to add additional security headers
 */
const additionalSecurityHeaders = (req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

/**
 * Middleware to validate request size and prevent large payloads
 */
const validateRequestSize = (req, res, next) => {
  const contentLength = req.get('content-length');
  const maxSize = 1024 * 1024; // 1MB limit
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    return res.status(413).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload too large',
        maxSize: '1MB'
      },
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Middleware to validate and sanitize User-Agent header
 */
const validateUserAgent = (req, res, next) => {
  const userAgent = req.get('User-Agent');
  
  // Block requests without User-Agent (potential bot/scraper)
  if (!userAgent) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_USER_AGENT',
        message: 'User-Agent header is required'
      },
      timestamp: new Date().toISOString()
    });
  }
  
  // Block suspicious User-Agents
  const suspiciousPatterns = [
    /curl/i,
    /wget/i,
    /python/i,
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isSuspicious && process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN_USER_AGENT',
        message: 'Access denied for this User-Agent'
      },
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Middleware to log security events
 */
const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log the request
  console.log(`[SECURITY] ${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
  
  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    // Log security-related responses
    if (data && !data.success && data.error) {
      console.log(`[SECURITY] ${new Date().toISOString()} - Error Response: ${data.error.code} - Duration: ${duration}ms`);
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  generalRateLimit,
  searchRateLimit,
  contentRateLimit,
  securityHeaders,
  additionalSecurityHeaders,
  validateRequestSize,
  validateUserAgent,
  securityLogger
};
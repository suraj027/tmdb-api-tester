/**
 * Centralized error handling middleware for Express
 * Handles different types of errors and formats consistent error responses
 */

const { APIError } = require('./errors');

/**
 * Logger utility for error logging
 */
class ErrorLogger {
  static log(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...metadata
    };

    // In production, you would use a proper logging service like Winston
    // For now, we'll use console with structured logging
    if (level === 'error') {
      console.error(JSON.stringify(logEntry, null, 2));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(logEntry, null, 2));
    } else {
      console.log(JSON.stringify(logEntry, null, 2));
    }
  }

  static error(message, metadata = {}) {
    this.log('error', message, metadata);
  }

  static warn(message, metadata = {}) {
    this.log('warn', message, metadata);
  }

  static info(message, metadata = {}) {
    this.log('info', message, metadata);
  }
}

/**
 * Enhanced error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  // Extract request metadata for logging
  const requestMetadata = {
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    params: req.params,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    requestId: req.id || generateRequestId()
  };

  // Log error with context
  ErrorLogger.error('API Error occurred', {
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      stack: err.stack,
      originalError: err.originalError ? {
        message: err.originalError.message,
        code: err.originalError.code,
        stack: err.originalError.stack
      } : undefined
    },
    request: requestMetadata
  });

  // Handle custom API errors
  if (err instanceof APIError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Default error response
  let statusCode = 500;
  let errorResponse = {
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred'
    },
    timestamp: new Date().toISOString()
  };

  // Handle specific error types based on error codes
  switch (err.code) {
    case 'TMDB_API_ERROR':
      statusCode = 502;
      errorResponse.error = {
        code: 'TMDB_API_ERROR',
        message: err.message || 'External API service temporarily unavailable'
      };
      break;

    case 'CATEGORY_SERVICE_ERROR':
      statusCode = 500;
      errorResponse.error = {
        code: 'CATEGORY_SERVICE_ERROR',
        message: err.message || 'Failed to fetch category content'
      };
      break;

    case 'CONTENT_SERVICE_ERROR':
      statusCode = 500;
      errorResponse.error = {
        code: 'CONTENT_SERVICE_ERROR',
        message: err.message || 'Failed to fetch content details'
      };
      break;

    case 'SEARCH_API_ERROR':
    case 'SEARCH_ERROR':
      statusCode = 500;
      errorResponse.error = {
        code: 'SEARCH_ERROR',
        message: err.message || 'Search operation failed'
      };
      break;

    case 'SEARCH_NETWORK_ERROR':
      statusCode = 502;
      errorResponse.error = {
        code: 'SEARCH_NETWORK_ERROR',
        message: err.message || 'Search service temporarily unavailable'
      };
      break;

    case 'INVALID_REQUEST':
      statusCode = 400;
      errorResponse.error = {
        code: 'INVALID_REQUEST',
        message: err.message || 'Invalid request parameters'
      };
      break;

    case 'NOT_FOUND':
      statusCode = 404;
      errorResponse.error = {
        code: 'NOT_FOUND',
        message: err.message || 'Requested resource not found'
      };
      break;

    case 'RATE_LIMIT_EXCEEDED':
      statusCode = 429;
      errorResponse.error = {
        code: 'RATE_LIMIT_EXCEEDED',
        message: err.message || 'Too many requests. Please try again later.'
      };
      break;

    case 'NETWORK_ERROR':
      statusCode = 502;
      errorResponse.error = {
        code: 'NETWORK_ERROR',
        message: err.message || 'Network connection failed'
      };
      break;

    case 'SERVICE_UNAVAILABLE':
      statusCode = 503;
      errorResponse.error = {
        code: 'SERVICE_UNAVAILABLE',
        message: err.message || 'Service temporarily unavailable'
      };
      break;

    case 'VALIDATION_ERROR':
      statusCode = 400;
      errorResponse.error = {
        code: 'VALIDATION_ERROR',
        message: err.message || 'Validation failed'
      };
      break;

    default:
      // Handle validation errors (from services)
      if (err.message && (err.message.includes('required') || err.message.includes('must be'))) {
        statusCode = 400;
        errorResponse.error = {
          code: 'VALIDATION_ERROR',
          message: err.message
        };
      } else if (err.message && err.message.includes('Unsupported')) {
        statusCode = 400;
        errorResponse.error = {
          code: 'UNSUPPORTED_PARAMETER',
          message: err.message
        };
      } else if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
        statusCode = 400;
        errorResponse.error = {
          code: 'INVALID_JSON',
          message: 'Invalid JSON in request body'
        };
      } else if (err.name === 'CastError') {
        statusCode = 400;
        errorResponse.error = {
          code: 'INVALID_ID',
          message: 'Invalid ID format'
        };
      }
      break;
  }

  // In development, include more error details
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.details = {
      originalMessage: err.message,
      stack: err.stack,
      originalError: err.originalError ? {
        message: err.originalError.message,
        code: err.originalError.code,
        stack: err.originalError.stack
      } : undefined,
      requestId: requestMetadata.requestId
    };
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Generate a simple request ID for tracking
 */
function generateRequestId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

/**
 * 404 handler for unmatched routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    },
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
  ErrorLogger
};
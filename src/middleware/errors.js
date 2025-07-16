/**
 * Custom error classes for the Movie/TV Tracking API
 * Provides specific error types with consistent structure
 */

/**
 * Base API Error class
 */
class APIError extends Error {
  constructor(message, code, statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details
      },
      timestamp: this.timestamp
    };
  }
}

/**
 * TMDB API related errors
 */
class TMDBAPIError extends APIError {
  constructor(message, details = null) {
    super(message, 'TMDB_API_ERROR', 502, details);
  }
}

/**
 * Invalid request errors (client-side errors)
 */
class InvalidRequestError extends APIError {
  constructor(message, details = null) {
    super(message, 'INVALID_REQUEST', 400, details);
  }
}

/**
 * Resource not found errors
 */
class NotFoundError extends APIError {
  constructor(message = 'Requested resource not found', details = null) {
    super(message, 'NOT_FOUND', 404, details);
  }
}

/**
 * Rate limit exceeded errors
 */
class RateLimitError extends APIError {
  constructor(message = 'Too many requests. Please try again later.', details = null) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, details);
  }
}

/**
 * Validation errors
 */
class ValidationError extends APIError {
  constructor(message, details = null) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Service unavailable errors
 */
class ServiceUnavailableError extends APIError {
  constructor(message = 'Service temporarily unavailable', details = null) {
    super(message, 'SERVICE_UNAVAILABLE', 503, details);
  }
}

/**
 * Network errors
 */
class NetworkError extends APIError {
  constructor(message = 'Network connection failed', details = null) {
    super(message, 'NETWORK_ERROR', 502, details);
  }
}

/**
 * Category service specific errors
 */
class CategoryServiceError extends APIError {
  constructor(message, details = null) {
    super(message, 'CATEGORY_SERVICE_ERROR', 500, details);
  }
}

/**
 * Content service specific errors
 */
class ContentServiceError extends APIError {
  constructor(message, details = null) {
    super(message, 'CONTENT_SERVICE_ERROR', 500, details);
  }
}

/**
 * Search service specific errors
 */
class SearchServiceError extends APIError {
  constructor(message, details = null) {
    super(message, 'SEARCH_ERROR', 500, details);
  }
}

/**
 * Helper function to create appropriate error based on error code
 */
function createErrorFromCode(code, message, details = null) {
  switch (code) {
    case 'TMDB_API_ERROR':
      return new TMDBAPIError(message, details);
    case 'INVALID_REQUEST':
      return new InvalidRequestError(message, details);
    case 'NOT_FOUND':
      return new NotFoundError(message, details);
    case 'RATE_LIMIT_EXCEEDED':
      return new RateLimitError(message, details);
    case 'VALIDATION_ERROR':
      return new ValidationError(message, details);
    case 'SERVICE_UNAVAILABLE':
      return new ServiceUnavailableError(message, details);
    case 'NETWORK_ERROR':
      return new NetworkError(message, details);
    case 'CATEGORY_SERVICE_ERROR':
      return new CategoryServiceError(message, details);
    case 'CONTENT_SERVICE_ERROR':
      return new ContentServiceError(message, details);
    case 'SEARCH_ERROR':
    case 'SEARCH_API_ERROR':
    case 'SEARCH_NETWORK_ERROR':
      return new SearchServiceError(message, details);
    default:
      return new APIError(message, code, 500, details);
  }
}

module.exports = {
  APIError,
  TMDBAPIError,
  InvalidRequestError,
  NotFoundError,
  RateLimitError,
  ValidationError,
  ServiceUnavailableError,
  NetworkError,
  CategoryServiceError,
  ContentServiceError,
  SearchServiceError,
  createErrorFromCode
};
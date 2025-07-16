const { body, param, query, validationResult } = require('express-validator');
const validator = require('validator');
const xss = require('xss');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input parameters',
        details: errors.array()
      },
      timestamp: new Date().toISOString()
    });
  }
  next();
};

/**
 * Sanitize string input to prevent XSS attacks
 */
const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  
  // Remove XSS attempts
  let sanitized = xss(value, {
    whiteList: {}, // No HTML tags allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script']
  });
  
  // Additional sanitization - escape HTML entities
  sanitized = validator.escape(sanitized.trim());
  
  return sanitized;
};

/**
 * Custom sanitizer middleware for query parameters
 */
const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    });
  }
  next();
};

/**
 * Custom sanitizer middleware for URL parameters
 */
const sanitizeParams = (req, res, next) => {
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      if (typeof req.params[key] === 'string') {
        req.params[key] = sanitizeString(req.params[key]);
      }
    });
  }
  next();
};

/**
 * Validation rules for search queries
 */
const validateSearchQuery = [
  query('query')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Search query must be between 1 and 200 characters')
    .custom((value) => {
      // Check for potentially malicious patterns
      const maliciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /data:text\/html/i
      ];
      
      if (maliciousPatterns.some(pattern => pattern.test(value))) {
        throw new Error('Search query contains invalid characters');
      }
      return true;
    }),
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer between 1 and 1000'),
  query('includeAdult')
    .optional()
    .isBoolean()
    .withMessage('includeAdult must be a boolean value'),
  query('minVoteCount')
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage('minVoteCount must be a positive integer'),
  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('minRating must be a number between 0 and 10'),
  query('sortBy')
    .optional()
    .isIn(['popularity.desc', 'popularity.asc', 'vote_average.desc', 'vote_average.asc', 'release_date.desc', 'release_date.asc'])
    .withMessage('Invalid sort option'),
  handleValidationErrors
];

/**
 * Validation rules for content ID parameters
 */
const validateContentId = [
  param('id')
    .isInt({ min: 1, max: 999999999 })
    .withMessage('Content ID must be a positive integer'),
  handleValidationErrors
];

/**
 * Validation rules for media type parameters
 */
const validateMediaType = [
  param('mediaType')
    .isIn(['movie', 'tv'])
    .withMessage('Media type must be either "movie" or "tv"'),
  handleValidationErrors
];

/**
 * Validation rules for category parameters
 */
const validateCategoryParam = [
  param('category')
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Category can only contain lowercase letters, numbers, and hyphens'),
  handleValidationErrors
];

/**
 * Validation rules for studio parameters
 */
const validateStudioParam = [
  param('studio')
    .isLength({ min: 1, max: 50 })
    .withMessage('Studio must be between 1 and 50 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Studio can only contain lowercase letters, numbers, and hyphens')
    .isIn(['disney', 'pixar', 'marvel', 'dc', 'universal', 'lucasfilm', 'illumination', 'dreamworks'])
    .withMessage('Invalid studio name'),
  handleValidationErrors
];

/**
 * Validation rules for network parameters
 */
const validateNetworkParam = [
  param('network')
    .isLength({ min: 1, max: 50 })
    .withMessage('Network must be between 1 and 50 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Network can only contain lowercase letters, numbers, and hyphens')
    .isIn(['netflix', 'apple-tv', 'disney-plus', 'prime-video', 'hbo', 'paramount-plus'])
    .withMessage('Invalid network name'),
  handleValidationErrors
];

/**
 * Validation rules for genre parameters
 */
const validateGenreParam = [
  param('genre')
    .isLength({ min: 1, max: 50 })
    .withMessage('Genre must be between 1 and 50 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Genre can only contain lowercase letters, numbers, and hyphens')
    .isIn(['action', 'adventure', 'animation', 'comedy', 'crime', 'documentary', 'drama', 'family', 'fantasy', 'history', 'horror', 'music', 'mystery', 'romance', 'science-fiction', 'thriller', 'war', 'western'])
    .withMessage('Invalid genre name'),
  handleValidationErrors
];

/**
 * Validation rules for award type parameters
 */
const validateAwardTypeParam = [
  param('type')
    .isLength({ min: 1, max: 50 })
    .withMessage('Award type must be between 1 and 50 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Award type can only contain lowercase letters, numbers, and hyphens')
    .isIn(['oscar-winners', 'top-grossing', 'imdb-top-250', 'blockbuster-shows', 'top-rated'])
    .withMessage('Invalid award type'),
  handleValidationErrors
];

/**
 * Validation rules for page query parameter
 */
const validatePageQuery = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer between 1 and 1000'),
  query('moviePage')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Movie page must be a positive integer between 1 and 1000'),
  query('tvPage')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('TV page must be a positive integer between 1 and 1000'),
  query('type')
    .optional()
    .isIn(['movie', 'tv'])
    .withMessage('Type must be either "movie" or "tv"'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  sanitizeString,
  sanitizeQuery,
  sanitizeParams,
  validateSearchQuery,
  validateContentId,
  validateMediaType,
  validateCategoryParam,
  validateStudioParam,
  validateNetworkParam,
  validateGenreParam,
  validateAwardTypeParam,
  validatePageQuery
};
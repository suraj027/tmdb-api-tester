const { errorHandler, notFoundHandler, ErrorLogger } = require('../../../src/middleware/errorHandler');
const { 
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
  SearchServiceError
} = require('../../../src/middleware/errors');

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      url: '/api/test',
      path: '/api/test',
      query: {},
      params: {},
      get: jest.fn().mockReturnValue('test-user-agent'),
      ip: '127.0.0.1'
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();

    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle APIError instances correctly', () => {
      const error = new TMDBAPIError('TMDB service unavailable');
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TMDB_API_ERROR',
          message: 'TMDB service unavailable',
          details: null
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle TMDB_API_ERROR code correctly', () => {
      const error = new Error('API Error');
      error.code = 'TMDB_API_ERROR';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TMDB_API_ERROR',
          message: 'API Error'
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle CATEGORY_SERVICE_ERROR code correctly', () => {
      const error = new Error('Category fetch failed');
      error.code = 'CATEGORY_SERVICE_ERROR';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CATEGORY_SERVICE_ERROR',
          message: 'Category fetch failed'
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle CONTENT_SERVICE_ERROR code correctly', () => {
      const error = new Error('Content fetch failed');
      error.code = 'CONTENT_SERVICE_ERROR';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CONTENT_SERVICE_ERROR',
          message: 'Content fetch failed'
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle SEARCH_ERROR codes correctly', () => {
      const error = new Error('Search failed');
      error.code = 'SEARCH_API_ERROR';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: 'Search failed'
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle SEARCH_NETWORK_ERROR code correctly', () => {
      const error = new Error('Search network error');
      error.code = 'SEARCH_NETWORK_ERROR';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SEARCH_NETWORK_ERROR',
          message: 'Search network error'
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle INVALID_REQUEST code correctly', () => {
      const error = new Error('Invalid parameters');
      error.code = 'INVALID_REQUEST';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid parameters'
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle NOT_FOUND code correctly', () => {
      const error = new Error('Resource not found');
      error.code = 'NOT_FOUND';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found'
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle RATE_LIMIT_EXCEEDED code correctly', () => {
      const error = new Error('Rate limit exceeded');
      error.code = 'RATE_LIMIT_EXCEEDED';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded'
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle NETWORK_ERROR code correctly', () => {
      const error = new Error('Network connection failed');
      error.code = 'NETWORK_ERROR';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network connection failed'
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle SERVICE_UNAVAILABLE code correctly', () => {
      const error = new Error('Service unavailable');
      error.code = 'SERVICE_UNAVAILABLE';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service unavailable'
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle VALIDATION_ERROR code correctly', () => {
      const error = new Error('Validation failed');
      error.code = 'VALIDATION_ERROR';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed'
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle validation errors by message content', () => {
      const error = new Error('Field is required');
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Field is required'
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle unsupported parameter errors', () => {
      const error = new Error('Unsupported category type');
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNSUPPORTED_PARAMETER',
          message: 'Unsupported category type'
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle JSON syntax errors', () => {
      const error = new SyntaxError('Unexpected token in JSON');
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Invalid JSON in request body'
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle CastError for invalid IDs', () => {
      const error = new Error('Cast to ObjectId failed');
      error.name = 'CastError';
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid ID format'
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle unknown errors with default response', () => {
      const error = new Error('Unknown error');
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred'
        },
        timestamp: expect.any(String)
      });
    });

    it('should include error details in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Test error');
      error.originalError = new Error('Original error');
      error.originalError.code = 'ORIGINAL_CODE';
      
      errorHandler(error, req, res, next);
      
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred',
          details: {
            originalMessage: 'Test error',
            stack: expect.any(String),
            originalError: {
              message: 'Original error',
              code: 'ORIGINAL_CODE',
              stack: expect.any(String)
            },
            requestId: expect.any(String)
          }
        },
        timestamp: expect.any(String)
      });
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should log error with request context', () => {
      const error = new Error('Test error');
      error.code = 'TEST_ERROR';
      
      errorHandler(error, req, res, next);
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('API Error occurred')
      );
    });

    it('should handle errors with originalError property', () => {
      const originalError = new Error('Original error');
      originalError.code = 'ORIGINAL_CODE';
      
      const error = new Error('Wrapper error');
      error.code = 'TMDB_API_ERROR';
      error.originalError = originalError;
      
      errorHandler(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(502);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('ORIGINAL_CODE')
      );
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 with proper error format', () => {
      notFoundHandler(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route GET /api/test not found'
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle different HTTP methods', () => {
      req.method = 'POST';
      req.path = '/api/movies';
      
      notFoundHandler(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route POST /api/movies not found'
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('ErrorLogger', () => {
    it('should log error messages correctly', () => {
      ErrorLogger.error('Test error message', { key: 'value' });
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Test error message')
      );
    });

    it('should log warning messages correctly', () => {
      ErrorLogger.warn('Test warning message', { key: 'value' });
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Test warning message')
      );
    });

    it('should log info messages correctly', () => {
      ErrorLogger.info('Test info message', { key: 'value' });
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Test info message')
      );
    });

    it('should include metadata in log entries', () => {
      const metadata = { requestId: '123', userId: 'user1' };
      
      ErrorLogger.error('Test message', metadata);
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('requestId')
      );
    });

    it('should include timestamp in log entries', () => {
      ErrorLogger.error('Test message');
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('timestamp')
      );
    });
  });
});
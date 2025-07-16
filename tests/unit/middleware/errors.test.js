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
  SearchServiceError,
  createErrorFromCode
} = require('../../../src/middleware/errors');

describe('Custom Error Classes', () => {
  describe('APIError', () => {
    it('should create an APIError with all properties', () => {
      const error = new APIError('Test message', 'TEST_CODE', 400, { key: 'value' });
      
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ key: 'value' });
      expect(error.timestamp).toBeDefined();
      expect(error.name).toBe('APIError');
    });

    it('should use default status code when not provided', () => {
      const error = new APIError('Test message', 'TEST_CODE');
      
      expect(error.statusCode).toBe(500);
      expect(error.details).toBeNull();
    });

    it('should have proper JSON representation', () => {
      const error = new APIError('Test message', 'TEST_CODE', 400, { key: 'value' });
      const json = error.toJSON();
      
      expect(json).toEqual({
        success: false,
        error: {
          code: 'TEST_CODE',
          message: 'Test message',
          details: { key: 'value' }
        },
        timestamp: error.timestamp
      });
    });

    it('should capture stack trace', () => {
      const error = new APIError('Test message', 'TEST_CODE');
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('APIError');
    });
  });

  describe('TMDBAPIError', () => {
    it('should create TMDBAPIError with correct properties', () => {
      const error = new TMDBAPIError('TMDB service down');
      
      expect(error.message).toBe('TMDB service down');
      expect(error.code).toBe('TMDB_API_ERROR');
      expect(error.statusCode).toBe(502);
      expect(error.name).toBe('TMDBAPIError');
    });

    it('should accept details parameter', () => {
      const details = { tmdbCode: 7, status: 'Invalid API key' };
      const error = new TMDBAPIError('API key invalid', details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('InvalidRequestError', () => {
    it('should create InvalidRequestError with correct properties', () => {
      const error = new InvalidRequestError('Missing required parameter');
      
      expect(error.message).toBe('Missing required parameter');
      expect(error.code).toBe('INVALID_REQUEST');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('InvalidRequestError');
    });
  });

  describe('NotFoundError', () => {
    it('should create NotFoundError with correct properties', () => {
      const error = new NotFoundError('Movie not found');
      
      expect(error.message).toBe('Movie not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });

    it('should use default message when not provided', () => {
      const error = new NotFoundError();
      
      expect(error.message).toBe('Requested resource not found');
    });
  });

  describe('RateLimitError', () => {
    it('should create RateLimitError with correct properties', () => {
      const error = new RateLimitError('Rate limit exceeded');
      
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.statusCode).toBe(429);
      expect(error.name).toBe('RateLimitError');
    });

    it('should use default message when not provided', () => {
      const error = new RateLimitError();
      
      expect(error.message).toBe('Too many requests. Please try again later.');
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with correct properties', () => {
      const error = new ValidationError('Invalid input format');
      
      expect(error.message).toBe('Invalid input format');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should create ServiceUnavailableError with correct properties', () => {
      const error = new ServiceUnavailableError('Service maintenance');
      
      expect(error.message).toBe('Service maintenance');
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      expect(error.statusCode).toBe(503);
      expect(error.name).toBe('ServiceUnavailableError');
    });

    it('should use default message when not provided', () => {
      const error = new ServiceUnavailableError();
      
      expect(error.message).toBe('Service temporarily unavailable');
    });
  });

  describe('NetworkError', () => {
    it('should create NetworkError with correct properties', () => {
      const error = new NetworkError('Connection timeout');
      
      expect(error.message).toBe('Connection timeout');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.statusCode).toBe(502);
      expect(error.name).toBe('NetworkError');
    });

    it('should use default message when not provided', () => {
      const error = new NetworkError();
      
      expect(error.message).toBe('Network connection failed');
    });
  });

  describe('CategoryServiceError', () => {
    it('should create CategoryServiceError with correct properties', () => {
      const error = new CategoryServiceError('Failed to fetch categories');
      
      expect(error.message).toBe('Failed to fetch categories');
      expect(error.code).toBe('CATEGORY_SERVICE_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('CategoryServiceError');
    });
  });

  describe('ContentServiceError', () => {
    it('should create ContentServiceError with correct properties', () => {
      const error = new ContentServiceError('Failed to fetch content');
      
      expect(error.message).toBe('Failed to fetch content');
      expect(error.code).toBe('CONTENT_SERVICE_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('ContentServiceError');
    });
  });

  describe('SearchServiceError', () => {
    it('should create SearchServiceError with correct properties', () => {
      const error = new SearchServiceError('Search failed');
      
      expect(error.message).toBe('Search failed');
      expect(error.code).toBe('SEARCH_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('SearchServiceError');
    });
  });

  describe('createErrorFromCode', () => {
    it('should create TMDBAPIError for TMDB_API_ERROR code', () => {
      const error = createErrorFromCode('TMDB_API_ERROR', 'TMDB error');
      
      expect(error).toBeInstanceOf(TMDBAPIError);
      expect(error.message).toBe('TMDB error');
    });

    it('should create InvalidRequestError for INVALID_REQUEST code', () => {
      const error = createErrorFromCode('INVALID_REQUEST', 'Invalid request');
      
      expect(error).toBeInstanceOf(InvalidRequestError);
      expect(error.message).toBe('Invalid request');
    });

    it('should create NotFoundError for NOT_FOUND code', () => {
      const error = createErrorFromCode('NOT_FOUND', 'Not found');
      
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Not found');
    });

    it('should create RateLimitError for RATE_LIMIT_EXCEEDED code', () => {
      const error = createErrorFromCode('RATE_LIMIT_EXCEEDED', 'Rate limit');
      
      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.message).toBe('Rate limit');
    });

    it('should create ValidationError for VALIDATION_ERROR code', () => {
      const error = createErrorFromCode('VALIDATION_ERROR', 'Validation failed');
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Validation failed');
    });

    it('should create ServiceUnavailableError for SERVICE_UNAVAILABLE code', () => {
      const error = createErrorFromCode('SERVICE_UNAVAILABLE', 'Service down');
      
      expect(error).toBeInstanceOf(ServiceUnavailableError);
      expect(error.message).toBe('Service down');
    });

    it('should create NetworkError for NETWORK_ERROR code', () => {
      const error = createErrorFromCode('NETWORK_ERROR', 'Network failed');
      
      expect(error).toBeInstanceOf(NetworkError);
      expect(error.message).toBe('Network failed');
    });

    it('should create CategoryServiceError for CATEGORY_SERVICE_ERROR code', () => {
      const error = createErrorFromCode('CATEGORY_SERVICE_ERROR', 'Category error');
      
      expect(error).toBeInstanceOf(CategoryServiceError);
      expect(error.message).toBe('Category error');
    });

    it('should create ContentServiceError for CONTENT_SERVICE_ERROR code', () => {
      const error = createErrorFromCode('CONTENT_SERVICE_ERROR', 'Content error');
      
      expect(error).toBeInstanceOf(ContentServiceError);
      expect(error.message).toBe('Content error');
    });

    it('should create SearchServiceError for SEARCH_ERROR code', () => {
      const error = createErrorFromCode('SEARCH_ERROR', 'Search error');
      
      expect(error).toBeInstanceOf(SearchServiceError);
      expect(error.message).toBe('Search error');
    });

    it('should create SearchServiceError for SEARCH_API_ERROR code', () => {
      const error = createErrorFromCode('SEARCH_API_ERROR', 'Search API error');
      
      expect(error).toBeInstanceOf(SearchServiceError);
      expect(error.message).toBe('Search API error');
    });

    it('should create SearchServiceError for SEARCH_NETWORK_ERROR code', () => {
      const error = createErrorFromCode('SEARCH_NETWORK_ERROR', 'Search network error');
      
      expect(error).toBeInstanceOf(SearchServiceError);
      expect(error.message).toBe('Search network error');
    });

    it('should create generic APIError for unknown codes', () => {
      const error = createErrorFromCode('UNKNOWN_CODE', 'Unknown error');
      
      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toBe('UNKNOWN_CODE');
      expect(error.message).toBe('Unknown error');
      expect(error.statusCode).toBe(500);
    });

    it('should pass details parameter correctly', () => {
      const details = { key: 'value' };
      const error = createErrorFromCode('TMDB_API_ERROR', 'TMDB error', details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('Error inheritance', () => {
    it('should properly inherit from Error class', () => {
      const error = new TMDBAPIError('Test error');
      
      expect(error instanceof Error).toBe(true);
      expect(error instanceof APIError).toBe(true);
      expect(error instanceof TMDBAPIError).toBe(true);
    });

    it('should have proper error name for each class', () => {
      expect(new TMDBAPIError('test').name).toBe('TMDBAPIError');
      expect(new InvalidRequestError('test').name).toBe('InvalidRequestError');
      expect(new NotFoundError('test').name).toBe('NotFoundError');
      expect(new RateLimitError('test').name).toBe('RateLimitError');
      expect(new ValidationError('test').name).toBe('ValidationError');
      expect(new ServiceUnavailableError('test').name).toBe('ServiceUnavailableError');
      expect(new NetworkError('test').name).toBe('NetworkError');
      expect(new CategoryServiceError('test').name).toBe('CategoryServiceError');
      expect(new ContentServiceError('test').name).toBe('ContentServiceError');
      expect(new SearchServiceError('test').name).toBe('SearchServiceError');
    });
  });
});
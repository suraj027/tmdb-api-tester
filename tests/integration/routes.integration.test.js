const request = require('supertest');
const app = require('../../src/server');

describe('API Routes Integration Tests', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'OK',
        message: 'Movie TV Tracking API is running',
        timestamp: expect.any(String),
        version: '1.0.0'
      });
    });
  });

  describe('Categories API', () => {
    it('should return categories overview', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('new-trending');
      expect(response.body.data).toHaveProperty('mood-picks');
      expect(response.body.data).toHaveProperty('award-winners');
      expect(response.body.data).toHaveProperty('studio-picks');
      expect(response.body.data).toHaveProperty('by-network');
      expect(response.body.data).toHaveProperty('by-genre');
    });
  });

  describe('Search API Validation', () => {
    it('should return error for empty search query', async () => {
      const response = await request(app)
        .get('/api/search/multi?query=')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_REQUEST');
      expect(response.body.error.message).toBe('Search query is required and must be a non-empty string');
    });

    it('should return error for missing search query', async () => {
      const response = await request(app)
        .get('/api/search/multi')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_REQUEST');
    });
  });

  describe('Content API Validation', () => {
    it('should return error for invalid movie ID', async () => {
      const response = await request(app)
        .get('/api/movie/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_REQUEST');
      expect(response.body.error.message).toBe('Valid movie ID is required');
    });

    it('should return error for invalid TV show ID', async () => {
      const response = await request(app)
        .get('/api/tv/abc')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_REQUEST');
      expect(response.body.error.message).toBe('Valid TV show ID is required');
    });

    it('should return error for invalid media type in credits', async () => {
      const response = await request(app)
        .get('/api/invalid/123/credits')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_REQUEST');
      expect(response.body.error.message).toBe('Media type must be "movie" or "tv"');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toBe('Route GET /api/nonexistent not found');
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error format', async () => {
      const response = await request(app)
        .get('/api/movie/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
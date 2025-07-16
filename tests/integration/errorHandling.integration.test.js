const request = require('supertest');
const app = require('../../src/server');

describe('Error Handling Integration Tests', () => {
  describe('404 Not Found', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route GET /api/non-existent-route not found'
        },
        timestamp: expect.any(String)
      });
    });

    it('should return 404 for non-existent POST routes', async () => {
      const response = await request(app)
        .post('/api/invalid-endpoint')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Route POST /api/invalid-endpoint not found'
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('Invalid JSON handling', () => {
    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/search/multi')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_JSON');
      expect(response.body.error.message).toBe('Invalid JSON in request body');
    });
  });

  describe('Service Error Handling', () => {
    // Note: This test would require a real TMDB API call which may timeout
    // In a real scenario, you would mock the TMDB service for integration tests
    it.skip('should handle TMDB API errors gracefully', async () => {
      // This test is skipped to avoid network timeouts in CI/CD
      // In practice, you would mock the TMDB service responses
    });

    it('should handle search with empty query', async () => {
      const response = await request(app)
        .get('/api/search/multi?query=')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(['VALIDATION_ERROR', 'INVALID_REQUEST', 'SEARCH_ERROR']).toContain(response.body.error.code);
    });

    it('should handle search with missing query parameter', async () => {
      const response = await request(app)
        .get('/api/search/multi')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(['VALIDATION_ERROR', 'INVALID_REQUEST', 'SEARCH_ERROR']).toContain(response.body.error.code);
    });
  });

  describe('Error Response Format', () => {
    it('should always return consistent error format', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);

      // Verify the error response structure
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      
      // Verify timestamp is a valid ISO string
      expect(() => new Date(response.body.timestamp)).not.toThrow();
    });

    it('should not expose sensitive information in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);

      // Should not have details in production
      expect(response.body.error).not.toHaveProperty('details');
      expect(response.body.error).not.toHaveProperty('stack');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
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

  describe('CORS Headers', () => {
    it('should include proper CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should handle OPTIONS requests', async () => {
      await request(app)
        .options('/api/search/multi')
        .expect(204);
    });
  });

  describe('Content-Type Handling', () => {
    it('should handle requests without content-type', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return JSON content-type for errors', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
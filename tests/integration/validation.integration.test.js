const request = require('supertest');
const app = require('../../src/server');

describe('Validation Integration Tests', () => {
  const userAgent = 'Mozilla/5.0 (Test Browser)';

  describe('Search endpoints with validation', () => {
    test('should validate search query parameters', async () => {
      // Test invalid search (empty query) - this should fail validation before API call
      const invalidResponse = await request(app)
        .get('/api/search/multi?query=')
        .set('User-Agent', userAgent)
        .expect(400);

      expect(invalidResponse.body.success).toBe(false);
      expect(invalidResponse.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should validate page parameters', async () => {
      // Test invalid page (too large) - this should fail validation before API call
      const invalidResponse = await request(app)
        .get('/api/search/multi?query=batman&page=1001')
        .set('User-Agent', userAgent)
        .expect(400);

      expect(invalidResponse.body.success).toBe(false);
      expect(invalidResponse.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Content endpoints with validation', () => {
    test('should validate content ID parameters', async () => {
      // Test invalid content ID (non-numeric)
      const invalidResponse = await request(app)
        .get('/api/movie/abc')
        .set('User-Agent', userAgent)
        .expect(400);

      expect(invalidResponse.body.success).toBe(false);
      expect(invalidResponse.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should validate media type parameters', async () => {
      // Test invalid media type
      const invalidResponse = await request(app)
        .get('/api/invalid/123/credits')
        .set('User-Agent', userAgent)
        .expect(400);

      expect(invalidResponse.body.success).toBe(false);
      expect(invalidResponse.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Category endpoints with validation', () => {
    test('should validate studio parameters', async () => {
      // Test invalid studio
      const invalidResponse = await request(app)
        .get('/api/studio/invalid-studio')
        .set('User-Agent', userAgent)
        .expect(400);

      expect(invalidResponse.body.success).toBe(false);
      expect(invalidResponse.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should validate network parameters', async () => {
      // Test invalid network
      const invalidResponse = await request(app)
        .get('/api/network/invalid-network')
        .set('User-Agent', userAgent)
        .expect(400);

      expect(invalidResponse.body.success).toBe(false);
      expect(invalidResponse.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should validate genre parameters', async () => {
      // Test invalid genre
      const invalidResponse = await request(app)
        .get('/api/genre/invalid-genre')
        .set('User-Agent', userAgent)
        .expect(400);

      expect(invalidResponse.body.success).toBe(false);
      expect(invalidResponse.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Security headers', () => {
    test('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/health')
        .set('User-Agent', userAgent)
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
      expect(response.headers['referrer-policy']).toBe('same-origin');
      expect(response.headers['x-api-version']).toBe('1.0.0');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('User-Agent validation', () => {
    test('should reject requests without User-Agent', async () => {
      const response = await request(app)
        .get('/health')
        .set('User-Agent', '')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_USER_AGENT');
    });

    test('should accept requests with valid User-Agent', async () => {
      const response = await request(app)
        .get('/health')
        .set('User-Agent', 'Mozilla/5.0 (compatible browser)')
        .expect(200);

      expect(response.body.status).toBe('OK');
    });
  });
});
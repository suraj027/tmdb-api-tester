const request = require('supertest');
const express = require('express');
const { 
  validateSearchQuery, 
  validateContentId, 
  validateMediaType,
  validateCategoryParam,
  validateStudioParam,
  validateNetworkParam,
  validateGenreParam,
  validateAwardTypeParam,
  sanitizeString,
  sanitizeQuery,
  sanitizeParams
} = require('../../../src/middleware/validation');

describe('Validation Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('validateSearchQuery', () => {
    beforeEach(() => {
      app.get('/test', validateSearchQuery, (req, res) => {
        res.json({ success: true, query: req.query.query });
      });
    });

    test('should accept valid search query', async () => {
      const response = await request(app)
        .get('/test?query=batman')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.query).toBe('batman');
    });

    test('should reject empty search query', async () => {
      const response = await request(app)
        .get('/test?query=')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject missing search query', async () => {
      const response = await request(app)
        .get('/test')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject search query that is too long', async () => {
      const longQuery = 'a'.repeat(201);
      const response = await request(app)
        .get(`/test?query=${longQuery}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject malicious search query with script tags', async () => {
      const response = await request(app)
        .get('/test?query=<script>alert("xss")</script>')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should accept valid page parameter', async () => {
      const response = await request(app)
        .get('/test?query=batman&page=2')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject invalid page parameter', async () => {
      const response = await request(app)
        .get('/test?query=batman&page=0')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject page parameter that is too large', async () => {
      const response = await request(app)
        .get('/test?query=batman&page=1001')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('validateContentId', () => {
    beforeEach(() => {
      app.get('/test/:id', validateContentId, (req, res) => {
        res.json({ success: true, id: req.params.id });
      });
    });

    test('should accept valid content ID', async () => {
      const response = await request(app)
        .get('/test/123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.id).toBe('123');
    });

    test('should reject non-numeric content ID', async () => {
      const response = await request(app)
        .get('/test/abc')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject zero content ID', async () => {
      const response = await request(app)
        .get('/test/0')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject negative content ID', async () => {
      const response = await request(app)
        .get('/test/-1')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('validateMediaType', () => {
    beforeEach(() => {
      app.get('/test/:mediaType', validateMediaType, (req, res) => {
        res.json({ success: true, mediaType: req.params.mediaType });
      });
    });

    test('should accept "movie" media type', async () => {
      const response = await request(app)
        .get('/test/movie')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.mediaType).toBe('movie');
    });

    test('should accept "tv" media type', async () => {
      const response = await request(app)
        .get('/test/tv')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.mediaType).toBe('tv');
    });

    test('should reject invalid media type', async () => {
      const response = await request(app)
        .get('/test/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('validateStudioParam', () => {
    beforeEach(() => {
      app.get('/test/:studio', validateStudioParam, (req, res) => {
        res.json({ success: true, studio: req.params.studio });
      });
    });

    test('should accept valid studio name', async () => {
      const response = await request(app)
        .get('/test/disney')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.studio).toBe('disney');
    });

    test('should reject invalid studio name', async () => {
      const response = await request(app)
        .get('/test/invalid-studio')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('validateNetworkParam', () => {
    beforeEach(() => {
      app.get('/test/:network', validateNetworkParam, (req, res) => {
        res.json({ success: true, network: req.params.network });
      });
    });

    test('should accept valid network name', async () => {
      const response = await request(app)
        .get('/test/netflix')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.network).toBe('netflix');
    });

    test('should reject invalid network name', async () => {
      const response = await request(app)
        .get('/test/invalid-network')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('sanitizeString', () => {
    test('should remove XSS attempts', () => {
      const malicious = '<script>alert("xss")</script>';
      const sanitized = sanitizeString(malicious);
      expect(sanitized).toBe(''); // XSS library removes the entire malicious content
    });

    test('should escape HTML entities', () => {
      const input = 'Batman & Robin';
      const sanitized = sanitizeString(input);
      expect(sanitized).toBe('Batman &amp; Robin');
    });

    test('should trim whitespace', () => {
      const input = '  batman  ';
      const sanitized = sanitizeString(input);
      expect(sanitized).toBe('batman');
    });

    test('should handle non-string input', () => {
      const input = 123;
      const sanitized = sanitizeString(input);
      expect(sanitized).toBe(123);
    });
  });

  describe('sanitizeQuery middleware', () => {
    beforeEach(() => {
      app.use(sanitizeQuery);
      app.get('/test', (req, res) => {
        res.json({ query: req.query });
      });
    });

    test('should sanitize query parameters', async () => {
      const response = await request(app)
        .get('/test?search=<script>alert("xss")</script>&normal=batman')
        .expect(200);

      expect(response.body.query.search).not.toContain('<script>');
      expect(response.body.query.normal).toBe('batman');
    });
  });

  describe('sanitizeParams middleware', () => {
    test('should sanitize URL parameters when middleware is applied', () => {
      // Test the middleware function directly
      const req = {
        params: {
          test: 'batman&robin',
          malicious: '<script>alert("test")</script>'
        }
      };
      const res = {};
      const next = jest.fn();

      sanitizeParams(req, res, next);

      expect(req.params.test).toBe('batman&amp;robin');
      expect(req.params.malicious).toBe(''); // XSS content should be removed
      expect(next).toHaveBeenCalled();
    });
  });
});
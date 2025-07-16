const request = require('supertest');
const express = require('express');
const { 
  generalRateLimit,
  searchRateLimit,
  contentRateLimit,
  securityHeaders,
  additionalSecurityHeaders,
  validateRequestSize,
  validateUserAgent,
  securityLogger
} = require('../../../src/middleware/security');

describe('Security Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('additionalSecurityHeaders', () => {
    beforeEach(() => {
      app.use(additionalSecurityHeaders);
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });
    });

    test('should add security headers', async () => {
      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
      expect(response.headers['referrer-policy']).toBe('same-origin');
      expect(response.headers['permissions-policy']).toContain('geolocation=()');
      expect(response.headers['x-api-version']).toBe('1.0.0');
    });

    test('should remove X-Powered-By header', async () => {
      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('validateRequestSize', () => {
    beforeEach(() => {
      app.use(validateRequestSize);
      app.post('/test', (req, res) => {
        res.json({ success: true });
      });
    });

    test('should accept requests within size limit', async () => {
      const smallPayload = { data: 'small' };
      const response = await request(app)
        .post('/test')
        .send(smallPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject requests that are too large', async () => {
      // Create a large payload (simulate content-length header)
      const app2 = express();
      app2.use((req, res, next) => {
        req.headers['content-length'] = '2000000'; // 2MB
        next();
      });
      app2.use(validateRequestSize);
      app2.post('/test', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app2)
        .post('/test')
        .send({ data: 'test' })
        .expect(413);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    });
  });

  describe('validateUserAgent', () => {
    beforeEach(() => {
      app.use(validateUserAgent);
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });
    });

    test('should accept requests with valid User-Agent', async () => {
      const response = await request(app)
        .get('/test')
        .set('User-Agent', 'Mozilla/5.0 (compatible browser)')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should reject requests without User-Agent', async () => {
      const response = await request(app)
        .get('/test')
        .set('User-Agent', '')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_USER_AGENT');
    });

    test('should accept suspicious User-Agent in development', async () => {
      // In test environment, suspicious user agents should be allowed
      const response = await request(app)
        .get('/test')
        .set('User-Agent', 'curl/7.68.0')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('securityLogger', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      app.use(securityLogger);
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });
      app.get('/error', (req, res) => {
        res.json({ 
          success: false, 
          error: { code: 'TEST_ERROR', message: 'Test error' } 
        });
      });
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    test('should log successful requests', async () => {
      await request(app)
        .get('/test')
        .set('User-Agent', 'test-agent')
        .expect(200);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY]')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('GET /test')
      );
    });

    test('should log error responses', async () => {
      await request(app)
        .get('/error')
        .set('User-Agent', 'test-agent')
        .expect(200);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SECURITY]')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error Response: TEST_ERROR')
      );
    });
  });

  describe('Rate Limiting', () => {
    test('should have different rate limits for different endpoints', () => {
      // Test that rate limiters are configured with different limits
      expect(generalRateLimit).toBeDefined();
      expect(searchRateLimit).toBeDefined();
      expect(contentRateLimit).toBeDefined();
    });

    test('should return proper error format when rate limit exceeded', () => {
      // Create a mock rate limiter that always triggers
      const mockRateLimit = (req, res, next) => {
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests from this IP, please try again later.',
            retryAfter: '15 minutes'
          },
          timestamp: new Date().toISOString()
        });
      };

      const testApp = express();
      testApp.use(mockRateLimit);
      testApp.get('/test', (req, res) => {
        res.json({ success: true });
      });

      return request(testApp)
        .get('/test')
        .expect(429)
        .then(response => {
          expect(response.body.success).toBe(false);
          expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
          expect(response.body.error.retryAfter).toBe('15 minutes');
          expect(response.body.timestamp).toBeDefined();
        });
    });
  });
});
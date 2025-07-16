# Movie TV Tracking API

A Node.js API service that serves as a proxy for TMDB API with organized content categorization, featuring comprehensive security measures and input validation.

## Features

- 🎬 **Movie & TV Show Data**: Access trending, upcoming, and detailed content information
- 🔍 **Advanced Search**: Multi-search across movies, TV shows, and people
- 🏷️ **Content Categories**: Organized by mood, studio, network, genre, and awards
- 🔒 **Security First**: Rate limiting, input validation, XSS protection, and security headers
- 📊 **Comprehensive API**: RESTful endpoints with consistent response formats
- 🧪 **Well Tested**: Unit and integration tests with 98+ test coverage

## Quick Start

### Prerequisites

- Node.js 16+ 
- TMDB API Key (get one at [themoviedb.org](https://www.themoviedb.org/settings/api))

### Local Development

1. **Clone and install dependencies**
   ```bash
   git clone <your-repo-url>
   cd movie-tv-tracking-app
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your TMDB_API_KEY
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Test the API**
   ```bash
   curl http://localhost:3000/health
   ```

### Deployment

#### Render.com Deployment

1. **Connect your GitHub repository** to Render
2. **Set environment variables** in Render dashboard:
   - `TMDB_API_KEY`: Your TMDB API key
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: Your frontend domain (or `*` for development)
3. **Deploy** - Render will automatically build and deploy

#### Replit Deployment

1. **Import your GitHub repository** to Replit
2. **Set environment variables** in Replit Secrets:
   - `TMDB_API_KEY`: Your TMDB API key
   - `NODE_ENV`: `production`
3. **Run** the application

## API Documentation

### Base URL
- Local: `http://localhost:3000`
- Production: `https://your-app.render.com` (or your deployed URL)

### Authentication
No authentication required - this is a public proxy API.

### Rate Limits
- **General API**: 1000 requests per 15 minutes
- **Search endpoints**: 100 requests per 5 minutes
- **Content endpoints**: 60 requests per minute

### Core Endpoints

#### Health Check
```http
GET /health
```

#### Categories Overview
```http
GET /api
```

#### Trending Content
```http
GET /api/trending/movies?page=1
GET /api/trending/tv?page=1
```

#### Search
```http
GET /api/search/multi?query=batman&page=1
GET /api/search/movies?query=batman&page=1
GET /api/search/tv?query=batman&page=1
```

#### Content Details
```http
GET /api/movie/{id}
GET /api/tv/{id}
GET /api/movie/{id}/credits
GET /api/tv/{id}/videos
```

#### Upcoming Content
```http
GET /api/upcoming
GET /api/upcoming/movies
GET /api/upcoming/tv
```

#### Category-based Content
```http
GET /api/studio/disney?page=1
GET /api/network/netflix?page=1
GET /api/genre/action?page=1&type=movie
GET /api/mood/family-movie-night?page=1
GET /api/awards/oscar-winners?page=1
```

### Response Format

#### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "pagination": {
    "page": 1,
    "totalPages": 10,
    "totalResults": 200
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Security Features

- **Input Validation**: All parameters validated and sanitized
- **Rate Limiting**: Prevents API abuse with tiered limits
- **Security Headers**: HSTS, CSP, XSS protection, and more
- **CORS Configuration**: Configurable origin restrictions
- **Request Size Limits**: Prevents large payload attacks
- **User-Agent Validation**: Blocks suspicious automated requests
- **XSS Protection**: Input sanitization prevents script injection

## Development

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- tests/unit/middleware/validation.test.js
```

### Project Structure
```
src/
├── config/           # Configuration files
├── middleware/       # Security, validation, error handling
├── routes/          # API route handlers
├── services/        # Business logic and external API calls
└── server.js        # Main application entry point

tests/
├── unit/            # Unit tests
├── integration/     # Integration tests
└── fixtures/        # Test data
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TMDB_API_KEY` | Your TMDB API key | - | ✅ |
| `PORT` | Server port | `3000` | ❌ |
| `NODE_ENV` | Environment | `development` | ❌ |
| `CORS_ORIGIN` | Allowed origins | `*` | ❌ |

## Troubleshooting

### Common Issues

1. **TMDB API calls failing**
   - Check your API key is valid
   - Ensure your network/ISP doesn't block TMDB API
   - Deploy to external service if local network blocks TMDB

2. **Rate limit errors**
   - Implement client-side request throttling
   - Consider caching responses
   - Contact for rate limit increases if needed

3. **CORS errors**
   - Set `CORS_ORIGIN` to your frontend domain
   - Use `*` only for development/testing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Open an issue on GitHub
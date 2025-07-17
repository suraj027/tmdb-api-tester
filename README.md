# Movie TV Tracking API

A Node.js API service that serves as a proxy for TMDB API with organized content categorization, featuring comprehensive security measures and input validation.

## Features

- 🎬 **Movie & TV Show Data**: Access trending, upcoming, and detailed content information
- 🔍 **Advanced Search**: Multi-search across movies, TV shows, and people
- 🏷️ **Content Categories**: Organized by mood, studio, network, genre, and awards
- 🔒 **Security First**: Rate limiting, input validation, XSS protection, and security headers
- 📊 **Comprehensive API**: RESTful endpoints with consistent response formats
- 🧪 **Well Tested**: Unit and integration tests with 98+ test coverage


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

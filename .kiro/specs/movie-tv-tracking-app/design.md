# Design Document

## Overview

The Movie/TV Tracking App will be built as a Node.js-based proxy API service that interfaces with The Movie Database (TMDB) API. The system will provide organized content categorization, detailed movie/show information, and search capabilities while bypassing network restrictions that block direct TMDB access.

The architecture follows a RESTful API design pattern with clear separation of concerns, featuring dedicated services for different content categories, caching mechanisms for performance, and comprehensive error handling.

## Architecture

### High-Level Architecture

```
Client Application
       ↓
Node.js Express API Server
       ↓
TMDB API Service Layer
       ↓
The Movie Database API
```

### System Components

1. **Express.js Web Server**: Main application server handling HTTP requests
2. **Route Handlers**: Organized endpoints for different content categories
3. **TMDB Service Layer**: Abstraction layer for TMDB API interactions
4. **Category Services**: Specialized services for different content categorizations
5. **Data Transformation Layer**: Formats TMDB responses for client consumption
6. **Error Handling Middleware**: Centralized error management
7. **Caching Layer**: Optional Redis/memory caching for performance

## Components and Interfaces

### Core API Endpoints

#### Category Endpoints
- `GET /api/categories` - Returns all available categories and subcategories
- `GET /api/trending/movies` - Trending movies
- `GET /api/trending/tv` - Hot TV shows
- `GET /api/upcoming/movies` - Anticipated movies
- `GET /api/streaming/now` - Films now streaming
- `GET /api/mood/:category` - Mood-based content (family, rom-com, thriller, etc.)
- `GET /api/awards/:type` - Award winners (oscar, top-grossing, imdb-top-250, etc.)
- `GET /api/studio/:studio` - Studio-specific content
- `GET /api/network/:network` - Network-specific content
- `GET /api/genre/:genre` - Genre-based content

#### Upcoming Content Endpoints
- `GET /api/upcoming` - Combined upcoming movies and TV shows
- `GET /api/upcoming/movies` - Upcoming movies only
- `GET /api/upcoming/tv` - Upcoming TV shows only

#### Detail Endpoints
- `GET /api/movie/:id` - Complete movie details
- `GET /api/tv/:id` - Complete TV show details
- `GET /api/movie/:id/credits` - Movie cast and crew
- `GET /api/movie/:id/videos` - Movie trailers and videos
- `GET /api/movie/:id/recommendations` - Similar movies
- `GET /api/movie/:id/watch-providers` - Where to watch information
- `GET /api/person/:id/movies` - Movies by director/actor

#### Search Endpoints
- `GET /api/search/multi?query=:query` - Search movies and TV shows
- `GET /api/search/movies?query=:query` - Search movies only
- `GET /api/search/tv?query=:query` - Search TV shows only

### Service Layer Architecture

#### TMDBService
```javascript
class TMDBService {
  constructor(apiKey, baseURL)
  async makeRequest(endpoint, params)
  async getMovie(id)
  async getTVShow(id)
  async searchMulti(query)
  async getTrending(mediaType, timeWindow)
  async getUpcoming()
  async getGenres(mediaType)
  async discoverMovies(params)
  async discoverTV(params)
}
```

#### CategoryService
```javascript
class CategoryService {
  constructor(tmdbService)
  async getTrendingMovies()
  async getHotTVShows()
  async getAnticipatedMovies()
  async getStreamingNow()
  async getUpcomingMovies()
  async getUpcomingTV()
  async getCombinedUpcoming()
  async getMoodContent(category)
  async getAwardWinners(type)
  async getStudioContent(studio)
  async getNetworkContent(network)
  async getGenreContent(genre)
}
```

#### ContentService
```javascript
class ContentService {
  constructor(tmdbService)
  async getMovieDetails(id)
  async getTVDetails(id)
  async getCredits(id, mediaType)
  async getVideos(id, mediaType)
  async getRecommendations(id, mediaType)
  async getWatchProviders(id, mediaType)
  async getDirectorMovies(directorId)
}
```

## Data Models

### Movie Response Model
```javascript
{
  id: number,
  title: string,
  tagline: string,
  overview: string,
  backdrop_path: string,
  poster_path: string,
  release_date: string,
  vote_average: number,
  vote_count: number,
  genres: [{ id: number, name: string }],
  status: string,
  runtime: number,
  production_companies: [{ id: number, name: string, logo_path: string }],
  original_language: string,
  revenue: number,
  budget: number,
  watch_providers: {
    flatrate: [{ provider_id: number, provider_name: string, logo_path: string }],
    rent: [...],
    buy: [...]
  },
  videos: {
    results: [{ key: string, name: string, type: string, site: string }]
  },
  credits: {
    cast: [{ id: number, name: string, character: string, profile_path: string }],
    crew: [{ id: number, name: string, job: string, profile_path: string }]
  },
  recommendations: {
    results: [{ id: number, title: string, poster_path: string, vote_average: number }]
  }
}
```

### TV Show Response Model
```javascript
{
  id: number,
  name: string,
  tagline: string,
  overview: string,
  backdrop_path: string,
  poster_path: string,
  first_air_date: string,
  vote_average: number,
  vote_count: number,
  genres: [{ id: number, name: string }],
  status: string,
  number_of_seasons: number,
  number_of_episodes: number,
  networks: [{ id: number, name: string, logo_path: string }],
  original_language: string,
  // Similar structure for videos, credits, recommendations, watch_providers
}
```

### Category Mapping Configuration
```javascript
const CATEGORY_MAPPINGS = {
  mood: {
    'family-movie-night': { genres: [10751], sort_by: 'popularity.desc' },
    'rom-com-classics': { genres: [10749, 35], sort_by: 'vote_average.desc' },
    'psychological-thrillers': { genres: [53], keywords: 'psychological', sort_by: 'vote_average.desc' },
    'feel-good-shows': { genres: [35], media_type: 'tv', sort_by: 'popularity.desc' },
    'musicals': { genres: [10402], sort_by: 'popularity.desc' },
    'halloween': { genres: [27], sort_by: 'popularity.desc' },
    'bingeable-series': { media_type: 'tv', sort_by: 'popularity.desc' }
  },
  studios: {
    'disney': { with_companies: '2' },
    'pixar': { with_companies: '3' },
    'marvel': { with_companies: '420' },
    'dc': { with_companies: '9993' },
    'universal': { with_companies: '33' },
    'lucasfilm': { with_companies: '1' },
    'illumination': { with_companies: '6704' },
    'dreamworks': { with_companies: '521' }
  },
  networks: {
    'netflix': { with_networks: '213' },
    'apple-tv': { with_networks: '2552' },
    'disney-plus': { with_networks: '2739' },
    'prime-video': { with_networks: '1024' },
    'hbo': { with_networks: '49' },
    'paramount-plus': { with_networks: '4330' }
  }
}
```

## Error Handling

### Error Response Structure
```javascript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  },
  timestamp: string
}
```

### Error Types
- `TMDB_API_ERROR`: Issues with TMDB API calls
- `INVALID_REQUEST`: Malformed client requests
- `NOT_FOUND`: Requested resource not found
- `RATE_LIMIT_EXCEEDED`: API rate limits exceeded
- `SERVER_ERROR`: Internal server errors

### Error Handling Strategy
1. **API Level**: Catch and transform TMDB API errors
2. **Service Level**: Handle business logic errors
3. **Route Level**: Validate requests and handle route-specific errors
4. **Global Level**: Catch-all error middleware for unhandled errors

## Testing Strategy

### Unit Testing
- **TMDB Service**: Mock API responses, test data transformation
- **Category Service**: Test category mapping logic
- **Content Service**: Test data aggregation and formatting
- **Route Handlers**: Test request/response handling

### Integration Testing
- **API Endpoints**: Test complete request/response cycles
- **TMDB Integration**: Test actual API calls with test data
- **Error Scenarios**: Test various error conditions

### Test Structure
```
tests/
├── unit/
│   ├── services/
│   │   ├── tmdb.service.test.js
│   │   ├── category.service.test.js
│   │   └── content.service.test.js
│   └── routes/
│       ├── movies.routes.test.js
│       └── categories.routes.test.js
├── integration/
│   ├── api.integration.test.js
│   └── tmdb.integration.test.js
└── fixtures/
    ├── movie-responses.json
    └── tv-responses.json
```

### Performance Considerations
1. **Caching**: Implement Redis caching for frequently requested data
2. **Rate Limiting**: Respect TMDB API rate limits (40 requests per 10 seconds)
3. **Request Batching**: Combine multiple API calls where possible
4. **Image Optimization**: Serve appropriate image sizes based on client needs
5. **Compression**: Enable gzip compression for API responses

### Security Considerations
1. **API Key Management**: Store TMDB API key in environment variables
2. **CORS Configuration**: Properly configure CORS for client applications
3. **Input Validation**: Validate all incoming requests
4. **Rate Limiting**: Implement client-side rate limiting
5. **Error Information**: Avoid exposing sensitive information in error messages
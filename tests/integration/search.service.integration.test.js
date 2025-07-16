const SearchService = require('../../src/services/search.service');
const TMDBService = require('../../src/services/tmdb.service');
require('dotenv').config();

describe('SearchService Integration Tests', () => {
  let searchService;
  let tmdbService;

  beforeAll(() => {
    // Skip tests if no API key is available
    if (!process.env.TMDB_API_KEY) {
      console.log('Skipping integration tests - TMDB_API_KEY not found');
      return;
    }

    tmdbService = new TMDBService(process.env.TMDB_API_KEY);
    searchService = new SearchService(tmdbService);
  });

  // Skip all tests if no API key
  const skipIfNoApiKey = () => {
    if (!process.env.TMDB_API_KEY) {
      pending('TMDB_API_KEY not configured');
    }
  };

  describe('Real TMDB API Integration', () => {
    it('should search for movies using real TMDB API', async () => {
      skipIfNoApiKey();

      const result = await searchService.searchMovies('batman', 1);

      expect(result.success).toBe(true);
      expect(result.searchType).toBe('movie');
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0]).toHaveProperty('id');
      expect(result.results[0]).toHaveProperty('title');
      expect(result.results[0]).toHaveProperty('mediaType', 'movie');
      expect(result.pagination.totalResults).toBeGreaterThan(0);
    }, 10000); // 10 second timeout for API call

    it('should search for TV shows using real TMDB API', async () => {
      skipIfNoApiKey();

      const result = await searchService.searchTV('breaking bad', 1);

      expect(result.success).toBe(true);
      expect(result.searchType).toBe('tv');
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0]).toHaveProperty('id');
      expect(result.results[0]).toHaveProperty('title');
      expect(result.results[0]).toHaveProperty('mediaType', 'tv');
      expect(result.pagination.totalResults).toBeGreaterThan(0);
    }, 10000);

    it('should perform multi-search using real TMDB API', async () => {
      skipIfNoApiKey();

      const result = await searchService.searchMulti('marvel', 1);

      expect(result.success).toBe(true);
      expect(result.searchType).toBe('multi');
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.pagination.totalResults).toBeGreaterThan(0);
      
      // Should have mixed media types
      const mediaTypes = result.results.map(r => r.mediaType);
      expect(mediaTypes.length).toBeGreaterThan(0);
    }, 10000);

    it('should handle empty search results gracefully', async () => {
      skipIfNoApiKey();

      const result = await searchService.searchMovies('xyzabc123nonexistentmovie', 1);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(0);
      expect(result.pagination.totalResults).toBe(0);
    }, 10000);

    it('should format poster URLs correctly', async () => {
      skipIfNoApiKey();

      const result = await searchService.searchMovies('avatar', 1);

      expect(result.results.length).toBeGreaterThan(0);
      
      const movieWithPoster = result.results.find(movie => movie.posterUrl);
      if (movieWithPoster) {
        expect(movieWithPoster.posterUrl).toMatch(/^https:\/\/image\.tmdb\.org\/t\/p\/w500\//);
      }
    }, 10000);

    it('should apply filtering options correctly', async () => {
      skipIfNoApiKey();

      const result = await searchService.searchMovies('action', 1, {
        minVoteCount: 100,
        minRating: 7.0
      });

      expect(result.success).toBe(true);
      
      // All results should meet the filter criteria
      result.results.forEach(movie => {
        expect(movie.voteCount).toBeGreaterThanOrEqual(100);
        expect(movie.voteAverage).toBeGreaterThanOrEqual(7.0);
      });
    }, 10000);
  });
});
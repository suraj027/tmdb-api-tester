const ContentService = require('../../src/services/content.service');
const TMDBService = require('../../src/services/tmdb.service');

describe('ContentService Integration', () => {
  let contentService;
  let tmdbService;

  beforeAll(() => {
    // Use a test API key or mock for integration tests
    const testApiKey = process.env.TMDB_API_KEY || 'test-api-key';
    tmdbService = new TMDBService(testApiKey);
    contentService = new ContentService(tmdbService);
  });

  it('should create ContentService with real TMDBService instance', () => {
    expect(contentService).toBeInstanceOf(ContentService);
    expect(contentService.tmdbService).toBeInstanceOf(TMDBService);
  });

  it('should have all required methods', () => {
    expect(typeof contentService.getMovieDetails).toBe('function');
    expect(typeof contentService.getTVDetails).toBe('function');
    expect(typeof contentService.getCredits).toBe('function');
    expect(typeof contentService.getVideos).toBe('function');
    expect(typeof contentService.getRecommendations).toBe('function');
    expect(typeof contentService.getWatchProviders).toBe('function');
    expect(typeof contentService.getDirectorMovies).toBe('function');
  });

  // Note: These tests would require a valid TMDB API key to run against real API
  // For now, we're just testing the service instantiation and method availability
});
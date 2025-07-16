const ContentService = require('../../../src/services/content.service');
const TMDBService = require('../../../src/services/tmdb.service');

// Mock TMDBService
jest.mock('../../../src/services/tmdb.service');

describe('ContentService', () => {
  let contentService;
  let mockTMDBService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock TMDB service instance
    mockTMDBService = {
      getMovie: jest.fn(),
      getTVShow: jest.fn(),
      getMovieCredits: jest.fn(),
      getTVCredits: jest.fn(),
      getMovieVideos: jest.fn(),
      getTVVideos: jest.fn(),
      getMovieRecommendations: jest.fn(),
      getTVRecommendations: jest.fn(),
      getMovieWatchProviders: jest.fn(),
      getTVWatchProviders: jest.fn(),
      getPersonMovies: jest.fn()
    };

    // Mock the constructor check
    Object.setPrototypeOf(mockTMDBService, TMDBService.prototype);
    
    contentService = new ContentService(mockTMDBService);
  });

  describe('constructor', () => {
    it('should create ContentService with valid TMDBService', () => {
      expect(contentService).toBeInstanceOf(ContentService);
      expect(contentService.tmdbService).toBe(mockTMDBService);
    });

    it('should throw error if no TMDBService provided', () => {
      expect(() => new ContentService()).toThrow('Valid TMDBService instance is required');
    });

    it('should throw error if invalid TMDBService provided', () => {
      expect(() => new ContentService({})).toThrow('Valid TMDBService instance is required');
    });
  });

  describe('getMovieDetails', () => {
    const mockMovieData = {
      id: 123,
      title: 'Test Movie',
      tagline: 'A test movie',
      overview: 'This is a test movie overview',
      backdrop_path: '/backdrop.jpg',
      backdrop_url: 'https://image.tmdb.org/t/p/w1280/backdrop.jpg',
      poster_path: '/poster.jpg',
      poster_url: 'https://image.tmdb.org/t/p/w500/poster.jpg',
      release_date: '2023-01-01',
      vote_average: 8.5,
      vote_count: 1000,
      genres: [{ id: 28, name: 'Action' }],
      status: 'Released',
      runtime: 120,
      production_companies: [{ id: 1, name: 'Test Studios' }],
      original_language: 'en',
      revenue: 100000000,
      budget: 50000000,
      credits: { cast: [], crew: [] },
      videos: { results: [] },
      recommendations: { results: [] },
      'watch/providers': { results: {} }
    };

    it('should get complete movie details successfully', async () => {
      mockTMDBService.getMovie.mockResolvedValue(mockMovieData);

      const result = await contentService.getMovieDetails(123);

      expect(mockTMDBService.getMovie).toHaveBeenCalledWith(123, 'credits,videos,recommendations,watch/providers');
      expect(result).toEqual({
        id: 123,
        title: 'Test Movie',
        tagline: 'A test movie',
        overview: 'This is a test movie overview',
        backdrop_path: '/backdrop.jpg',
        backdrop_url: 'https://image.tmdb.org/t/p/w1280/backdrop.jpg',
        poster_path: '/poster.jpg',
        poster_url: 'https://image.tmdb.org/t/p/w500/poster.jpg',
        release_date: '2023-01-01',
        vote_average: 8.5,
        vote_count: 1000,
        genres: [{ id: 28, name: 'Action' }],
        status: 'Released',
        runtime: 120,
        production_companies: [{ id: 1, name: 'Test Studios' }],
        original_language: 'en',
        revenue: 100000000,
        budget: 50000000,
        credits: { cast: [], crew: [] },
        videos: { results: [] },
        recommendations: { results: [] },
        watch_providers: { results: {} }
      });
    });

    it('should handle missing optional fields', async () => {
      const minimalMovieData = {
        id: 123,
        title: 'Test Movie',
        vote_average: 8.5,
        vote_count: 1000
      };

      mockTMDBService.getMovie.mockResolvedValue(minimalMovieData);

      const result = await contentService.getMovieDetails(123);

      expect(result.tagline).toBe('');
      expect(result.overview).toBe('');
      expect(result.genres).toEqual([]);
      expect(result.production_companies).toEqual([]);
      expect(result.revenue).toBe(0);
      expect(result.budget).toBe(0);
    });

    it('should throw error for invalid movie ID', async () => {
      await expect(contentService.getMovieDetails()).rejects.toThrow('Valid movie ID is required');
      await expect(contentService.getMovieDetails('invalid')).rejects.toThrow('Valid movie ID is required');
      await expect(contentService.getMovieDetails(null)).rejects.toThrow('Valid movie ID is required');
    });

    it('should handle TMDB service errors', async () => {
      const tmdbError = new Error('TMDB API Error');
      mockTMDBService.getMovie.mockRejectedValue(tmdbError);

      await expect(contentService.getMovieDetails(123)).rejects.toThrow('Failed to get movie details: TMDB API Error');
    });
  });

  describe('getTVDetails', () => {
    const mockTVData = {
      id: 456,
      name: 'Test TV Show',
      tagline: 'A test TV show',
      overview: 'This is a test TV show overview',
      backdrop_path: '/tv-backdrop.jpg',
      backdrop_url: 'https://image.tmdb.org/t/p/w1280/tv-backdrop.jpg',
      poster_path: '/tv-poster.jpg',
      poster_url: 'https://image.tmdb.org/t/p/w500/tv-poster.jpg',
      first_air_date: '2023-01-01',
      vote_average: 9.0,
      vote_count: 500,
      genres: [{ id: 18, name: 'Drama' }],
      status: 'Returning Series',
      number_of_seasons: 3,
      number_of_episodes: 30,
      networks: [{ id: 1, name: 'Test Network' }],
      original_language: 'en',
      credits: { cast: [], crew: [] },
      videos: { results: [] },
      recommendations: { results: [] },
      'watch/providers': { results: {} }
    };

    it('should get complete TV show details successfully', async () => {
      mockTMDBService.getTVShow.mockResolvedValue(mockTVData);

      const result = await contentService.getTVDetails(456);

      expect(mockTMDBService.getTVShow).toHaveBeenCalledWith(456, 'credits,videos,recommendations,watch/providers');
      expect(result).toEqual({
        id: 456,
        name: 'Test TV Show',
        tagline: 'A test TV show',
        overview: 'This is a test TV show overview',
        backdrop_path: '/tv-backdrop.jpg',
        backdrop_url: 'https://image.tmdb.org/t/p/w1280/tv-backdrop.jpg',
        poster_path: '/tv-poster.jpg',
        poster_url: 'https://image.tmdb.org/t/p/w500/tv-poster.jpg',
        first_air_date: '2023-01-01',
        vote_average: 9.0,
        vote_count: 500,
        genres: [{ id: 18, name: 'Drama' }],
        status: 'Returning Series',
        number_of_seasons: 3,
        number_of_episodes: 30,
        networks: [{ id: 1, name: 'Test Network' }],
        original_language: 'en',
        credits: { cast: [], crew: [] },
        videos: { results: [] },
        recommendations: { results: [] },
        watch_providers: { results: {} }
      });
    });

    it('should throw error for invalid TV show ID', async () => {
      await expect(contentService.getTVDetails()).rejects.toThrow('Valid TV show ID is required');
      await expect(contentService.getTVDetails('invalid')).rejects.toThrow('Valid TV show ID is required');
    });
  });

  describe('getCredits', () => {
    const mockCredits = {
      cast: [
        { id: 1, name: 'Actor 1', character: 'Character 1' },
        { id: 2, name: 'Actor 2', character: 'Character 2' }
      ],
      crew: [
        { id: 3, name: 'Director 1', job: 'Director' },
        { id: 4, name: 'Producer 1', job: 'Producer' }
      ]
    };

    it('should get movie credits successfully', async () => {
      mockTMDBService.getMovieCredits.mockResolvedValue(mockCredits);

      const result = await contentService.getCredits(123, 'movie');

      expect(mockTMDBService.getMovieCredits).toHaveBeenCalledWith(123);
      expect(result).toEqual({
        id: 123,
        cast: mockCredits.cast,
        crew: mockCredits.crew
      });
    });

    it('should get TV credits successfully', async () => {
      mockTMDBService.getTVCredits.mockResolvedValue(mockCredits);

      const result = await contentService.getCredits(456, 'tv');

      expect(mockTMDBService.getTVCredits).toHaveBeenCalledWith(456);
      expect(result).toEqual({
        id: 456,
        cast: mockCredits.cast,
        crew: mockCredits.crew
      });
    });

    it('should throw error for invalid parameters', async () => {
      await expect(contentService.getCredits()).rejects.toThrow('Valid content ID is required');
      await expect(contentService.getCredits(123)).rejects.toThrow('Media type must be "movie" or "tv"');
      await expect(contentService.getCredits(123, 'invalid')).rejects.toThrow('Media type must be "movie" or "tv"');
    });
  });

  describe('getVideos', () => {
    const mockVideos = {
      results: [
        { key: 'abc123', name: 'Official Trailer', type: 'Trailer', site: 'YouTube' },
        { key: 'def456', name: 'Teaser', type: 'Teaser', site: 'YouTube' },
        { key: 'ghi789', name: 'Behind the Scenes', type: 'Behind the Scenes', site: 'YouTube' }
      ]
    };

    it('should get and prioritize videos correctly', async () => {
      mockTMDBService.getMovieVideos.mockResolvedValue(mockVideos);

      const result = await contentService.getVideos(123, 'movie');

      expect(mockTMDBService.getMovieVideos).toHaveBeenCalledWith(123);
      expect(result.id).toBe(123);
      expect(result.results).toHaveLength(3);
      // Trailers should come first
      expect(result.results[0].type).toBe('Trailer');
      expect(result.results[1].type).toBe('Teaser');
      expect(result.results[2].type).toBe('Behind the Scenes');
    });

    it('should handle empty videos', async () => {
      mockTMDBService.getMovieVideos.mockResolvedValue({ results: [] });

      const result = await contentService.getVideos(123, 'movie');

      expect(result.results).toEqual([]);
    });

    it('should throw error for invalid parameters', async () => {
      await expect(contentService.getVideos()).rejects.toThrow('Valid content ID is required');
      await expect(contentService.getVideos(123, 'invalid')).rejects.toThrow('Media type must be "movie" or "tv"');
    });
  });

  describe('getRecommendations', () => {
    const mockRecommendations = {
      page: 1,
      total_pages: 5,
      total_results: 100,
      results: [
        { id: 1, title: 'Recommended Movie 1' },
        { id: 2, title: 'Recommended Movie 2' }
      ]
    };

    it('should get movie recommendations successfully', async () => {
      mockTMDBService.getMovieRecommendations.mockResolvedValue(mockRecommendations);

      const result = await contentService.getRecommendations(123, 'movie', 1);

      expect(mockTMDBService.getMovieRecommendations).toHaveBeenCalledWith(123, 1);
      expect(result).toEqual({
        id: 123,
        page: 1,
        total_pages: 5,
        total_results: 100,
        results: mockRecommendations.results
      });
    });

    it('should use default page number', async () => {
      mockTMDBService.getMovieRecommendations.mockResolvedValue(mockRecommendations);

      await contentService.getRecommendations(123, 'movie');

      expect(mockTMDBService.getMovieRecommendations).toHaveBeenCalledWith(123, 1);
    });
  });

  describe('getWatchProviders', () => {
    const mockWatchProviders = {
      results: {
        US: {
          flatrate: [{ provider_id: 8, provider_name: 'Netflix' }],
          rent: [{ provider_id: 2, provider_name: 'Apple iTunes' }]
        }
      }
    };

    it('should get watch providers successfully', async () => {
      mockTMDBService.getMovieWatchProviders.mockResolvedValue(mockWatchProviders);

      const result = await contentService.getWatchProviders(123, 'movie');

      expect(mockTMDBService.getMovieWatchProviders).toHaveBeenCalledWith(123);
      expect(result).toEqual({
        id: 123,
        results: mockWatchProviders.results
      });
    });

    it('should handle empty watch providers', async () => {
      mockTMDBService.getMovieWatchProviders.mockResolvedValue({ results: {} });

      const result = await contentService.getWatchProviders(123, 'movie');

      expect(result.results).toEqual({});
    });
  });

  describe('getDirectorMovies', () => {
    const mockPersonMovies = {
      crew: [
        {
          id: 1,
          title: 'Movie 1',
          job: 'Director',
          release_date: '2023-01-01',
          popularity: 100
        },
        {
          id: 2,
          title: 'Movie 2',
          job: 'Producer',
          release_date: '2022-01-01',
          popularity: 80
        },
        {
          id: 3,
          title: 'Movie 3',
          job: 'Director',
          release_date: '2024-01-01',
          popularity: 120
        }
      ]
    };

    it('should get director movies and sort them correctly', async () => {
      mockTMDBService.getPersonMovies.mockResolvedValue(mockPersonMovies);

      const result = await contentService.getDirectorMovies(789);

      expect(mockTMDBService.getPersonMovies).toHaveBeenCalledWith(789);
      expect(result.director_id).toBe(789);
      expect(result.total_results).toBe(2); // Only director jobs
      expect(result.results).toHaveLength(2);
      
      // Should be sorted by date (newest first)
      expect(result.results[0].title).toBe('Movie 3'); // 2024
      expect(result.results[1].title).toBe('Movie 1'); // 2023
    });

    it('should handle person with no director credits', async () => {
      mockTMDBService.getPersonMovies.mockResolvedValue({
        crew: [
          { id: 1, title: 'Movie 1', job: 'Producer' }
        ]
      });

      const result = await contentService.getDirectorMovies(789);

      expect(result.total_results).toBe(0);
      expect(result.results).toEqual([]);
    });

    it('should handle missing crew data', async () => {
      mockTMDBService.getPersonMovies.mockResolvedValue({});

      const result = await contentService.getDirectorMovies(789);

      expect(result.total_results).toBe(0);
      expect(result.results).toEqual([]);
    });

    it('should throw error for invalid director ID', async () => {
      await expect(contentService.getDirectorMovies()).rejects.toThrow('Valid director ID is required');
      await expect(contentService.getDirectorMovies('invalid')).rejects.toThrow('Valid director ID is required');
    });
  });
});
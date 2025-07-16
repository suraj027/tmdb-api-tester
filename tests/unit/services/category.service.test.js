const CategoryService = require('../../../src/services/category.service');
const TMDBService = require('../../../src/services/tmdb.service');

// Mock the TMDBService
jest.mock('../../../src/services/tmdb.service');

describe('CategoryService', () => {
  let categoryService;
  let mockTMDBService;

  // Sample response data for testing
  const mockMovieResponse = {
    page: 1,
    results: [
      {
        id: 1,
        title: 'Test Movie',
        poster_path: '/test-poster.jpg',
        vote_average: 8.5,
        release_date: '2023-01-01'
      }
    ],
    total_pages: 10,
    total_results: 200
  };

  const mockTVResponse = {
    page: 1,
    results: [
      {
        id: 1,
        name: 'Test TV Show',
        poster_path: '/test-tv-poster.jpg',
        vote_average: 9.0,
        first_air_date: '2023-01-01'
      }
    ],
    total_pages: 5,
    total_results: 100
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create mock TMDB service instance
    mockTMDBService = new TMDBService('test-api-key');
    
    // Mock all the methods we'll use
    mockTMDBService.getTrending = jest.fn();
    mockTMDBService.getUpcoming = jest.fn();
    mockTMDBService.discoverMovies = jest.fn();
    mockTMDBService.discoverTV = jest.fn();
    
    // Create CategoryService instance with mocked TMDB service
    categoryService = new CategoryService(mockTMDBService);
  });

  describe('Constructor', () => {
    it('should create CategoryService instance with valid TMDBService', () => {
      expect(categoryService).toBeInstanceOf(CategoryService);
      expect(categoryService.tmdbService).toBe(mockTMDBService);
    });

    it('should throw error when TMDBService is not provided', () => {
      expect(() => new CategoryService()).toThrow('TMDBService instance is required');
    });
  });

  describe('getTrendingMovies', () => {
    it('should fetch trending movies successfully', async () => {
      mockTMDBService.getTrending.mockResolvedValue(mockMovieResponse);

      const result = await categoryService.getTrendingMovies();

      expect(mockTMDBService.getTrending).toHaveBeenCalledWith('movie', 'day');
      expect(result).toEqual({
        success: true,
        data: mockMovieResponse,
        category: 'trending-movies',
        page: 1
      });
    });

    it('should handle errors when fetching trending movies', async () => {
      const error = new Error('TMDB API Error');
      mockTMDBService.getTrending.mockRejectedValue(error);

      await expect(categoryService.getTrendingMovies()).rejects.toThrow('Failed to fetch trending movies');
    });

    it('should support custom page parameter', async () => {
      mockTMDBService.getTrending.mockResolvedValue(mockMovieResponse);

      const result = await categoryService.getTrendingMovies(2);

      expect(result.page).toBe(2);
    });
  });

  describe('getHotTVShows', () => {
    it('should fetch hot TV shows successfully', async () => {
      mockTMDBService.getTrending.mockResolvedValue(mockTVResponse);

      const result = await categoryService.getHotTVShows();

      expect(mockTMDBService.getTrending).toHaveBeenCalledWith('tv', 'day');
      expect(result).toEqual({
        success: true,
        data: mockTVResponse,
        category: 'hot-tv-shows',
        page: 1
      });
    });

    it('should handle errors when fetching hot TV shows', async () => {
      const error = new Error('TMDB API Error');
      mockTMDBService.getTrending.mockRejectedValue(error);

      await expect(categoryService.getHotTVShows()).rejects.toThrow('Failed to fetch hot TV shows');
    });
  });

  describe('getAnticipatedMovies', () => {
    it('should fetch anticipated movies successfully', async () => {
      mockTMDBService.getUpcoming.mockResolvedValue(mockMovieResponse);

      const result = await categoryService.getAnticipatedMovies();

      expect(mockTMDBService.getUpcoming).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        success: true,
        data: mockMovieResponse,
        category: 'anticipated-movies',
        page: 1
      });
    });

    it('should handle errors when fetching anticipated movies', async () => {
      const error = new Error('TMDB API Error');
      mockTMDBService.getUpcoming.mockRejectedValue(error);

      await expect(categoryService.getAnticipatedMovies()).rejects.toThrow('Failed to fetch anticipated movies');
    });
  });

  describe('getStreamingNow', () => {
    it('should fetch streaming movies successfully', async () => {
      mockTMDBService.discoverMovies.mockResolvedValue(mockMovieResponse);

      const result = await categoryService.getStreamingNow();

      expect(mockTMDBService.discoverMovies).toHaveBeenCalledWith({
        sort_by: 'popularity.desc',
        'vote_average.gte': 6.0,
        'vote_count.gte': 100,
        page: 1
      });
      expect(result).toEqual({
        success: true,
        data: mockMovieResponse,
        category: 'streaming-now',
        page: 1
      });
    });

    it('should handle errors when fetching streaming movies', async () => {
      const error = new Error('TMDB API Error');
      mockTMDBService.discoverMovies.mockRejectedValue(error);

      await expect(categoryService.getStreamingNow()).rejects.toThrow('Failed to fetch streaming movies');
    });
  });

  describe('getMoodContent', () => {
    it('should fetch family movie night content successfully', async () => {
      mockTMDBService.discoverMovies.mockResolvedValue(mockMovieResponse);

      const result = await categoryService.getMoodContent('family-movie-night');

      expect(mockTMDBService.discoverMovies).toHaveBeenCalledWith({
        with_genres: '10751',
        sort_by: 'popularity.desc',
        page: 1
      });
      expect(result).toEqual({
        success: true,
        data: mockMovieResponse,
        category: 'mood-family-movie-night',
        mediaType: 'movie',
        page: 1
      });
    });

    it('should fetch feel-good shows (TV content) successfully', async () => {
      mockTMDBService.discoverTV.mockResolvedValue(mockTVResponse);

      const result = await categoryService.getMoodContent('feel-good-shows');

      expect(mockTMDBService.discoverTV).toHaveBeenCalledWith({
        with_genres: '35',
        sort_by: 'popularity.desc',
        'vote_average.gte': 7.0,
        page: 1
      });
      expect(result).toEqual({
        success: true,
        data: mockTVResponse,
        category: 'mood-feel-good-shows',
        mediaType: 'tv',
        page: 1
      });
    });

    it('should throw error for unsupported mood category', async () => {
      await expect(categoryService.getMoodContent('invalid-mood')).rejects.toThrow('Unsupported mood category: invalid-mood');
    });

    it('should handle errors when fetching mood content', async () => {
      const error = new Error('TMDB API Error');
      mockTMDBService.discoverMovies.mockRejectedValue(error);

      await expect(categoryService.getMoodContent('family-movie-night')).rejects.toThrow('Failed to fetch mood content for family-movie-night');
    });
  });

  describe('getAwardWinners', () => {
    it('should fetch Oscar winners successfully', async () => {
      mockTMDBService.discoverMovies.mockResolvedValue(mockMovieResponse);

      const result = await categoryService.getAwardWinners('oscar-winners');

      expect(mockTMDBService.discoverMovies).toHaveBeenCalledWith({
        with_keywords: '210024',
        sort_by: 'vote_average.desc',
        'vote_average.gte': 7.0,
        page: 1
      });
      expect(result).toEqual({
        success: true,
        data: mockMovieResponse,
        category: 'awards-oscar-winners',
        mediaType: 'movie',
        page: 1
      });
    });

    it('should fetch blockbuster shows (TV content) successfully', async () => {
      mockTMDBService.discoverTV.mockResolvedValue(mockTVResponse);

      const result = await categoryService.getAwardWinners('blockbuster-shows');

      expect(mockTMDBService.discoverTV).toHaveBeenCalledWith({
        sort_by: 'popularity.desc',
        'vote_average.gte': 8.0,
        'vote_count.gte': 1000,
        page: 1
      });
      expect(result).toEqual({
        success: true,
        data: mockTVResponse,
        category: 'awards-blockbuster-shows',
        mediaType: 'tv',
        page: 1
      });
    });

    it('should throw error for unsupported award type', async () => {
      await expect(categoryService.getAwardWinners('invalid-award')).rejects.toThrow('Unsupported award type: invalid-award');
    });
  });

  describe('getStudioContent', () => {
    it('should fetch Disney content successfully', async () => {
      mockTMDBService.discoverMovies.mockResolvedValue(mockMovieResponse);

      const result = await categoryService.getStudioContent('disney');

      expect(mockTMDBService.discoverMovies).toHaveBeenCalledWith({
        with_companies: '2',
        sort_by: 'popularity.desc',
        page: 1
      });
      expect(result).toEqual({
        success: true,
        data: mockMovieResponse,
        category: 'studio-disney',
        mediaType: 'movie',
        page: 1
      });
    });

    it('should fetch Marvel content successfully', async () => {
      mockTMDBService.discoverMovies.mockResolvedValue(mockMovieResponse);

      const result = await categoryService.getStudioContent('marvel');

      expect(mockTMDBService.discoverMovies).toHaveBeenCalledWith({
        with_companies: '420',
        sort_by: 'popularity.desc',
        page: 1
      });
    });

    it('should throw error for unsupported studio', async () => {
      await expect(categoryService.getStudioContent('invalid-studio')).rejects.toThrow('Unsupported studio: invalid-studio');
    });
  });

  describe('getNetworkContent', () => {
    it('should fetch Netflix content successfully', async () => {
      mockTMDBService.discoverTV.mockResolvedValue(mockTVResponse);

      const result = await categoryService.getNetworkContent('netflix');

      expect(mockTMDBService.discoverTV).toHaveBeenCalledWith({
        with_networks: '213',
        sort_by: 'popularity.desc',
        page: 1
      });
      expect(result).toEqual({
        success: true,
        data: mockTVResponse,
        category: 'network-netflix',
        mediaType: 'tv',
        page: 1
      });
    });

    it('should fetch HBO content successfully', async () => {
      mockTMDBService.discoverTV.mockResolvedValue(mockTVResponse);

      const result = await categoryService.getNetworkContent('hbo');

      expect(mockTMDBService.discoverTV).toHaveBeenCalledWith({
        with_networks: '49',
        sort_by: 'popularity.desc',
        page: 1
      });
    });

    it('should throw error for unsupported network', async () => {
      await expect(categoryService.getNetworkContent('invalid-network')).rejects.toThrow('Unsupported network: invalid-network');
    });
  });

  describe('getGenreContent', () => {
    it('should fetch action movies successfully', async () => {
      mockTMDBService.discoverMovies.mockResolvedValue(mockMovieResponse);

      const result = await categoryService.getGenreContent('action');

      expect(mockTMDBService.discoverMovies).toHaveBeenCalledWith({
        with_genres: '28',
        sort_by: 'popularity.desc',
        page: 1
      });
      expect(result).toEqual({
        success: true,
        data: mockMovieResponse,
        category: 'genre-action',
        mediaType: 'movie',
        page: 1
      });
    });

    it('should fetch comedy TV shows successfully', async () => {
      mockTMDBService.discoverTV.mockResolvedValue(mockTVResponse);

      const result = await categoryService.getGenreContent('comedy', 'tv');

      expect(mockTMDBService.discoverTV).toHaveBeenCalledWith({
        with_genres: '35',
        sort_by: 'popularity.desc',
        page: 1
      });
      expect(result).toEqual({
        success: true,
        data: mockTVResponse,
        category: 'genre-comedy',
        mediaType: 'tv',
        page: 1
      });
    });

    it('should default to movie media type', async () => {
      mockTMDBService.discoverMovies.mockResolvedValue(mockMovieResponse);

      await categoryService.getGenreContent('drama');

      expect(mockTMDBService.discoverMovies).toHaveBeenCalled();
      expect(mockTMDBService.discoverTV).not.toHaveBeenCalled();
    });

    it('should throw error for unsupported genre', async () => {
      await expect(categoryService.getGenreContent('invalid-genre')).rejects.toThrow('Unsupported genre: invalid-genre');
    });
  });

  describe('getUpcomingMovies', () => {
    const mockUpcomingMoviesResponse = {
      page: 1,
      results: [
        {
          id: 1,
          title: 'Upcoming Movie 1',
          poster_path: '/upcoming1.jpg',
          vote_average: 7.5,
          release_date: '2024-06-15'
        },
        {
          id: 2,
          title: 'Upcoming Movie 2',
          poster_path: '/upcoming2.jpg',
          vote_average: 8.0,
          release_date: '2024-07-20'
        }
      ],
      total_pages: 5,
      total_results: 100
    };

    it('should fetch upcoming movies successfully', async () => {
      mockTMDBService.getUpcoming.mockResolvedValue(mockUpcomingMoviesResponse);

      const result = await categoryService.getUpcomingMovies();

      expect(mockTMDBService.getUpcoming).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
      expect(result.category).toBe('upcoming-movies');
      expect(result.page).toBe(1);
      expect(result.data.results).toHaveLength(2);
      expect(result.data.results[0]).toHaveProperty('release_date_formatted');
      expect(result.data.results[0]).toHaveProperty('is_upcoming');
    });

    it('should format release dates correctly', async () => {
      mockTMDBService.getUpcoming.mockResolvedValue(mockUpcomingMoviesResponse);

      const result = await categoryService.getUpcomingMovies();

      expect(result.data.results[0].release_date_formatted).toBe('June 15, 2024');
      expect(result.data.results[1].release_date_formatted).toBe('July 20, 2024');
    });

    it('should handle movies with no release date', async () => {
      const responseWithNoDate = {
        ...mockUpcomingMoviesResponse,
        results: [
          {
            id: 1,
            title: 'Movie Without Date',
            poster_path: '/test.jpg',
            vote_average: 7.0,
            release_date: null
          }
        ]
      };
      mockTMDBService.getUpcoming.mockResolvedValue(responseWithNoDate);

      const result = await categoryService.getUpcomingMovies();

      expect(result.data.results[0].release_date_formatted).toBe('TBA');
      expect(result.data.results[0].is_upcoming).toBe(false);
    });

    it('should support custom page parameter', async () => {
      mockTMDBService.getUpcoming.mockResolvedValue(mockUpcomingMoviesResponse);

      const result = await categoryService.getUpcomingMovies(3);

      expect(mockTMDBService.getUpcoming).toHaveBeenCalledWith(3);
      expect(result.page).toBe(3);
    });

    it('should handle errors when fetching upcoming movies', async () => {
      const error = new Error('TMDB API Error');
      mockTMDBService.getUpcoming.mockRejectedValue(error);

      await expect(categoryService.getUpcomingMovies()).rejects.toThrow('Failed to fetch upcoming movies');
    });

    it('should handle empty results', async () => {
      const emptyResponse = { ...mockUpcomingMoviesResponse, results: [] };
      mockTMDBService.getUpcoming.mockResolvedValue(emptyResponse);

      const result = await categoryService.getUpcomingMovies();

      expect(result.data.results).toEqual([]);
    });
  });

  describe('getUpcomingTV', () => {
    const mockUpcomingTVResponse = {
      page: 1,
      results: [
        {
          id: 1,
          name: 'Upcoming TV Show 1',
          poster_path: '/tv1.jpg',
          vote_average: 8.5,
          first_air_date: '2024-08-10'
        },
        {
          id: 2,
          name: 'Upcoming TV Show 2',
          poster_path: '/tv2.jpg',
          vote_average: 7.8,
          first_air_date: '2024-09-05'
        }
      ],
      total_pages: 3,
      total_results: 60
    };

    it('should fetch upcoming TV shows successfully', async () => {
      mockTMDBService.discoverTV.mockResolvedValue(mockUpcomingTVResponse);

      const result = await categoryService.getUpcomingTV();

      expect(mockTMDBService.discoverTV).toHaveBeenCalledWith(
        expect.objectContaining({
          'first_air_date.gte': expect.any(String),
          'first_air_date.lte': expect.any(String),
          sort_by: 'first_air_date.asc',
          page: 1
        })
      );
      expect(result.success).toBe(true);
      expect(result.category).toBe('upcoming-tv');
      expect(result.page).toBe(1);
      expect(result.data.results).toHaveLength(2);
      expect(result.data.results[0]).toHaveProperty('first_air_date_formatted');
      expect(result.data.results[0]).toHaveProperty('is_upcoming');
    });

    it('should format air dates correctly', async () => {
      mockTMDBService.discoverTV.mockResolvedValue(mockUpcomingTVResponse);

      const result = await categoryService.getUpcomingTV();

      expect(result.data.results[0].first_air_date_formatted).toBe('August 10, 2024');
      expect(result.data.results[1].first_air_date_formatted).toBe('September 5, 2024');
    });

    it('should handle TV shows with no air date', async () => {
      const responseWithNoDate = {
        ...mockUpcomingTVResponse,
        results: [
          {
            id: 1,
            name: 'TV Show Without Date',
            poster_path: '/test.jpg',
            vote_average: 7.0,
            first_air_date: null
          }
        ]
      };
      mockTMDBService.discoverTV.mockResolvedValue(responseWithNoDate);

      const result = await categoryService.getUpcomingTV();

      expect(result.data.results[0].first_air_date_formatted).toBe('TBA');
      expect(result.data.results[0].is_upcoming).toBe(false);
    });

    it('should support custom page parameter', async () => {
      mockTMDBService.discoverTV.mockResolvedValue(mockUpcomingTVResponse);

      const result = await categoryService.getUpcomingTV(2);

      expect(mockTMDBService.discoverTV).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
      expect(result.page).toBe(2);
    });

    it('should handle errors when fetching upcoming TV shows', async () => {
      const error = new Error('TMDB API Error');
      mockTMDBService.discoverTV.mockRejectedValue(error);

      await expect(categoryService.getUpcomingTV()).rejects.toThrow('Failed to fetch upcoming TV shows');
    });

    it('should use correct date range for upcoming content', async () => {
      mockTMDBService.discoverTV.mockResolvedValue(mockUpcomingTVResponse);

      await categoryService.getUpcomingTV();

      const call = mockTMDBService.discoverTV.mock.calls[0][0];
      const startDate = new Date(call['first_air_date.gte']);
      const endDate = new Date(call['first_air_date.lte']);
      const today = new Date();

      // Start date should be today or very close
      expect(Math.abs(startDate - today)).toBeLessThan(24 * 60 * 60 * 1000); // Within 24 hours

      // End date should be approximately 6 months from now
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(today.getMonth() + 6);
      expect(Math.abs(endDate - sixMonthsFromNow)).toBeLessThan(7 * 24 * 60 * 60 * 1000); // Within 7 days
    });
  });

  describe('getCombinedUpcoming', () => {
    const mockUpcomingMoviesResponse = {
      page: 1,
      results: [
        {
          id: 1,
          title: 'Upcoming Movie',
          poster_path: '/movie.jpg',
          vote_average: 7.5,
          release_date: '2024-07-15'
        }
      ],
      total_pages: 5,
      total_results: 100
    };

    const mockUpcomingTVResponse = {
      page: 1,
      results: [
        {
          id: 2,
          name: 'Upcoming TV Show',
          poster_path: '/tv.jpg',
          vote_average: 8.0,
          first_air_date: '2024-06-20'
        }
      ],
      total_pages: 3,
      total_results: 60
    };

    beforeEach(() => {
      // Mock the individual methods
      categoryService.getUpcomingMovies = jest.fn();
      categoryService.getUpcomingTV = jest.fn();
    });

    it('should fetch and combine upcoming movies and TV shows successfully', async () => {
      categoryService.getUpcomingMovies.mockResolvedValue({
        success: true,
        data: mockUpcomingMoviesResponse,
        category: 'upcoming-movies',
        page: 1
      });

      categoryService.getUpcomingTV.mockResolvedValue({
        success: true,
        data: mockUpcomingTVResponse,
        category: 'upcoming-tv',
        page: 1
      });

      const result = await categoryService.getCombinedUpcoming();

      expect(categoryService.getUpcomingMovies).toHaveBeenCalledWith(1);
      expect(categoryService.getUpcomingTV).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
      expect(result.category).toBe('upcoming-combined');
      expect(result.data.results).toHaveLength(2);
      expect(result.data.total_results).toBe(160); // 100 + 60
    });

    it('should add media_type to each item', async () => {
      categoryService.getUpcomingMovies.mockResolvedValue({
        success: true,
        data: mockUpcomingMoviesResponse,
        category: 'upcoming-movies',
        page: 1
      });

      categoryService.getUpcomingTV.mockResolvedValue({
        success: true,
        data: mockUpcomingTVResponse,
        category: 'upcoming-tv',
        page: 1
      });

      const result = await categoryService.getCombinedUpcoming();

      const movieItem = result.data.results.find(item => item.title);
      const tvItem = result.data.results.find(item => item.name);

      expect(movieItem.media_type).toBe('movie');
      expect(tvItem.media_type).toBe('tv');
    });

    it('should sort combined results by release date (ascending)', async () => {
      const moviesWithLaterDate = {
        ...mockUpcomingMoviesResponse,
        results: [
          {
            id: 1,
            title: 'Later Movie',
            release_date: '2024-08-15'
          }
        ]
      };

      const tvWithEarlierDate = {
        ...mockUpcomingTVResponse,
        results: [
          {
            id: 2,
            name: 'Earlier TV Show',
            first_air_date: '2024-06-10'
          }
        ]
      };

      categoryService.getUpcomingMovies.mockResolvedValue({
        success: true,
        data: moviesWithLaterDate,
        category: 'upcoming-movies',
        page: 1
      });

      categoryService.getUpcomingTV.mockResolvedValue({
        success: true,
        data: tvWithEarlierDate,
        category: 'upcoming-tv',
        page: 1
      });

      const result = await categoryService.getCombinedUpcoming();

      // TV show should come first (earlier date)
      expect(result.data.results[0].name).toBe('Earlier TV Show');
      expect(result.data.results[1].title).toBe('Later Movie');
    });

    it('should support custom page parameters', async () => {
      categoryService.getUpcomingMovies.mockResolvedValue({
        success: true,
        data: mockUpcomingMoviesResponse,
        category: 'upcoming-movies',
        page: 2
      });

      categoryService.getUpcomingTV.mockResolvedValue({
        success: true,
        data: mockUpcomingTVResponse,
        category: 'upcoming-tv',
        page: 3
      });

      const result = await categoryService.getCombinedUpcoming(2, 3);

      expect(categoryService.getUpcomingMovies).toHaveBeenCalledWith(2);
      expect(categoryService.getUpcomingTV).toHaveBeenCalledWith(3);
      expect(result.moviePage).toBe(2);
      expect(result.tvPage).toBe(3);
    });

    it('should handle errors when fetching combined upcoming content', async () => {
      const error = new Error('TMDB API Error');
      categoryService.getUpcomingMovies.mockRejectedValue(error);

      await expect(categoryService.getCombinedUpcoming()).rejects.toThrow('Failed to fetch combined upcoming content');
    });

    it('should handle empty results from both sources', async () => {
      categoryService.getUpcomingMovies.mockResolvedValue({
        success: true,
        data: { ...mockUpcomingMoviesResponse, results: [], total_results: 0 },
        category: 'upcoming-movies',
        page: 1
      });

      categoryService.getUpcomingTV.mockResolvedValue({
        success: true,
        data: { ...mockUpcomingTVResponse, results: [], total_results: 0 },
        category: 'upcoming-tv',
        page: 1
      });

      const result = await categoryService.getCombinedUpcoming();

      expect(result.data.results).toEqual([]);
      expect(result.data.total_results).toBe(0);
    });
  });

  describe('Date formatting utilities', () => {
    describe('formatReleaseDate', () => {
      it('should format valid dates correctly', () => {
        const formatted = categoryService.formatReleaseDate('2024-06-15');
        expect(formatted).toBe('June 15, 2024');
      });

      it('should handle null or undefined dates', () => {
        expect(categoryService.formatReleaseDate(null)).toBe('TBA');
        expect(categoryService.formatReleaseDate(undefined)).toBe('TBA');
        expect(categoryService.formatReleaseDate('')).toBe('TBA');
      });

      it('should handle invalid date strings', () => {
        const result = categoryService.formatReleaseDate('invalid-date');
        expect(result).toBe('invalid-date'); // Should return original string if parsing fails
      });
    });

    describe('formatDateForAPI', () => {
      it('should format date for API correctly', () => {
        const date = new Date('2024-06-15T10:30:00Z');
        const formatted = categoryService.formatDateForAPI(date);
        expect(formatted).toBe('2024-06-15');
      });
    });

    describe('isUpcoming', () => {
      it('should return true for future dates', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        const dateString = futureDate.toISOString().split('T')[0];
        
        expect(categoryService.isUpcoming(dateString)).toBe(true);
      });

      it('should return false for past dates', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        const dateString = pastDate.toISOString().split('T')[0];
        
        expect(categoryService.isUpcoming(dateString)).toBe(false);
      });

      it('should return true for today', () => {
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        
        expect(categoryService.isUpcoming(dateString)).toBe(true);
      });

      it('should handle null or invalid dates', () => {
        expect(categoryService.isUpcoming(null)).toBe(false);
        expect(categoryService.isUpcoming('')).toBe(false);
        expect(categoryService.isUpcoming('invalid-date')).toBe(false);
      });
    });
  });

  describe('createCategoryError', () => {
    it('should create properly formatted error', () => {
      const originalError = new Error('Original error');
      const error = categoryService.createCategoryError('Test message', originalError);

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('CATEGORY_SERVICE_ERROR');
      expect(error.originalError).toBe(originalError);
      expect(error.timestamp).toBeDefined();
      expect(typeof error.timestamp).toBe('string');
    });
  });
});
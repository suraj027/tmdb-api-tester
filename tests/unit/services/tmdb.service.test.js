const TMDBService = require('../../../src/services/tmdb.service');
const axios = require('axios');
const {
  movieResponse,
  tvResponse,
  searchResponse,
  creditsResponse,
  videosResponse,
  watchProvidersResponse,
  errorResponse
} = require('../../fixtures/tmdb-responses');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('TMDBService', () => {
  let tmdbService;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock axios.create to return a mock instance
    const mockAxiosInstance = {
      get: jest.fn(),
      interceptors: {
        response: {
          use: jest.fn()
        }
      }
    };
    
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    
    tmdbService = new TMDBService(mockApiKey);
    tmdbService.axiosInstance = mockAxiosInstance;
  });

  describe('Constructor', () => {
    it('should throw error if no API key provided', () => {
      expect(() => new TMDBService()).toThrow('TMDB API key is required');
    });

    it('should initialize with correct default values', () => {
      const service = new TMDBService(mockApiKey);
      expect(service.apiKey).toBe(mockApiKey);
      expect(service.baseURL).toBe('https://api.themoviedb.org/3');
      expect(service.imageBaseURL).toBe('https://image.tmdb.org/t/p/');
      expect(service.maxRequestsPerWindow).toBe(40);
      expect(service.windowSizeMs).toBe(10000);
    });

    it('should accept custom base URL', () => {
      const customURL = 'https://custom.api.url';
      const service = new TMDBService(mockApiKey, customURL);
      expect(service.baseURL).toBe(customURL);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      // Reset rate limiting state
      tmdbService.requestTimes = [];
    });

    it('should allow requests when under rate limit', async () => {
      const startTime = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(startTime);

      await tmdbService.enforceRateLimit();
      
      expect(tmdbService.requestTimes).toHaveLength(1);
      expect(tmdbService.requestTimes[0]).toBe(startTime);
    });

    it('should clean up old request times', async () => {
      const now = Date.now();
      const oldTime = now - 15000; // 15 seconds ago (outside window)
      const recentTime = now - 5000; // 5 seconds ago (inside window)
      
      tmdbService.requestTimes = [oldTime, recentTime];
      
      jest.spyOn(Date, 'now').mockReturnValue(now);
      
      await tmdbService.enforceRateLimit();
      
      // Should have removed the old time and added the new one
      expect(tmdbService.requestTimes).toHaveLength(2);
      expect(tmdbService.requestTimes).toContain(recentTime);
      expect(tmdbService.requestTimes).toContain(now);
      expect(tmdbService.requestTimes).not.toContain(oldTime);
    });
  });

  describe('Error Handling', () => {
    it('should handle TMDB API errors', () => {
      const error = {
        response: {
          status: 404,
          data: errorResponse
        }
      };

      expect(() => tmdbService.handleAPIError(error)).toThrow();
      
      try {
        tmdbService.handleAPIError(error);
      } catch (e) {
        expect(e.code).toBe('TMDB_API_ERROR');
        expect(e.status).toBe(404);
        expect(e.tmdbCode).toBe(34);
        expect(e.message).toBe('The resource you requested could not be found.');
      }
    });

    it('should handle network errors', () => {
      const error = {
        request: {}
      };

      expect(() => tmdbService.handleAPIError(error)).toThrow();
      
      try {
        tmdbService.handleAPIError(error);
      } catch (e) {
        expect(e.code).toBe('NETWORK_ERROR');
        expect(e.message).toBe('Failed to connect to TMDB API');
      }
    });

    it('should handle request setup errors', () => {
      const error = {
        message: 'Request setup failed'
      };

      expect(() => tmdbService.handleAPIError(error)).toThrow();
      
      try {
        tmdbService.handleAPIError(error);
      } catch (e) {
        expect(e.code).toBe('REQUEST_ERROR');
        expect(e.message).toBe('Request setup error');
      }
    });
  });

  describe('Response Transformation', () => {
    it('should transform image paths to full URLs', () => {
      const data = {
        poster_path: '/test-poster.jpg',
        backdrop_path: '/test-backdrop.jpg',
        profile_path: '/test-profile.jpg'
      };

      const transformed = tmdbService.transformResponse(data);

      expect(transformed.poster_url).toBe('https://image.tmdb.org/t/p/w500/test-poster.jpg');
      expect(transformed.backdrop_url).toBe('https://image.tmdb.org/t/p/w1280/test-backdrop.jpg');
      expect(transformed.profile_url).toBe('https://image.tmdb.org/t/p/w185/test-profile.jpg');
    });

    it('should transform arrays of results', () => {
      const data = {
        results: [
          { poster_path: '/poster1.jpg' },
          { poster_path: '/poster2.jpg' }
        ]
      };

      const transformed = tmdbService.transformResponse(data);

      expect(transformed.results[0].poster_url).toBe('https://image.tmdb.org/t/p/w500/poster1.jpg');
      expect(transformed.results[1].poster_url).toBe('https://image.tmdb.org/t/p/w500/poster2.jpg');
    });

    it('should transform cast and crew arrays', () => {
      const data = {
        cast: [{ profile_path: '/actor1.jpg' }],
        crew: [{ profile_path: '/director1.jpg' }]
      };

      const transformed = tmdbService.transformResponse(data);

      expect(transformed.cast[0].profile_url).toBe('https://image.tmdb.org/t/p/w185/actor1.jpg');
      expect(transformed.crew[0].profile_url).toBe('https://image.tmdb.org/t/p/w185/director1.jpg');
    });

    it('should handle null image paths', () => {
      const data = {
        poster_path: null,
        backdrop_path: null
      };

      const transformed = tmdbService.transformResponse(data);

      expect(transformed.poster_url).toBeUndefined();
      expect(transformed.backdrop_url).toBeUndefined();
    });
  });

  describe('Image URL Generation', () => {
    it('should generate correct image URLs', () => {
      expect(tmdbService.getImageURL('/test.jpg', 'w500')).toBe('https://image.tmdb.org/t/p/w500/test.jpg');
      expect(tmdbService.getImageURL('/test.jpg')).toBe('https://image.tmdb.org/t/p/original/test.jpg');
    });

    it('should return null for null image path', () => {
      expect(tmdbService.getImageURL(null)).toBeNull();
      expect(tmdbService.getImageURL(undefined)).toBeNull();
    });
  });

  describe('API Methods', () => {
    beforeEach(() => {
      // Mock the makeRequest method to avoid rate limiting in tests
      tmdbService.makeRequest = jest.fn();
    });

    describe('getMovie', () => {
      it('should call correct endpoint for movie details', async () => {
        tmdbService.makeRequest.mockResolvedValue(movieResponse);

        const result = await tmdbService.getMovie(550);

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/movie/550', {});
        expect(result).toEqual(movieResponse);
      });

      it('should handle append_to_response parameter', async () => {
        tmdbService.makeRequest.mockResolvedValue(movieResponse);

        await tmdbService.getMovie(550, 'credits,videos');

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/movie/550', {
          append_to_response: 'credits,videos'
        });
      });
    });

    describe('getTVShow', () => {
      it('should call correct endpoint for TV show details', async () => {
        tmdbService.makeRequest.mockResolvedValue(tvResponse);

        const result = await tmdbService.getTVShow(1399);

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/tv/1399', {});
        expect(result).toEqual(tvResponse);
      });
    });

    describe('searchMulti', () => {
      it('should call correct endpoint for multi search', async () => {
        tmdbService.makeRequest.mockResolvedValue(searchResponse);

        const result = await tmdbService.searchMulti('fight club');

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/search/multi', {
          query: 'fight club',
          page: 1
        });
        expect(result).toEqual(searchResponse);
      });

      it('should handle custom page parameter', async () => {
        tmdbService.makeRequest.mockResolvedValue(searchResponse);

        await tmdbService.searchMulti('fight club', 2);

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/search/multi', {
          query: 'fight club',
          page: 2
        });
      });
    });

    describe('searchMovies', () => {
      it('should call correct endpoint for movie search', async () => {
        tmdbService.makeRequest.mockResolvedValue(searchResponse);

        await tmdbService.searchMovies('fight club');

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/search/movie', {
          query: 'fight club',
          page: 1
        });
      });
    });

    describe('searchTV', () => {
      it('should call correct endpoint for TV search', async () => {
        tmdbService.makeRequest.mockResolvedValue(searchResponse);

        await tmdbService.searchTV('game of thrones');

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/search/tv', {
          query: 'game of thrones',
          page: 1
        });
      });
    });

    describe('getTrending', () => {
      it('should call correct endpoint with default parameters', async () => {
        tmdbService.makeRequest.mockResolvedValue(searchResponse);

        await tmdbService.getTrending();

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/trending/all/day');
      });

      it('should handle custom media type and time window', async () => {
        tmdbService.makeRequest.mockResolvedValue(searchResponse);

        await tmdbService.getTrending('movie', 'week');

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/trending/movie/week');
      });
    });

    describe('getUpcoming', () => {
      it('should call correct endpoint for upcoming movies', async () => {
        tmdbService.makeRequest.mockResolvedValue(searchResponse);

        await tmdbService.getUpcoming();

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/movie/upcoming', { page: 1 });
      });
    });

    describe('getGenres', () => {
      it('should call correct endpoint with default media type', async () => {
        tmdbService.makeRequest.mockResolvedValue({ genres: [] });

        await tmdbService.getGenres();

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/genre/movie/list');
      });

      it('should handle TV media type', async () => {
        tmdbService.makeRequest.mockResolvedValue({ genres: [] });

        await tmdbService.getGenres('tv');

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/genre/tv/list');
      });
    });

    describe('discoverMovies', () => {
      it('should call correct endpoint for movie discovery', async () => {
        tmdbService.makeRequest.mockResolvedValue(searchResponse);

        const params = { with_genres: '28', sort_by: 'popularity.desc' };
        await tmdbService.discoverMovies(params);

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/discover/movie', params);
      });
    });

    describe('discoverTV', () => {
      it('should call correct endpoint for TV discovery', async () => {
        tmdbService.makeRequest.mockResolvedValue(searchResponse);

        const params = { with_genres: '18', sort_by: 'vote_average.desc' };
        await tmdbService.discoverTV(params);

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/discover/tv', params);
      });
    });

    describe('Credits Methods', () => {
      it('should get movie credits', async () => {
        tmdbService.makeRequest.mockResolvedValue(creditsResponse);

        await tmdbService.getMovieCredits(550);

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/movie/550/credits');
      });

      it('should get TV credits', async () => {
        tmdbService.makeRequest.mockResolvedValue(creditsResponse);

        await tmdbService.getTVCredits(1399);

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/tv/1399/credits');
      });
    });

    describe('Videos Methods', () => {
      it('should get movie videos', async () => {
        tmdbService.makeRequest.mockResolvedValue(videosResponse);

        await tmdbService.getMovieVideos(550);

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/movie/550/videos');
      });

      it('should get TV videos', async () => {
        tmdbService.makeRequest.mockResolvedValue(videosResponse);

        await tmdbService.getTVVideos(1399);

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/tv/1399/videos');
      });
    });

    describe('Recommendations Methods', () => {
      it('should get movie recommendations', async () => {
        tmdbService.makeRequest.mockResolvedValue(searchResponse);

        await tmdbService.getMovieRecommendations(550);

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/movie/550/recommendations', { page: 1 });
      });

      it('should get TV recommendations', async () => {
        tmdbService.makeRequest.mockResolvedValue(searchResponse);

        await tmdbService.getTVRecommendations(1399, 2);

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/tv/1399/recommendations', { page: 2 });
      });
    });

    describe('Watch Providers Methods', () => {
      it('should get movie watch providers', async () => {
        tmdbService.makeRequest.mockResolvedValue(watchProvidersResponse);

        await tmdbService.getMovieWatchProviders(550);

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/movie/550/watch/providers');
      });

      it('should get TV watch providers', async () => {
        tmdbService.makeRequest.mockResolvedValue(watchProvidersResponse);

        await tmdbService.getTVWatchProviders(1399);

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/tv/1399/watch/providers');
      });
    });

    describe('Person Methods', () => {
      it('should get person details', async () => {
        const personResponse = { id: 819, name: 'Edward Norton' };
        tmdbService.makeRequest.mockResolvedValue(personResponse);

        await tmdbService.getPerson(819);

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/person/819');
      });

      it('should get person movies', async () => {
        const personMoviesResponse = { cast: [], crew: [] };
        tmdbService.makeRequest.mockResolvedValue(personMoviesResponse);

        await tmdbService.getPersonMovies(819);

        expect(tmdbService.makeRequest).toHaveBeenCalledWith('/person/819/movie_credits');
      });
    });
  });

  describe('Integration with makeRequest', () => {
    beforeEach(() => {
      // Restore the original makeRequest method for integration tests
      tmdbService.makeRequest = TMDBService.prototype.makeRequest.bind(tmdbService);
      
      // Mock the enforceRateLimit to avoid delays in tests
      tmdbService.enforceRateLimit = jest.fn().mockResolvedValue();
    });

    it('should make successful API request and transform response', async () => {
      const mockResponse = {
        data: {
          ...movieResponse,
          poster_path: '/test-poster.jpg'
        }
      };

      tmdbService.axiosInstance.get.mockResolvedValue(mockResponse);

      const result = await tmdbService.makeRequest('/movie/550');

      expect(tmdbService.enforceRateLimit).toHaveBeenCalled();
      expect(tmdbService.axiosInstance.get).toHaveBeenCalledWith('/movie/550', { params: {} });
      expect(result.poster_url).toBe('https://image.tmdb.org/t/p/w500/test-poster.jpg');
    });

    it('should handle API errors in makeRequest', async () => {
      const error = new Error('API Error');
      error.code = 'TMDB_API_ERROR';
      
      tmdbService.axiosInstance.get.mockRejectedValue(error);

      await expect(tmdbService.makeRequest('/movie/550')).rejects.toThrow('API Error');
      expect(tmdbService.enforceRateLimit).toHaveBeenCalled();
    });
  });
});
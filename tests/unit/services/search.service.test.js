const SearchService = require('../../../src/services/search.service');
const TMDBService = require('../../../src/services/tmdb.service');

// Mock TMDBService
jest.mock('../../../src/services/tmdb.service');

describe('SearchService', () => {
  let searchService;
  let mockTmdbService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock TMDB service instance
    mockTmdbService = {
      searchMulti: jest.fn(),
      searchMovies: jest.fn(),
      searchTV: jest.fn()
    };
    
    // Mock the instanceof check
    Object.setPrototypeOf(mockTmdbService, TMDBService.prototype);
    
    searchService = new SearchService(mockTmdbService);
  });

  describe('Constructor', () => {
    it('should create SearchService with valid TMDBService', () => {
      expect(searchService).toBeInstanceOf(SearchService);
      expect(searchService.tmdbService).toBe(mockTmdbService);
    });

    it('should throw error if no TMDBService provided', () => {
      expect(() => new SearchService()).toThrow('Valid TMDBService instance is required');
    });

    it('should throw error if invalid TMDBService provided', () => {
      expect(() => new SearchService({})).toThrow('Valid TMDBService instance is required');
    });
  });

  describe('searchMulti', () => {
    const mockResponse = {
      page: 1,
      total_pages: 5,
      total_results: 100,
      results: [
        {
          id: 1,
          media_type: 'movie',
          title: 'Test Movie',
          overview: 'Test overview',
          poster_path: '/test.jpg',
          poster_url: 'https://image.tmdb.org/t/p/w500/test.jpg',
          vote_average: 8.5,
          vote_count: 1000,
          popularity: 100.5,
          release_date: '2023-01-01',
          adult: false,
          genre_ids: [28, 12]
        },
        {
          id: 2,
          media_type: 'tv',
          name: 'Test TV Show',
          overview: 'Test TV overview',
          poster_path: '/test-tv.jpg',
          poster_url: 'https://image.tmdb.org/t/p/w500/test-tv.jpg',
          vote_average: 7.8,
          vote_count: 500,
          popularity: 80.2,
          first_air_date: '2023-02-01',
          adult: false,
          genre_ids: [18, 35]
        }
      ]
    };

    it('should search multi successfully with default parameters', async () => {
      mockTmdbService.searchMulti.mockResolvedValue(mockResponse);

      const result = await searchService.searchMulti('test query');

      expect(mockTmdbService.searchMulti).toHaveBeenCalledWith('test query', 1);
      expect(result.success).toBe(true);
      expect(result.searchType).toBe('multi');
      expect(result.results).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(5);
      expect(result.pagination.totalResults).toBe(100);
    });

    it('should search multi with custom page', async () => {
      mockTmdbService.searchMulti.mockResolvedValue({ ...mockResponse, page: 2 });

      const result = await searchService.searchMulti('test query', 2);

      expect(mockTmdbService.searchMulti).toHaveBeenCalledWith('test query', 2);
      expect(result.pagination.page).toBe(2);
    });

    it('should format movie results correctly', async () => {
      mockTmdbService.searchMulti.mockResolvedValue(mockResponse);

      const result = await searchService.searchMulti('test query');
      const movieResult = result.results.find(r => r.mediaType === 'movie');

      expect(movieResult).toEqual({
        id: 1,
        mediaType: 'movie',
        title: 'Test Movie',
        originalTitle: undefined,
        overview: 'Test overview',
        posterPath: '/test.jpg',
        posterUrl: 'https://image.tmdb.org/t/p/w500/test.jpg',
        backdropPath: undefined,
        backdropUrl: undefined,
        popularity: 100.5,
        voteAverage: 8.5,
        voteCount: 1000,
        adult: false,
        genreIds: [28, 12],
        releaseDate: '2023-01-01',
        originalLanguage: undefined,
        video: false
      });
    });

    it('should format TV results correctly', async () => {
      mockTmdbService.searchMulti.mockResolvedValue(mockResponse);

      const result = await searchService.searchMulti('test query');
      const tvResult = result.results.find(r => r.mediaType === 'tv');

      expect(tvResult).toEqual({
        id: 2,
        mediaType: 'tv',
        title: 'Test TV Show',
        originalTitle: undefined,
        overview: 'Test TV overview',
        posterPath: '/test-tv.jpg',
        posterUrl: 'https://image.tmdb.org/t/p/w500/test-tv.jpg',
        backdropPath: undefined,
        backdropUrl: undefined,
        popularity: 80.2,
        voteAverage: 7.8,
        voteCount: 500,
        adult: false,
        genreIds: [18, 35],
        firstAirDate: '2023-02-01',
        originCountry: [],
        originalLanguage: undefined
      });
    });

    it('should throw error for empty query', async () => {
      await expect(searchService.searchMulti('')).rejects.toThrow(
        'Search query is required and must be a non-empty string'
      );
    });

    it('should throw error for invalid page number', async () => {
      await expect(searchService.searchMulti('test', 0)).rejects.toThrow(
        'Page must be between 1 and 1000'
      );
      
      await expect(searchService.searchMulti('test', 1001)).rejects.toThrow(
        'Page must be between 1 and 1000'
      );
    });

    it('should handle TMDB API errors', async () => {
      const tmdbError = new Error('TMDB API Error');
      tmdbError.code = 'TMDB_API_ERROR';
      mockTmdbService.searchMulti.mockRejectedValue(tmdbError);

      await expect(searchService.searchMulti('test')).rejects.toThrow('Search failed: TMDB API Error');
    });
  });

  describe('searchMovies', () => {
    const mockMovieResponse = {
      page: 1,
      total_pages: 3,
      total_results: 50,
      results: [
        {
          id: 1,
          title: 'Test Movie',
          overview: 'Test overview',
          poster_path: '/test.jpg',
          vote_average: 8.5,
          vote_count: 1000,
          popularity: 100.5,
          release_date: '2023-01-01',
          adult: false,
          genre_ids: [28, 12]
        }
      ]
    };

    it('should search movies successfully', async () => {
      mockTmdbService.searchMovies.mockResolvedValue(mockMovieResponse);

      const result = await searchService.searchMovies('test movie');

      expect(mockTmdbService.searchMovies).toHaveBeenCalledWith('test movie', 1);
      expect(result.success).toBe(true);
      expect(result.searchType).toBe('movie');
      expect(result.results).toHaveLength(1);
      expect(result.results[0].mediaType).toBe('movie');
    });

    it('should trim whitespace from query', async () => {
      mockTmdbService.searchMovies.mockResolvedValue(mockMovieResponse);

      await searchService.searchMovies('  test movie  ');

      expect(mockTmdbService.searchMovies).toHaveBeenCalledWith('test movie', 1);
    });
  });

  describe('searchTV', () => {
    const mockTVResponse = {
      page: 1,
      total_pages: 2,
      total_results: 25,
      results: [
        {
          id: 1,
          name: 'Test TV Show',
          overview: 'Test TV overview',
          poster_path: '/test-tv.jpg',
          vote_average: 7.8,
          vote_count: 500,
          popularity: 80.2,
          first_air_date: '2023-02-01',
          adult: false,
          genre_ids: [18, 35]
        }
      ]
    };

    it('should search TV shows successfully', async () => {
      mockTmdbService.searchTV.mockResolvedValue(mockTVResponse);

      const result = await searchService.searchTV('test tv');

      expect(mockTmdbService.searchTV).toHaveBeenCalledWith('test tv', 1);
      expect(result.success).toBe(true);
      expect(result.searchType).toBe('tv');
      expect(result.results).toHaveLength(1);
      expect(result.results[0].mediaType).toBe('tv');
    });
  });

  describe('filterResults', () => {
    const testResults = [
      { id: 1, adult: false, vote_count: 100, vote_average: 8.0 },
      { id: 2, adult: true, vote_count: 50, vote_average: 6.5 },
      { id: 3, adult: false, vote_count: 200, vote_average: 9.0 },
      { id: 4, adult: false, vote_count: 10, vote_average: 5.0 }
    ];

    it('should filter adult content when includeAdult is false', () => {
      const filtered = searchService.filterResults(testResults, {
        includeAdult: false,
        minVoteCount: 0,
        minRating: 0
      });

      expect(filtered).toHaveLength(3);
      expect(filtered.every(item => !item.adult)).toBe(true);
    });

    it('should filter by minimum vote count', () => {
      const filtered = searchService.filterResults(testResults, {
        includeAdult: true,
        minVoteCount: 75,
        minRating: 0
      });

      expect(filtered).toHaveLength(2);
      expect(filtered.every(item => item.vote_count >= 75)).toBe(true);
    });

    it('should filter by minimum rating', () => {
      const filtered = searchService.filterResults(testResults, {
        includeAdult: true,
        minVoteCount: 0,
        minRating: 7.0
      });

      expect(filtered).toHaveLength(2);
      expect(filtered.every(item => item.vote_average >= 7.0)).toBe(true);
    });

    it('should apply multiple filters', () => {
      const filtered = searchService.filterResults(testResults, {
        includeAdult: false,
        minVoteCount: 50,
        minRating: 7.0
      });

      expect(filtered).toHaveLength(2);
      expect(filtered.every(item => !item.adult && item.vote_count >= 50 && item.vote_average >= 7.0)).toBe(true);
    });
  });

  describe('sortResults', () => {
    const testResults = [
      { id: 1, popularity: 50, vote_average: 7.0, release_date: '2023-01-01', title: 'B Movie' },
      { id: 2, popularity: 100, vote_average: 8.5, release_date: '2022-01-01', title: 'A Movie' },
      { id: 3, popularity: 75, vote_average: 6.0, first_air_date: '2024-01-01', name: 'C Show' }
    ];

    it('should sort by popularity descending', () => {
      const sorted = searchService.sortResults(testResults, 'popularity');
      
      expect(sorted[0].popularity).toBe(100);
      expect(sorted[1].popularity).toBe(75);
      expect(sorted[2].popularity).toBe(50);
    });

    it('should sort by rating descending', () => {
      const sorted = searchService.sortResults(testResults, 'rating');
      
      expect(sorted[0].vote_average).toBe(8.5);
      expect(sorted[1].vote_average).toBe(7.0);
      expect(sorted[2].vote_average).toBe(6.0);
    });

    it('should sort by date descending', () => {
      const sorted = searchService.sortResults(testResults, 'date');
      
      expect(sorted[0].first_air_date || sorted[0].release_date).toBe('2024-01-01');
      expect(sorted[1].release_date).toBe('2023-01-01');
      expect(sorted[2].release_date).toBe('2022-01-01');
    });

    it('should sort by title ascending', () => {
      const sorted = searchService.sortResults(testResults, 'title');
      
      expect(sorted[0].title).toBe('A Movie');
      expect(sorted[1].title).toBe('B Movie');
      expect(sorted[2].name).toBe('C Show');
    });

    it('should return original array for invalid sort criteria', () => {
      const sorted = searchService.sortResults(testResults, 'invalid');
      
      expect(sorted).toEqual(testResults);
    });
  });

  describe('formatResultItem', () => {
    it('should format person results correctly', () => {
      const personItem = {
        id: 1,
        media_type: 'person',
        name: 'Test Actor',
        profile_path: '/actor.jpg',
        profile_url: 'https://image.tmdb.org/t/p/w185/actor.jpg',
        popularity: 50.5,
        adult: false,
        known_for: [
          {
            id: 100,
            media_type: 'movie',
            title: 'Famous Movie',
            poster_path: '/famous.jpg'
          }
        ],
        known_for_department: 'Acting'
      };

      const formatted = searchService.formatResultItem(personItem, 'multi');

      expect(formatted).toEqual({
        id: 1,
        mediaType: 'person',
        name: 'Test Actor',
        originalName: undefined,
        profilePath: '/actor.jpg',
        profileUrl: 'https://image.tmdb.org/t/p/w185/actor.jpg',
        popularity: 50.5,
        adult: false,
        knownFor: [{
          id: 100,
          mediaType: 'movie',
          title: 'Famous Movie',
          originalTitle: undefined,
          overview: undefined,
          posterPath: '/famous.jpg',
          posterUrl: undefined,
          backdropPath: undefined,
          backdropUrl: undefined,
          popularity: undefined,
          voteAverage: undefined,
          voteCount: undefined,
          adult: false,
          genreIds: [],
          releaseDate: undefined,
          originalLanguage: undefined,
          video: false
        }],
        knownForDepartment: 'Acting'
      });
    });
  });

  describe('Pagination', () => {
    it('should correctly calculate pagination info', async () => {
      const mockResponse = {
        page: 2,
        total_pages: 5,
        total_results: 100,
        results: []
      };

      mockTmdbService.searchMulti.mockResolvedValue(mockResponse);

      const result = await searchService.searchMulti('test', 2);

      expect(result.pagination).toEqual({
        page: 2,
        totalPages: 5,
        totalResults: 100,
        hasNextPage: true,
        hasPreviousPage: true
      });
    });

    it('should handle first page pagination', async () => {
      const mockResponse = {
        page: 1,
        total_pages: 5,
        total_results: 100,
        results: []
      };

      mockTmdbService.searchMulti.mockResolvedValue(mockResponse);

      const result = await searchService.searchMulti('test', 1);

      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPreviousPage).toBe(false);
    });

    it('should handle last page pagination', async () => {
      const mockResponse = {
        page: 5,
        total_pages: 5,
        total_results: 100,
        results: []
      };

      mockTmdbService.searchMulti.mockResolvedValue(mockResponse);

      const result = await searchService.searchMulti('test', 5);

      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPreviousPage).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network failed');
      networkError.code = 'NETWORK_ERROR';
      mockTmdbService.searchMulti.mockRejectedValue(networkError);

      await expect(searchService.searchMulti('test')).rejects.toThrow('Search service temporarily unavailable');
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Something went wrong');
      mockTmdbService.searchMulti.mockRejectedValue(genericError);

      await expect(searchService.searchMulti('test')).rejects.toThrow('Search operation failed: Something went wrong');
    });
  });
});
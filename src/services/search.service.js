const TMDBService = require('./tmdb.service');

/**
 * Search Service for handling all search-related functionality
 * Provides multi-search capabilities, result formatting, filtering, and pagination
 */
class SearchService {
  constructor(tmdbService) {
    if (!tmdbService || !(tmdbService instanceof TMDBService)) {
      throw new Error('Valid TMDBService instance is required');
    }
    this.tmdbService = tmdbService;
  }

  /**
   * Search across movies, TV shows, and people with enhanced formatting
   * @param {string} query - Search query string
   * @param {number} page - Page number for pagination (default: 1)
   * @param {Object} options - Additional search options
   * @returns {Object} Formatted search results with pagination info
   */
  async searchMulti(query, page = 1, options = {}) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Search query is required and must be a non-empty string');
    }

    if (page < 1 || page > 1000) {
      throw new Error('Page must be between 1 and 1000');
    }

    try {
      const response = await this.tmdbService.searchMulti(query.trim(), page);
      return this.formatSearchResults(response, 'multi', options);
    } catch (error) {
      throw this.handleSearchError(error, 'multi-search');
    }
  }

  /**
   * Search for movies only with enhanced formatting
   * @param {string} query - Search query string
   * @param {number} page - Page number for pagination (default: 1)
   * @param {Object} options - Additional search options
   * @returns {Object} Formatted movie search results with pagination info
   */
  async searchMovies(query, page = 1, options = {}) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Search query is required and must be a non-empty string');
    }

    if (page < 1 || page > 1000) {
      throw new Error('Page must be between 1 and 1000');
    }

    try {
      const response = await this.tmdbService.searchMovies(query.trim(), page);
      return this.formatSearchResults(response, 'movie', options);
    } catch (error) {
      throw this.handleSearchError(error, 'movie-search');
    }
  }

  /**
   * Search for TV shows only with enhanced formatting
   * @param {string} query - Search query string
   * @param {number} page - Page number for pagination (default: 1)
   * @param {Object} options - Additional search options
   * @returns {Object} Formatted TV search results with pagination info
   */
  async searchTV(query, page = 1, options = {}) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Search query is required and must be a non-empty string');
    }

    if (page < 1 || page > 1000) {
      throw new Error('Page must be between 1 and 1000');
    }

    try {
      const response = await this.tmdbService.searchTV(query.trim(), page);
      return this.formatSearchResults(response, 'tv', options);
    } catch (error) {
      throw this.handleSearchError(error, 'tv-search');
    }
  }

  /**
   * Format search results with consistent structure and enhanced data
   * @param {Object} response - Raw TMDB API response
   * @param {string} searchType - Type of search (multi, movie, tv)
   * @param {Object} options - Formatting options
   * @returns {Object} Formatted search results
   */
  formatSearchResults(response, searchType, options = {}) {
    const {
      includeAdult = false,
      minVoteCount = 0,
      minRating = 0,
      sortBy = null
    } = options;

    let results = response.results || [];

    // Filter results based on options
    results = this.filterResults(results, {
      includeAdult,
      minVoteCount,
      minRating
    });

    // Sort results if specified
    if (sortBy) {
      results = this.sortResults(results, sortBy);
    }

    // Format each result item
    results = results.map(item => this.formatResultItem(item, searchType));

    return {
      success: true,
      query: response.query || '',
      searchType,
      results,
      pagination: {
        page: response.page || 1,
        totalPages: response.total_pages || 1,
        totalResults: response.total_results || 0,
        hasNextPage: (response.page || 1) < (response.total_pages || 1),
        hasPreviousPage: (response.page || 1) > 1
      },
      metadata: {
        resultCount: results.length,
        filteredCount: (response.results || []).length - results.length,
        searchTimestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Filter search results based on criteria
   * @param {Array} results - Array of search results
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered results
   */
  filterResults(results, filters) {
    const { includeAdult, minVoteCount, minRating } = filters;

    return results.filter(item => {
      // Filter adult content
      if (!includeAdult && item.adult) {
        return false;
      }

      // Filter by minimum vote count
      if (minVoteCount > 0 && (item.vote_count || 0) < minVoteCount) {
        return false;
      }

      // Filter by minimum rating
      if (minRating > 0 && (item.vote_average || 0) < minRating) {
        return false;
      }

      return true;
    });
  }

  /**
   * Sort search results by specified criteria
   * @param {Array} results - Array of search results
   * @param {string} sortBy - Sort criteria (popularity, rating, date, title)
   * @returns {Array} Sorted results
   */
  sortResults(results, sortBy) {
    const sortFunctions = {
      popularity: (a, b) => (b.popularity || 0) - (a.popularity || 0),
      rating: (a, b) => (b.vote_average || 0) - (a.vote_average || 0),
      date: (a, b) => {
        const dateA = new Date(a.release_date || a.first_air_date || '1900-01-01');
        const dateB = new Date(b.release_date || b.first_air_date || '1900-01-01');
        return dateB - dateA;
      },
      title: (a, b) => {
        const titleA = (a.title || a.name || '').toLowerCase();
        const titleB = (b.title || b.name || '').toLowerCase();
        return titleA.localeCompare(titleB);
      }
    };

    const sortFunction = sortFunctions[sortBy];
    if (!sortFunction) {
      return results;
    }

    return [...results].sort(sortFunction);
  }

  /**
   * Format individual search result item
   * @param {Object} item - Raw search result item
   * @param {string} searchType - Type of search
   * @returns {Object} Formatted result item
   */
  formatResultItem(item, searchType) {
    const baseItem = {
      id: item.id,
      mediaType: item.media_type || this.getMediaTypeFromSearchType(searchType),
      title: item.title || item.name,
      originalTitle: item.original_title || item.original_name,
      overview: item.overview,
      posterPath: item.poster_path,
      posterUrl: item.poster_url,
      backdropPath: item.backdrop_path,
      backdropUrl: item.backdrop_url,
      popularity: item.popularity,
      voteAverage: item.vote_average,
      voteCount: item.vote_count,
      adult: item.adult || false,
      genreIds: item.genre_ids || []
    };

    // Add media-specific fields
    if (item.media_type === 'movie' || searchType === 'movie') {
      return {
        ...baseItem,
        releaseDate: item.release_date,
        originalLanguage: item.original_language,
        video: item.video || false
      };
    } else if (item.media_type === 'tv' || searchType === 'tv') {
      return {
        ...baseItem,
        firstAirDate: item.first_air_date,
        originCountry: item.origin_country || [],
        originalLanguage: item.original_language
      };
    } else if (item.media_type === 'person') {
      return {
        id: item.id,
        mediaType: 'person',
        name: item.name,
        originalName: item.original_name,
        profilePath: item.profile_path,
        profileUrl: item.profile_url,
        popularity: item.popularity,
        adult: item.adult || false,
        knownFor: (item.known_for || []).map(knownItem => 
          this.formatResultItem(knownItem, 'multi')
        ),
        knownForDepartment: item.known_for_department
      };
    }

    return baseItem;
  }

  /**
   * Get media type from search type
   * @param {string} searchType - Search type
   * @returns {string} Media type
   */
  getMediaTypeFromSearchType(searchType) {
    const typeMap = {
      movie: 'movie',
      tv: 'tv',
      multi: 'unknown'
    };
    return typeMap[searchType] || 'unknown';
  }

  /**
   * Handle search-specific errors
   * @param {Error} error - Original error
   * @param {string} searchContext - Context of the search operation
   * @returns {Error} Enhanced error
   */
  handleSearchError(error, searchContext) {
    if (error.code === 'TMDB_API_ERROR') {
      const searchError = new Error(`Search failed: ${error.message}`);
      searchError.code = 'SEARCH_API_ERROR';
      searchError.context = searchContext;
      searchError.originalError = error;
      return searchError;
    }

    if (error.code === 'NETWORK_ERROR') {
      const searchError = new Error('Search service temporarily unavailable');
      searchError.code = 'SEARCH_NETWORK_ERROR';
      searchError.context = searchContext;
      searchError.originalError = error;
      return searchError;
    }

    // For validation errors, pass through as-is
    if (error.message.includes('required') || error.message.includes('must be')) {
      return error;
    }

    // Generic search error
    const searchError = new Error(`Search operation failed: ${error.message}`);
    searchError.code = 'SEARCH_ERROR';
    searchError.context = searchContext;
    searchError.originalError = error;
    return searchError;
  }
}

module.exports = SearchService;
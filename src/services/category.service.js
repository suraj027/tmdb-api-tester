const { getCategoryMapping, convertToTMDBParams, getMediaType } = require('../config/categories');

/**
 * CategoryService for organizing content into different categories
 * Handles trending, mood-based, award-winning, studio, network, and genre content
 */
class CategoryService {
  constructor(tmdbService) {
    if (!tmdbService) {
      throw new Error('TMDBService instance is required');
    }
    this.tmdbService = tmdbService;
  }

  /**
   * Get trending movies
   * @param {number} page - Page number for pagination
   * @returns {Promise<Object>} Trending movies data
   */
  async getTrendingMovies(page = 1) {
    try {
      const response = await this.tmdbService.getTrending('movie', 'day');
      return {
        success: true,
        data: response,
        category: 'trending-movies',
        page
      };
    } catch (error) {
      throw this.createCategoryError('Failed to fetch trending movies', error);
    }
  }

  /**
   * Get hot TV shows (trending TV shows)
   * @param {number} page - Page number for pagination
   * @returns {Promise<Object>} Hot TV shows data
   */
  async getHotTVShows(page = 1) {
    try {
      const response = await this.tmdbService.getTrending('tv', 'day');
      return {
        success: true,
        data: response,
        category: 'hot-tv-shows',
        page
      };
    } catch (error) {
      throw this.createCategoryError('Failed to fetch hot TV shows', error);
    }
  }

  /**
   * Get anticipated movies (upcoming movies)
   * @param {number} page - Page number for pagination
   * @returns {Promise<Object>} Anticipated movies data
   */
  async getAnticipatedMovies(page = 1) {
    try {
      const response = await this.tmdbService.getUpcoming(page);
      return {
        success: true,
        data: response,
        category: 'anticipated-movies',
        page
      };
    } catch (error) {
      throw this.createCategoryError('Failed to fetch anticipated movies', error);
    }
  }

  /**
   * Get films now streaming (popular movies with high ratings)
   * @param {number} page - Page number for pagination
   * @returns {Promise<Object>} Streaming movies data
   */
  async getStreamingNow(page = 1) {
    try {
      const params = {
        sort_by: 'popularity.desc',
        'vote_average.gte': 6.0,
        'vote_count.gte': 100,
        page
      };
      
      const response = await this.tmdbService.discoverMovies(params);
      return {
        success: true,
        data: response,
        category: 'streaming-now',
        page
      };
    } catch (error) {
      throw this.createCategoryError('Failed to fetch streaming movies', error);
    }
  }

  /**
   * Get mood-based content
   * @param {string} moodCategory - The mood category (family-movie-night, rom-com-classics, etc.)
   * @param {number} page - Page number for pagination
   * @returns {Promise<Object>} Mood-based content data
   */
  async getMoodContent(moodCategory, page = 1) {
    const mapping = getCategoryMapping('mood', moodCategory);
    if (!mapping) {
      throw new Error(`Unsupported mood category: ${moodCategory}`);
    }

    try {
      const mediaType = getMediaType('mood', moodCategory);
      const params = { ...convertToTMDBParams(mapping), page };

      let response;
      if (mediaType === 'tv') {
        response = await this.tmdbService.discoverTV(params);
      } else {
        response = await this.tmdbService.discoverMovies(params);
      }

      return {
        success: true,
        data: response,
        category: `mood-${moodCategory}`,
        mediaType,
        page
      };
    } catch (error) {
      throw this.createCategoryError(`Failed to fetch mood content for ${moodCategory}`, error);
    }
  }

  /**
   * Get award winners content
   * @param {string} awardType - The award type (oscar-winners, top-grossing, imdb-top-250, etc.)
   * @param {number} page - Page number for pagination
   * @returns {Promise<Object>} Award winners content data
   */
  async getAwardWinners(awardType, page = 1) {
    const mapping = getCategoryMapping('awards', awardType);
    if (!mapping) {
      throw new Error(`Unsupported award type: ${awardType}`);
    }

    try {
      const mediaType = getMediaType('awards', awardType);
      const params = { ...convertToTMDBParams(mapping), page };

      let response;
      if (mediaType === 'tv') {
        response = await this.tmdbService.discoverTV(params);
      } else {
        response = await this.tmdbService.discoverMovies(params);
      }

      return {
        success: true,
        data: response,
        category: `awards-${awardType}`,
        mediaType,
        page
      };
    } catch (error) {
      throw this.createCategoryError(`Failed to fetch award winners for ${awardType}`, error);
    }
  }

  /**
   * Get studio-specific content
   * @param {string} studio - The studio name (disney, pixar, marvel, etc.)
   * @param {number} page - Page number for pagination
   * @returns {Promise<Object>} Studio content data
   */
  async getStudioContent(studio, page = 1) {
    const mapping = getCategoryMapping('studios', studio);
    if (!mapping) {
      throw new Error(`Unsupported studio: ${studio}`);
    }

    try {
      const params = { ...convertToTMDBParams(mapping), page };
      const response = await this.tmdbService.discoverMovies(params);

      return {
        success: true,
        data: response,
        category: `studio-${studio}`,
        mediaType: 'movie',
        page
      };
    } catch (error) {
      throw this.createCategoryError(`Failed to fetch studio content for ${studio}`, error);
    }
  }

  /**
   * Get network-specific content
   * @param {string} network - The network name (netflix, apple-tv, disney-plus, etc.)
   * @param {number} page - Page number for pagination
   * @returns {Promise<Object>} Network content data
   */
  async getNetworkContent(network, page = 1) {
    const mapping = getCategoryMapping('networks', network);
    if (!mapping) {
      throw new Error(`Unsupported network: ${network}`);
    }

    try {
      const params = { ...convertToTMDBParams(mapping), page };
      const response = await this.tmdbService.discoverTV(params);

      return {
        success: true,
        data: response,
        category: `network-${network}`,
        mediaType: 'tv',
        page
      };
    } catch (error) {
      throw this.createCategoryError(`Failed to fetch network content for ${network}`, error);
    }
  }

  /**
   * Get genre-based content
   * @param {string} genre - The genre name (action, comedy, drama, etc.)
   * @param {string} mediaType - Media type ('movie' or 'tv'), defaults to 'movie'
   * @param {number} page - Page number for pagination
   * @returns {Promise<Object>} Genre content data
   */
  async getGenreContent(genre, mediaType = 'movie', page = 1) {
    const mapping = getCategoryMapping('genres', genre);
    if (!mapping) {
      throw new Error(`Unsupported genre: ${genre}`);
    }

    try {
      const params = { ...convertToTMDBParams(mapping), page };

      let response;
      if (mediaType === 'tv') {
        response = await this.tmdbService.discoverTV(params);
      } else {
        response = await this.tmdbService.discoverMovies(params);
      }

      return {
        success: true,
        data: response,
        category: `genre-${genre}`,
        mediaType,
        page
      };
    } catch (error) {
      throw this.createCategoryError(`Failed to fetch genre content for ${genre}`, error);
    }
  }

  /**
   * Get upcoming movies
   * @param {number} page - Page number for pagination
   * @returns {Promise<Object>} Upcoming movies data
   */
  async getUpcomingMovies(page = 1) {
    try {
      const response = await this.tmdbService.getUpcoming(page);
      
      // Transform data with proper date formatting
      const transformedData = {
        ...response,
        results: response.results?.map(movie => ({
          ...movie,
          release_date_formatted: this.formatReleaseDate(movie.release_date),
          is_upcoming: this.isUpcoming(movie.release_date)
        })) || []
      };

      return {
        success: true,
        data: transformedData,
        category: 'upcoming-movies',
        page
      };
    } catch (error) {
      throw this.createCategoryError('Failed to fetch upcoming movies', error);
    }
  }

  /**
   * Get upcoming TV shows
   * @param {number} page - Page number for pagination
   * @returns {Promise<Object>} Upcoming TV shows data
   */
  async getUpcomingTV(page = 1) {
    try {
      // TMDB doesn't have a direct upcoming TV endpoint, so we use discover with air date filters
      const today = new Date();
      const futureDate = new Date();
      futureDate.setMonth(today.getMonth() + 6); // Next 6 months

      const params = {
        'first_air_date.gte': this.formatDateForAPI(today),
        'first_air_date.lte': this.formatDateForAPI(futureDate),
        sort_by: 'first_air_date.asc',
        page
      };

      const response = await this.tmdbService.discoverTV(params);
      
      // Transform data with proper date formatting
      const transformedData = {
        ...response,
        results: response.results?.map(show => ({
          ...show,
          first_air_date_formatted: this.formatReleaseDate(show.first_air_date),
          is_upcoming: this.isUpcoming(show.first_air_date)
        })) || []
      };

      return {
        success: true,
        data: transformedData,
        category: 'upcoming-tv',
        page
      };
    } catch (error) {
      throw this.createCategoryError('Failed to fetch upcoming TV shows', error);
    }
  }

  /**
   * Get combined upcoming content (movies and TV shows)
   * @param {number} moviePage - Page number for movies
   * @param {number} tvPage - Page number for TV shows
   * @returns {Promise<Object>} Combined upcoming content data
   */
  async getCombinedUpcoming(moviePage = 1, tvPage = 1) {
    try {
      // Fetch both movies and TV shows concurrently
      const [moviesResponse, tvResponse] = await Promise.all([
        this.getUpcomingMovies(moviePage),
        this.getUpcomingTV(tvPage)
      ]);

      // Combine and sort by release/air date
      const combinedResults = [
        ...moviesResponse.data.results.map(item => ({ ...item, media_type: 'movie' })),
        ...tvResponse.data.results.map(item => ({ ...item, media_type: 'tv' }))
      ];

      // Sort by release date (ascending - soonest first)
      combinedResults.sort((a, b) => {
        const dateA = new Date(a.release_date || a.first_air_date);
        const dateB = new Date(b.release_date || b.first_air_date);
        return dateA - dateB;
      });

      return {
        success: true,
        data: {
          results: combinedResults,
          total_results: moviesResponse.data.total_results + tvResponse.data.total_results,
          total_pages: Math.max(moviesResponse.data.total_pages, tvResponse.data.total_pages)
        },
        category: 'upcoming-combined',
        moviePage,
        tvPage
      };
    } catch (error) {
      throw this.createCategoryError('Failed to fetch combined upcoming content', error);
    }
  }

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date string
   */
  formatReleaseDate(dateString) {
    if (!dateString) return 'TBA';
    
    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Format date for TMDB API (YYYY-MM-DD)
   * @param {Date} date - Date object
   * @returns {string} Formatted date string for API
   */
  formatDateForAPI(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Check if a date is in the future
   * @param {string} dateString - ISO date string
   * @returns {boolean} True if date is in the future
   */
  isUpcoming(dateString) {
    if (!dateString) return false;
    
    try {
      const date = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      return date >= today;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create a standardized category error
   * @param {string} message - Error message
   * @param {Error} originalError - Original error object
   * @returns {Error} Formatted error
   */
  createCategoryError(message, originalError) {
    const error = new Error(message);
    error.code = 'CATEGORY_SERVICE_ERROR';
    error.originalError = originalError;
    error.timestamp = new Date().toISOString();
    return error;
  }
}

module.exports = CategoryService;
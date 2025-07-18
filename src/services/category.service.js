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
      
      // Enrich with taglines
      if (response.results) {
        response.results = await this.tmdbService.enrichWithTaglines(response.results);
      }
      
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
      
      // Enrich with taglines
      if (response.results) {
        response.results = await this.tmdbService.enrichWithTaglines(response.results);
      }
      
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
      
      // Filter out movies that have already been released
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      
      if (response.results) {
        // Filter movies to only include those with future release dates
        response.results = response.results.filter(movie => {
          if (!movie.release_date) return false; // Exclude movies without release dates
          
          const releaseDate = new Date(movie.release_date);
          return releaseDate >= today; // Only include movies releasing today or in the future
        });
        
        // Enrich with taglines
        response.results = await this.tmdbService.enrichWithTaglines(response.results);
        
        // Add formatted release dates and upcoming status
        response.results = response.results.map(movie => ({
          ...movie,
          release_date_formatted: this.formatReleaseDate(movie.release_date),
          is_upcoming: true,
          days_until_release: this.getDaysUntilRelease(movie.release_date)
        }));
        
        // Sort by release date (soonest first)
        response.results.sort((a, b) => {
          const dateA = new Date(a.release_date);
          const dateB = new Date(b.release_date);
          return dateA - dateB;
        });
        
        // Update total results count after filtering
        response.total_results = response.results.length;
      }
      
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
   * Get films now streaming on OTT platforms (prioritizing recently added)
   * @param {number} page - Page number for pagination
   * @returns {Promise<Object>} Streaming movies data
   */
  async getStreamingNow(page = 1) {
    try {
      // Get multiple batches to find recently added streaming content
      const recentlyAddedMovies = [];
      const olderStreamingMovies = [];
      
      // Batch 1: Very recent releases (3-6 months ago) - likely recently added to streaming
      const recentBatch = await this.getStreamingMoviesBatch(3, 6, 1);
      
      // Batch 2: Moderately recent (6-12 months ago) - some recently added
      const moderateBatch = await this.getStreamingMoviesBatch(6, 12, 1);
      
      // Batch 3: Older movies (1-3 years) - established streaming content
      const olderBatch = await this.getStreamingMoviesBatch(12, 36, 1);
      
      // Combine and categorize results
      const allMovies = [...recentBatch, ...moderateBatch, ...olderBatch];
      
      // Process each movie to get streaming info and categorize
      for (const movie of allMovies) {
        try {
          const watchProviders = await this.tmdbService.getMovieWatchProviders(movie.id);
          const hasStreamingOptions = this.hasStreamingAvailability(watchProviders);
          
          if (hasStreamingOptions) {
            const monthsSinceRelease = this.getMonthsSinceRelease(movie.release_date);
            const streamingScore = this.calculateStreamingRecencyScore(movie, monthsSinceRelease);
            
            const enhancedMovie = {
              ...movie,
              watch_providers: this.formatWatchProviders(watchProviders),
              streaming_available: true,
              months_since_release: monthsSinceRelease,
              streaming_recency_score: streamingScore,
              likely_recently_added: streamingScore > 7
            };
            
            // Categorize based on recency score
            if (streamingScore > 7) {
              recentlyAddedMovies.push(enhancedMovie);
            } else {
              olderStreamingMovies.push(enhancedMovie);
            }
          }
          
          // Limit total results
          if (recentlyAddedMovies.length + olderStreamingMovies.length >= 20) break;
          
        } catch (error) {
          // Continue with next movie if this one fails
          continue;
        }
      }
      
      // Sort recently added by recency score (highest first)
      recentlyAddedMovies.sort((a, b) => b.streaming_recency_score - a.streaming_recency_score);
      
      // Sort older movies by popularity
      olderStreamingMovies.sort((a, b) => b.popularity - a.popularity);
      
      // Combine with recently added first
      const finalResults = [...recentlyAddedMovies, ...olderStreamingMovies];
      
      // Enrich with taglines
      const enrichedResults = await this.tmdbService.enrichWithTaglines(finalResults);
      
      return {
        success: true,
        data: {
          results: enrichedResults,
          total_results: enrichedResults.length,
          recently_added_count: recentlyAddedMovies.length,
          page: 1 // Always return page 1 for this curated list
        },
        category: 'streaming-now',
        description: 'Movies recently added to streaming platforms and popular streaming content',
        page
      };
    } catch (error) {
      throw this.createCategoryError('Failed to fetch streaming movies', error);
    }
  }

  /**
   * Get a batch of movies for streaming analysis
   * @param {number} minMonthsAgo - Minimum months since release
   * @param {number} maxMonthsAgo - Maximum months since release
   * @param {number} page - Page number
   * @returns {Promise<Array>} Array of movies
   */
  async getStreamingMoviesBatch(minMonthsAgo, maxMonthsAgo, page = 1) {
    const today = new Date();
    const minDate = new Date();
    minDate.setMonth(today.getMonth() - maxMonthsAgo);
    
    const maxDate = new Date();
    maxDate.setMonth(today.getMonth() - minMonthsAgo);
    
    const params = {
      sort_by: 'popularity.desc',
      'release_date.gte': this.formatDateForAPI(minDate),
      'release_date.lte': this.formatDateForAPI(maxDate),
      'vote_average.gte': 5.5,
      'vote_count.gte': 100,
      with_watch_monetization_types: 'flatrate|ads',
      page
    };
    
    try {
      const response = await this.tmdbService.discoverMovies(params);
      return response.results || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Calculate streaming recency score (higher = more likely recently added)
   * @param {Object} movie - Movie object
   * @param {number} monthsSinceRelease - Months since theatrical release
   * @returns {number} Score from 1-10
   */
  calculateStreamingRecencyScore(movie, monthsSinceRelease) {
    let score = 5; // Base score
    
    // Recent releases are more likely to be recently added to streaming
    if (monthsSinceRelease <= 6) {
      score += 3;
    } else if (monthsSinceRelease <= 12) {
      score += 2;
    } else if (monthsSinceRelease <= 24) {
      score += 1;
    }
    
    // High popularity suggests recent addition or trending
    if (movie.popularity > 50) {
      score += 2;
    } else if (movie.popularity > 25) {
      score += 1;
    }
    
    // High vote count suggests recent attention
    if (movie.vote_count > 1000) {
      score += 1;
    }
    
    // Recent high ratings suggest current relevance
    if (movie.vote_average >= 7.5) {
      score += 1;
    }
    
    return Math.min(score, 10); // Cap at 10
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
      
      // Enrich with taglines
      if (response.results) {
        response.results = await this.tmdbService.enrichWithTaglines(response.results);
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
      
      // Enrich with taglines
      if (response.results) {
        response.results = await this.tmdbService.enrichWithTaglines(response.results);
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
      
      // Enrich with taglines
      if (response.results) {
        response.results = await this.tmdbService.enrichWithTaglines(response.results);
      }

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
      
      // Enrich with taglines
      if (response.results) {
        response.results = await this.tmdbService.enrichWithTaglines(response.results);
      }

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
      
      // Enrich with taglines
      if (response.results) {
        response.results = await this.tmdbService.enrichWithTaglines(response.results);
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
      
      // Enrich with taglines
      if (response.results) {
        response.results = await this.tmdbService.enrichWithTaglines(response.results);
      }
      
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
      
      // Enrich with taglines
      if (response.results) {
        response.results = await this.tmdbService.enrichWithTaglines(response.results);
      }
      
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
   * Calculate days until release
   * @param {string} dateString - ISO date string
   * @returns {number} Number of days until release (0 if today, negative if past)
   */
  getDaysUntilRelease(dateString) {
    if (!dateString) return null;
    
    try {
      const releaseDate = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      releaseDate.setHours(0, 0, 0, 0); // Reset time to start of day
      
      const timeDiff = releaseDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      return daysDiff;
    } catch (error) {
      return null;
    }
  }

  /**
   * Calculate months since release
   * @param {string} dateString - ISO date string
   * @returns {number} Number of months since release
   */
  getMonthsSinceRelease(dateString) {
    if (!dateString) return null;
    
    try {
      const releaseDate = new Date(dateString);
      const today = new Date();
      
      const yearDiff = today.getFullYear() - releaseDate.getFullYear();
      const monthDiff = today.getMonth() - releaseDate.getMonth();
      
      return yearDiff * 12 + monthDiff;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if movie has streaming availability (not just buy/rent)
   * @param {Object} watchProviders - Watch providers data from TMDB
   * @returns {boolean} True if streaming options are available
   */
  hasStreamingAvailability(watchProviders) {
    if (!watchProviders || !watchProviders.results) return false;
    
    // Check US market (you can modify this for other regions)
    const usProviders = watchProviders.results.US;
    if (!usProviders) return false;
    
    // Check for flatrate (subscription) or ads (free with ads) options
    return !!(usProviders.flatrate || usProviders.ads);
  }

  /**
   * Format watch providers for display
   * @param {Object} watchProviders - Watch providers data from TMDB
   * @returns {Object} Formatted watch providers
   */
  formatWatchProviders(watchProviders) {
    if (!watchProviders || !watchProviders.results) return null;
    
    const usProviders = watchProviders.results.US;
    if (!usProviders) return null;
    
    return {
      streaming: usProviders.flatrate || [],
      free: usProviders.ads || [],
      rent: usProviders.rent || [],
      buy: usProviders.buy || []
    };
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
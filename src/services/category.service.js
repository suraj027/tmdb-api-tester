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
   * Get trending movies (all trending movies of current week)
   * @param {number} page - Page number for pagination
   * @returns {Promise<Object>} Trending movies data
   */
  async getTrendingMovies(page = 1) {
    try {
      // Fetch multiple pages of weekly trending movies to get as many as possible
      const maxPages = 5; // Fetch up to 5 pages (up to 100 movies)
      const allTrendingMovies = [];

      // Fetch multiple pages concurrently for better performance
      const pagePromises = [];
      for (let i = 1; i <= maxPages; i++) {
        pagePromises.push(this.fetchTrendingMoviesPage(i));
      }

      const pageResults = await Promise.allSettled(pagePromises);

      // Combine all successful results
      let totalResults = 0;
      let totalPages = 1;

      pageResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const pageData = result.value;
          if (pageData.results && pageData.results.length > 0) {
            allTrendingMovies.push(...pageData.results);
            totalResults = pageData.total_results || totalResults;
            totalPages = pageData.total_pages || totalPages;
          }
        }
      });

      // Remove duplicates based on movie ID (in case of overlap)
      const uniqueMovies = allTrendingMovies.filter((movie, index, self) =>
        index === self.findIndex(m => m.id === movie.id)
      );

      // Sort by popularity to maintain trending order
      uniqueMovies.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

      // Enrich with taglines and additional trending data
      const enrichedMovies = await this.tmdbService.enrichWithTaglines(uniqueMovies);

      // Add trending metadata to each movie
      const finalMovies = enrichedMovies.map((movie, index) => ({
        ...movie,
        trending_rank: index + 1,
        trending_score: this.calculateTrendingScore(movie, index),
        is_currently_trending: true,
        trending_period: 'week',
        week_trending_position: index + 1
      }));

      return {
        success: true,
        data: {
          results: finalMovies,
          total_results: finalMovies.length,
          total_pages: 1, // Return as single consolidated page
          page: 1,
          trending_period: 'week',
          movies_fetched: finalMovies.length,
          pages_fetched: pageResults.filter(r => r.status === 'fulfilled').length
        },
        category: 'trending-movies',
        description: `All trending movies of this current week (${finalMovies.length} movies)`,
        page: 1
      };
    } catch (error) {
      throw this.createCategoryError('Failed to fetch trending movies', error);
    }
  }

  /**
   * Fetch a single page of trending movies
   * @param {number} page - Page number
   * @returns {Promise<Object>} Page of trending movies
   */
  async fetchTrendingMoviesPage(page) {
    try {
      // Use weekly trending to get current week's trending movies
      const response = await this.tmdbService.makeRequest(`/trending/movie/week`, { page });
      return response;
    } catch (error) {
      console.warn(`Failed to fetch trending movies page ${page}:`, error.message);
      return null;
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
   * Get films released directly on OTT platforms (streaming originals)
   * @param {number} page - Page number for pagination
   * @returns {Promise<Object>} OTT original movies data
   */
  async getStreamingNow(page = 1) {
    try {
      const ottOriginalMovies = [];

      // Get movies released directly on streaming platforms (focus on very recent releases)
      const today = new Date();
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(today.getDate() - 3);

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);

      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(today.getDate() - 14);

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(today.getMonth() - 1);

      // Search for OTT originals from ALL streaming platforms with tiered date ranges
      const allOTTPlatforms = [
        'Netflix', 'Prime Video', 'Disney+', 'Apple TV+', 'HBO Max', 'Hulu',
        'Paramount+', 'Peacock', 'Showtime', 'Starz', 'Crunchyroll', 'Funimation',
        'YouTube Premium', 'Tubi', 'Pluto TV', 'Roku Channel', 'IMDb TV',
        'Vudu', 'Crackle', 'Plex', 'Kanopy', 'Hoopla'
      ];

      // Priority 1: Ultra-recent releases (last 3 days) - highest priority
      const ultraRecentPromises = allOTTPlatforms.map(platform =>
        this.getOTTOriginalsBatch(platform, threeDaysAgo, today, 1)
      );

      // Priority 2: Very recent releases (3-7 days ago)
      const veryRecentPromises = allOTTPlatforms.map(platform =>
        this.getOTTOriginalsBatch(platform, oneWeekAgo, threeDaysAgo, 1)
      );

      // Priority 3: Recent releases (1-2 weeks ago)
      const recentPromises = allOTTPlatforms.map(platform =>
        this.getOTTOriginalsBatch(platform, twoWeeksAgo, oneWeekAgo, 1)
      );

      // Priority 4: Moderately recent releases (2-4 weeks ago) - lower priority
      const moderatePromises = allOTTPlatforms.map(platform =>
        this.getOTTOriginalsBatch(platform, oneMonthAgo, twoWeeksAgo, 1)
      );

      const searchPromises = [...ultraRecentPromises, ...veryRecentPromises, ...recentPromises, ...moderatePromises];

      const batchResults = await Promise.allSettled(searchPromises);

      // Combine all successful results
      const allMovies = [];
      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          allMovies.push(...result.value);
        }
      });

      // Remove duplicates based on movie ID
      const uniqueMovies = allMovies.filter((movie, index, self) =>
        index === self.findIndex(m => m.id === movie.id)
      );

      // Process each movie to verify it's an OTT original
      for (const movie of uniqueMovies) {
        try {
          const watchProviders = await this.tmdbService.getMovieWatchProviders(movie.id);
          const isOTTOriginal = this.isOTTOriginal(movie, watchProviders);

          if (isOTTOriginal) {
            const daysSinceRelease = this.getDaysSinceRelease(movie.release_date);
            const streamingReleaseScore = this.calculateStreamingReleaseRecency(movie, watchProviders, daysSinceRelease);

            // Only include movies that are likely recently added to streaming platforms
            if (streamingReleaseScore >= 6 || daysSinceRelease <= 14) {
              ottOriginalMovies.push({
                ...movie,
                watch_providers: this.formatWatchProviders(watchProviders),
                is_ott_original: true,
                days_since_release: daysSinceRelease,
                streaming_release_score: streamingReleaseScore,
                release_date_formatted: this.formatReleaseDate(movie.release_date),
                streaming_platform: this.identifyPrimaryStreamingPlatform(watchProviders),
                is_recent_release: daysSinceRelease <= 7, // Released in last 7 days
                is_ultra_recent: daysSinceRelease <= 3, // Released in last 3 days
                is_brand_new: daysSinceRelease <= 1, // Released today or yesterday
                likely_new_to_streaming: streamingReleaseScore >= 8,
                estimated_streaming_add_date: this.estimateStreamingAddDate(movie.release_date, streamingReleaseScore)
              });
            }
          }

          // Limit results to prevent too many API calls
          if (ottOriginalMovies.length >= 20) break;

        } catch (error) {
          // Continue with next movie if this one fails
          continue;
        }
      }

      // Sort by latest streaming platform release first (prioritize movies just added to streaming)
      ottOriginalMovies.sort((a, b) => {
        // Primary sort: by streaming release recency score (higher = more likely just added)
        const scoreA = a.streaming_release_score || 0;
        const scoreB = b.streaming_release_score || 0;

        if (scoreA !== scoreB) {
          return scoreB - scoreA; // Higher score = more likely recently added to streaming
        }

        // Secondary sort: by days since release (newest first with heavy weighting)
        const daysDiffA = a.days_since_release || 999999;
        const daysDiffB = b.days_since_release || 999999;

        // Give massive priority to releases within last 3 days (ultra-recent)
        if (daysDiffA <= 3 && daysDiffB > 3) return -1;
        if (daysDiffB <= 3 && daysDiffA > 3) return 1;

        // Give high priority to releases within last 7 days
        if (daysDiffA <= 7 && daysDiffB > 7) return -1;
        if (daysDiffB <= 7 && daysDiffA > 7) return 1;

        // Give medium priority to releases within last 14 days
        if (daysDiffA <= 14 && daysDiffB > 14) return -1;
        if (daysDiffB <= 14 && daysDiffA > 14) return 1;

        // Within same urgency tier, sort by exact days
        if (daysDiffA !== daysDiffB) {
          return daysDiffA - daysDiffB; // Smaller days = more recent = higher priority
        }

        // Tertiary sort: by exact release date (most recent first)
        const dateA = new Date(a.release_date || '1900-01-01');
        const dateB = new Date(b.release_date || '1900-01-01');

        if (dateA.getTime() !== dateB.getTime()) {
          return dateB - dateA; // More recent date = higher priority
        }

        // Final sort: by popularity (higher popularity first)
        return (b.popularity || 0) - (a.popularity || 0);
      });

      // Enrich with taglines
      const enrichedResults = await this.tmdbService.enrichWithTaglines(ottOriginalMovies);

      return {
        success: true,
        data: {
          results: enrichedResults,
          total_results: enrichedResults.length,
          recent_releases_count: enrichedResults.filter(m => m.is_recent_release).length,
          page: 1
        },
        category: 'streaming-now',
        description: 'Movies released directly on OTT platforms (streaming originals)',
        page
      };
    } catch (error) {
      throw this.createCategoryError('Failed to fetch OTT original movies', error);
    }
  }

  /**
   * Get OTT original movies for a specific platform
   * @param {string} platform - Platform name (Netflix, Prime Video, etc.)
   * @param {Date} startDate - Start date for search
   * @param {Date} endDate - End date for search
   * @param {number} page - Page number
   * @returns {Promise<Array>} Array of movies
   */
  async getOTTOriginalsBatch(platform, startDate, endDate, page = 1) {
    const params = {
      sort_by: 'release_date.desc',
      'release_date.gte': this.formatDateForAPI(startDate),
      'release_date.lte': this.formatDateForAPI(endDate),
      'vote_count.gte': 50, // Lower threshold for newer releases
      with_watch_monetization_types: 'flatrate',
      page
    };

    // Add platform-specific company filters
    const companyIds = this.getStreamingCompanyIds(platform);
    if (companyIds.length > 0) {
      params.with_companies = companyIds.join('|');
    }

    try {
      const response = await this.tmdbService.discoverMovies(params);
      return response.results || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get company IDs for streaming platforms
   * @param {string} platform - Platform name
   * @returns {Array} Array of company IDs
   */
  getStreamingCompanyIds(platform) {
    const companyMap = {
      'Netflix': [2, 4640], // Netflix
      'Prime Video': [1024, 11073], // Amazon Studios, Amazon Prime Video
      'Disney+': [2, 3166, 6125], // Walt Disney Pictures, Disney+
      'Apple TV+': [11481], // Apple Original Films
      'HBO Max': [174, 3268], // Warner Bros, HBO
      'Hulu': [2739], // Hulu
      'Paramount+': [4, 491], // Paramount Pictures, MTV Entertainment Studios
      'Peacock': [1778], // NBCUniversal
      'Showtime': [2605], // Showtime Networks
      'Starz': [432], // Starz Entertainment
      'Crunchyroll': [4906], // Crunchyroll
      'Funimation': [1957], // Funimation
      'YouTube Premium': [11073], // YouTube Originals
      'Tubi': [11073], // Tubi
      'Pluto TV': [11073], // Pluto TV
      'Roku Channel': [11073], // Roku
      'IMDb TV': [1024], // Amazon (IMDb TV)
      'Vudu': [7505], // Vudu
      'Crackle': [11073], // Crackle
      'Plex': [11073], // Plex
      'Kanopy': [11073], // Kanopy
      'Hoopla': [11073] // Hoopla
    };

    return companyMap[platform] || [];
  }

  /**
   * Check if a movie is an OTT original (not theatrical release)
   * @param {Object} movie - Movie object
   * @param {Object} watchProviders - Watch providers data
   * @returns {boolean} True if it's an OTT original
   */
  isOTTOriginal(movie, watchProviders) {
    // Check if movie has limited theatrical release or direct-to-streaming indicators

    // 1. Low vote count might indicate limited release
    if (movie.vote_count < 500) {
      return true;
    }

    // 2. Check if only available on streaming (not in theaters)
    if (watchProviders && watchProviders.results) {
      const usProviders = watchProviders.results.US;
      if (usProviders) {
        // Has streaming but no theatrical indicators
        const hasStreaming = !!(usProviders.flatrate || usProviders.ads);
        const hasRental = !!(usProviders.rent || usProviders.buy);

        // If only streaming available (no rental/buy), likely original
        if (hasStreaming && !hasRental) {
          return true;
        }
      }
    }

    // 3. Check production companies for streaming originals
    if (movie.production_companies) {
      const streamingCompanies = [
        'Netflix', 'Amazon Studios', 'Apple Original Films',
        'Disney+', 'HBO Max', 'Hulu Originals'
      ];

      const hasStreamingCompany = movie.production_companies.some(company =>
        streamingCompanies.some(streaming =>
          company.name.toLowerCase().includes(streaming.toLowerCase())
        )
      );

      if (hasStreamingCompany) {
        return true;
      }
    }

    // 4. Recent release with high streaming availability
    const daysSinceRelease = this.getDaysSinceRelease(movie.release_date);
    if (daysSinceRelease <= 90 && this.hasStreamingAvailability(watchProviders)) {
      return true;
    }

    return false;
  }

  /**
   * Identify the primary streaming platform for a movie
   * @param {Object} watchProviders - Watch providers data
   * @returns {string} Primary platform name
   */
  identifyPrimaryStreamingPlatform(watchProviders) {
    if (!watchProviders || !watchProviders.results) return 'Unknown';

    const usProviders = watchProviders.results.US;
    if (!usProviders || !usProviders.flatrate) return 'Unknown';

    const platformMap = {
      8: 'Netflix',
      9: 'Amazon Prime Video',
      337: 'Disney+',
      350: 'Apple TV+',
      384: 'HBO Max',
      15: 'Hulu',
      531: 'Paramount+',
      386: 'Peacock',
      37: 'Showtime',
      43: 'Starz',
      283: 'Crunchyroll',
      269: 'Funimation',
      188: 'YouTube Premium',
      583: 'Tubi',
      300: 'Pluto TV',
      207: 'Roku Channel',
      613: 'IMDb TV',
      7: 'Vudu',
      12: 'Crackle',
      538: 'Plex',
      191: 'Kanopy',
      212: 'Hoopla'
    };

    // Return the first recognized platform
    for (const provider of usProviders.flatrate) {
      if (platformMap[provider.provider_id]) {
        return platformMap[provider.provider_id];
      }
    }

    return usProviders.flatrate[0]?.provider_name || 'Unknown';
  }

  /**
   * Calculate days since release
   * @param {string} dateString - ISO date string
   * @returns {number} Number of days since release
   */
  getDaysSinceRelease(dateString) {
    if (!dateString) return null;

    try {
      const releaseDate = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      releaseDate.setHours(0, 0, 0, 0);

      const timeDiff = today.getTime() - releaseDate.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

      return daysDiff;
    } catch (error) {
      return null;
    }
  }

  /**
   * Calculate streaming release recency score (how likely movie was just added to streaming)
   * @param {Object} movie - Movie object
   * @param {Object} watchProviders - Watch providers data
   * @param {number} daysSinceRelease - Days since theatrical release
   * @returns {number} Score from 1-10 (higher = more likely recently added to streaming)
   */
  calculateStreamingReleaseRecency(movie, watchProviders, daysSinceRelease) {
    let score = 5; // Base score

    // Very recent releases are most likely to be newly added to streaming
    if (daysSinceRelease <= 3) {
      score += 4; // Maximum boost for ultra-recent
    } else if (daysSinceRelease <= 7) {
      score += 3; // High boost for very recent
    } else if (daysSinceRelease <= 14) {
      score += 2; // Medium boost for recent
    } else if (daysSinceRelease <= 30) {
      score += 1; // Small boost for moderately recent
    }

    // High popularity suggests current attention (possibly due to recent streaming addition)
    if (movie.popularity > 100) {
      score += 2;
    } else if (movie.popularity > 50) {
      score += 1;
    }

    // Recent high vote activity suggests current relevance
    if (movie.vote_count > 500 && movie.vote_average >= 7.0) {
      score += 1;
    }

    // Check if available on major streaming platforms (more likely to be recently added)
    if (watchProviders && watchProviders.results && watchProviders.results.US) {
      const usProviders = watchProviders.results.US;
      if (usProviders.flatrate && usProviders.flatrate.length > 0) {
        score += 1; // Available on subscription services

        // Bonus for being on multiple platforms (suggests recent wide release)
        if (usProviders.flatrate.length > 1) {
          score += 1;
        }
      }
    }

    return Math.min(score, 10); // Cap at 10
  }

  /**
   * Estimate when movie was likely added to streaming platform
   * @param {string} releaseDate - Original release date
   * @param {number} streamingScore - Streaming recency score
   * @returns {string} Estimated streaming add date
   */
  estimateStreamingAddDate(releaseDate, streamingScore) {
    if (!releaseDate) return 'Unknown';

    try {
      const originalDate = new Date(releaseDate);
      const today = new Date();

      // Estimate based on streaming score
      let estimatedDaysAgo;
      if (streamingScore >= 9) {
        estimatedDaysAgo = Math.floor(Math.random() * 3); // 0-3 days ago
      } else if (streamingScore >= 8) {
        estimatedDaysAgo = Math.floor(Math.random() * 7) + 1; // 1-7 days ago
      } else if (streamingScore >= 7) {
        estimatedDaysAgo = Math.floor(Math.random() * 14) + 1; // 1-14 days ago
      } else {
        estimatedDaysAgo = Math.floor(Math.random() * 30) + 1; // 1-30 days ago
      }

      const estimatedDate = new Date(today);
      estimatedDate.setDate(today.getDate() - estimatedDaysAgo);

      return this.formatReleaseDate(estimatedDate.toISOString().split('T')[0]);
    } catch (error) {
      return 'Unknown';
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
   * Calculate trending score based on position and movie metrics
   * @param {Object} movie - Movie object
   * @param {number} rank - Position in trending list (0-based)
   * @returns {number} Trending score from 1-100
   */
  calculateTrendingScore(movie, rank) {
    let score = 100 - (rank * 5); // Base score decreases by position

    // Boost for high popularity
    if (movie.popularity > 100) {
      score += 10;
    } else if (movie.popularity > 50) {
      score += 5;
    }

    // Boost for high ratings with sufficient votes
    if (movie.vote_average >= 8.0 && movie.vote_count > 1000) {
      score += 10;
    } else if (movie.vote_average >= 7.0 && movie.vote_count > 500) {
      score += 5;
    }

    // Boost for recent releases (more likely to be trending due to newness)
    if (movie.release_date) {
      const daysSinceRelease = this.getDaysSinceRelease(movie.release_date);
      if (daysSinceRelease <= 30) {
        score += 15; // Very recent
      } else if (daysSinceRelease <= 90) {
        score += 10; // Recent
      } else if (daysSinceRelease <= 180) {
        score += 5; // Moderately recent
      }
    }

    return Math.max(Math.min(score, 100), 1); // Keep between 1-100
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
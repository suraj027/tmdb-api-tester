const axios = require('axios');

/**
 * TMDB Service for handling all interactions with The Movie Database API
 * Provides authentication, rate limiting, error handling, and response transformation
 */
class TMDBService {
  constructor(apiKey, baseURL = 'https://api.themoviedb.org/3') {
    if (!apiKey) {
      throw new Error('TMDB API key is required');
    }

    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.imageBaseURL = 'https://image.tmdb.org/t/p/';
    
    // Rate limiting: TMDB allows 40 requests per 10 seconds
    this.requestQueue = [];
    this.requestTimes = [];
    this.maxRequestsPerWindow = 40;
    this.windowSizeMs = 10000; // 10 seconds

    // Create axios instance with default config
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      params: {
        api_key: this.apiKey
      }
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => this.handleAPIError(error)
    );
  }

  /**
   * Rate limiting implementation
   * Ensures we don't exceed TMDB's rate limits
   */
  async enforceRateLimit() {
    const now = Date.now();
    
    // Remove timestamps older than the window
    this.requestTimes = this.requestTimes.filter(
      time => now - time < this.windowSizeMs
    );

    // If we're at the limit, wait until we can make another request
    if (this.requestTimes.length >= this.maxRequestsPerWindow) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = this.windowSizeMs - (now - oldestRequest);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.enforceRateLimit(); // Recursive call to check again
      }
    }

    // Record this request time
    this.requestTimes.push(now);
  }

  /**
   * Handle API errors and transform them into consistent format
   */
  handleAPIError(error) {
    if (error.response) {
      // TMDB API returned an error response
      const { status, data } = error.response;
      
      const tmdbError = new Error(data.status_message || 'TMDB API Error');
      tmdbError.code = 'TMDB_API_ERROR';
      tmdbError.status = status;
      tmdbError.tmdbCode = data.status_code;
      tmdbError.originalError = error;
      
      throw tmdbError;
    } else if (error.request) {
      // Network error
      const networkError = new Error('Failed to connect to TMDB API');
      networkError.code = 'NETWORK_ERROR';
      networkError.originalError = error;
      
      throw networkError;
    } else {
      // Other error
      const genericError = new Error('Request setup error');
      genericError.code = 'REQUEST_ERROR';
      genericError.originalError = error;
      
      throw genericError;
    }
  }

  /**
   * Make authenticated request to TMDB API with rate limiting
   */
  async makeRequest(endpoint, params = {}) {
    await this.enforceRateLimit();

    try {
      const response = await this.axiosInstance.get(endpoint, { params });
      return this.transformResponse(response.data);
    } catch (error) {
      throw error; // Error already handled by interceptor
    }
  }

  /**
   * Transform TMDB response data for consistent client consumption
   */
  transformResponse(data) {
    if (!data) return data;

    // Transform image paths to full URLs
    if (data.poster_path) {
      data.poster_url = this.getImageURL(data.poster_path, 'w500');
    }
    
    if (data.backdrop_path) {
      data.backdrop_url = this.getImageURL(data.backdrop_path, 'w1280');
    }

    if (data.profile_path) {
      data.profile_url = this.getImageURL(data.profile_path, 'w185');
    }

    // Transform arrays of items with image paths
    if (data.results && Array.isArray(data.results)) {
      data.results = data.results.map(item => this.transformResponse(item));
    }

    if (data.cast && Array.isArray(data.cast)) {
      data.cast = data.cast.map(person => this.transformResponse(person));
    }

    if (data.crew && Array.isArray(data.crew)) {
      data.crew = data.crew.map(person => this.transformResponse(person));
    }

    return data;
  }

  /**
   * Generate full image URL from TMDB image path
   */
  getImageURL(imagePath, size = 'original') {
    if (!imagePath) return null;
    return `${this.imageBaseURL}${size}${imagePath}`;
  }

  /**
   * Get movie details by ID
   */
  async getMovie(id, appendToResponse = '') {
    const params = appendToResponse ? { append_to_response: appendToResponse } : {};
    return this.makeRequest(`/movie/${id}`, params);
  }

  /**
   * Get TV show details by ID
   */
  async getTVShow(id, appendToResponse = '') {
    const params = appendToResponse ? { append_to_response: appendToResponse } : {};
    return this.makeRequest(`/tv/${id}`, params);
  }

  /**
   * Search for movies, TV shows, and people
   */
  async searchMulti(query, page = 1) {
    return this.makeRequest('/search/multi', { query, page });
  }

  /**
   * Search for movies only
   */
  async searchMovies(query, page = 1) {
    return this.makeRequest('/search/movie', { query, page });
  }

  /**
   * Search for TV shows only
   */
  async searchTV(query, page = 1) {
    return this.makeRequest('/search/tv', { query, page });
  }

  /**
   * Get trending content
   */
  async getTrending(mediaType = 'all', timeWindow = 'day') {
    return this.makeRequest(`/trending/${mediaType}/${timeWindow}`);
  }

  /**
   * Get upcoming movies
   */
  async getUpcoming(page = 1) {
    return this.makeRequest('/movie/upcoming', { page });
  }

  /**
   * Get genres for movies or TV
   */
  async getGenres(mediaType = 'movie') {
    return this.makeRequest(`/genre/${mediaType}/list`);
  }

  /**
   * Discover movies with filters
   */
  async discoverMovies(params = {}) {
    return this.makeRequest('/discover/movie', params);
  }

  /**
   * Discover TV shows with filters
   */
  async discoverTV(params = {}) {
    return this.makeRequest('/discover/tv', params);
  }

  /**
   * Get movie credits (cast and crew)
   */
  async getMovieCredits(id) {
    return this.makeRequest(`/movie/${id}/credits`);
  }

  /**
   * Get TV show credits (cast and crew)
   */
  async getTVCredits(id) {
    return this.makeRequest(`/tv/${id}/credits`);
  }

  /**
   * Get movie videos (trailers, teasers, etc.)
   */
  async getMovieVideos(id) {
    return this.makeRequest(`/movie/${id}/videos`);
  }

  /**
   * Get TV show videos
   */
  async getTVVideos(id) {
    return this.makeRequest(`/tv/${id}/videos`);
  }

  /**
   * Get movie recommendations
   */
  async getMovieRecommendations(id, page = 1) {
    return this.makeRequest(`/movie/${id}/recommendations`, { page });
  }

  /**
   * Get TV show recommendations
   */
  async getTVRecommendations(id, page = 1) {
    return this.makeRequest(`/tv/${id}/recommendations`, { page });
  }

  /**
   * Get watch providers for a movie
   */
  async getMovieWatchProviders(id) {
    return this.makeRequest(`/movie/${id}/watch/providers`);
  }

  /**
   * Get watch providers for a TV show
   */
  async getTVWatchProviders(id) {
    return this.makeRequest(`/tv/${id}/watch/providers`);
  }

  /**
   * Get person details (for directors, actors, etc.)
   */
  async getPerson(id) {
    return this.makeRequest(`/person/${id}`);
  }

  /**
   * Get movies by a specific person (director, actor, etc.)
   */
  async getPersonMovies(id) {
    return this.makeRequest(`/person/${id}/movie_credits`);
  }
}

module.exports = TMDBService;
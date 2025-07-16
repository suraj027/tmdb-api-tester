const TMDBService = require('./tmdb.service');

/**
 * ContentService for handling detailed movie and TV show information
 * Provides comprehensive data aggregation from multiple TMDB endpoints
 */
class ContentService {
  constructor(tmdbService) {
    if (!tmdbService || !(tmdbService instanceof TMDBService)) {
      throw new Error('Valid TMDBService instance is required');
    }
    this.tmdbService = tmdbService;
  }

  /**
   * Get complete movie details with all related information
   * @param {number} id - Movie ID
   * @returns {Object} Complete movie details
   */
  async getMovieDetails(id) {
    if (!id || typeof id !== 'number') {
      throw new Error('Valid movie ID is required');
    }

    try {
      // Get basic movie details with appended responses for efficiency
      const movieData = await this.tmdbService.getMovie(id, 'credits,videos,recommendations,watch/providers');
      
      // Transform and structure the response
      return {
        id: movieData.id,
        title: movieData.title,
        tagline: movieData.tagline || '',
        overview: movieData.overview || '',
        backdrop_path: movieData.backdrop_path,
        backdrop_url: movieData.backdrop_url,
        poster_path: movieData.poster_path,
        poster_url: movieData.poster_url,
        release_date: movieData.release_date,
        vote_average: movieData.vote_average,
        vote_count: movieData.vote_count,
        genres: movieData.genres || [],
        status: movieData.status,
        runtime: movieData.runtime,
        production_companies: movieData.production_companies || [],
        original_language: movieData.original_language,
        revenue: movieData.revenue || 0,
        budget: movieData.budget || 0,
        credits: movieData.credits || { cast: [], crew: [] },
        videos: movieData.videos || { results: [] },
        recommendations: movieData.recommendations || { results: [] },
        watch_providers: movieData['watch/providers'] || { results: {} }
      };
    } catch (error) {
      const contentError = new Error(`Failed to get movie details: ${error.message}`);
      contentError.code = 'CONTENT_SERVICE_ERROR';
      contentError.originalError = error;
      throw contentError;
    }
  }

  /**
   * Get complete TV show details with all related information
   * @param {number} id - TV show ID
   * @returns {Object} Complete TV show details
   */
  async getTVDetails(id) {
    if (!id || typeof id !== 'number') {
      throw new Error('Valid TV show ID is required');
    }

    try {
      // Get basic TV show details with appended responses for efficiency
      const tvData = await this.tmdbService.getTVShow(id, 'credits,videos,recommendations,watch/providers');
      
      // Transform and structure the response
      return {
        id: tvData.id,
        name: tvData.name,
        tagline: tvData.tagline || '',
        overview: tvData.overview || '',
        backdrop_path: tvData.backdrop_path,
        backdrop_url: tvData.backdrop_url,
        poster_path: tvData.poster_path,
        poster_url: tvData.poster_url,
        first_air_date: tvData.first_air_date,
        vote_average: tvData.vote_average,
        vote_count: tvData.vote_count,
        genres: tvData.genres || [],
        status: tvData.status,
        number_of_seasons: tvData.number_of_seasons,
        number_of_episodes: tvData.number_of_episodes,
        networks: tvData.networks || [],
        original_language: tvData.original_language,
        credits: tvData.credits || { cast: [], crew: [] },
        videos: tvData.videos || { results: [] },
        recommendations: tvData.recommendations || { results: [] },
        watch_providers: tvData['watch/providers'] || { results: {} }
      };
    } catch (error) {
      const contentError = new Error(`Failed to get TV show details: ${error.message}`);
      contentError.code = 'CONTENT_SERVICE_ERROR';
      contentError.originalError = error;
      throw contentError;
    }
  }

  /**
   * Get credits (cast and crew) for a movie or TV show
   * @param {number} id - Content ID
   * @param {string} mediaType - 'movie' or 'tv'
   * @returns {Object} Credits with cast and crew
   */
  async getCredits(id, mediaType) {
    if (!id || typeof id !== 'number') {
      throw new Error('Valid content ID is required');
    }

    if (!mediaType || !['movie', 'tv'].includes(mediaType)) {
      throw new Error('Media type must be "movie" or "tv"');
    }

    try {
      const credits = mediaType === 'movie' 
        ? await this.tmdbService.getMovieCredits(id)
        : await this.tmdbService.getTVCredits(id);

      return {
        id,
        cast: credits.cast || [],
        crew: credits.crew || []
      };
    } catch (error) {
      const contentError = new Error(`Failed to get credits: ${error.message}`);
      contentError.code = 'CONTENT_SERVICE_ERROR';
      contentError.originalError = error;
      throw contentError;
    }
  }

  /**
   * Get videos (trailers, teasers, etc.) for a movie or TV show
   * @param {number} id - Content ID
   * @param {string} mediaType - 'movie' or 'tv'
   * @returns {Object} Videos with results array
   */
  async getVideos(id, mediaType) {
    if (!id || typeof id !== 'number') {
      throw new Error('Valid content ID is required');
    }

    if (!mediaType || !['movie', 'tv'].includes(mediaType)) {
      throw new Error('Media type must be "movie" or "tv"');
    }

    try {
      const videos = mediaType === 'movie'
        ? await this.tmdbService.getMovieVideos(id)
        : await this.tmdbService.getTVVideos(id);

      // Filter and prioritize trailers
      const results = videos.results || [];
      const trailers = results.filter(video => video.type === 'Trailer');
      const teasers = results.filter(video => video.type === 'Teaser');
      const others = results.filter(video => !['Trailer', 'Teaser'].includes(video.type));

      return {
        id,
        results: [...trailers, ...teasers, ...others]
      };
    } catch (error) {
      const contentError = new Error(`Failed to get videos: ${error.message}`);
      contentError.code = 'CONTENT_SERVICE_ERROR';
      contentError.originalError = error;
      throw contentError;
    }
  }

  /**
   * Get recommendations for a movie or TV show
   * @param {number} id - Content ID
   * @param {string} mediaType - 'movie' or 'tv'
   * @param {number} page - Page number for pagination
   * @returns {Object} Recommendations with results array
   */
  async getRecommendations(id, mediaType, page = 1) {
    if (!id || typeof id !== 'number') {
      throw new Error('Valid content ID is required');
    }

    if (!mediaType || !['movie', 'tv'].includes(mediaType)) {
      throw new Error('Media type must be "movie" or "tv"');
    }

    try {
      const recommendations = mediaType === 'movie'
        ? await this.tmdbService.getMovieRecommendations(id, page)
        : await this.tmdbService.getTVRecommendations(id, page);

      return {
        id,
        page: recommendations.page,
        total_pages: recommendations.total_pages,
        total_results: recommendations.total_results,
        results: recommendations.results || []
      };
    } catch (error) {
      const contentError = new Error(`Failed to get recommendations: ${error.message}`);
      contentError.code = 'CONTENT_SERVICE_ERROR';
      contentError.originalError = error;
      throw contentError;
    }
  }

  /**
   * Get watch providers (streaming platforms) for a movie or TV show
   * @param {number} id - Content ID
   * @param {string} mediaType - 'movie' or 'tv'
   * @returns {Object} Watch providers by country
   */
  async getWatchProviders(id, mediaType) {
    if (!id || typeof id !== 'number') {
      throw new Error('Valid content ID is required');
    }

    if (!mediaType || !['movie', 'tv'].includes(mediaType)) {
      throw new Error('Media type must be "movie" or "tv"');
    }

    try {
      const watchProviders = mediaType === 'movie'
        ? await this.tmdbService.getMovieWatchProviders(id)
        : await this.tmdbService.getTVWatchProviders(id);

      return {
        id,
        results: watchProviders.results || {}
      };
    } catch (error) {
      const contentError = new Error(`Failed to get watch providers: ${error.message}`);
      contentError.code = 'CONTENT_SERVICE_ERROR';
      contentError.originalError = error;
      throw contentError;
    }
  }

  /**
   * Get movies by a specific director for "More by this Director" functionality
   * @param {number} directorId - Director's person ID
   * @returns {Object} Movies directed by the person
   */
  async getDirectorMovies(directorId) {
    if (!directorId || typeof directorId !== 'number') {
      throw new Error('Valid director ID is required');
    }

    try {
      const personMovies = await this.tmdbService.getPersonMovies(directorId);
      
      // Filter to only include movies where the person was a director
      const directedMovies = personMovies.crew ? 
        personMovies.crew.filter(movie => movie.job === 'Director') : [];

      // Sort by release date (newest first) and popularity
      const sortedMovies = directedMovies.sort((a, b) => {
        const dateA = new Date(a.release_date || '1900-01-01');
        const dateB = new Date(b.release_date || '1900-01-01');
        
        // First sort by date (newest first)
        if (dateB.getTime() !== dateA.getTime()) {
          return dateB.getTime() - dateA.getTime();
        }
        
        // Then by popularity if dates are the same
        return (b.popularity || 0) - (a.popularity || 0);
      });

      return {
        director_id: directorId,
        total_results: sortedMovies.length,
        results: sortedMovies
      };
    } catch (error) {
      const contentError = new Error(`Failed to get director movies: ${error.message}`);
      contentError.code = 'CONTENT_SERVICE_ERROR';
      contentError.originalError = error;
      throw contentError;
    }
  }
}

module.exports = ContentService;
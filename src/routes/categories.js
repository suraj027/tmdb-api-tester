const express = require('express');
const CategoryService = require('../services/category.service');
const TMDBService = require('../services/tmdb.service');
const { 
  validatePageQuery, 
  validateCategoryParam, 
  validateStudioParam, 
  validateNetworkParam, 
  validateGenreParam, 
  validateAwardTypeParam 
} = require('../middleware/validation');

const router = express.Router();

// Initialize services
const tmdbService = new TMDBService(process.env.TMDB_API_KEY);
const categoryService = new CategoryService(tmdbService);

/**
 * Get all available categories and subcategories
 */
router.get('/', async (req, res, next) => {
  try {
    const categories = {
      'new-trending': {
        name: 'New & Trending',
        subcategories: [
          { key: 'trending-movies', name: 'Trending Movies', endpoint: '/api/trending/movies' },
          { key: 'hot-tv-shows', name: 'Hot TV Shows', endpoint: '/api/trending/tv' },
          { key: 'anticipated-movies', name: 'Anticipated Movies', endpoint: '/api/upcoming/movies' },
          { key: 'streaming-now', name: 'Films Now Streaming', endpoint: '/api/streaming/now' }
        ]
      },
      'mood-picks': {
        name: 'Mood Picks',
        subcategories: [
          { key: 'family-movie-night', name: 'Family Movie Night', endpoint: '/api/mood/family-movie-night' },
          { key: 'rom-com-classics', name: 'Rom-Com Classics', endpoint: '/api/mood/rom-com-classics' },
          { key: 'psychological-thrillers', name: 'Psychological Thrillers', endpoint: '/api/mood/psychological-thrillers' },
          { key: 'feel-good-shows', name: 'Feel-Good Shows', endpoint: '/api/mood/feel-good-shows' },
          { key: 'musicals', name: 'Musicals', endpoint: '/api/mood/musicals' },
          { key: 'halloween', name: 'Halloween', endpoint: '/api/mood/halloween' },
          { key: 'bingeable-series', name: 'Bingeable Series', endpoint: '/api/mood/bingeable-series' }
        ]
      },
      'award-winners': {
        name: 'Award Winners & Blockbusters',
        subcategories: [
          { key: 'oscar-winners', name: 'Great Oscar Winners', endpoint: '/api/awards/oscar-winners' },
          { key: 'top-grossing', name: 'Top Grossing Movies', endpoint: '/api/awards/top-grossing' },
          { key: 'imdb-top-250', name: 'IMDb Top 250', endpoint: '/api/awards/imdb-top-250' },
          { key: 'blockbuster-shows', name: 'Blockbuster Shows', endpoint: '/api/awards/blockbuster-shows' },
          { key: 'top-rated', name: 'Top Rated', endpoint: '/api/awards/top-rated' }
        ]
      },
      'studio-picks': {
        name: 'Studio Picks',
        subcategories: [
          { key: 'disney', name: 'Disney', endpoint: '/api/studio/disney' },
          { key: 'pixar', name: 'Pixar', endpoint: '/api/studio/pixar' },
          { key: 'marvel', name: 'Marvel', endpoint: '/api/studio/marvel' },
          { key: 'dc', name: 'DC', endpoint: '/api/studio/dc' },
          { key: 'universal', name: 'Universal', endpoint: '/api/studio/universal' },
          { key: 'lucasfilm', name: 'Lucasfilm', endpoint: '/api/studio/lucasfilm' },
          { key: 'illumination', name: 'Illumination', endpoint: '/api/studio/illumination' },
          { key: 'dreamworks', name: 'Dreamworks', endpoint: '/api/studio/dreamworks' }
        ]
      },
      'by-network': {
        name: 'By Network',
        subcategories: [
          { key: 'netflix', name: 'Netflix', endpoint: '/api/network/netflix' },
          { key: 'apple-tv', name: 'Apple TV+', endpoint: '/api/network/apple-tv' },
          { key: 'disney-plus', name: 'Disney+', endpoint: '/api/network/disney-plus' },
          { key: 'prime-video', name: 'Prime Video', endpoint: '/api/network/prime-video' },
          { key: 'hbo', name: 'HBO', endpoint: '/api/network/hbo' },
          { key: 'paramount-plus', name: 'Paramount+', endpoint: '/api/network/paramount-plus' }
        ]
      },
      'by-genre': {
        name: 'By Genre',
        subcategories: [
          { key: 'action', name: 'Action', endpoint: '/api/genre/action' },
          { key: 'adventure', name: 'Adventure', endpoint: '/api/genre/adventure' },
          { key: 'animation', name: 'Animation', endpoint: '/api/genre/animation' },
          { key: 'comedy', name: 'Comedy', endpoint: '/api/genre/comedy' },
          { key: 'crime', name: 'Crime', endpoint: '/api/genre/crime' },
          { key: 'documentary', name: 'Documentary', endpoint: '/api/genre/documentary' },
          { key: 'drama', name: 'Drama', endpoint: '/api/genre/drama' },
          { key: 'family', name: 'Family', endpoint: '/api/genre/family' },
          { key: 'fantasy', name: 'Fantasy', endpoint: '/api/genre/fantasy' },
          { key: 'history', name: 'History', endpoint: '/api/genre/history' },
          { key: 'horror', name: 'Horror', endpoint: '/api/genre/horror' },
          { key: 'music', name: 'Music', endpoint: '/api/genre/music' },
          { key: 'mystery', name: 'Mystery', endpoint: '/api/genre/mystery' },
          { key: 'romance', name: 'Romance', endpoint: '/api/genre/romance' },
          { key: 'science-fiction', name: 'Science Fiction', endpoint: '/api/genre/science-fiction' },
          { key: 'thriller', name: 'Thriller', endpoint: '/api/genre/thriller' },
          { key: 'war', name: 'War', endpoint: '/api/genre/war' },
          { key: 'western', name: 'Western', endpoint: '/api/genre/western' }
        ]
      }
    };

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get trending movies
 */
router.get('/trending/movies', validatePageQuery, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await categoryService.getTrendingMovies(page);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Get hot TV shows (trending TV)
 */
router.get('/trending/tv', validatePageQuery, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await categoryService.getHotTVShows(page);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Get films now streaming
 */
router.get('/streaming/now', validatePageQuery, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await categoryService.getStreamingNow(page);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Get mood-based content
 */
router.get('/mood/:category', validateCategoryParam, validatePageQuery, async (req, res, next) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const result = await categoryService.getMoodContent(category, page);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Get award winners content
 */
router.get('/awards/:type', validateAwardTypeParam, validatePageQuery, async (req, res, next) => {
  try {
    const { type } = req.params;
    const page = parseInt(req.query.page) || 1;
    const result = await categoryService.getAwardWinners(type, page);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Get studio-specific content
 */
router.get('/studio/:studio', validateStudioParam, validatePageQuery, async (req, res, next) => {
  try {
    const { studio } = req.params;
    const page = parseInt(req.query.page) || 1;
    const result = await categoryService.getStudioContent(studio, page);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Get network-specific content
 */
router.get('/network/:network', validateNetworkParam, validatePageQuery, async (req, res, next) => {
  try {
    const { network } = req.params;
    const page = parseInt(req.query.page) || 1;
    const result = await categoryService.getNetworkContent(network, page);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Get genre-based content
 */
router.get('/genre/:genre', validateGenreParam, validatePageQuery, async (req, res, next) => {
  try {
    const { genre } = req.params;
    const mediaType = req.query.type || 'movie'; // Default to movie
    const page = parseInt(req.query.page) || 1;
    const result = await categoryService.getGenreContent(genre, mediaType, page);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
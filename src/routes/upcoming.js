const express = require('express');
const CategoryService = require('../services/category.service');
const TMDBService = require('../services/tmdb.service');
const { validatePageQuery } = require('../middleware/validation');

const router = express.Router();

// Initialize services
const tmdbService = new TMDBService(process.env.TMDB_API_KEY);
const categoryService = new CategoryService(tmdbService);

/**
 * Get combined upcoming movies and TV shows
 */
router.get('/', validatePageQuery, async (req, res, next) => {
  try {
    const moviePage = parseInt(req.query.moviePage) || 1;
    const tvPage = parseInt(req.query.tvPage) || 1;
    const result = await categoryService.getCombinedUpcoming(moviePage, tvPage);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Get upcoming movies only
 */
router.get('/movies', validatePageQuery, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await categoryService.getUpcomingMovies(page);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Get upcoming TV shows only
 */
router.get('/tv', validatePageQuery, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await categoryService.getUpcomingTV(page);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
const express = require('express');
const SearchService = require('../services/search.service');
const TMDBService = require('../services/tmdb.service');
const { validateSearchQuery } = require('../middleware/validation');

const router = express.Router();

// Initialize services
const tmdbService = new TMDBService(process.env.TMDB_API_KEY);
const searchService = new SearchService(tmdbService);

/**
 * Multi-search across movies, TV shows, and people
 */
router.get('/multi', validateSearchQuery, async (req, res, next) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;

    // Parse additional options
    const options = {
      includeAdult: req.query.includeAdult === 'true',
      minVoteCount: parseInt(req.query.minVoteCount) || 0,
      minRating: parseFloat(req.query.minRating) || 0,
      sortBy: req.query.sortBy || null
    };

    const result = await searchService.searchMulti(query, page, options);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Search movies only
 */
router.get('/movies', validateSearchQuery, async (req, res, next) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;

    // Parse additional options
    const options = {
      includeAdult: req.query.includeAdult === 'true',
      minVoteCount: parseInt(req.query.minVoteCount) || 0,
      minRating: parseFloat(req.query.minRating) || 0,
      sortBy: req.query.sortBy || null
    };

    const result = await searchService.searchMovies(query, page, options);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * Search TV shows only
 */
router.get('/tv', validateSearchQuery, async (req, res, next) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;

    // Parse additional options
    const options = {
      includeAdult: req.query.includeAdult === 'true',
      minVoteCount: parseInt(req.query.minVoteCount) || 0,
      minRating: parseFloat(req.query.minRating) || 0,
      sortBy: req.query.sortBy || null
    };

    const result = await searchService.searchTV(query, page, options);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
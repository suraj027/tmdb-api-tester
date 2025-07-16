const express = require('express');
const ContentService = require('../services/content.service');
const TMDBService = require('../services/tmdb.service');
const { validateContentId, validateMediaType, validatePageQuery } = require('../middleware/validation');

const router = express.Router();

// Initialize services
const tmdbService = new TMDBService(process.env.TMDB_API_KEY);
const contentService = new ContentService(tmdbService);

/**
 * Get complete movie details
 */
router.get('/movie/:id', validateContentId, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const result = await contentService.getMovieDetails(id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get complete TV show details
 */
router.get('/tv/:id', validateContentId, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const result = await contentService.getTVDetails(id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get credits for movie or TV show
 */
router.get('/:mediaType/:id/credits', validateMediaType, validateContentId, async (req, res, next) => {
  try {
    const { mediaType, id } = req.params;
    const parsedId = parseInt(id);

    const result = await contentService.getCredits(parsedId, mediaType);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get videos for movie or TV show
 */
router.get('/:mediaType/:id/videos', validateMediaType, validateContentId, async (req, res, next) => {
  try {
    const { mediaType, id } = req.params;
    const parsedId = parseInt(id);

    const result = await contentService.getVideos(parsedId, mediaType);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get recommendations for movie or TV show
 */
router.get('/:mediaType/:id/recommendations', validateMediaType, validateContentId, validatePageQuery, async (req, res, next) => {
  try {
    const { mediaType, id } = req.params;
    const parsedId = parseInt(id);
    const page = parseInt(req.query.page) || 1;

    const result = await contentService.getRecommendations(parsedId, mediaType, page);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get watch providers for movie or TV show
 */
router.get('/:mediaType/:id/watch-providers', validateMediaType, validateContentId, async (req, res, next) => {
  try {
    const { mediaType, id } = req.params;
    const parsedId = parseInt(id);

    const result = await contentService.getWatchProviders(parsedId, mediaType);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get movies by director for "More by this Director" functionality
 */
router.get('/person/:id/movies', validateContentId, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const result = await contentService.getDirectorMovies(id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
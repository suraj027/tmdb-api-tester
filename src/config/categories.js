/**
 * Category mappings for TMDB API parameters
 * Maps user-friendly category names to TMDB API parameters
 */

const CATEGORY_MAPPINGS = {
  // Mood-based content categories
  mood: {
    'family-movie-night': {
      genres: [10751], // Family
      sort_by: 'popularity.desc',
      media_type: 'movie'
    },
    'rom-com-classics': {
      genres: [10749, 35], // Romance, Comedy
      sort_by: 'vote_average.desc',
      'vote_average.gte': 7.0,
      media_type: 'movie'
    },
    'psychological-thrillers': {
      genres: [53], // Thriller
      with_keywords: '9715,10349', // psychological, mind-bending
      sort_by: 'vote_average.desc',
      'vote_average.gte': 6.5,
      media_type: 'movie'
    },
    'feel-good-shows': {
      genres: [35], // Comedy
      media_type: 'tv',
      sort_by: 'popularity.desc',
      'vote_average.gte': 7.0
    },
    'musicals': {
      genres: [10402], // Music
      sort_by: 'popularity.desc',
      media_type: 'movie'
    },
    'halloween': {
      genres: [27], // Horror
      sort_by: 'popularity.desc',
      media_type: 'movie'
    },
    'bingeable-series': {
      media_type: 'tv',
      sort_by: 'popularity.desc',
      'vote_average.gte': 7.5,
      'with_runtime.gte': 30
    }
  },

  // Award winners and blockbusters
  awards: {
    'oscar-winners': {
      with_keywords: '210024', // Oscar winner
      sort_by: 'vote_average.desc',
      'vote_average.gte': 7.0,
      media_type: 'movie'
    },
    'top-grossing': {
      sort_by: 'revenue.desc',
      'revenue.gte': 100000000,
      media_type: 'movie'
    },
    'imdb-top-250': {
      sort_by: 'vote_average.desc',
      'vote_count.gte': 10000,
      'vote_average.gte': 8.0,
      media_type: 'movie'
    },
    'blockbuster-shows': {
      media_type: 'tv',
      sort_by: 'popularity.desc',
      'vote_average.gte': 8.0,
      'vote_count.gte': 1000
    },
    'top-rated': {
      sort_by: 'vote_average.desc',
      'vote_average.gte': 8.0,
      'vote_count.gte': 5000
    }
  },

  // Studio-specific content
  studios: {
    'disney': {
      with_companies: '2', // Walt Disney Pictures
      sort_by: 'popularity.desc'
    },
    'pixar': {
      with_companies: '3', // Pixar Animation Studios
      sort_by: 'popularity.desc'
    },
    'marvel': {
      with_companies: '420', // Marvel Studios
      sort_by: 'popularity.desc'
    },
    'dc': {
      with_companies: '9993', // DC Entertainment
      sort_by: 'popularity.desc'
    },
    'universal': {
      with_companies: '33', // Universal Pictures
      sort_by: 'popularity.desc'
    },
    'lucasfilm': {
      with_companies: '1', // Lucasfilm Ltd.
      sort_by: 'popularity.desc'
    },
    'illumination': {
      with_companies: '6704', // Illumination Entertainment
      sort_by: 'popularity.desc'
    },
    'dreamworks': {
      with_companies: '521', // DreamWorks Animation
      sort_by: 'popularity.desc'
    }
  },

  // Network-specific content (TV shows)
  networks: {
    'netflix': {
      with_networks: '213', // Netflix
      media_type: 'tv',
      sort_by: 'popularity.desc'
    },
    'apple-tv': {
      with_networks: '2552', // Apple TV+
      media_type: 'tv',
      sort_by: 'popularity.desc'
    },
    'disney-plus': {
      with_networks: '2739', // Disney+
      media_type: 'tv',
      sort_by: 'popularity.desc'
    },
    'prime-video': {
      with_networks: '1024', // Amazon Prime Video
      media_type: 'tv',
      sort_by: 'popularity.desc'
    },
    'hbo': {
      with_networks: '49', // HBO
      media_type: 'tv',
      sort_by: 'popularity.desc'
    },
    'paramount-plus': {
      with_networks: '4330', // Paramount+
      media_type: 'tv',
      sort_by: 'popularity.desc'
    }
  },

  // Genre-based content
  genres: {
    'action': { genres: [28], sort_by: 'popularity.desc' },
    'adventure': { genres: [12], sort_by: 'popularity.desc' },
    'animation': { genres: [16], sort_by: 'popularity.desc' },
    'comedy': { genres: [35], sort_by: 'popularity.desc' },
    'crime': { genres: [80], sort_by: 'popularity.desc' },
    'documentary': { genres: [99], sort_by: 'popularity.desc' },
    'drama': { genres: [18], sort_by: 'popularity.desc' },
    'family': { genres: [10751], sort_by: 'popularity.desc' },
    'fantasy': { genres: [14], sort_by: 'popularity.desc' },
    'history': { genres: [36], sort_by: 'popularity.desc' },
    'horror': { genres: [27], sort_by: 'popularity.desc' },
    'music': { genres: [10402], sort_by: 'popularity.desc' },
    'mystery': { genres: [9648], sort_by: 'popularity.desc' },
    'romance': { genres: [10749], sort_by: 'popularity.desc' },
    'science-fiction': { genres: [878], sort_by: 'popularity.desc' },
    'thriller': { genres: [53], sort_by: 'popularity.desc' },
    'war': { genres: [10752], sort_by: 'popularity.desc' },
    'western': { genres: [37], sort_by: 'popularity.desc' }
  }
};

/**
 * Helper function to get category mapping by category type and name
 * @param {string} categoryType - The main category type (mood, studios, networks, genres, awards)
 * @param {string} categoryName - The specific category name
 * @returns {Object|null} The mapping object or null if not found
 */
function getCategoryMapping(categoryType, categoryName) {
  if (!CATEGORY_MAPPINGS[categoryType]) {
    return null;
  }
  
  return CATEGORY_MAPPINGS[categoryType][categoryName] || null;
}

/**
 * Helper function to convert category mapping to TMDB API parameters
 * @param {Object} mapping - The category mapping object
 * @returns {Object} TMDB API parameters
 */
function convertToTMDBParams(mapping) {
  if (!mapping || typeof mapping !== 'object') {
    return {};
  }

  const params = { ...mapping };
  
  // Convert genres array to comma-separated string if present
  if (params.genres && Array.isArray(params.genres)) {
    params.with_genres = params.genres.join(',');
    delete params.genres;
  }
  
  // Remove media_type from params as it's used for endpoint selection
  const { media_type, ...tmdbParams } = params;
  
  return tmdbParams;
}

/**
 * Validate if a category type and name combination is supported
 * @param {string} categoryType - The main category type
 * @param {string} categoryName - The specific category name
 * @returns {boolean} True if the category is supported
 */
function isValidCategory(categoryType, categoryName) {
  return getCategoryMapping(categoryType, categoryName) !== null;
}

/**
 * Get all available categories and their subcategories
 * @returns {Object} Object containing all available categories
 */
function getAllCategories() {
  const categories = {};
  
  Object.keys(CATEGORY_MAPPINGS).forEach(categoryType => {
    categories[categoryType] = Object.keys(CATEGORY_MAPPINGS[categoryType]);
  });
  
  return categories;
}

/**
 * Get supported category types
 * @returns {string[]} Array of supported category types
 */
function getSupportedCategoryTypes() {
  return Object.keys(CATEGORY_MAPPINGS);
}

/**
 * Get media type for a specific category
 * @param {string} categoryType - The main category type
 * @param {string} categoryName - The specific category name
 * @returns {string|null} The media type ('movie', 'tv') or null if not specified
 */
function getMediaType(categoryType, categoryName) {
  const mapping = getCategoryMapping(categoryType, categoryName);
  return mapping ? mapping.media_type || null : null;
}

module.exports = {
  CATEGORY_MAPPINGS,
  getCategoryMapping,
  convertToTMDBParams,
  isValidCategory,
  getAllCategories,
  getSupportedCategoryTypes,
  getMediaType
};
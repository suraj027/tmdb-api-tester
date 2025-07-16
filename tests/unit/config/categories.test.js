const {
  CATEGORY_MAPPINGS,
  getCategoryMapping,
  convertToTMDBParams,
  isValidCategory,
  getAllCategories,
  getSupportedCategoryTypes,
  getMediaType
} = require('../../../src/config/categories');

describe('Category Mappings Configuration', () => {
  describe('CATEGORY_MAPPINGS structure', () => {
    test('should have all required category types', () => {
      const expectedTypes = ['mood', 'awards', 'studios', 'networks', 'genres'];
      expectedTypes.forEach(type => {
        expect(CATEGORY_MAPPINGS).toHaveProperty(type);
        expect(typeof CATEGORY_MAPPINGS[type]).toBe('object');
      });
    });

    test('should have all mood subcategories', () => {
      const expectedMoodCategories = [
        'family-movie-night',
        'rom-com-classics',
        'psychological-thrillers',
        'feel-good-shows',
        'musicals',
        'halloween',
        'bingeable-series'
      ];
      
      expectedMoodCategories.forEach(category => {
        expect(CATEGORY_MAPPINGS.mood).toHaveProperty(category);
      });
    });

    test('should have all studio subcategories', () => {
      const expectedStudios = [
        'disney',
        'pixar',
        'marvel',
        'dc',
        'universal',
        'lucasfilm',
        'illumination',
        'dreamworks'
      ];
      
      expectedStudios.forEach(studio => {
        expect(CATEGORY_MAPPINGS.studios).toHaveProperty(studio);
      });
    });
  });

  describe('getCategoryMapping', () => {
    test('should return correct mapping for valid category', () => {
      const mapping = getCategoryMapping('mood', 'family-movie-night');
      expect(mapping).toEqual({
        genres: [10751],
        sort_by: 'popularity.desc',
        media_type: 'movie'
      });
    });

    test('should return null for invalid category type', () => {
      const mapping = getCategoryMapping('invalid', 'test');
      expect(mapping).toBeNull();
    });

    test('should return null for invalid category name', () => {
      const mapping = getCategoryMapping('mood', 'invalid-category');
      expect(mapping).toBeNull();
    });
  });

  describe('convertToTMDBParams', () => {
    test('should convert genres array to with_genres string', () => {
      const mapping = {
        genres: [28, 12],
        sort_by: 'popularity.desc',
        media_type: 'movie'
      };
      
      const params = convertToTMDBParams(mapping);
      expect(params).toEqual({
        with_genres: '28,12',
        sort_by: 'popularity.desc'
      });
      expect(params).not.toHaveProperty('genres');
      expect(params).not.toHaveProperty('media_type');
    });

    test('should remove media_type from params', () => {
      const mapping = {
        with_companies: '2',
        media_type: 'movie',
        sort_by: 'popularity.desc'
      };
      
      const params = convertToTMDBParams(mapping);
      expect(params).toEqual({
        with_companies: '2',
        sort_by: 'popularity.desc'
      });
      expect(params).not.toHaveProperty('media_type');
    });
  });

  describe('isValidCategory', () => {
    test('should return true for valid categories', () => {
      expect(isValidCategory('mood', 'family-movie-night')).toBe(true);
      expect(isValidCategory('studios', 'disney')).toBe(true);
      expect(isValidCategory('genres', 'action')).toBe(true);
    });

    test('should return false for invalid category types', () => {
      expect(isValidCategory('invalid', 'test')).toBe(false);
    });
  });

  describe('getAllCategories', () => {
    test('should return all categories with their subcategories', () => {
      const categories = getAllCategories();
      
      expect(categories).toHaveProperty('mood');
      expect(categories).toHaveProperty('studios');
      expect(categories).toHaveProperty('genres');
      
      expect(Array.isArray(categories.mood)).toBe(true);
      expect(categories.mood).toContain('family-movie-night');
      expect(categories.studios).toContain('disney');
      expect(categories.genres).toContain('action');
    });
  });

  describe('getSupportedCategoryTypes', () => {
    test('should return all supported category types', () => {
      const types = getSupportedCategoryTypes();
      const expectedTypes = ['mood', 'awards', 'studios', 'networks', 'genres'];
      
      expect(types).toEqual(expect.arrayContaining(expectedTypes));
      expect(types.length).toBe(5);
    });
  });

  describe('getMediaType', () => {
    test('should return correct media type for categories that specify it', () => {
      expect(getMediaType('mood', 'family-movie-night')).toBe('movie');
      expect(getMediaType('mood', 'feel-good-shows')).toBe('tv');
    });

    test('should return null for categories without media_type', () => {
      expect(getMediaType('genres', 'action')).toBeNull();
      expect(getMediaType('studios', 'disney')).toBeNull();
    });
  });
});

describe('Additional category validation', () => {
    test('should have all network subcategories', () => {
      const expectedNetworks = [
        'netflix',
        'apple-tv',
        'disney-plus',
        'prime-video',
        'hbo',
        'paramount-plus'
      ];
      
      expectedNetworks.forEach(network => {
        expect(CATEGORY_MAPPINGS.networks).toHaveProperty(network);
      });
    });

    test('should have all award subcategories', () => {
      const expectedAwards = [
        'oscar-winners',
        'top-grossing',
        'imdb-top-250',
        'blockbuster-shows',
        'top-rated'
      ];
      
      expectedAwards.forEach(award => {
        expect(CATEGORY_MAPPINGS.awards).toHaveProperty(award);
      });
    });

    test('should have comprehensive genre subcategories', () => {
      const expectedGenres = [
        'action',
        'adventure',
        'animation',
        'comedy',
        'crime',
        'documentary',
        'drama',
        'family',
        'fantasy',
        'history',
        'horror',
        'music',
        'mystery',
        'romance',
        'science-fiction',
        'thriller',
        'war',
        'western'
      ];
      
      expectedGenres.forEach(genre => {
        expect(CATEGORY_MAPPINGS.genres).toHaveProperty(genre);
      });
    });
  });

  describe('convertToTMDBParams edge cases', () => {
    test('should handle mapping without genres', () => {
      const mapping = {
        with_companies: '420',
        sort_by: 'popularity.desc'
      };
      
      const params = convertToTMDBParams(mapping);
      expect(params).toEqual({
        with_companies: '420',
        sort_by: 'popularity.desc'
      });
    });

    test('should return empty object for null input', () => {
      const params = convertToTMDBParams(null);
      expect(params).toEqual({});
    });

    test('should return empty object for non-object input', () => {
      const params = convertToTMDBParams('invalid');
      expect(params).toEqual({});
    });

    test('should preserve complex parameters', () => {
      const mapping = {
        genres: [35],
        'vote_average.gte': 7.0,
        'vote_count.gte': 1000,
        sort_by: 'vote_average.desc',
        media_type: 'tv'
      };
      
      const params = convertToTMDBParams(mapping);
      expect(params).toEqual({
        with_genres: '35',
        'vote_average.gte': 7.0,
        'vote_count.gte': 1000,
        sort_by: 'vote_average.desc'
      });
    });
  });

  describe('Data integrity validation', () => {
    test('all network categories should have media_type tv', () => {
      Object.values(CATEGORY_MAPPINGS.networks).forEach(mapping => {
        expect(mapping).toHaveProperty('media_type');
        expect(mapping.media_type).toBe('tv');
        expect(mapping).toHaveProperty('with_networks');
      });
    });

    test('all studio categories should have with_companies', () => {
      Object.values(CATEGORY_MAPPINGS.studios).forEach(mapping => {
        expect(mapping).toHaveProperty('with_companies');
        expect(typeof mapping.with_companies).toBe('string');
      });
    });

    test('all genre categories should have genres array', () => {
      Object.values(CATEGORY_MAPPINGS.genres).forEach(mapping => {
        expect(mapping).toHaveProperty('genres');
        expect(Array.isArray(mapping.genres)).toBe(true);
        expect(mapping.genres.length).toBeGreaterThan(0);
      });
    });
  });
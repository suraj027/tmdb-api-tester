const TMDBService = require('./src/services/tmdb.service');
const SearchService = require('./src/services/search.service');
require('dotenv').config();

async function testTMDBConnection() {
  console.log('Testing TMDB API connection...');
  console.log('API Key:', process.env.TMDB_API_KEY ? 'Present' : 'Missing');
  
  try {
    const tmdbService = new TMDBService(process.env.TMDB_API_KEY);
    console.log('TMDBService created successfully');
    
    // Test basic TMDB connection
    console.log('Testing direct TMDB search...');
    const directResult = await tmdbService.searchMovies('batman', 1);
    console.log('Direct TMDB result:', {
      page: directResult.page,
      total_results: directResult.total_results,
      results_count: directResult.results?.length || 0
    });
    
    // Test SearchService
    console.log('Testing SearchService...');
    const searchService = new SearchService(tmdbService);
    const searchResult = await searchService.searchMovies('batman', 1);
    console.log('SearchService result:', {
      success: searchResult.success,
      searchType: searchResult.searchType,
      results_count: searchResult.results?.length || 0,
      total_results: searchResult.pagination?.totalResults || 0
    });
    
    console.log('✅ All tests passed! Your API can fetch movie/TV data.');
    
  } catch (error) {
    console.error('❌ Error testing TMDB connection:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
  }
}

testTMDBConnection();
#!/usr/bin/env node

/**
 * Deployment Test Script
 * 
 * This script tests your deployed API to ensure all endpoints work correctly.
 * Usage: node test-deployment.js <your-api-url>
 * Example: node test-deployment.js https://your-app.onrender.com
 */

const https = require('https');
const http = require('http');

const API_URL = process.argv[2];

if (!API_URL) {
  console.error('❌ Please provide your API URL');
  console.error('Usage: node test-deployment.js <your-api-url>');
  console.error('Example: node test-deployment.js https://your-app.onrender.com');
  process.exit(1);
}

console.log(`🚀 Testing deployment at: ${API_URL}`);
console.log('=' .repeat(50));

// Helper function to make HTTP requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Test cases
const tests = [
  {
    name: 'Health Check',
    url: '/health',
    expectedStatus: 200,
    expectedFields: ['status', 'message', 'timestamp']
  },
  {
    name: 'Categories Overview',
    url: '/api',
    expectedStatus: 200,
    expectedFields: ['success', 'data']
  },
  {
    name: 'Search Movies',
    url: '/api/search/movies?query=batman',
    expectedStatus: 200,
    expectedFields: ['success', 'data']
  },
  {
    name: 'Search Multi',
    url: '/api/search/multi?query=avengers',
    expectedStatus: 200,
    expectedFields: ['success', 'data']
  },
  {
    name: 'Trending Movies',
    url: '/api/trending/movies',
    expectedStatus: 200,
    expectedFields: ['success', 'data']
  },
  {
    name: 'Upcoming Movies',
    url: '/api/upcoming/movies',
    expectedStatus: 200,
    expectedFields: ['success', 'data']
  },
  {
    name: 'Movie Details',
    url: '/api/movie/550', // Fight Club
    expectedStatus: 200,
    expectedFields: ['success', 'data']
  },
  {
    name: 'Invalid Movie ID (Validation)',
    url: '/api/movie/abc',
    expectedStatus: 400,
    expectedFields: ['success', 'error']
  },
  {
    name: 'Invalid Search Query (Validation)',
    url: '/api/search/multi?query=',
    expectedStatus: 400,
    expectedFields: ['success', 'error']
  }
];

// Run tests
async function runTests() {
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`\n🧪 Testing: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      const response = await makeRequest(API_URL + test.url);
      
      // Check status code
      if (response.status === test.expectedStatus) {
        console.log(`   ✅ Status: ${response.status} (expected)`);
      } else {
        console.log(`   ❌ Status: ${response.status} (expected ${test.expectedStatus})`);
        failed++;
        continue;
      }
      
      // Check expected fields
      if (typeof response.data === 'object' && response.data !== null) {
        const missingFields = test.expectedFields.filter(field => !(field in response.data));
        
        if (missingFields.length === 0) {
          console.log(`   ✅ Response structure: Valid`);
          
          // Show some response data
          if (response.data.success === true && response.data.data) {
            if (Array.isArray(response.data.data.results)) {
              console.log(`   📊 Results: ${response.data.data.results.length} items`);
            } else if (response.data.data.title || response.data.data.name) {
              console.log(`   📊 Content: ${response.data.data.title || response.data.data.name}`);
            }
          }
          
          passed++;
        } else {
          console.log(`   ❌ Missing fields: ${missingFields.join(', ')}`);
          failed++;
        }
      } else {
        console.log(`   ❌ Invalid JSON response`);
        failed++;
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failed++;
    }
  }
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log(`📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Your deployment is working correctly.');
    console.log('\n📝 Next steps:');
    console.log('   1. Update your frontend to use this API URL');
    console.log('   2. Test with your actual application');
    console.log('   3. Monitor the logs for any issues');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
    console.log('\n🔧 Common fixes:');
    console.log('   1. Ensure TMDB_API_KEY is set correctly');
    console.log('   2. Check that all environment variables are configured');
    console.log('   3. Verify the deployment completed successfully');
  }
  
  console.log(`\n🌐 Your API is available at: ${API_URL}`);
}

runTests().catch(console.error);
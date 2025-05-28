// Test script for location stats API
// Use built-in fetch (Node.js 18+) or require node-fetch for older versions
const fetch = globalThis.fetch || require('node-fetch');

async function testLocationStats() {
  try {
    console.log('Testing location stats API...');
    
    const response = await fetch('http://localhost:3000/api/profiles/location-stats');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Location stats response:', JSON.stringify(data, null, 2));
    
    // Test that we get the expected structure
    if (data.countries && Array.isArray(data.countries)) {
      console.log('✅ Countries array found with', data.countries.length, 'countries');
    } else {
      console.log('❌ Countries array not found or invalid');
    }
    
    if (data.cities && typeof data.cities === 'object') {
      const cityCountries = Object.keys(data.cities);
      console.log('✅ Cities object found with', cityCountries.length, 'countries');
    } else {
      console.log('❌ Cities object not found or invalid');
    }
    
  } catch (error) {
    console.error('❌ Error testing location stats:', error.message);
  }
}

testLocationStats();

// Simple test to verify the service stats API works
console.log('Testing service stats API...');

// This would be run in the browser console or as a fetch test
const testServiceStatsAPI = async () => {
  try {
    console.log('Making request to /api/service-management/stats...');
    
    const response = await fetch('/api/service-management/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Success! Stats data:', data);
    
    // Validate expected fields
    const expectedFields = ['serviceName', 'assignedEmployees', 'availableEmployees', 'currentMonth', 'coverage', 'targetCoverage', 'pendingRequests', 'activeSchedule'];
    const missingFields = expectedFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      console.warn('Missing expected fields:', missingFields);
    } else {
      console.log('✅ All expected fields present');
    }
    
  } catch (error) {
    console.error('Network or parsing error:', error);
  }
};

// Instructions for manual testing
console.log(`
To test the service stats API:

1. Open browser developer tools
2. Navigate to the service management page while logged in as a jefe_servicio
3. Run this in the console:

${testServiceStatsAPI.toString()}

testServiceStatsAPI();

Or check the Network tab for the request to /api/service-management/stats
`);

module.exports = { testServiceStatsAPI };
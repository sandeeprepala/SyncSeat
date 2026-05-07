// Test script to verify API Gateway URL
// Run this in browser console to test your API Gateway

const testApiGateway = async (gatewayUrl) => {
  console.log('Testing API Gateway:', gatewayUrl);

  try {
    // Test health endpoint
    const healthResponse = await fetch(`${gatewayUrl}/health`);
    console.log('Health check:', healthResponse.status);

    // Test booking proxy
    const bookingResponse = await fetch(`${gatewayUrl}/booking/test`, {
      method: 'GET',
      credentials: 'include'
    });
    console.log('Booking proxy:', bookingResponse.status);

    // Test homepage proxy
    const homepageResponse = await fetch(`${gatewayUrl}/homepage/movies`);
    console.log('Homepage proxy:', homepageResponse.status);

    console.log('✅ API Gateway is working!');
  } catch (error) {
    console.error('❌ API Gateway test failed:', error);
  }
};

// Usage: testApiGateway('https://your-api-gateway-url.onrender.com')
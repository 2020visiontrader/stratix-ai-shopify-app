// Quick authentication test script
const fetch = require('node-fetch');

async function testAuth() {
  console.log('🧪 Testing Authentication Flow...\n');
  
  try {
    // Test 1: Login with demo credentials
    console.log('1. Testing login with demo credentials...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@example.com',
        password: 'password'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('   Login Response:', loginData);
    
    // Extract session cookie
    const setCookie = loginResponse.headers.get('set-cookie');
    const sessionCookie = setCookie ? setCookie.split(';')[0] : '';
    console.log('   Session Cookie:', sessionCookie);
    
    if (loginData.success) {
      console.log('   ✅ Login successful!');
      
      // Test 2: Check auth status
      console.log('\n2. Testing auth status...');
      const statusResponse = await fetch('http://localhost:3000/api/auth/status', {
        headers: { 'Cookie': sessionCookie }
      });
      
      const statusData = await statusResponse.json();
      console.log('   Status Response:', statusData);
      
      if (statusData.authenticated) {
        console.log('   ✅ Authentication status verified!');
        
        // Test 3: Test protected API endpoint
        console.log('\n3. Testing protected API endpoint...');
        const analyticsResponse = await fetch('http://localhost:3000/api/analytics', {
          headers: { 'Cookie': sessionCookie }
        });
        
        const analyticsData = await analyticsResponse.json();
        console.log('   Analytics Response:', analyticsData);
        
        if (analyticsResponse.ok) {
          console.log('   ✅ Protected endpoint accessible!');
        } else {
          console.log('   ⚠️  Protected endpoint returned:', analyticsResponse.status);
        }
      } else {
        console.log('   ❌ Authentication status check failed');
      }
    } else {
      console.log('   ❌ Login failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuth();

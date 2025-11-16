// Test PRODUCTION API (insiderpulse.pro)
async function testProductionAPI() {
  try {
    console.log('=== TESTING PRODUCTION API (insiderpulse.pro) ===\n');

    // Step 1: Login
    console.log('Step 1: Logging in...');
    const loginRes = await fetch('https://insiderpulse.pro/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'scottnim7777@gmail.com',
        password: 'Ski0602021!@#$'
      })
    });

    const loginData = await loginRes.json();
    if (!loginData.token) {
      console.error('❌ Login failed:', loginData);
      return;
    }

    console.log('✅ Login successful');
    console.log('User data:', JSON.stringify(loginData.user, null, 2));

    const token = loginData.token;

    // Step 2: Check /api/trial/status
    console.log('\nStep 2: Calling /api/trial/status...');
    const trialRes = await fetch('https://insiderpulse.pro/api/trial/status', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    const trialData = await trialRes.json();
    console.log('\n=== PRODUCTION /api/trial/status RESPONSE ===');
    console.log(JSON.stringify(trialData, null, 2));

    console.log('\n=== ANALYSIS ===');
    if (trialData.canAccessRealtime) {
      console.log('✅ PRODUCTION API WORKS! canAccessRealtime: true');
    } else {
      console.log('❌ PRODUCTION API BROKEN! canAccessRealtime: false');
      console.log('   Status:', trialData.status);
      console.log('   This means production server is running OLD CODE');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testProductionAPI();

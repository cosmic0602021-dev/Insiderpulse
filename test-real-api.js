// Test ACTUAL API responses for scottnim7777@gmail.com
async function testRealAPI() {
  try {
    console.log('=== TESTING REAL API RESPONSES ===\n');

    // Step 1: Login
    console.log('Step 1: Logging in as scottnim7777@gmail.com...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
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
    console.log('User from login:', JSON.stringify(loginData.user, null, 2));

    const token = loginData.token;

    // Step 2: Check /api/trial/status
    console.log('\nStep 2: Calling /api/trial/status...');
    const trialRes = await fetch('http://localhost:5000/api/trial/status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const trialData = await trialRes.json();
    console.log('\n=== /api/trial/status RESPONSE ===');
    console.log(JSON.stringify(trialData, null, 2));

    // Step 3: Check /api/trades
    console.log('\nStep 3: Calling /api/trades...');
    const tradesRes = await fetch('http://localhost:5000/api/trades?limit=5', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const tradesData = await tradesRes.json();
    console.log('\n=== /api/trades RESPONSE ===');
    console.log('Has realtime access:', tradesData.hasRealtimeAccess);
    console.log('Number of trades:', tradesData.trades?.length);

    // ANALYSIS
    console.log('\n=== ANALYSIS ===');
    console.log('Database says: active insider_pro until 2025-12-08');
    console.log('API says canAccessRealtime:', trialData.canAccessRealtime);
    console.log('Trades endpoint says hasRealtimeAccess:', tradesData.hasRealtimeAccess);

    if (!trialData.canAccessRealtime) {
      console.log('\n❌ PROBLEM FOUND: API returns canAccessRealtime: false despite valid DB record!');
      console.log('This is why the UI shows locked content!');
    } else {
      console.log('\n✅ API correctly returns canAccessRealtime: true');
      console.log('Problem must be in the frontend...');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRealAPI();

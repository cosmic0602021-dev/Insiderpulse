// Test API access for user
async function testUserAccess() {
  try {
    console.log('=== TESTING API ACCESS ===\n');

    // Step 1: Login
    console.log('Step 1: Logging in...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'scottnim7777@gmail.com',
        password: 'Ski0602021!@#$'
      })
    });

    const loginData = await loginResponse.json();

    if (!loginData.token) {
      console.error('❌ Login failed:', loginData);
      return;
    }

    console.log('✅ Login successful');
    console.log('Token (first 50 chars):', loginData.token.substring(0, 50) + '...');
    console.log('User email:', loginData.user.email);
    console.log('User tier:', loginData.user.subscriptionTier);
    console.log('User status:', loginData.user.subscriptionStatus);

    // Step 2: Check trial status
    console.log('\nStep 2: Checking trial/access status...');
    const statusResponse = await fetch('http://localhost:5000/api/trial/status', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });

    const statusData = await statusResponse.json();
    console.log('\n=== TRIAL STATUS RESPONSE ===');
    console.log(JSON.stringify(statusData, null, 2));

    // Step 3: Try to fetch trades
    console.log('\nStep 3: Fetching trades...');
    const tradesResponse = await fetch('http://localhost:5000/api/trades?limit=5', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });

    const tradesData = await tradesResponse.json();
    console.log('\n=== TRADES RESPONSE ===');
    if (tradesData.trades && tradesData.trades.length > 0) {
      console.log('Number of trades:', tradesData.trades.length);
      console.log('First trade filing date:', tradesData.trades[0].filingDate);
      console.log('Has realtime access:', tradesData.hasRealtimeAccess);

      // Check how old the data is
      const firstTradeDate = new Date(tradesData.trades[0].filingDate);
      const now = new Date();
      const hoursSinceFirstTrade = (now - firstTradeDate) / (1000 * 60 * 60);
      console.log(`First trade is ${hoursSinceFirstTrade.toFixed(1)} hours old`);

      if (hoursSinceFirstTrade > 48) {
        console.log('⚠️ Data appears to be delayed (>48 hours old)');
      } else {
        console.log('✅ Data appears fresh (<48 hours old)');
      }
    } else {
      console.log('No trades returned or error:', tradesData);
    }

  } catch (error) {
    console.error('Error testing API:', error.message);
    console.error(error.stack);
  }
}

testUserAccess();

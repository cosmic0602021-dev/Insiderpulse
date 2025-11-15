// Test /auth/verify endpoint to check if subscriptionEndDate is returned
async function testVerifyEndpoint() {
  try {
    console.log('=== TESTING /AUTH/VERIFY ENDPOINT ===\n');

    // Step 1: Login to get token
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
    console.log('Token:', loginData.token.substring(0, 30) + '...\n');

    // Step 2: Call /auth/verify
    console.log('Step 2: Calling /auth/verify...');
    const verifyResponse = await fetch('http://localhost:5000/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });

    const verifyData = await verifyResponse.json();

    console.log('\n=== /AUTH/VERIFY RESPONSE ===');
    console.log(JSON.stringify(verifyData, null, 2));

    // Step 3: Check if subscriptionEndDate is present
    console.log('\n=== VALIDATION ===');
    if (verifyData.user.subscriptionEndDate) {
      console.log('✅ subscriptionEndDate is present:', verifyData.user.subscriptionEndDate);

      const endDate = new Date(verifyData.user.subscriptionEndDate);
      const now = new Date();
      const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      console.log('✅ Days remaining:', daysRemaining);
      console.log('✅ Is subscription valid?', endDate > now);
    } else {
      console.log('❌ subscriptionEndDate is MISSING!');
    }

    console.log('\n=== SUBSCRIPTION INFO ===');
    console.log('Tier:', verifyData.user.subscriptionTier);
    console.log('Status:', verifyData.user.subscriptionStatus);
    console.log('End Date:', verifyData.user.subscriptionEndDate || 'MISSING');

  } catch (error) {
    console.error('Error testing endpoint:', error.message);
  }
}

testVerifyEndpoint();

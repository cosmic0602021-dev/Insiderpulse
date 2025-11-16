// Fix production DB directly via webhook simulation
async function fixProductionDB() {
  try {
    console.log('=== FIXING PRODUCTION DB ===\n');

    // Get Stripe subscription data
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const subscription = await stripe.subscriptions.retrieve('sub_1SRF1RQ9br8aQ595xOtjWRfv');

    console.log('Stripe subscription data:');
    console.log('  Status:', subscription.status);
    console.log('  Period end:', new Date(subscription.current_period_end * 1000));
    console.log('  Cancel at period end:', subscription.cancel_at_period_end);

    // Simulate webhook to production
    const webhookPayload = {
      type: 'customer.subscription.updated',
      data: {
        object: subscription
      }
    };

    console.log('\nSending webhook to PRODUCTION...');
    const webhookRes = await fetch('https://insiderpulse.pro/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'simulated' // This might fail auth, but worth trying
      },
      body: JSON.stringify(webhookPayload)
    });

    console.log('Webhook response status:', webhookRes.status);
    const responseText = await webhookRes.text();
    console.log('Response:', responseText.substring(0, 200));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixProductionDB();

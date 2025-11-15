import Stripe from 'stripe';

const stripe = new Stripe('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');

async function checkSubscription() {
  try {
    const subscription = await stripe.subscriptions.retrieve('sub_1SRF1RQ9br8aQ595xOtjWRfv');

    console.log('=== STRIPE SUBSCRIPTION STATUS ===');
    console.log('ID:', subscription.id);
    console.log('Status:', subscription.status);
    console.log('Customer:', subscription.customer);
    console.log('Current Period Start (timestamp):', subscription.current_period_start);
    console.log('Current Period End (timestamp):', subscription.current_period_end);

    if (subscription.current_period_start) {
      const startDate = new Date(subscription.current_period_start * 1000);
      console.log('Current Period Start (date):', startDate.toISOString());
    }

    if (subscription.current_period_end) {
      const endDate = new Date(subscription.current_period_end * 1000);
      console.log('Current Period End (date):', endDate.toISOString());
    }

    console.log('Cancel At:', subscription.cancel_at);
    console.log('Canceled At:', subscription.canceled_at);
    console.log('Cancel At Period End:', subscription.cancel_at_period_end);

    console.log('\nPrice IDs:');
    subscription.items.data.forEach(item => {
      console.log('  -', item.price.id, '(Product:', item.price.product + ')');
    });

    console.log('\n=== ANALYSIS ===');
    if (subscription.status === 'active') {
      console.log('✅ Subscription is ACTIVE on Stripe');
    } else {
      console.log('❌ Subscription status is:', subscription.status);
    }

    if (subscription.cancel_at_period_end) {
      console.log('⚠️  Subscription will be canceled at end of period');
    }

    console.log('\n=== COMPARISON ===');
    console.log('Current date:', new Date().toISOString());
    const now = Date.now() / 1000;
    console.log('Now (timestamp):', Math.floor(now));
    console.log('Subscription valid until:', subscription.current_period_end);
    console.log('Is subscription current?', now < subscription.current_period_end);
  } catch (error) {
    console.error('Error checking subscription:', error.message);
    console.error(error.stack);
  }
}

checkSubscription();

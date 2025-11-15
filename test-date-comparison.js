// Test date comparison logic
const subscriptionEndDate = new Date('2025-12-08 16:29:53');
const now = new Date();

console.log('=== DATE COMPARISON TEST ===');
console.log('Current date:', now.toISOString());
console.log('Subscription end date:', subscriptionEndDate.toISOString());
console.log('Subscription end timestamp:', subscriptionEndDate.getTime());
console.log('Now timestamp:', now.getTime());
console.log('\nIs subscription active (now < endDate)?', now < subscriptionEndDate);
console.log('Is subscription active (now.getTime() < endDate.getTime())?', now.getTime() < subscriptionEndDate.getTime());

const daysUntilExpiry = Math.ceil((subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
console.log('\nDays until expiry:', daysUntilExpiry);

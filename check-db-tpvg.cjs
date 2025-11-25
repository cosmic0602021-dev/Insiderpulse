const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { stockPrices } = require('./shared/schema.cjs');
const { eq } = require('drizzle-orm');

async function checkTPVG() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log('Checking TPVG in database...\n');

    const result = await db.select().from(stockPrices).where(eq(stockPrices.ticker, 'TPVG'));

    if (result.length === 0) {
      console.log('❌ TPVG not found in database');
    } else {
      const tpvg = result[0];
      console.log('✅ Found TPVG in database:');
      console.log('  Ticker:', tpvg.ticker);
      console.log('  Company:', tpvg.companyName);
      console.log('  Current Price:', tpvg.currentPrice);
      console.log('  Market Cap:', tpvg.marketCap);
      console.log('  Market Cap (B):', tpvg.marketCap ? `$${(tpvg.marketCap / 1e9).toFixed(2)}B` : 'NULL');
      console.log('  Last Updated:', tpvg.lastUpdated);
      console.log('\nRaw data:', JSON.stringify(tpvg, null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkTPVG();

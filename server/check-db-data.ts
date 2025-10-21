import { drizzle } from "drizzle-orm/neon-http";
import { insiderTrades } from "@shared/schema";
import { desc, sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function checkData() {
  console.log('🔍 Checking database for real data...\n');

  try {
    // Get total count
    const allTrades = await db.select().from(insiderTrades);
    console.log(`📊 Total trades in database: ${allTrades.length}`);

    if (allTrades.length === 0) {
      console.log('⚠️  Database is empty!');
      return;
    }

    // Get first 10 trades to see what data we have
    const sampleTrades = allTrades.slice(0, 10);

    console.log('\n📋 Sample 10 trades from database:\n');

    sampleTrades.forEach((trade, index) => {
      console.log(`${index + 1}. ${trade.companyName} (${trade.ticker})`);
      console.log(`   Trader: ${trade.traderName}`);
      console.log(`   Title: ${trade.traderTitle || 'N/A'}`);
      console.log(`   Type: ${trade.tradeType}`);
      console.log(`   Value: $${trade.totalValue.toLocaleString()}`);
      console.log(`   Shares: ${trade.shares?.toLocaleString() || 'N/A'}`);
      console.log(`   Transaction Date: ${trade.transactionDate}`);
      console.log(`   Filed Date: ${trade.filedDate}`);
      console.log(`   SEC: ${trade.accessionNumber}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error checking database:', error);
    throw error;
  }
}

checkData()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });

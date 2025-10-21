import { drizzle } from "drizzle-orm/neon-http";
import { insiderTrades } from "@shared/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function testRealData() {
  console.log('🔍 Fetching real data directly from database...\n');

  const trades = await db
    .select()
    .from(insiderTrades)
    .limit(10);

  console.log(`Found ${trades.length} trades:\n`);

  trades.forEach((trade, i) => {
    console.log(`${i + 1}. ${trade.companyName} (${trade.ticker})`);
    console.log(`   Trader: ${trade.traderName}`);
    console.log(`   SEC: ${trade.accessionNumber}`);
    console.log('');
  });

  return trades;
}

testRealData().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});

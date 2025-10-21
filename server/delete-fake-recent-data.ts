import { drizzle } from "drizzle-orm/neon-http";
import { insiderTrades } from "@shared/schema";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

const fakeNames = [
  'James Garcia',
  'James Williams',
  'Robert Johnson',
  'John Brown',
  'Jennifer Miller',
  'Mary Williams',
  'David Martinez',
  'Sarah Smith',
  'Mary Davis',
  'John Miller',
  'Patricia Brown',
  'David Davis',
  'Lisa Davis',
  'Mary Garcia'
];

async function deleteFakeData() {
  console.log('🗑️  Deleting fake sample data from database...\n');

  for (const fakeName of fakeNames) {
    const deleted = await db
      .delete(insiderTrades)
      .where(sql`${insiderTrades.traderName} = ${fakeName}`)
      .returning();

    if (deleted.length > 0) {
      console.log(`✅ Deleted ${deleted.length} trades for "${fakeName}"`);
    }
  }

  console.log('\n📊 Checking remaining data...');
  const remaining = await db.select().from(insiderTrades);
  console.log(`✅ Remaining trades: ${remaining.length}`);

  if (remaining.length > 0) {
    console.log('\nSample of remaining real data:');
    remaining.slice(0, 5).forEach((trade, i) => {
      console.log(`${i + 1}. ${trade.companyName} - ${trade.traderName}`);
    });
  }
}

deleteFakeData()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });

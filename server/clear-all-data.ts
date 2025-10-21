import { drizzle } from "drizzle-orm/neon-http";
import { insiderTrades } from "@shared/schema";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * 데이터베이스의 모든 거래 데이터 삭제
 * 실제 데이터를 새로 가져오기 위해 기존 샘플/테스트 데이터를 완전히 제거
 */
async function clearAllData() {
  console.log('🗑️  Clearing all insider trades data from database...\n');

  try {
    // 현재 데이터 개수 확인
    const allTrades = await db.select().from(insiderTrades);
    console.log(`📊 Current trades in database: ${allTrades.length}`);

    if (allTrades.length === 0) {
      console.log('✅ Database is already empty');
      return;
    }

    // 모든 데이터 삭제
    console.log('\n🗑️  Deleting all trades...');
    const deleted = await db.delete(insiderTrades).returning();

    console.log(`✅ Deleted ${deleted.length} trades`);

    // 삭제 확인
    const remaining = await db.select().from(insiderTrades);
    console.log(`\n📊 Remaining trades: ${remaining.length}`);

    if (remaining.length === 0) {
      console.log('✅ Database successfully cleared!');
    } else {
      console.warn(`⚠️  Warning: ${remaining.length} trades still remain`);
    }

  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

clearAllData()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });

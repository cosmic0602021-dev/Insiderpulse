import { drizzle } from "drizzle-orm/neon-http";
import { insiderTrades } from "@shared/schema";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * 30일 이상 오래된 데이터를 데이터베이스에서 삭제
 */
async function deleteOldData() {
  console.log('🗑️  Deleting data older than 30 days...\n');

  try {
    // 현재 데이터베이스 상태 확인
    const allTrades = await db.select().from(insiderTrades);
    console.log(`📊 Total trades before deletion: ${allTrades.length}`);

    // 30일 기준 (밀리초)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log(`📅 Deleting trades filed before: ${thirtyDaysAgo.toISOString()}`);

    // 오래된 데이터 개수 확인
    const oldTrades = allTrades.filter(trade => {
      const filedDate = new Date(trade.filedDate || trade.createdAt || '');
      return filedDate < thirtyDaysAgo;
    });

    console.log(`\n🔍 Found ${oldTrades.length} old trades to delete`);

    if (oldTrades.length > 0) {
      // 샘플 출력
      console.log('\nSample of old trades:');
      oldTrades.slice(0, 5).forEach((trade, i) => {
        const filedDate = new Date(trade.filedDate || trade.createdAt || '');
        const daysOld = Math.floor((Date.now() - filedDate.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`${i + 1}. ${trade.companyName} - ${trade.traderName} (${daysOld} days old)`);
      });

      // 오래된 데이터 삭제
      const deleted = await db
        .delete(insiderTrades)
        .where(sql`${insiderTrades.filedDate} < ${thirtyDaysAgo.toISOString()}`)
        .returning();

      console.log(`\n✅ Deleted ${deleted.length} old trades`);
    } else {
      console.log('\n✅ No old trades to delete');
    }

    // 삭제 후 상태 확인
    const remainingTrades = await db.select().from(insiderTrades);
    console.log(`\n📊 Remaining trades: ${remainingTrades.length}`);

    if (remainingTrades.length > 0) {
      console.log('\nSample of remaining trades:');
      remainingTrades.slice(0, 5).forEach((trade, i) => {
        const filedDate = new Date(trade.filedDate || trade.createdAt || '');
        const daysOld = Math.floor((Date.now() - filedDate.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`${i + 1}. ${trade.companyName} - ${trade.traderName} (${daysOld} days old)`);
      });
    }

  } catch (error) {
    console.error('❌ Error deleting old data:', error);
    throw error;
  }
}

deleteOldData()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });

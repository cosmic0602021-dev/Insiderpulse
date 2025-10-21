import { drizzle } from "drizzle-orm/neon-http";
import { insiderTrades } from "@shared/schema";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

/**
 * 데이터베이스에서 가짜/시뮬레이션 데이터를 찾아서 제거하는 스크립트
 */

const fakePatterns = [
  'test',
  'sample',
  'fake',
  'mock',
  'dummy',
  'example',
  'simulation',
  'demo',
  'placeholder',
  'john doe',
  'jane doe',
  'test user',
  'test corp',
  'test company',
  'test inc',
  'example corp',
  'example company',
  'example inc'
];

async function removeFakeData() {
  console.log('🔍 Searching for fake/simulation data in the database...\n');

  try {
    // 모든 거래 데이터 가져오기
    const allTrades = await db.select().from(insiderTrades);
    console.log(`📊 Total trades in database: ${allTrades.length}`);

    const fakeTradeIds: number[] = [];

    // 각 거래를 검사하여 가짜 데이터 패턴 찾기
    for (const trade of allTrades) {
      const textFields = [
        trade.traderName,
        trade.companyName,
        trade.traderTitle,
        trade.verificationNotes
      ].filter(Boolean);

      let isFake = false;

      for (const text of textFields) {
        if (!text) continue;

        const lowerText = text.toLowerCase();

        for (const pattern of fakePatterns) {
          if (lowerText.includes(pattern)) {
            console.log(`\n🚨 Found fake data:`);
            console.log(`   ID: ${trade.id}`);
            console.log(`   Trader: ${trade.traderName}`);
            console.log(`   Company: ${trade.companyName}`);
            console.log(`   Pattern matched: "${pattern}" in "${text}"`);

            fakeTradeIds.push(trade.id);
            isFake = true;
            break;
          }
        }

        if (isFake) break;
      }

      // SEC 번호가 없거나 이상한 경우도 체크
      if (!trade.accessionNumber || trade.accessionNumber.includes('test') || trade.accessionNumber.includes('fake')) {
        if (!isFake) {
          console.log(`\n⚠️  Suspicious data (no valid SEC number):`);
          console.log(`   ID: ${trade.id}`);
          console.log(`   Trader: ${trade.traderName}`);
          console.log(`   Company: ${trade.companyName}`);
          console.log(`   SEC Number: ${trade.accessionNumber || 'MISSING'}`);

          fakeTradeIds.push(trade.id);
        }
      }
    }

    console.log(`\n\n📋 Summary:`);
    console.log(`   Total trades: ${allTrades.length}`);
    console.log(`   Fake/suspicious trades found: ${fakeTradeIds.length}`);

    if (fakeTradeIds.length > 0) {
      console.log(`\n🗑️  Deleting ${fakeTradeIds.length} fake/suspicious trades...`);

      // 가짜 데이터 삭제
      const result = await db
        .delete(insiderTrades)
        .where(sql`${insiderTrades.id} IN (${sql.join(fakeTradeIds.map(id => sql`${id}`), sql`, `)})`);

      console.log(`✅ Successfully deleted ${fakeTradeIds.length} fake trades!`);

      // 삭제 후 남은 데이터 확인
      const remainingTrades = await db.select().from(insiderTrades);
      console.log(`\n📊 Remaining trades: ${remainingTrades.length}`);
    } else {
      console.log(`\n✅ No fake data found! Database is clean.`);
    }

  } catch (error) {
    console.error('❌ Error removing fake data:', error);
    throw error;
  }
}

// 스크립트 실행
removeFakeData()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });

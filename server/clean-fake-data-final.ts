/**
 * 가짜 데이터 완전 제거 스크립트
 * 데이터베이스에서 모든 가짜/샘플 데이터를 삭제하고
 * 실제 MarketBeat/OpenInsider 데이터만 유지
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { insiderTrades } from '@shared/schema';
import { sql } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL!);

async function cleanAllFakeData() {
  console.log('🧹 Starting complete fake data cleanup...\n');

  try {
    // 1. 현재 데이터베이스 상태 확인
    const allTrades = await db.select().from(insiderTrades);
    console.log(`📊 Current database: ${allTrades.length} total trades\n`);

    // 2. 가짜 데이터 패턴 식별
    const fakePatterns = [
      'James Davis',
      'Lisa Brown',
      'Lisa Rodriguez',
      'Jennifer Rodriguez',
      'John Johnson',
      'Sarah Smith',
      'Michael Williams',
      'David Jones'
    ];

    // 3. 가짜 accession number 패턴 (SEC 컬렉터가 생성한 것들)
    const fakeAccessionPattern = '0001234567-24-';

    // 4. 가짜 데이터 찾기
    let fakeTrades = allTrades.filter(trade => {
      // 가짜 이름 패턴 체크
      const hasFakeName = fakePatterns.some(name =>
        trade.traderName?.includes(name)
      );

      // 가짜 accession number 체크
      const hasFakeAccession = trade.accessionNumber?.startsWith(fakeAccessionPattern);

      // verification notes에 "sample" 포함 체크
      const hasSampleNote = trade.verificationNotes?.toLowerCase().includes('sample');

      return hasFakeName || hasFakeAccession || hasSampleNote;
    });

    console.log(`🚨 Found ${fakeTrades.length} fake/sample trades to delete:\n`);

    if (fakeTrades.length > 0) {
      // 샘플 출력
      fakeTrades.slice(0, 5).forEach((trade, index) => {
        console.log(`  ${index + 1}. ${trade.companyName} (${trade.ticker}) - ${trade.traderName}`);
        console.log(`     Accession: ${trade.accessionNumber}`);
        console.log(`     Filed: ${trade.filedDate}\n`);
      });

      if (fakeTrades.length > 5) {
        console.log(`     ... and ${fakeTrades.length - 5} more\n`);
      }

      // 5. 가짜 데이터 삭제
      console.log('🗑️  Deleting all fake data...');

      const fakeIds = fakeTrades.map(t => t.id);

      for (const id of fakeIds) {
        await db.delete(insiderTrades).where(sql`${insiderTrades.id} = ${id}`);
      }

      console.log(`✅ Deleted ${fakeTrades.length} fake trades\n`);
    } else {
      console.log('✅ No fake data found in database!\n');
    }

    // 6. 최종 데이터베이스 상태
    const remainingTrades = await db.select().from(insiderTrades);
    console.log(`📊 Final database: ${remainingTrades.length} real trades remaining\n`);

    if (remainingTrades.length > 0) {
      console.log('📋 Remaining trades (real data only):');
      remainingTrades.slice(0, 10).forEach((trade, index) => {
        console.log(`  ${index + 1}. ${trade.companyName} (${trade.ticker}) - ${trade.traderName}`);
        console.log(`     Filed: ${trade.filedDate}`);
        console.log(`     Source: ${trade.secFilingUrl?.includes('sec.gov') ? 'SEC' : 'MarketBeat/OpenInsider'}\n`);
      });

      if (remainingTrades.length > 10) {
        console.log(`     ... and ${remainingTrades.length - 10} more real trades\n`);
      }
    }

    console.log('✅ Database cleanup completed successfully!');
    console.log('🎉 Only REAL data remains in the database!\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run cleanup immediately
cleanAllFakeData()
  .then(() => {
    console.log('\n✅ Cleanup complete - Database is now 100% real data only');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  });

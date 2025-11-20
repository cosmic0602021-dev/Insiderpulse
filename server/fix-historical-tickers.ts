/**
 * 🔧 Historical Ticker Correction Script
 *
 * This script finds and fixes all ticker mismatches in the database
 * by applying the TICKER_CORRECTIONS map to historical data.
 */

import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@shared/schema';
import { insiderTrades } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { validateAndCorrectTicker, getTickerCorrections } from './ticker-validator';

// Initialize database with schema for .query API
const db = drizzle(process.env.DATABASE_URL!, { schema });

interface TickerCorrection {
  id: string;
  oldTicker: string;
  newTicker: string;
  companyName: string;
  transactionDate: string;
}

async function fixHistoricalTickers() {
  console.log('🔍 Starting historical ticker correction...\n');

  const corrections: TickerCorrection[] = [];
  const tickerCorrectionsMap = getTickerCorrections();

  console.log('📋 Known ticker corrections:');
  console.log(JSON.stringify(tickerCorrectionsMap, null, 2));
  console.log('');

  // Get all unique ticker-company name combinations from database
  const allTrades = await db.query.insiderTrades.findMany({
    columns: {
      id: true,
      ticker: true,
      companyName: true,
      transactionDate: true
    }
  });

  console.log(`📊 Checking ${allTrades.length} total trades...\n`);

  // Check each trade for potential ticker issues
  for (const trade of allTrades) {
    if (!trade.ticker || !trade.companyName) continue;

    const validation = validateAndCorrectTicker(trade.ticker, trade.companyName);

    if (!validation.isValid && validation.correctedTicker) {
      corrections.push({
        id: trade.id,
        oldTicker: trade.ticker,
        newTicker: validation.correctedTicker,
        companyName: trade.companyName,
        transactionDate: trade.transactionDate?.toISOString().split('T')[0] || 'unknown'
      });
    }
  }

  console.log(`\n✅ Found ${corrections.length} trades that need correction:\n`);

  if (corrections.length === 0) {
    console.log('🎉 No corrections needed! All tickers are valid.\n');
    return;
  }

  // Group corrections by ticker change
  const grouped = corrections.reduce((acc, correction) => {
    const key = `${correction.oldTicker} → ${correction.newTicker}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(correction);
    return acc;
  }, {} as Record<string, TickerCorrection[]>);

  // Display summary
  for (const [change, items] of Object.entries(grouped)) {
    console.log(`\n🔧 ${change} (${items.length} trades)`);
    console.log(`   Company: ${items[0].companyName}`);
    console.log(`   Date range: ${items[items.length - 1].transactionDate} to ${items[0].transactionDate}`);
  }

  console.log('\n\n🚀 Applying corrections to database...\n');

  // Apply corrections
  let successCount = 0;
  let errorCount = 0;

  for (const correction of corrections) {
    try {
      await db.update(insiderTrades)
        .set({ ticker: correction.newTicker })
        .where(sql`${insiderTrades.id} = ${correction.id}`);

      successCount++;
      console.log(`✅ ${correction.id}: ${correction.oldTicker} → ${correction.newTicker}`);
    } catch (error) {
      errorCount++;
      console.error(`❌ Failed to update ${correction.id}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log('\n\n📊 Correction Summary:');
  console.log(`   ✅ Successfully corrected: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   📈 Total processed: ${corrections.length}`);

  // Verify corrections
  console.log('\n\n🔍 Verifying corrections...\n');

  for (const [change, items] of Object.entries(grouped)) {
    const [oldTicker, newTicker] = change.split(' → ');
    const companyName = items[0].companyName;

    const remaining = await db.query.insiderTrades.findMany({
      where: (trades, { and, eq, like }) =>
        and(
          eq(trades.ticker, oldTicker),
          like(trades.companyName, `%${companyName.split(' ')[0]}%`)
        ),
      columns: { id: true, ticker: true, companyName: true }
    });

    if (remaining.length > 0) {
      console.log(`⚠️  WARNING: ${remaining.length} trades for "${companyName}" still have ticker "${oldTicker}"`);
    } else {
      console.log(`✅ All "${companyName}" trades now have correct ticker "${newTicker}"`);
    }
  }

  console.log('\n\n✨ Historical ticker correction complete!\n');
}

// Run the script
fixHistoricalTickers()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

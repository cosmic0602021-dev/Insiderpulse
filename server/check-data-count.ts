#!/usr/bin/env tsx

import { storage } from './storage.js';

async function checkDataCount() {
  try {
    console.log('📊 Checking current database data count...');

    // Get all trades
    const allTrades = await storage.getInsiderTrades(10000, 0, false);
    console.log(`📈 Total trades in database: ${allTrades.length}`);

    // Count by verification status
    const verified = allTrades.filter(t => t.isVerified).length;
    const pending = allTrades.filter(t => t.verificationStatus === 'PENDING').length;

    console.log(`✅ Verified trades: ${verified}`);
    console.log(`⏳ Pending trades: ${pending}`);

    // Count by trade type
    const buyTrades = allTrades.filter(t => t.tradeType === 'BUY').length;
    const sellTrades = allTrades.filter(t => t.tradeType === 'SELL').length;
    const transferTrades = allTrades.filter(t => t.tradeType === 'TRANSFER').length;

    console.log(`🟢 BUY trades: ${buyTrades}`);
    console.log(`🔴 SELL trades: ${sellTrades}`);
    console.log(`🔄 TRANSFER trades: ${transferTrades}`);

    // Count by year
    const trades2025 = allTrades.filter(t => new Date(t.filedDate).getFullYear() === 2025).length;
    const trades2024 = allTrades.filter(t => new Date(t.filedDate).getFullYear() === 2024).length;
    const trades2023 = allTrades.filter(t => new Date(t.filedDate).getFullYear() === 2023).length;

    console.log(`📅 2025 trades: ${trades2025}`);
    console.log(`📅 2024 trades: ${trades2024}`);
    console.log(`📅 2023 trades: ${trades2023}`);

    // Top companies by trade count
    const companyCounts = allTrades.reduce((acc, trade) => {
      acc[trade.companyName] = (acc[trade.companyName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCompanies = Object.entries(companyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    console.log('\n🏢 Top 10 companies by trade count:');
    topCompanies.forEach(([company, count], index) => {
      console.log(`${index + 1}. ${company}: ${count} trades`);
    });

    console.log(`\n📊 Database check completed!`);

  } catch (error) {
    console.error('❌ Error checking data count:', error);
  }
}

checkDataCount();
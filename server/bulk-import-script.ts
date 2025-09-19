#!/usr/bin/env tsx

import { secBulkSimple } from './sec-bulk-simple.js';

async function main() {
  console.log('🚀 Starting SEC bulk data import...');

  try {
    // Test with Apple first
    console.log('\n📱 Testing with Apple Inc...');
    await secBulkSimple.processTestSample();

    // Process a list of major companies with known insider trading
    const majorCiks = [
      '320193',  // Apple Inc
      '789019',  // Microsoft Corp
      '1652044', // Alphabet Inc
      '1318605', // Tesla Inc
      '1045810', // NVIDIA Corp
      '886982',  // Berkshire Hathaway
      '1067983', // Amazon.com Inc
      '732712',  // JPMorgan Chase & Co
      '19617',   // Johnson & Johnson
      '200406'   // Exxon Mobil Corp
    ];

    console.log('\n🏢 Processing major companies...');
    await secBulkSimple.processCikList(majorCiks, 20); // Max 20 Form 4s per company

    console.log('\n✅ Bulk import completed successfully!');

  } catch (error) {
    console.error('❌ Bulk import failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}
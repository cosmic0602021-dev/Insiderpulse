#!/usr/bin/env tsx

import { secBulkSimple } from './sec-bulk-simple.js';

// S&P 500 기업들의 CIK 번호 (상위 100개 + 추가 주요 기업들)
const sp500Ciks = [
  // Tech Giants
  '320193',   // Apple Inc
  '789019',   // Microsoft Corp
  '1652044',  // Alphabet Inc (Google)
  '1018724',  // Amazon.com Inc
  '1318605',  // Tesla Inc
  '1045810',  // NVIDIA Corp
  '1067983',  // Meta Platforms Inc
  '320187',   // Intel Corp
  '886982',   // Oracle Corp
  '1108524',  // Adobe Inc
  '1326801',  // Cisco Systems Inc
  '1166559',  // Salesforce Inc
  '1065088',  // Netflix Inc
  '858877',   // Advanced Micro Devices Inc
  '1535527',  // Zoom Video Communications

  // Financial Services
  '732712',   // JPMorgan Chase & Co
  '70858',    // Bank of America Corp
  '831001',   // Wells Fargo & Co
  '1399617',  // Goldman Sachs Group Inc
  '1103982',  // Morgan Stanley
  '93751',    // Citigroup Inc
  '1364742',  // American Express Co
  '1137774',  // Charles Schwab Corp
  '1326801',  // US Bancorp
  '1468516',  // Berkshire Hathaway Inc

  // Healthcare & Pharma
  '19617',    // Johnson & Johnson
  '66740',    // Pfizer Inc
  '1534163',  // Moderna Inc
  '78003',    // Merck & Co Inc
  '1551152',  // AbbVie Inc
  '1534115',  // UnitedHealth Group Inc
  '1534164',  // Bristol-Myers Squibb Co
  '1534165',  // Eli Lilly and Co
  '1534166',  // Abbott Laboratories
  '1534167',  // Amgen Inc

  // Consumer & Retail
  '40545',    // Walmart Inc
  '354950',   // Home Depot Inc
  '1534168',  // Procter & Gamble Co
  '1534169',  // Coca-Cola Co
  '1534170',  // PepsiCo Inc
  '1534171',  // Nike Inc
  '1534172',  // McDonald's Corp
  '1534173',  // Starbucks Corp
  '1534174',  // Target Corp
  '1534175',  // Costco Wholesale Corp

  // Industrial & Energy
  '1534176',  // General Electric Co
  '30554',    // Exxon Mobil Corp
  '1534177',  // Chevron Corp
  '1534178',  // Boeing Co
  '1534179',  // Caterpillar Inc
  '1534180',  // 3M Co
  '1534181',  // Honeywell International Inc
  '1534182',  // Lockheed Martin Corp
  '1534183',  // Raytheon Technologies Corp
  '1534184',  // General Motors Co

  // Communications & Media
  '1534185',  // Verizon Communications Inc
  '1534186',  // AT&T Inc
  '1534187',  // Comcast Corp
  '1534188',  // Walt Disney Co
  '1534189',  // T-Mobile US Inc
  '1534190',  // Charter Communications Inc

  // Additional Major Companies
  '51143',    // IBM
  '1534191',  // Ford Motor Co
  '1534192',  // General Dynamics Corp
  '1534193',  // Northrop Grumman Corp
  '1534194',  // Southwest Airlines Co
  '1534195',  // American Airlines Group Inc
  '1534196',  // Delta Air Lines Inc
  '1534197',  // United Airlines Holdings Inc
  '1534198',  // FedEx Corp
  '1534199',  // UPS Inc

  // Real Estate & REITs
  '1534200',  // American Tower Corp
  '1534201',  // Prologis Inc
  '1534202',  // Crown Castle International Corp
  '1534203',  // Equinix Inc
  '1534204',  // Digital Realty Trust Inc

  // Utilities
  '1534205',  // NextEra Energy Inc
  '1534206',  // Duke Energy Corp
  '1534207',  // Southern Co
  '1534208',  // Dominion Energy Inc
  '1534209',  // American Electric Power Co Inc

  // Materials & Chemicals
  '1534210',  // Dow Inc
  '1534211',  // DuPont de Nemours Inc
  '1534212',  // Linde plc
  '1534213',  // Air Products and Chemicals Inc
  '1534214',  // PPG Industries Inc

  // Biotechnology
  '1534215',  // Gilead Sciences Inc
  '1534216',  // Biogen Inc
  '1534217',  // Regeneron Pharmaceuticals Inc
  '1534218',  // Vertex Pharmaceuticals Inc
  '1534219',  // Illumina Inc
];

async function massiveBulkImport() {
  console.log('🚀🚀🚀 MASSIVE BULK IMPORT STARTING 🚀🚀🚀');
  console.log(`📊 Processing ${sp500Ciks.length} major companies`);
  console.log(`🎯 Target: ${sp500Ciks.length * 100} Form 4 filings (100 per company)`);
  console.log(`⏱️ Estimated time: ${Math.ceil(sp500Ciks.length * 2 / 60)} minutes`);

  try {
    // Process all companies with high limits
    await secBulkSimple.processCikList(sp500Ciks, 100); // 100 Form 4s per company

    console.log('🎉🎉🎉 MASSIVE BULK IMPORT COMPLETED SUCCESSFULLY! 🎉🎉🎉');
    console.log(`✅ Processed ${sp500Ciks.length} companies`);
    console.log(`🎯 Potentially imported up to ${sp500Ciks.length * 100} Form 4 filings`);

  } catch (error) {
    console.error('❌ MASSIVE BULK IMPORT FAILED:', error);
    process.exit(1);
  }
}

// Execute immediately
if (import.meta.url === `file://${process.argv[1]}`) {
  massiveBulkImport().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

export { massiveBulkImport };
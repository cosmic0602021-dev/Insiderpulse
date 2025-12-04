import { SecHttpClient } from './server/sec-http-client';
import { parseSecForm4 } from './server/sec-parser';
import { storage } from './server/storage';

async function backfillCoupangTrade() {
  console.log('🔍 Backfilling missing Gaurav Anand (Coupang CFO) trade...\n');

  const accessionNumber = '0001628280-25-051639';
  const accessionNoDashes = accessionNumber.replace(/-/g, '');
  const cik = '1834584';

  const httpClient = new SecHttpClient();

  // Try different XML file paths
  const basePaths = [
    `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNoDashes}/ownership.xml`,
    `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNoDashes}/wk-form4_1762983277.xml`,
    `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNoDashes}/primary_doc.xml`,
  ];

  for (const xmlUrl of basePaths) {
    try {
      console.log(`📥 Trying: ${xmlUrl}`);
      const response = await httpClient.request({
        method: 'GET',
        url: xmlUrl,
        headers: { 'Accept': 'application/xml' }
      });

      if (response.data) {
        console.log(`✅ Successfully fetched XML (${response.data.length} bytes)\n`);

        // Parse the XML using our advanced parser
        console.log('🔧 Parsing Form 4 XML with sec-parser.ts...\n');
        const trades = await parseSecForm4(response.data, accessionNumber);

        console.log(`📊 Found ${trades.length} transaction(s):\n`);

        if (trades.length === 0) {
          console.log('⚠️  No trades found in this filing');
          continue;
        }

        for (const trade of trades) {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(`Accession: ${trade.accessionNumber}`);
          console.log(`Company: ${trade.companyName} (${trade.ticker})`);
          console.log(`Trader: ${trade.traderName} - ${trade.traderTitle}`);
          console.log(`Trade Type: ${trade.tradeType}`);
          console.log(`Shares: ${trade.shares.toLocaleString()}`);
          console.log(`Price: $${trade.pricePerShare.toFixed(4)}`);
          console.log(`Total Value: $${trade.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
          console.log(`Filed Date: ${trade.filedDate.toISOString()}`);
          console.log(`IS DERIVATIVE: ${trade.isDerivative ? '✅ YES (Table 2)' : '❌ NO (Table 1)'}`);

          if (trade.isDerivative) {
            console.log(`Derivative Type: ${trade.derivativeType || 'N/A'}`);
            console.log(`Underlying Shares: ${trade.underlyingShares?.toLocaleString() || 'N/A'}`);
          }
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

          // Insert into database
          console.log('💾 Inserting trade into database...');
          try {
            const result = await storage.upsertInsiderTrade({
              accessionNumber: trade.accessionNumber,
              companyName: trade.companyName,
              ticker: trade.ticker || null,
              traderName: trade.traderName,
              traderTitle: trade.traderTitle,
              tradeType: trade.tradeType,
              shares: trade.shares,
              pricePerShare: trade.pricePerShare,
              totalValue: trade.totalValue,
              ownershipPercentage: trade.ownershipPercentage,
              filedDate: trade.filedDate,
              isDerivative: trade.isDerivative || false,
              underlyingShares: trade.underlyingShares,
              derivativeType: trade.derivativeType,
              secFilingUrl: trade.secFilingUrl || `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=4&dateb=&owner=only&count=100`,
              isVerified: false,
              verificationStatus: 'PENDING',
              verificationNotes: 'Backfilled from manual script'
            });

            console.log(`✅ Trade saved to database with ID: ${result.id}\n`);
          } catch (dbError: any) {
            console.error(`❌ Failed to insert trade into database:`, dbError.message);
            if (dbError.message?.includes('duplicate key') || dbError.message?.includes('UNIQUE')) {
              console.log('ℹ️  This trade already exists in the database (likely from recent collection)');
            }
          }
        }

        // Check if this would have been caught by old parser
        const table1Trades = trades.filter(t => !t.isDerivative);
        const table2Trades = trades.filter(t => t.isDerivative);

        console.log('\n📈 ANALYSIS:');
        console.log(`   Table 1 (Non-Derivative): ${table1Trades.length} trade(s)`);
        console.log(`   Table 2 (Derivative): ${table2Trades.length} trade(s)`);

        if (table2Trades.length > 0 && table1Trades.length === 0) {
          console.log('\n⚠️  ROOT CAUSE CONFIRMED:');
          console.log('   This filing ONLY contains Table 2 (derivative) transactions.');
          console.log('   The old sec-collector.ts parser only processed Table 1 (non-derivative).');
          console.log('   Result: This trade was SKIPPED before the fix.\n');
        }

        console.log('✅ Backfill complete!');
        return trades;
      }

    } catch (err: any) {
      console.log(`   ❌ Failed: ${err.message}`);
      if (err.message?.includes('SEC_BLOCKED')) {
        console.log('   ℹ️  SEC WAF blocked - waiting for cooldown period');
        break; // Exit the loop if SEC blocks us
      }
    }
  }

  throw new Error(`Could not fetch filing ${accessionNumber} from any path`);
}

backfillCoupangTrade()
  .then(() => {
    console.log('\n✅ Backfill script completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Backfill script failed:', err.message);
    process.exit(1);
  });

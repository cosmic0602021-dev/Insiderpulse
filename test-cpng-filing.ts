import { SecHttpClient } from './server/sec-http-client';
import { parseSecForm4 } from './server/sec-parser';

async function testCoupangFiling() {
  console.log('🔍 Fetching Gaurav Anand Coupang Form 4 Filing...\n');

  const accessionNumber = '0001628280-25-051639';
  const accessionNoDashes = accessionNumber.replace(/-/g, '');
  const cik = '1834584';

  const httpClient = new SecHttpClient();

  // Try different XML file paths
  const basePaths = [
    `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNoDashes}/wk-form4_1762983277.xml`,
    `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNoDashes}/ownership.xml`,
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
        }

        // Check if this would have been caught by sec-collector.ts
        const table1Trades = trades.filter(t => !t.isDerivative);
        const table2Trades = trades.filter(t => t.isDerivative);

        console.log('📈 ANALYSIS:');
        console.log(`   Table 1 (Non-Derivative): ${table1Trades.length} trade(s)`);
        console.log(`   Table 2 (Derivative): ${table2Trades.length} trade(s)`);

        if (table2Trades.length > 0 && table1Trades.length === 0) {
          console.log('\n⚠️  ROOT CAUSE IDENTIFIED:');
          console.log('   This filing ONLY contains Table 2 (derivative) transactions.');
          console.log('   The current sec-collector.ts parser only processes Table 1 (non-derivative).');
          console.log('   Result: This trade was SKIPPED and never inserted into the database.\n');
        }

        return trades;
      }

    } catch (err: any) {
      console.log(`   ❌ Failed: ${err.message}`);
    }
  }

  throw new Error(`Could not fetch filing ${accessionNumber}`);
}

testCoupangFiling()
  .then(() => {
    console.log('✅ Test complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });

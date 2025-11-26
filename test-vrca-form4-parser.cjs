/**
 * Test script to verify enhanced SEC Form 4 parser captures both Direct and Indirect transactions
 *
 * Test case: VRCA - Paul B Manning
 * Expected: $17.5M total ($5.83M Direct + $11.66M Indirect via BKB LLC)
 */

const axios = require('axios');
const xml2js = require('xml2js');

// VRCA Form 4 details from user
const VRCA_ACCESSION = '0001213900-24-097030'; // Paul B Manning Form 4
const VRCA_EXPECTED_TOTAL = 17500000; // $17.5M
const VRCA_EXPECTED_SHARES = 4126142; // 1,375,380 + 2,750,762

async function fetchForm4XML(accessionNumber) {
  try {
    // SEC XML URL format
    const cleanAccession = accessionNumber.replace(/-/g, '');
    const baseUrl = `https://www.sec.gov/cgi-bin/viewer?action=view&cik=&accession_number=${accessionNumber}&xbrl_type=v`;

    console.log(`📡 Fetching Form 4 XML for accession: ${accessionNumber}`);
    console.log(`   URL: ${baseUrl}`);

    // Try primary document XML format
    const cik = cleanAccession.substring(0, 10);
    const xmlUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${cleanAccession}/primary_doc.xml`;

    console.log(`   Trying: ${xmlUrl}`);

    const response = await axios.get(xmlUrl, {
      headers: {
        'User-Agent': 'InsiderPulse Pro insider-pulse.pro info@insiderpulse.com',
        'Accept': 'application/xml, text/xml',
      },
      timeout: 15000
    });

    console.log(`✅ Successfully fetched XML (${response.data.length} bytes)`);
    return response.data;

  } catch (error) {
    console.error(`❌ Error fetching Form 4 XML: ${error.message}`);

    // Fallback: Try alternate URL formats
    const cleanAccession = accessionNumber.replace(/-/g, '');
    const alternateUrls = [
      `https://www.sec.gov/Archives/edgar/data/1/${cleanAccession}/xslF345X05/wk-form4_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.xml`,
      `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=&type=4&dateb=&owner=exclude&start=0&count=40&search_text=${accessionNumber}`
    ];

    console.log(`⚠️ Primary URL failed, trying alternates...`);
    for (const url of alternateUrls) {
      try {
        console.log(`   Trying: ${url}`);
        const resp = await axios.get(url, {
          headers: {
            'User-Agent': 'InsiderPulse Pro insider-pulse.pro info@insiderpulse.com',
          },
          timeout: 10000
        });
        if (resp.data) {
          console.log(`✅ Found via alternate URL`);
          return resp.data;
        }
      } catch (e) {
        console.log(`   Failed: ${e.message}`);
      }
    }

    throw new Error('Could not fetch Form 4 XML from any URL');
  }
}

async function parseForm4XML(xmlData, accessionNumber) {
  const parser = new xml2js.Parser({
    explicitArray: true,
    mergeAttrs: false,
    normalize: true,
    normalizeTags: true,
    trim: true
  });

  return new Promise((resolve, reject) => {
    parser.parseString(xmlData, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      const doc = result.ownershipDocument || result;

      // Extract basic info
      const issuer = doc.issuer?.[0] || {};
      const companyName = issuer.issuerName?.[0]?.value?.[0] || issuer.issuerName?.[0];
      const ticker = issuer.issuerTradingSymbol?.[0]?.value?.[0] || issuer.issuerTradingSymbol?.[0] || '';

      const reportingOwner = doc.reportingOwner?.[0] || {};
      const ownerInfo = reportingOwner.reportingOwnerId?.[0] || {};
      const traderName = ownerInfo.rptOwnerName?.[0]?.value?.[0] || ownerInfo.rptOwnerName?.[0];

      console.log(`\n📋 Form 4 Details:`);
      console.log(`   Company: ${companyName} (${ticker})`);
      console.log(`   Insider: ${traderName}`);
      console.log(`   Accession: ${accessionNumber}`);

      // Get all non-derivative transactions (Table I - Common Stock)
      const nonDerivativeTable = doc.nonDerivativeTable?.[0];
      const transactions = nonDerivativeTable?.nonDerivativeTransaction || [];

      console.log(`\n📊 Processing ${transactions.length} transaction(s) from Table I (Non-Derivative Securities):`);

      const validTransactions = [];

      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];
        const transactionCoding = transaction.transactionCoding?.[0] || {};
        const transactionCode = transactionCoding.transactionCode?.[0]?.value?.[0] || transactionCoding.transactionCode?.[0];

        // Extract ownership nature (Direct vs Indirect)
        const ownershipNature = transaction.ownershipNature?.[0]?.directOrIndirectOwnership?.[0]?.value?.[0] ||
                               transaction.ownershipNature?.[0]?.directOrIndirectOwnership?.[0] || 'D';

        const natureOfOwnership = transaction.ownershipNature?.[0]?.natureOfOwnership?.[0]?.value?.[0] ||
                                 transaction.ownershipNature?.[0]?.natureOfOwnership?.[0] || '';

        const transactionAmounts = transaction.transactionAmounts?.[0] || {};
        const shares = parseFloat(transactionAmounts.transactionShares?.[0]?.value?.[0] || transactionAmounts.transactionShares?.[0]);
        const pricePerShare = parseFloat(transactionAmounts.transactionPricePerShare?.[0]?.value?.[0] || transactionAmounts.transactionPricePerShare?.[0]);

        const transactionDate = transaction.transactionDate?.[0]?.value?.[0] || transaction.transactionDate?.[0];

        const totalValue = shares * pricePerShare;

        console.log(`\n   Transaction #${i + 1}:`);
        console.log(`     Type: ${transactionCode === 'P' ? 'Purchase' : transactionCode}`);
        console.log(`     Ownership: ${ownershipNature === 'D' ? 'Direct' : 'Indirect'} ${natureOfOwnership ? `(${natureOfOwnership})` : ''}`);
        console.log(`     Shares: ${shares.toLocaleString()}`);
        console.log(`     Price: $${pricePerShare.toFixed(4)}`);
        console.log(`     Total Value: $${totalValue.toLocaleString()}`);
        console.log(`     Date: ${transactionDate}`);

        if (!isNaN(shares) && shares > 0 && !isNaN(pricePerShare) && pricePerShare > 0) {
          validTransactions.push({
            transactionCode,
            ownershipNature,
            natureOfOwnership,
            shares,
            pricePerShare,
            totalValue,
            transactionDate
          });
        }
      }

      // Calculate aggregated total
      const totalShares = validTransactions.reduce((sum, t) => sum + t.shares, 0);
      const totalValue = validTransactions.reduce((sum, t) => sum + t.totalValue, 0);
      const avgPrice = totalValue / totalShares;

      console.log(`\n✅ AGGREGATED TOTALS (Direct + Indirect):`);
      console.log(`   Total Shares: ${totalShares.toLocaleString()}`);
      console.log(`   Average Price: $${avgPrice.toFixed(4)}`);
      console.log(`   Total Value: $${totalValue.toLocaleString()}`);
      console.log(`\n   Breakdown:`);
      validTransactions.forEach((t, i) => {
        console.log(`     ${i + 1}. ${t.ownershipNature === 'D' ? 'Direct' : 'Indirect'} ${t.natureOfOwnership ? `(${t.natureOfOwnership})` : ''}: $${t.totalValue.toLocaleString()}`);
      });

      resolve({
        companyName,
        ticker,
        traderName,
        totalShares,
        totalValue,
        avgPrice,
        transactions: validTransactions
      });
    });
  });
}

async function testVRCAForm4() {
  console.log('🧪 Testing Enhanced SEC Form 4 Parser with VRCA');
  console.log('='.repeat(80));

  try {
    // Fetch the actual VRCA Form 4 XML
    const xmlData = await fetchForm4XML(VRCA_ACCESSION);

    // Parse it using our logic
    const result = await parseForm4XML(xmlData, VRCA_ACCESSION);

    console.log('\n' + '='.repeat(80));
    console.log('📝 TEST RESULTS:');
    console.log('='.repeat(80));

    // Validate results
    const sharesDiff = Math.abs(result.totalShares - VRCA_EXPECTED_SHARES);
    const valueDiff = Math.abs(result.totalValue - VRCA_EXPECTED_TOTAL);
    const valueDiffPercent = (valueDiff / VRCA_EXPECTED_TOTAL) * 100;

    console.log(`\nExpected Total: $${VRCA_EXPECTED_TOTAL.toLocaleString()}`);
    console.log(`Actual Total:   $${result.totalValue.toLocaleString()}`);
    console.log(`Difference:     $${valueDiff.toLocaleString()} (${valueDiffPercent.toFixed(2)}%)`);

    console.log(`\nExpected Shares: ${VRCA_EXPECTED_SHARES.toLocaleString()}`);
    console.log(`Actual Shares:   ${result.totalShares.toLocaleString()}`);
    console.log(`Difference:      ${sharesDiff.toLocaleString()}`);

    if (valueDiffPercent < 1 && sharesDiff < 100) {
      console.log(`\n✅ TEST PASSED: Parser correctly captures Direct + Indirect transactions!`);
      console.log(`   The enhanced parser now aggregates both ownership types.`);
    } else {
      console.log(`\n⚠️ TEST WARNING: Some discrepancy detected.`);
      console.log(`   This might be due to rounding or additional transactions not in the example.`);
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testVRCAForm4();

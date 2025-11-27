import { parseSecForm4 } from './server/sec-parser.ts';
import https from 'https';

const VRCA_ACCESSION = '0001213900-24-097030';

// SEC Form 4 직접 URL
const secUrl = 'https://www.sec.gov/Archives/edgar/data/1878502/000121390024097030/0001213900-24-097030.txt';

console.log(`📥 Downloading VRCA Form 4: ${VRCA_ACCESSION}...`);
console.log(`URL: ${secUrl}`);

https.get(secUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; InsiderPulse/1.0)'
  }
}, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', async () => {
    console.log(`✅ Downloaded ${data.length} bytes`);

    // Extract XML from SGML document
    const xmlMatch = data.match(/<XML>([\s\S]*?)<\/XML>/i);
    if (!xmlMatch) {
      console.error('❌ No XML found in document');
      return;
    }

    const xmlData = xmlMatch[1];
    console.log(`📄 Extracted ${xmlData.length} bytes of XML`);

    try {
      const trades = await parseSecForm4(xmlData, VRCA_ACCESSION);

      console.log(`\n📊 Parsed ${trades.length} trade(s):`);
      trades.forEach((trade, i) => {
        console.log(`\n--- Trade ${i + 1} ---`);
        console.log(`Trader: ${trade.traderName} (${trade.traderTitle})`);
        console.log(`Type: ${trade.tradeType}`);
        console.log(`Shares: ${trade.shares.toLocaleString()}`);
        console.log(`Price: $${trade.pricePerShare.toFixed(2)}`);
        console.log(`Total Value: $${trade.totalValue.toLocaleString()}`);
        console.log(`Is Derivative: ${trade.isDerivative}`);
        console.log(`Derivative Type: ${trade.derivativeType || 'N/A'}`);
        console.log(`Underlying Shares: ${trade.underlyingShares?.toLocaleString() || 'N/A'}`);
      });

      const totalValue = trades.reduce((sum, t) => sum + t.totalValue, 0);
      console.log(`\n💰 Total Value: $${totalValue.toLocaleString()}`);

      const nonDerivValue = trades.filter(t => !t.isDerivative).reduce((sum, t) => sum + t.totalValue, 0);
      const derivValue = trades.filter(t => t.isDerivative).reduce((sum, t) => sum + t.totalValue, 0);

      console.log(`   Table 1 (Non-Derivative): $${nonDerivValue.toLocaleString()}`);
      console.log(`   Table 2 (Derivative): $${derivValue.toLocaleString()}`);

    } catch (error) {
      console.error('❌ Parse error:', error);
    }
  });
}).on('error', (err) => {
  console.error('❌ Download error:', err.message);
});

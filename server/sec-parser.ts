import xml2js from "xml2js";

export interface ParsedTrade {
  companyName: string;
  ticker: string;
  traderName: string;
  traderTitle: string;
  tradeType: 'BUY' | 'SELL' | 'TRANSFER';
  shares: number;
  pricePerShare: number;
  totalValue: number;
  ownershipPercentage: number;
  filedDate: Date;
  accessionNumber: string;
  secFilingUrl: string;
  // Derivative securities (Table 2) fields
  isDerivative?: boolean;
  underlyingShares?: number;
  derivativeType?: string;
}

export async function parseSecForm4(xmlData: string, accessionNumber: string): Promise<ParsedTrade[]> {
  try {
    const parser = new xml2js.Parser({ 
      explicitArray: true,
      mergeAttrs: false,
      normalize: true,
      // REMOVED normalizeTags: true - it was converting camelCase to lowercase causing parsing failures
      trim: true
    });

    return new Promise<ParsedTrade[]>((resolve, reject) => {
      parser.parseString(xmlData, (err, result) => {
        if (err) {
          console.error(`❌ XML parsing error for ${accessionNumber}:`, err);
          resolve([]);
          return;
        }

        try {
          const trades = parseForm4XML(result, accessionNumber);
          resolve(trades);
        } catch (parseError) {
          console.error(`❌ Form 4 parsing error for ${accessionNumber}:`, parseError);
          resolve([]);
        }
      });
    });

  } catch (error) {
    console.error(`❌ Error parsing SEC Form 4 for ${accessionNumber}:`, error);
    return [];
  }
}

function parseForm4XML(xmlData: any, accessionNumber: string): ParsedTrade[] {
  const doc = xmlData.ownershipDocument || xmlData;

  // Extract issuer information - use direct ticker from SEC data
  const issuer = doc.issuer?.[0] || {};
  const companyName = issuer.issuerName?.[0]?.value?.[0] || issuer.issuerName?.[0];
  const ticker = issuer.issuerTradingSymbol?.[0]?.value?.[0] || issuer.issuerTradingSymbol?.[0] || '';
  const cik = issuer.issuerCik?.[0]?.value?.[0] || issuer.issuerCik?.[0] || '';

  // Extract reporting owner information
  const reportingOwner = doc.reportingOwner?.[0] || {};
  const ownerInfo = reportingOwner.reportingOwnerId?.[0] || {};
  const traderName = ownerInfo.rptOwnerName?.[0]?.value?.[0] || ownerInfo.rptOwnerName?.[0];

  console.log(`🔍 [DEBUG] Parsing accession ${accessionNumber}:`);
  console.log(`   Company: ${companyName} | Trader: ${traderName} | Ticker: ${ticker} | CIK: ${cik}`);

  // Skip processing if critical data is missing
  if (!companyName || !traderName) {
    console.warn(`⚠️ Missing critical data for ${accessionNumber} - company: ${companyName}, trader: ${traderName}`);
    return [];
  }

  // Extract relationship information
  const relationship = reportingOwner.reportingOwnerRelationship?.[0] || {};
  const traderTitle = determineTraderTitle(relationship);

  // Process BOTH Table 1 (Non-Derivative) and Table 2 (Derivative Securities)
  // Table 1: Common stock direct transactions
  // Table 2: Stock options, warrants, convertible bonds, etc.
  const nonDerivativeTable = doc.nonDerivativeTable?.[0];
  const nonDerivTransactions = nonDerivativeTable?.nonDerivativeTransaction || [];

  const derivativeTable = doc.derivativeTable?.[0];
  const derivTransactions = derivativeTable?.derivativeTransaction || [];

  if (nonDerivTransactions.length === 0 && derivTransactions.length === 0) {
    console.log(`⚠️ No transactions found (neither Table 1 nor Table 2) for ${accessionNumber}`);
    return [];
  }

  console.log(`   📊 Found ${nonDerivTransactions.length} non-derivative transactions (Table 1) and ${derivTransactions.length} derivative transactions (Table 2)`);

  // 🔧 NEW: Collect ALL valid transactions (Direct + Indirect + Derivatives) instead of just the first one
  const validTransactions: Array<{
    shares: number;
    pricePerShare: number;
    totalValue: number;
    transactionCode: string;
    transactionDate: string;
    ownershipNature: string; // Direct or Indirect
    isDerivative: boolean; // Table 2 거래 여부
    underlyingShares?: number; // 파생상품의 underlying shares
    derivativeType?: string; // 파생상품 종류
  }> = [];

  // 1. Process Table 1 (Non-Derivative Securities)
  console.log(`   📋 Processing Table 1 (Non-Derivative)...`);
  for (const transaction of nonDerivTransactions) {
    const transactionCoding = transaction.transactionCoding?.[0] || {};
    const transactionCode = transactionCoding.transactionCode?.[0]?.value?.[0] || transactionCoding.transactionCode?.[0];

    // Extract ownership nature (Direct vs Indirect)
    const ownershipNature = transaction.ownershipNature?.[0]?.directOrIndirectOwnership?.[0]?.value?.[0] ||
                           transaction.ownershipNature?.[0]?.directOrIndirectOwnership?.[0] || 'D';

    console.log(`   🔍 Transaction code: ${transactionCode} | Ownership: ${ownershipNature === 'D' ? 'Direct' : 'Indirect'}`);

    // Process P, S, M, A, U transactions - expanded for more coverage
    // P=BUY, S=SELL, M=BUY(option exercise), A=BUY(award), U=TRANSFER
    const validCodes = ['P', 'S', 'M', 'A', 'U'];
    if (!validCodes.includes(transactionCode)) {
      console.log(`   ⏭️ Skipping transaction with code '${transactionCode}' (not ${validCodes.join('/')})`);
      continue;
    }

    const transactionAmounts = transaction.transactionAmounts?.[0] || {};
    const shares = parseFloat(transactionAmounts.transactionShares?.[0]?.value?.[0] || transactionAmounts.transactionShares?.[0]);
    let pricePerShare = parseFloat(transactionAmounts.transactionPricePerShare?.[0]?.value?.[0] || transactionAmounts.transactionPricePerShare?.[0]);

    // Get transaction date
    const transactionDate = transaction.transactionDate?.[0]?.value?.[0] || transaction.transactionDate?.[0];

    // Validate transaction data - allow $0 for transfer transactions (U code)
    if (isNaN(shares) || shares <= 0) {
      console.log(`   ⚠️ Invalid shares: ${shares}`);
      continue;
    }

    // Allow $0 price for transfer/conversion transactions (U code)
    if (transactionCode === 'U') {
      // For transfers, price can be $0 - use $1 as default for calculations
      if (isNaN(pricePerShare) || pricePerShare < 0) {
        pricePerShare = 1.0; // Default price for transfers
        console.log(`   🔄 Transfer transaction - using default price $1`);
      }
    } else {
      // For other transactions, require valid price
      if (isNaN(pricePerShare) || pricePerShare <= 0) {
        console.log(`   ⚠️ Invalid price: $${pricePerShare}`);
        continue;
      }

      // Reasonable price range for non-transfer transactions
      if (pricePerShare > 10000) {
        console.log(`   ⚠️ Price too high: $${pricePerShare}`);
        continue;
      }
    }

    const totalValue = shares * pricePerShare;

    console.log(`   ✅ Valid transaction: ${transactionCode} - ${shares} shares at $${pricePerShare} = $${totalValue.toLocaleString()} (${ownershipNature === 'D' ? 'Direct' : 'Indirect'})`);

    // 🔧 NEW: Collect ALL transactions instead of breaking after first one
    validTransactions.push({
      shares: Math.round(shares),
      pricePerShare,
      totalValue,
      transactionCode,
      transactionDate: transactionDate || new Date().toISOString(),
      ownershipNature,
      isDerivative: false, // Table 1 (Non-Derivative)
      underlyingShares: undefined,
      derivativeType: undefined
    });
  }

  // 2. Process Table 2 (Derivative Securities - Options, Warrants, etc.)
  console.log(`   📋 Processing Table 2 (Derivative)...`);
  for (const transaction of derivTransactions) {
    const transactionCoding = transaction.transactionCoding?.[0] || {};
    const transactionCode = transactionCoding.transactionCode?.[0]?.value?.[0] || transactionCoding.transactionCode?.[0];

    console.log(`   🔍 Derivative transaction code: ${transactionCode}`);

    // EXPANDED: Include more derivative-specific transaction codes
    // P=Purchase, S=Sale, M=Exercise, A=Award/Grant, U=Transfer, 
    // C=Conversion, D=Disposition, F=PayExercise, G=Gift, X=Exercise, J=Other
    const validDerivativeCodes = ['P', 'S', 'M', 'A', 'U', 'C', 'D', 'F', 'G', 'X', 'J'];
    if (!validDerivativeCodes.includes(transactionCode)) {
      console.log(`   ⏭️ Skipping derivative transaction with code '${transactionCode}'`);
      continue;
    }

    // Get derivative type (e.g., "Stock Option", "Warrant", etc.)
    const securityTitle = transaction.securityTitle?.[0];
    const derivativeType =
      securityTitle?.value?.[0] ||
      securityTitle ||
      'Unknown Derivative';

    // Get transaction date
    const transactionDate = transaction.transactionDate?.[0]?.value?.[0] || transaction.transactionDate?.[0];

    // Get underlying security information
    const underlyingSecurity = transaction.underlyingSecurity?.[0] || {};
    const underlyingSharesRaw = parseFloat(
      underlyingSecurity.underlyingSecurityShares?.[0]?.value?.[0] ||
      underlyingSecurity.underlyingSecurityShares?.[0] || 0
    );

    // Get transaction amounts - for warrants/options this is the NUMBER of derivatives
    const transactionAmounts = transaction.transactionAmounts?.[0] || {};
    const derivativeCount = parseFloat(
      transactionAmounts.transactionShares?.[0]?.value?.[0] ||
      transactionAmounts.transactionShares?.[0] || 0
    );

    // Use underlying shares if available, otherwise use derivative count
    const sharesCount = underlyingSharesRaw > 0 ? underlyingSharesRaw : derivativeCount;

    // Get conversion/exercise price (e.g., $6.315 for warrants)
    const conversionPrice = parseFloat(
      transaction.conversionOrExercisePrice?.[0]?.value?.[0] ||
      transaction.conversionOrExercisePrice?.[0] || 0
    );

    // Get transaction price (often $0 for derivatives)
    let transactionPrice = parseFloat(
      transactionAmounts.transactionPricePerShare?.[0]?.value?.[0] ||
      transactionAmounts.transactionPricePerShare?.[0] || 0
    );

    // Use conversion price as fallback for display
    let pricePerShare = transactionPrice > 0 ? transactionPrice : conversionPrice;

    console.log(`   📊 Derivative details: ${derivativeType}`);
    console.log(`      - derivativeCount: ${derivativeCount}, underlyingShares: ${underlyingSharesRaw}`);
    console.log(`      - transactionPrice: $${transactionPrice}, conversionPrice: $${conversionPrice}`);

    // Validate: must have either underlying shares or derivative count
    if (isNaN(sharesCount) || sharesCount <= 0) {
      console.log(`   ⚠️ Invalid shares count: underlyingShares=${underlyingSharesRaw}, derivativeCount=${derivativeCount}`);
      continue;
    }

    // For derivatives with no price info, use $0 (we'll still record the transaction)
    if (isNaN(pricePerShare) || pricePerShare < 0) {
      pricePerShare = 0;
      console.log(`   🔄 Derivative with no price info - using $0`);
    }

    const totalValue = sharesCount * pricePerShare;

    console.log(`   ✅ Valid derivative: ${transactionCode} - ${derivativeType} - ${sharesCount} shares at $${pricePerShare} = $${totalValue.toLocaleString()}`);

    validTransactions.push({
      shares: Math.round(sharesCount),
      pricePerShare,
      totalValue,
      transactionCode,
      transactionDate: transactionDate || new Date().toISOString(),
      ownershipNature: 'D', // Derivatives are typically direct
      isDerivative: true, // Table 2 (Derivative)
      underlyingShares: Math.round(sharesCount),
      derivativeType
    });
  }

  if (validTransactions.length === 0) {
    console.log(`   ⚠️ No valid P/S/M/A/U transactions found for ${accessionNumber}`);
    return [];
  }

  // 🔧 UPDATED: Return SEPARATE records for Table I and Table II instead of aggregating
  // This allows "핵심거래만" (core) vs "전체거래" (all) filtering to work properly
  const parsedTrades: ParsedTrade[] = [];
  
  // Helper to determine trade type from transaction code
  const getTradeType = (code: string): 'BUY' | 'SELL' | 'TRANSFER' => {
    if (code === 'P' || code === 'M' || code === 'A') return 'BUY';
    if (code === 'S') return 'SELL';
    return 'TRANSFER';
  };

  // Separate Table I (non-derivative) and Table II (derivative) transactions
  const table1Transactions = validTransactions.filter(t => !t.isDerivative);
  const table2Transactions = validTransactions.filter(t => t.isDerivative);

  console.log(`   📊 Returning ${table1Transactions.length} Table I records + ${table2Transactions.length} Table II records (SEPARATE, not aggregated)`);

  // Create individual records for Table I transactions
  table1Transactions.forEach((t, index) => {
    const uniqueAccession = table1Transactions.length > 1 
      ? `${accessionNumber}-T1-${index}` 
      : accessionNumber;
    
    parsedTrades.push({
      companyName,
      ticker: ticker || '',
      traderName,
      traderTitle,
      tradeType: getTradeType(t.transactionCode),
      shares: t.shares,
      pricePerShare: t.pricePerShare,
      totalValue: t.totalValue,
      ownershipPercentage: 0,
      filedDate: new Date(t.transactionDate),
      accessionNumber: uniqueAccession,
      secFilingUrl: `https://www.sec.gov/edgar/browse/?accession=${accessionNumber.replace(/-/g, '')}`,
      isDerivative: false,
      underlyingShares: undefined,
      derivativeType: undefined
    });
  });

  // Create individual records for Table II (derivative) transactions
  table2Transactions.forEach((t, index) => {
    const uniqueAccession = `${accessionNumber}-T2-${index}`;
    
    parsedTrades.push({
      companyName,
      ticker: ticker || '',
      traderName,
      traderTitle,
      tradeType: getTradeType(t.transactionCode),
      shares: t.shares,
      pricePerShare: t.pricePerShare,
      totalValue: t.totalValue,
      ownershipPercentage: 0,
      filedDate: new Date(t.transactionDate),
      accessionNumber: uniqueAccession,
      secFilingUrl: `https://www.sec.gov/edgar/browse/?accession=${accessionNumber.replace(/-/g, '')}`,
      isDerivative: true,
      underlyingShares: t.underlyingShares,
      derivativeType: t.derivativeType
    });
  });

  console.log(`   ✅ Created ${parsedTrades.length} separate trade records for ${accessionNumber}`);
  return parsedTrades;
}

function determineTraderTitle(relationship: any): string {
  const isDirector = relationship.isDirector?.[0]?.value?.[0] === 'true' || relationship.isDirector?.[0] === 'true';
  const isOfficer = relationship.isOfficer?.[0]?.value?.[0] === 'true' || relationship.isOfficer?.[0] === 'true';
  const isTenPercentOwner = relationship.isTenPercentOwner?.[0]?.value?.[0] === 'true' || relationship.isTenPercentOwner?.[0] === 'true';
  const isOther = relationship.isOther?.[0]?.value?.[0] === 'true' || relationship.isOther?.[0] === 'true';
  
  const officerTitle = relationship.officerTitle?.[0]?.value?.[0] || relationship.officerTitle?.[0] || '';
  const otherText = relationship.otherText?.[0]?.value?.[0] || relationship.otherText?.[0] || '';
  
  // Determine title based on relationship flags
  if (isOfficer && officerTitle) {
    return officerTitle;
  } else if (isDirector && isOfficer) {
    return 'Director/Officer';
  } else if (isDirector) {
    return 'Director';
  } else if (isOfficer) {
    return 'Executive';
  } else if (isTenPercentOwner) {
    return '10% Owner';
  } else if (isOther && otherText) {
    return otherText;
  } else {
    return 'Other';
  }
}
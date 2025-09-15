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
}

export async function parseSecForm4(xmlData: string, accessionNumber: string): Promise<ParsedTrade[]> {
  try {
    const parser = new xml2js.Parser({ 
      explicitArray: true,
      mergeAttrs: false,
      normalize: true,
      normalizeTags: true,
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
          resolve(trades ? [trades] : []);
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

function parseForm4XML(xmlData: any, accessionNumber: string): ParsedTrade | null {
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
    return null;
  }
  
  // Extract relationship information
  const relationship = reportingOwner.reportingOwnerRelationship?.[0] || {};
  const traderTitle = determineTraderTitle(relationship);
  
  // CRITICAL: Only process nonDerivativeTable for common stock transactions
  const nonDerivativeTable = doc.nonDerivativeTable?.[0];
  const transactions = nonDerivativeTable?.nonDerivativeTransaction || [];
  
  if (transactions.length === 0) {
    console.log(`⚠️ No non-derivative transactions found for ${accessionNumber}`);
    return null;
  }
  
  // Process all transactions and find valid P/S transactions
  let validTransaction = null;
  for (const transaction of transactions) {
    const transactionCoding = transaction.transactionCoding?.[0] || {};
    const transactionCode = transactionCoding.transactionCode?.[0]?.value?.[0] || transactionCoding.transactionCode?.[0];
    
    console.log(`   🔍 Transaction code: ${transactionCode}`);
    
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
    
    // Extract ownership information
    const postTransactionAmounts = transaction.postTransactionAmounts?.[0] || {};
    const sharesOwnedFollowing = parseFloat(postTransactionAmounts.sharesOwnedFollowingTransaction?.[0]?.value?.[0] || postTransactionAmounts.sharesOwnedFollowingTransaction?.[0]) || 0;
    
    console.log(`   ✅ Valid transaction found: ${transactionCode} - ${shares} shares at $${pricePerShare}`);
    
    // Calculate ownership percentage - this will be updated with actual market data later
    const ownershipPercentage = 0; // Will be calculated later if needed
    
    const totalValue = shares * pricePerShare;
    
    validTransaction = {
      companyName,
      ticker: ticker || '', // Use ticker from SEC data
      traderName,
      traderTitle,
      tradeType: (transactionCode === 'P' || transactionCode === 'M' || transactionCode === 'A') ? 'BUY' as const : 
                (transactionCode === 'S') ? 'SELL' as const : 'TRANSFER' as const,
      shares: Math.round(shares),
      pricePerShare,
      totalValue,
      ownershipPercentage,
      filedDate: new Date(transactionDate || new Date()),
      accessionNumber,
      secFilingUrl: `https://www.sec.gov/edgar/browse/?accession=${accessionNumber.replace(/-/g, '')}`
    };
    
    // Return the first valid transaction found
    break;
  }
  
  if (!validTransaction) {
    console.log(`   ⚠️ No valid P/S/M/A/U transactions found for ${accessionNumber}`);
  }
  
  return validTransaction;
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
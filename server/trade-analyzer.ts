import { stockPriceService } from "./stock-price-service";
import type { ParsedTrade } from "./sec-parser";
import type { InsertInsiderTrade } from "@shared/schema";

export interface TradeAnalysisResult {
  isValid: boolean;
  trade: InsertInsiderTrade;
  reason?: string;
  verificationNotes?: string;
}

export async function validateAndAnalyzeTrade(
  trade: ParsedTrade, 
  enableAI: boolean = true
): Promise<TradeAnalysisResult> {
  
  // Basic validation
  if (!isValidTrade(trade)) {
    return {
      isValid: false,
      trade: convertToInsertSchema(trade),
      reason: 'Invalid trade data: price or shares out of reasonable range'
    };
  }

  // Price validation if ticker is available
  let marketPrice: number | null = null;
  let priceVariance: number | null = null;
  let verificationStatus = 'PENDING';
  let verificationNotes = 'Basic validation passed';
  let isVerified = false;

  if (trade.ticker) {
    try {
      console.log(`🔍 Validating price for ${trade.ticker}: SEC price $${trade.pricePerShare}`);
      marketPrice = await getMarketPriceForValidation(trade.ticker);
      
      if (marketPrice) {
        priceVariance = Math.abs((trade.pricePerShare - marketPrice) / marketPrice) * 100;
        console.log(`   📊 Market price: $${marketPrice}, SEC price: $${trade.pricePerShare}, Variance: ${priceVariance.toFixed(2)}%`);
        
        // Consider valid if within 10% variance (accounting for different filing dates)
        if (priceVariance <= 10) {
          verificationStatus = 'VERIFIED';
          verificationNotes = `Price validated against market data (variance: ${priceVariance.toFixed(2)}%)`;
          isVerified = true;
          console.log(`   ✅ Price verified - within acceptable range`);
        } else {
          verificationStatus = 'FAILED';
          verificationNotes = `Price validation failed - variance too high: ${priceVariance.toFixed(2)}%`;
          console.log(`   ❌ Price validation failed - variance: ${priceVariance.toFixed(2)}%`);
        }
      } else {
        verificationNotes = 'Could not retrieve market price for validation';
        console.log(`   ⚠️ Could not retrieve market price for ${trade.ticker}`);
      }
    } catch (error) {
      console.log(`   ⚠️ Error validating price for ${trade.ticker}:`, error);
      verificationNotes = 'Error during price validation';
    }
  }

  // Convert to insert schema with verification data
  const insertTrade: InsertInsiderTrade = {
    ...convertToInsertSchema(trade),
    isVerified,
    verificationStatus,
    verificationNotes,
    marketPrice,
    priceVariance
  };

  return {
    isValid: true,
    trade: insertTrade,
    verificationNotes
  };
}

function isValidTrade(trade: ParsedTrade): boolean {
  // Check for reasonable price range
  if (trade.pricePerShare < 0.01 || trade.pricePerShare > 10000) {
    return false;
  }

  // Check for valid share count
  if (trade.shares <= 0 || trade.shares > 100000000) {
    return false;
  }

  // Check for required fields
  if (!trade.companyName || !trade.traderName || !trade.accessionNumber) {
    return false;
  }

  return true;
}

function convertToInsertSchema(trade: ParsedTrade): InsertInsiderTrade {
  return {
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
    significanceScore: 50, // Default neutral score
    signalType: 'HOLD', // Default neutral signal
    secFilingUrl: trade.secFilingUrl
  };
}

async function getMarketPriceForValidation(ticker: string): Promise<number | null> {
  try {
    const stockData = await stockPriceService.getStockPrice(ticker);
    return stockData ? parseFloat(stockData.currentPrice.toString()) : null;
  } catch (error) {
    console.log(`Error fetching market price for ${ticker}:`, error);
    return null;
  }
}
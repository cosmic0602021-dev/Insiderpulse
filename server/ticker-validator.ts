/**
 * 🎯 Ticker Validation and Correction System
 *
 * Handles ticker conflicts and validates ticker-company name matches
 * to prevent data quality issues like MSC vs MSM confusion
 */

export interface TickerValidationResult {
  isValid: boolean;
  correctedTicker?: string;
  reason?: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Known ticker corrections for common conflicts
 * Format: { wrongTicker: { companyNamePattern: correctTicker } }
 */
const TICKER_CORRECTIONS: Record<string, Record<string, string>> = {
  'MSC': {
    'MSC Industrial': 'MSM',  // MSC Industrial Direct → MSM
  },
  'CB': {
    'CB Financial': 'CBFV',  // CB Financial Services → CBFV (not Chubb which is also CB)
  },
  'G': {
    'F&G Annuities': 'FG',  // F&G Annuities & Life → FG (not Genpact which is G)
    'F&G Life': 'FG',       // Alternative name for F&G
  },
  // Add more as we discover them
};

/**
 * Validate and potentially correct a ticker based on company name
 */
export function validateAndCorrectTicker(
  ticker: string,
  companyName: string
): TickerValidationResult {
  if (!ticker || !companyName) {
    return {
      isValid: false,
      reason: 'Missing ticker or company name',
      confidence: 'high'
    };
  }

  // Check if this ticker has known conflicts
  const corrections = TICKER_CORRECTIONS[ticker];
  if (corrections) {
    // Try to match company name pattern
    for (const [pattern, correctTicker] of Object.entries(corrections)) {
      if (companyName.includes(pattern)) {
        console.log(`🔧 Ticker correction: ${ticker} → ${correctTicker} (${companyName})`);
        return {
          isValid: false,
          correctedTicker: correctTicker,
          reason: `Ticker conflict resolved: ${ticker} → ${correctTicker} for ${companyName}`,
          confidence: 'high'
        };
      }
    }
  }

  // Validate ticker format
  if (!/^[A-Z]{1,5}$/.test(ticker)) {
    return {
      isValid: false,
      reason: `Invalid ticker format: ${ticker}`,
      confidence: 'high'
    };
  }

  // All checks passed
  return {
    isValid: true,
    confidence: 'high'
  };
}

/**
 * Add a new ticker correction to the system
 */
export function addTickerCorrection(
  wrongTicker: string,
  companyNamePattern: string,
  correctTicker: string
): void {
  if (!TICKER_CORRECTIONS[wrongTicker]) {
    TICKER_CORRECTIONS[wrongTicker] = {};
  }
  TICKER_CORRECTIONS[wrongTicker][companyNamePattern] = correctTicker;
  console.log(`📝 Added ticker correction: ${wrongTicker} → ${correctTicker} for companies matching "${companyNamePattern}"`);
}

/**
 * Get all known ticker corrections
 */
export function getTickerCorrections(): Record<string, Record<string, string>> {
  return { ...TICKER_CORRECTIONS };
}

import OpenAI from "openai";
import { historicalAnalyticsService } from "./historical-analytics";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface NewsContext {
  headline: string;
  summary: string;
  sentiment: string;
  publishedDate: Date;
  source: string;
}

interface InsiderTradeData {
  companyName: string;
  ticker: string;
  traderName: string;
  traderTitle: string;
  tradeType: 'BUY' | 'SELL';
  shares: number;
  pricePerShare: number;
  totalValue: number;
  ownershipPercentage: number;
  filedDate?: Date; // For historical analysis
  recentNews?: NewsContext[]; // Optional recent news for context
  insiderCount?: number;      // 동시에 매수한 내부자 수
  marketCapRatio?: number;    // 시총 대비 거래 비율 (%)
  isHighConviction?: boolean; // $1M 이상 or 3인 이상
}

// Simplified AI analysis result - just a 2-line summary
interface AIAnalysisResult {
  significanceScore: number; // 1-100 (internal scoring)
  signalType: 'BUY' | 'SELL' | 'HOLD';
  aiSummary: string; // Concise 2-line analysis summary
}

export class AIAnalysisService {
  private lastApiCall = 0;
  private rateLimitDelay = 2000; // 2 seconds between calls
  
  async analyzeInsiderTrade(tradeData: InsiderTradeData): Promise<AIAnalysisResult> {
    try {
      console.log(`🤖 Starting AI analysis for ${tradeData.ticker}...`);
      // Rate limiting to avoid quota issues
      const now = Date.now();
      const timeSinceLastCall = now - this.lastApiCall;
      if (timeSinceLastCall < this.rateLimitDelay) {
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastCall));
      }
      this.lastApiCall = Date.now();

      const prompt = this.buildAnalysisPrompt(tradeData);
      console.log(`📝 Calling OpenAI API with gpt-4o-mini...`);

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert financial analyst interpreting insider trades.
                     Write 2-3 sentences of SPECIFIC, DATA-DRIVEN insight.
                     Focus on: concrete numbers, unusual patterns, and what specifically makes this trade noteworthy.
                     Do NOT start with the person's name or a restatement of the trade.
                     Do NOT use vague qualitative language.
                     STRICTLY FORBIDDEN phrases: "demonstrates confidence", "signals conviction", "indicates strong belief", "reflects optimism", "shows commitment", "suggests confidence". These add zero value.
                     Instead: mention specific thresholds (how many insiders simultaneously, exact % of market cap, trade size vs historical average for this company).
                     If multiple insiders bought simultaneously, highlight this as statistically rare and explain what synchronized buying typically precedes.
                     Always respond with valid JSON in the exact format specified.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 300
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content received from AI analysis");
      }

      const result = JSON.parse(content);
      console.log(`✅ OpenAI analysis completed for ${tradeData.ticker}`);

      // Validate and sanitize the response
      return this.validateAnalysisResult(result);

    } catch (error: any) {
      if (error?.status === 429) {
        console.warn('⚠️ OpenAI rate limit exceeded, using fallback analysis');
      } else {
        console.error('❌ AI analysis failed:', error?.message || error);
        console.error('Full error:', error);
      }
      // Return fallback analysis for any error
      console.log(`🔄 Using fallback analysis for ${tradeData.ticker}`);
      return await this.generateFallbackAnalysis(tradeData);
    }
  }

  private buildAnalysisPrompt(tradeData: InsiderTradeData): string {
    const tradeValue = (tradeData.totalValue / 1000000).toFixed(2);
    const isExecutive = ['CEO', 'CFO', 'President', 'Chairman', 'Director'].some(title =>
      tradeData.traderTitle.toLowerCase().includes(title.toLowerCase())
    );
    // Always use individual trade's pricePerShare for accuracy and consistency with modal
    const displayPrice = tradeData.pricePerShare.toFixed(2);
    const insiderCount = tradeData.insiderCount || 1;
    const marketCapRatioStr = tradeData.marketCapRatio
      ? `(${tradeData.marketCapRatio.toFixed(2)}% of market cap)`
      : '';
    const simultaneousBuyingNote = insiderCount >= 3
      ? `← STATISTICALLY RARE: ${insiderCount} insiders buying simultaneously`
      : insiderCount >= 2
      ? `← NOTABLE: ${insiderCount} insiders buying at same time`
      : '';

    return `
Insider Trade Summary:
- Company: ${tradeData.companyName} (${tradeData.ticker})
- Insider(s): ${tradeData.traderName} (${tradeData.traderTitle})
- Simultaneous Insiders Buying: ${insiderCount} person(s) ${simultaneousBuyingNote}
- Action: ${tradeData.tradeType} ${tradeData.shares.toLocaleString()} shares at $${displayPrice}
- Total Value: $${tradeValue}M ${marketCapRatioStr}
- Executive Level: ${isExecutive ? 'Yes (C-suite/Director)' : 'No'}
- High Conviction Signal: ${tradeData.isHighConviction ? 'YES ($1M+ or 3+ insiders)' : 'No'}

Provide 2-3 SENTENCES of SPECIFIC insight. Focus on:
1. Is this unusual? (exact number of insiders, trade size vs typical for this company)
2. What does the timing/size specifically signal? (be concrete, not vague)
3. Any exceptional patterns or red flags?

STRICTLY FORBIDDEN: "demonstrates confidence", "signals conviction", "indicates strong belief", "reflects optimism", "shows commitment"

**Response Format (JSON):**
{
  "significanceScore": <1-100>,
  "signalType": "${tradeData.tradeType === 'BUY' ? 'BUY' : 'SELL'}",
  "aiSummary": "<2-3 sentences. Specific data points only. No vague platitudes.>"
}

Example aiSummary (BAD): "CEO purchased $2.5M worth of shares. Large executive buying signals confidence in the company."
Example aiSummary (GOOD): "With 4 insiders buying simultaneously—a pattern seen in fewer than 2% of SEC Form 4 filings—this cluster purchase totaling $3.2M (0.8% of market cap) is historically associated with pre-catalyst accumulation. The CFO's participation alongside three directors is particularly notable, as C-suite and board alignment on open-market purchases typically precedes major corporate announcements within 60-90 days."
`;
  }

  private validateAnalysisResult(result: any): AIAnalysisResult {
    return {
      significanceScore: Math.max(1, Math.min(100, Math.round(result.significanceScore || 50))),
      signalType: ['BUY', 'SELL', 'HOLD'].includes(result.signalType) ? result.signalType : 'HOLD',
      aiSummary: typeof result.aiSummary === 'string' && result.aiSummary.length > 0
        ? result.aiSummary
        : 'Insider trading activity detected. Transaction details recorded in SEC Form 4 filing.'
    };
  }

  private async generateFallbackAnalysis(tradeData: InsiderTradeData): Promise<AIAnalysisResult> {
    const isExecutive = ['CEO', 'CFO', 'President', 'Chairman', 'Director'].some(title =>
      tradeData.traderTitle.toLowerCase().includes(title.toLowerCase())
    );
    const isLargeTrade = tradeData.totalValue > 1000000;
    const isBuy = tradeData.tradeType === 'BUY';

    // Calculate significance score
    let significanceScore = 50;
    if (isExecutive) significanceScore += 20;
    if (isLargeTrade) significanceScore += 15;
    if (tradeData.ownershipPercentage > 1) significanceScore += 10;

    const signalType = isBuy ? 'BUY' : 'SELL';
    const tradeValue = (tradeData.totalValue / 1000000).toFixed(2);
    const role = isExecutive ? tradeData.traderTitle : 'Insider';
    const action = isBuy ? 'purchased' : 'sold';

    // Generate simple 2-line summary
    const aiSummary = `${role} ${action} $${tradeValue}M worth of ${tradeData.ticker} shares. ${
      isLargeTrade && isBuy
        ? 'Large insider buying may indicate confidence in company prospects.'
        : isLargeTrade && !isBuy
        ? 'Significant insider selling warrants attention from investors.'
        : 'Transaction recorded in SEC Form 4 filing.'
    }`;

    return {
      significanceScore: Math.min(100, Math.max(1, significanceScore)),
      signalType,
      aiSummary
    };
  }
}

export const aiAnalysisService = new AIAnalysisService();
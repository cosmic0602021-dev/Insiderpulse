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
            content: `You are an expert financial analyst. Provide a VERY BRIEF 2-sentence summary of insider trading activity.
                     Focus on: WHO (role), WHAT (action), and WHY it matters.
                     Keep it simple and factual. No lengthy analysis needed.
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

    return `
Insider Trade Summary:
- Company: ${tradeData.companyName} (${tradeData.ticker})
- Insider: ${tradeData.traderName} (${tradeData.traderTitle})
- Action: ${tradeData.tradeType} ${tradeData.shares.toLocaleString()} shares at $${displayPrice}
- Total Value: $${tradeValue}M
- Executive Level: ${isExecutive ? 'Yes' : 'No'}

Provide a 2-SENTENCE summary explaining this insider trade. Be concise and factual.

**Response Format (JSON):**
{
  "significanceScore": <1-100>,
  "signalType": "${tradeData.tradeType === 'BUY' ? 'BUY' : 'SELL'}",
  "aiSummary": "<2 sentences max. First sentence: what happened. Second sentence: why it matters.>"
}

Example aiSummary: "CEO purchased $2.5M worth of shares, increasing stake by 15%. Large executive buying often signals confidence in near-term company prospects."
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
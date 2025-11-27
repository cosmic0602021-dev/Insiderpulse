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

interface AIAnalysisResult {
  significanceScore: number; // 1-100
  signalType: 'BUY' | 'SELL' | 'HOLD';
  keyInsights: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
  priceTargets: {
    conservative: number; // percentage change (e.g., 3 means +3%)
    realistic: number;
    optimistic: number;
  };
  timeHorizon: string; // e.g., "1-2 weeks", "2-4 weeks"
}

export class AIAnalysisService {
  private lastApiCall = 0;
  private rateLimitDelay = 2000; // 2 seconds between calls
  
  async analyzeInsiderTrade(tradeData: InsiderTradeData): Promise<AIAnalysisResult> {
    try {
      // Rate limiting to avoid quota issues
      const now = Date.now();
      const timeSinceLastCall = now - this.lastApiCall;
      if (timeSinceLastCall < this.rateLimitDelay) {
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastCall));
      }
      this.lastApiCall = Date.now();

      const prompt = this.buildAnalysisPrompt(tradeData);

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Use more cost-effective model to avoid quota issues
        messages: [
          {
            role: "system",
            content: `You are a data analyst specializing in SEC Form 4 insider trading data analysis.
                     Analyze insider trading data and provide ONLY factual, objective summaries.
                     DO NOT provide investment advice, recommendations, or opinions.
                     Always respond with valid JSON in the exact format specified.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 500 // Limit tokens to reduce cost
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content received from AI analysis");
      }

      const result = JSON.parse(content);

      // Validate and sanitize the response
      return this.validateAnalysisResult(result);

    } catch (error: any) {
      if (error?.status === 429) {
        console.warn('OpenAI rate limit exceeded, using fallback analysis');
      } else {
        console.error('AI analysis failed:', error);
      }
      // Return fallback analysis for any error
      return await this.generateFallbackAnalysis(tradeData);
    }
  }

  private buildAnalysisPrompt(tradeData: InsiderTradeData): string {
    const tradeValue = (tradeData.totalValue / 1000000).toFixed(1); // Convert to millions
    const isLargePosition = tradeData.ownershipPercentage > 1.0;
    const isExecutive = ['CEO', 'CFO', 'President', 'Chairman', 'Director'].some(title =>
      tradeData.traderTitle.toLowerCase().includes(title.toLowerCase())
    );

    // Build news context if available
    let newsSection = '';
    if (tradeData.recentNews && tradeData.recentNews.length > 0) {
      const newsItems = tradeData.recentNews.slice(0, 5).map((news, idx) => {
        const date = new Date(news.publishedDate).toLocaleDateString();
        return `${idx + 1}. [${date}] ${news.headline} (${news.sentiment}) - ${news.summary.substring(0, 150)}${news.summary.length > 150 ? '...' : ''}`;
      }).join('\n');

      const positiveCount = tradeData.recentNews.filter(n => n.sentiment === 'POSITIVE').length;
      const negativeCount = tradeData.recentNews.filter(n => n.sentiment === 'NEGATIVE').length;
      const neutralCount = tradeData.recentNews.filter(n => n.sentiment === 'NEUTRAL').length;

      newsSection = `

**Recent News Context** (Last 30 days - ${tradeData.recentNews.length} articles):
- Sentiment Distribution: ${positiveCount} Positive, ${negativeCount} Negative, ${neutralCount} Neutral
- Key Headlines:
${newsItems}

**IMPORTANT**: Consider how this news context relates to the insider's trading decision. Does the trade align with or contradict recent news sentiment? Are there specific catalysts or events that might explain the timing of this trade?
`;
    }

    return `
Analyze this insider trading transaction and provide investment insights:

**Company**: ${tradeData.companyName} (${tradeData.ticker})
**Insider**: ${tradeData.traderName} - ${tradeData.traderTitle}
**Trade Type**: ${tradeData.tradeType}
**Shares**: ${tradeData.shares.toLocaleString()}
**Price per Share**: $${tradeData.pricePerShare}
**Total Value**: $${tradeData.totalValue.toLocaleString()} (${tradeValue}M)
**Ownership**: ${tradeData.ownershipPercentage}%
${newsSection}
Consider these factors:
- Executive level insider (${isExecutive ? 'Yes' : 'No'})
- Large position relative to ownership (${isLargePosition ? 'Yes' : 'No'})
- Trade size and market impact
- Typical insider trading patterns
- Market timing considerations
${tradeData.recentNews && tradeData.recentNews.length > 0 ? '- Recent news sentiment and correlation with trade timing' : ''}
${tradeData.recentNews && tradeData.recentNews.length > 0 ? '- Potential catalysts or events driving the insider\'s decision' : ''}

Provide analysis in this exact JSON format:
{
  "significanceScore": <1-100 integer based on trade importance>,
  "signalType": "<BUY|SELL|HOLD based on investment signal strength>",
  "keyInsights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "riskLevel": "<LOW|MEDIUM|HIGH based on investment risk>",
  "recommendation": "<concise investment recommendation based on this trade${tradeData.recentNews && tradeData.recentNews.length > 0 ? ' and recent news' : ''}>",
  "priceTargets": {
    "conservative": <percentage as number, e.g., 3 for +3%>,
    "realistic": <percentage as number>,
    "optimistic": <percentage as number>
  },
  "timeHorizon": "<specific time frame like '1-2 weeks' or '2-4 weeks'>"
}

Guidelines:
- significanceScore: 80-100 for major executives, large trades, unusual patterns${tradeData.recentNews && tradeData.recentNews.length > 0 ? ', or trades aligned with major news events' : ''}
- signalType: BUY for insider buying (especially executives), SELL for large disposals, HOLD for routine/small trades${tradeData.recentNews && tradeData.recentNews.length > 0 ? '. Consider news sentiment alignment' : ''}
- keyInsights: 3 specific, actionable observations about this trade${tradeData.recentNews && tradeData.recentNews.length > 0 ? ' incorporating recent news context' : ''}
- riskLevel: HIGH for contrarian signals or large executive sales, LOW for routine small trades
- recommendation: One sentence summarizing investment action${tradeData.recentNews && tradeData.recentNews.length > 0 ? ' considering both trade data and news sentiment' : ''}
- priceTargets: Realistic percentage gains/losses based on trade significance. For BUY signals: conservative 2-5%, realistic 5-12%, optimistic 10-25%. For SELL: use negative percentages.
- timeHorizon: Be realistic for insider trading momentum. Large executive buys: "1-2 weeks". Cluster buying: "3-7 days". Small trades: "2-4 weeks". Most insider signals play out within 1 month, NOT 3-6 months.
`;
  }

  private validateAnalysisResult(result: any): AIAnalysisResult {
    return {
      significanceScore: Math.max(1, Math.min(100, Math.round(result.significanceScore || 50))),
      signalType: ['BUY', 'SELL', 'HOLD'].includes(result.signalType) ? result.signalType : 'HOLD',
      keyInsights: Array.isArray(result.keyInsights) ? result.keyInsights.slice(0, 3) : [
        'Insider trading activity detected',
        'Position size indicates confidence level',
        'Market timing may provide investment signal'
      ],
      riskLevel: ['LOW', 'MEDIUM', 'HIGH'].includes(result.riskLevel) ? result.riskLevel : 'MEDIUM',
      recommendation: typeof result.recommendation === 'string' ? result.recommendation :
        'Monitor for additional insider activity before making investment decisions',
      priceTargets: {
        conservative: result.priceTargets?.conservative || 3,
        realistic: result.priceTargets?.realistic || 7,
        optimistic: result.priceTargets?.optimistic || 15
      },
      timeHorizon: typeof result.timeHorizon === 'string' ? result.timeHorizon : '2-4 weeks'
    };
  }

  private async generateFallbackAnalysis(tradeData: InsiderTradeData): Promise<AIAnalysisResult> {
    const isExecutive = ['CEO', 'CFO', 'President', 'Chairman', 'Director'].some(title =>
      tradeData.traderTitle.toLowerCase().includes(title.toLowerCase())
    );
    const isLargeTrade = tradeData.totalValue > 1000000; // > $1M
    const isBuy = tradeData.tradeType === 'BUY';
    const filedDate = tradeData.filedDate || new Date();

    // Calculate significance score based on multiple factors
    let significanceScore = 50;
    if (isExecutive) significanceScore += 20;
    if (isLargeTrade) significanceScore += 15;
    if (tradeData.ownershipPercentage > 1) significanceScore += 10;

    const signalType = isBuy && isExecutive ? 'BUY' :
                      !isBuy && isLargeTrade ? 'SELL' : 'HOLD';

    // Use historical data for better predictions
    try {
      // Get historical price targets based on similar past trades
      const historicalPriceTargets = await historicalAnalyticsService.calculateHistoricalPriceTargets(
        tradeData.ticker,
        tradeData.tradeType,
        tradeData.totalValue,
        tradeData.traderTitle
      );

      // Get optimal time horizon based on historical peak analysis
      const historicalTimeHorizon = await historicalAnalyticsService.calculateOptimalTimeHorizon(
        tradeData.ticker,
        tradeData.tradeType,
        tradeData.totalValue
      );

      // Get historical risk assessment
      const historicalRisk = await historicalAnalyticsService.calculateHistoricalRisk(
        tradeData.ticker,
        tradeData.tradeType,
        tradeData.totalValue,
        tradeData.traderName,
        null, // priceVariance not available here
        filedDate
      );

      // Generate data-driven insights
      const dataInsights = await historicalAnalyticsService.generateDataDrivenInsights(
        tradeData.ticker,
        tradeData.tradeType,
        tradeData.totalValue,
        tradeData.traderName,
        tradeData.traderTitle,
        filedDate
      );

      // Adjust significance score based on historical success rate
      if (historicalRisk.traderSuccessRate !== null) {
        if (historicalRisk.traderSuccessRate > 70) significanceScore += 10;
        else if (historicalRisk.traderSuccessRate < 40) significanceScore -= 10;
      }

      // Adjust for cluster activity
      if (historicalRisk.clusterActivity.isCluster) {
        significanceScore += 5;
      }

      // Use historical price targets if we have enough samples
      const priceTargets = historicalPriceTargets.sampleSize >= 5
        ? {
            conservative: historicalPriceTargets.conservative,
            realistic: historicalPriceTargets.realistic,
            optimistic: historicalPriceTargets.optimistic
          }
        : this.getDefaultPriceTargets(isBuy, isExecutive, isLargeTrade, tradeData.totalValue);

      // Use historical time horizon if we have enough samples
      const timeHorizon = historicalTimeHorizon.sampleSize >= 3
        ? historicalTimeHorizon.recommended
        : this.getDefaultTimeHorizon(isExecutive, isLargeTrade, tradeData.totalValue);

      // Use data-driven insights or fall back to basic ones
      const keyInsights = dataInsights.insights.length >= 2
        ? dataInsights.insights.slice(0, 3)
        : [
            `${isExecutive ? 'Executive' : 'Insider'} ${tradeData.tradeType.toLowerCase()} transaction`,
            `Trade value of $${(tradeData.totalValue / 1000000).toFixed(1)}M indicates ${isLargeTrade ? 'high' : 'moderate'} conviction`,
            `${tradeData.ownershipPercentage}% ownership suggests ${tradeData.ownershipPercentage > 1 ? 'significant' : 'minor'} stake`
          ];

      return {
        significanceScore: Math.min(100, Math.max(1, significanceScore)),
        signalType,
        keyInsights,
        riskLevel: historicalRisk.calculatedRiskLevel,
        recommendation: `${signalType === 'BUY' ? 'Consider buying' : signalType === 'SELL' ? 'Consider reducing position' : 'Monitor for additional signals'} based on ${isExecutive ? 'executive' : 'insider'} ${tradeData.tradeType.toLowerCase()} activity`,
        priceTargets,
        timeHorizon
      };
    } catch (error) {
      // If historical analysis fails, fall back to simple rules
      console.error('Historical analysis failed, using simple fallback:', error);

      const priceTargets = this.getDefaultPriceTargets(isBuy, isExecutive, isLargeTrade, tradeData.totalValue);
      const timeHorizon = this.getDefaultTimeHorizon(isExecutive, isLargeTrade, tradeData.totalValue);

      return {
        significanceScore: Math.min(100, significanceScore),
        signalType,
        keyInsights: [
          `${isExecutive ? 'Executive' : 'Insider'} ${tradeData.tradeType.toLowerCase()} transaction`,
          `Trade value of $${(tradeData.totalValue / 1000000).toFixed(1)}M indicates ${isLargeTrade ? 'high' : 'moderate'} conviction`,
          `${tradeData.ownershipPercentage}% ownership suggests ${tradeData.ownershipPercentage > 1 ? 'significant' : 'minor'} stake`
        ],
        riskLevel: isLargeTrade && !isBuy ? 'HIGH' : isExecutive && isBuy ? 'LOW' : 'MEDIUM',
        recommendation: `${signalType === 'BUY' ? 'Consider buying' : signalType === 'SELL' ? 'Consider reducing position' : 'Monitor for additional signals'} based on ${isExecutive ? 'executive' : 'insider'} ${tradeData.tradeType.toLowerCase()} activity`,
        priceTargets,
        timeHorizon
      };
    }
  }

  private getDefaultPriceTargets(
    isBuy: boolean,
    isExecutive: boolean,
    isLargeTrade: boolean,
    totalValue: number
  ): { conservative: number; realistic: number; optimistic: number } {
    const isMediumTrade = totalValue > 100000;

    if (isBuy) {
      if (isExecutive && isLargeTrade) {
        return { conservative: 5, realistic: 12, optimistic: 25 };
      } else if (isExecutive || isLargeTrade) {
        return { conservative: 3, realistic: 8, optimistic: 18 };
      } else if (isMediumTrade) {
        return { conservative: 2, realistic: 5, optimistic: 12 };
      } else {
        return { conservative: 1, realistic: 3, optimistic: 8 };
      }
    } else {
      if (isLargeTrade) {
        return { conservative: -3, realistic: -8, optimistic: -15 };
      } else {
        return { conservative: -1, realistic: -3, optimistic: -7 };
      }
    }
  }

  private getDefaultTimeHorizon(
    isExecutive: boolean,
    isLargeTrade: boolean,
    totalValue: number
  ): string {
    const isMediumTrade = totalValue > 100000;

    if (isExecutive && isLargeTrade) {
      return '1-2 weeks';
    } else if (isExecutive || isLargeTrade) {
      return '2-3 weeks';
    } else if (isMediumTrade) {
      return '2-4 weeks';
    } else {
      return '3-4 weeks';
    }
  }
}

export const aiAnalysisService = new AIAnalysisService();
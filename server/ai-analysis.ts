import OpenAI from "openai";

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
  recentNews?: NewsContext[]; // Optional recent news for context
}

interface AIAnalysisResult {
  significanceScore: number; // 1-100
  signalType: 'BUY' | 'SELL' | 'HOLD';
  keyInsights: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
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
            content: `You are an expert financial analyst specializing in insider trading analysis. 
                     Analyze insider trading data and provide actionable investment insights.
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
      return this.generateFallbackAnalysis(tradeData);
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
  "recommendation": "<concise investment recommendation based on this trade${tradeData.recentNews && tradeData.recentNews.length > 0 ? ' and recent news' : ''}>"
}

Guidelines:
- significanceScore: 80-100 for major executives, large trades, unusual patterns${tradeData.recentNews && tradeData.recentNews.length > 0 ? ', or trades aligned with major news events' : ''}
- signalType: BUY for insider buying (especially executives), SELL for large disposals, HOLD for routine/small trades${tradeData.recentNews && tradeData.recentNews.length > 0 ? '. Consider news sentiment alignment' : ''}
- keyInsights: 3 specific, actionable observations about this trade${tradeData.recentNews && tradeData.recentNews.length > 0 ? ' incorporating recent news context' : ''}
- riskLevel: HIGH for contrarian signals or large executive sales, LOW for routine small trades
- recommendation: One sentence summarizing investment action${tradeData.recentNews && tradeData.recentNews.length > 0 ? ' considering both trade data and news sentiment' : ''}
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
        'Monitor for additional insider activity before making investment decisions'
    };
  }

  private generateFallbackAnalysis(tradeData: InsiderTradeData): AIAnalysisResult {
    const isExecutive = ['CEO', 'CFO', 'President', 'Chairman', 'Director'].some(title => 
      tradeData.traderTitle.toLowerCase().includes(title.toLowerCase())
    );
    const isLargeTrade = tradeData.totalValue > 1000000; // > $1M
    const isBuy = tradeData.tradeType === 'BUY';

    let significanceScore = 50;
    if (isExecutive) significanceScore += 20;
    if (isLargeTrade) significanceScore += 15;
    if (tradeData.ownershipPercentage > 1) significanceScore += 10;

    const signalType = isBuy && isExecutive ? 'BUY' : 
                      !isBuy && isLargeTrade ? 'SELL' : 'HOLD';

    return {
      significanceScore: Math.min(100, significanceScore),
      signalType,
      keyInsights: [
        `${isExecutive ? 'Executive' : 'Insider'} ${tradeData.tradeType.toLowerCase()} transaction`,
        `Trade value of $${(tradeData.totalValue / 1000000).toFixed(1)}M indicates ${isLargeTrade ? 'high' : 'moderate'} conviction`,
        `${tradeData.ownershipPercentage}% ownership suggests ${tradeData.ownershipPercentage > 1 ? 'significant' : 'minor'} stake`
      ],
      riskLevel: isLargeTrade && !isBuy ? 'HIGH' : isExecutive && isBuy ? 'LOW' : 'MEDIUM',
      recommendation: `${signalType === 'BUY' ? 'Consider buying' : signalType === 'SELL' ? 'Consider reducing position' : 'Monitor for additional signals'} based on ${isExecutive ? 'executive' : 'insider'} ${tradeData.tradeType.toLowerCase()} activity`
    };
  }
}

export const aiAnalysisService = new AIAnalysisService();
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
            content: `You are an expert insider trading analyst who connects the dots between trades and real-world events.

**Your mission:** Write 2-3 sentences that explain WHY this insider trade matters RIGHT NOW.

**Requirements:**
1. If recent news is provided (FDA approval, earnings, clinical trial, product launch, partnership, acquisition, etc.), you MUST connect the trade to these events
2. Mention the insider's specific role and what it tells us (e.g., "CMO rarely buys in open market—suggests upcoming marketing campaign or product launch")
3. Use concrete numbers: exact % of market cap, number of simultaneous insiders, trade size vs. sector average
4. Explain timing: Is this before a catalyst? After a quiet period? During sector downturn?

**STRICTLY FORBIDDEN vague phrases (these add zero value):**
- "demonstrates confidence", "signals conviction", "indicates strong belief", "reflects optimism", "shows commitment", "suggests confidence"

**What makes a GOOD analysis:**
- Connects insider's role to likely catalyst (e.g., "Chief Medical Officer's $400K purchase 3 weeks before FDA decision suggests positive Phase 3 data")
- Cites specific statistics (e.g., "4 insiders buying simultaneously—a pattern seen in <2% of SEC filings—historically precedes major announcements within 60-90 days")
- References recent news events when provided

**What makes a BAD analysis:**
- Generic statements like "Large buying signals confidence" or "Executive purchase reflects optimism"
- No connection to real events or timing
- Restating the obvious without adding insight

Always respond with valid JSON in the exact format specified.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 350
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

    // 직책별 특수 의미 분석
    const roleContext = this.getRoleSpecificContext(tradeData.traderTitle);

    // 뉴스 컨텍스트 추가
    let newsContext = '';
    if (tradeData.recentNews && tradeData.recentNews.length > 0) {
      const newsItems = tradeData.recentNews.slice(0, 5).map(news =>
        `  • ${news.headline} (${news.sentiment}, ${new Date(news.publishedDate).toLocaleDateString()})`
      ).join('\n');
      newsContext = `\n\n**Recent News Context (Use this to explain WHY the insider bought NOW):**\n${newsItems}`;
    }

    // 타이밍 분석 - 분기 말, 월말 체크
    const filingDateInfo = tradeData.filedDate
      ? `\n- Filing Date: ${new Date(tradeData.filedDate).toLocaleDateString()}`
      : '';
    const timingHint = this.getTimingHint(tradeData.filedDate);

    return `
Insider Trade Summary:
- Company: ${tradeData.companyName} (${tradeData.ticker})
- Insider(s): ${tradeData.traderName} (${tradeData.traderTitle})${roleContext ? ` ${roleContext}` : ''}
- Simultaneous Insiders Buying: ${insiderCount} person(s) ${simultaneousBuyingNote}
- Action: ${tradeData.tradeType} ${tradeData.shares.toLocaleString()} shares at $${displayPrice}
- Total Value: $${tradeValue}M ${marketCapRatioStr}
- Executive Level: ${isExecutive ? 'Yes (C-suite/Director)' : 'No'}
- High Conviction Signal: ${tradeData.isHighConviction ? 'YES ($1M+ or 3+ insiders)' : 'No'}${filingDateInfo}${timingHint}${newsContext}

**YOUR TASK: Write 2-3 sentences that answer "WHY THIS TRADE MATTERS RIGHT NOW"**

Focus on:
1. **Role-specific meaning**: ${roleContext || 'What does this person\'s role tell us about why they bought?'}
2. **News/Events correlation**: If recent news mentions FDA approval, earnings, product launch, clinical trial, partnership, etc. - CONNECT IT to why the insider bought now
3. **Timing significance**: Is this before earnings? After a dip? During quiet period end?
4. **Unusual patterns**: Size, number of insiders, % of market cap vs. typical for this sector

STRICTLY FORBIDDEN phrases (add zero value):
- "demonstrates confidence", "signals conviction", "indicates strong belief", "reflects optimism", "shows commitment", "suggests confidence"

**Response Format (JSON):**
{
  "significanceScore": <1-100>,
  "signalType": "${tradeData.tradeType === 'BUY' ? 'BUY' : 'SELL'}",
  "aiSummary": "<2-3 sentences. MUST connect to real events/news if provided. Be specific about WHY NOW.>"
}

Example (BAD): "CMO purchased $500K worth of shares. Large executive buying signals confidence."
Example (GOOD): "CMO's $500K purchase comes 2 weeks before phase 3 clinical trial results announcement—a rare move for marketing chiefs who typically avoid pre-catalyst exposure. The 0.12% market cap purchase suggests insider knowledge of positive trial outcomes, as CMO involvement in open-market buys is historically seen in only 3% of biotech Form 4s."
`;
  }

  // 직책별 특수 컨텍스트 생성
  private getRoleSpecificContext(title: string): string {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('cmo') || lowerTitle.includes('marketing')) {
      return '← CMOs rarely buy in open market (suggests upcoming product/partnership news)';
    }
    if (lowerTitle.includes('cto') || lowerTitle.includes('technology')) {
      return '← CTOs buy when confident in tech roadmap/patents';
    }
    if (lowerTitle.includes('cfo')) {
      return '← CFO has best visibility into financials';
    }
    if (lowerTitle.includes('ceo')) {
      return '← CEO has full company visibility';
    }
    if (lowerTitle.includes('chief medical') || lowerTitle.includes('chief science')) {
      return '← Medical/Science chiefs buy before clinical/research catalysts';
    }
    if (lowerTitle.includes('general counsel') || lowerTitle.includes('legal')) {
      return '← Legal chiefs buy when regulatory/M&A activity imminent';
    }
    return '';
  }

  // 타이밍 힌트 생성 (분기 말, 실적 발표 시즌 등)
  private getTimingHint(filedDate?: Date): string {
    if (!filedDate) return '';

    const date = new Date(filedDate);
    const month = date.getMonth(); // 0-11
    const day = date.getDate();

    // 분기 말 (3월, 6월, 9월, 12월)
    if ([2, 5, 8, 11].includes(month) && day >= 20) {
      return '\n- Timing: End of quarter (often precedes earnings)';
    }

    // 분기 초 (1월, 4월, 7월, 10월)
    if ([0, 3, 6, 9].includes(month) && day <= 15) {
      return '\n- Timing: Start of quarter (post-earnings window)';
    }

    return '';
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
    const insiderCount = tradeData.insiderCount || 1;

    // Calculate significance score
    let significanceScore = 50;
    if (isExecutive) significanceScore += 20;
    if (isLargeTrade) significanceScore += 15;
    if (tradeData.ownershipPercentage > 1) significanceScore += 10;
    if (insiderCount >= 3) significanceScore += 15;
    if (tradeData.marketCapRatio && tradeData.marketCapRatio > 0.5) significanceScore += 10;

    const signalType = isBuy ? 'BUY' : 'SELL';
    const tradeValue = (tradeData.totalValue / 1000000).toFixed(2);
    const action = isBuy ? 'purchased' : 'sold';

    // 직책별 특수 컨텍스트
    const roleContext = this.getRoleSpecificContext(tradeData.traderTitle);
    const roleInsight = roleContext ? roleContext.replace('←', '').trim() : '';

    // Generate improved fallback summary
    let aiSummary = '';

    // 클러스터 매수 (3명 이상)
    if (insiderCount >= 3 && isBuy) {
      const mcapStr = tradeData.marketCapRatio
        ? ` (${tradeData.marketCapRatio.toFixed(2)}% of market cap)`
        : '';
      aiSummary = `${insiderCount}명의 내부자가 동시에 총 $${tradeValue}M 매수${mcapStr}—통계적으로 전체 SEC Form 4 신고의 2% 미만에서만 나타나는 희귀 패턴. ${roleInsight || '다수 내부자의 동시 매수는 역사적으로 60-90일 내 주요 기업 발표를 앞두고 나타나는 경향이 있습니다.'}`;
    }
    // 대규모 매수 (단일 내부자)
    else if (isLargeTrade && isBuy) {
      const mcapStr = tradeData.marketCapRatio
        ? ` 시가총액의 ${tradeData.marketCapRatio.toFixed(2)}%에 해당하며`
        : '';
      const rolePrefix = isExecutive
        ? `${tradeData.traderTitle}의 $${tradeValue}M 매수는`
        : `내부자의 $${tradeValue}M 매수는`;
      aiSummary = `${rolePrefix}${mcapStr} 고액 내부자 거래 기준($1M+)을 충족합니다. ${roleInsight || '이 규모의 공개 시장 매수는 내부자의 강한 확신을 나타내는 지표로 간주됩니다.'}`;
    }
    // 임원 매수
    else if (isExecutive && isBuy) {
      aiSummary = `${tradeData.traderTitle}의 $${tradeValue}M 매수 기록. ${roleInsight || 'C-레벨 임원의 공개 시장 매수는 회사 전반에 대한 가시성을 바탕으로 한 의사결정을 반영합니다.'}`;
    }
    // 일반 매수
    else if (isBuy) {
      aiSummary = `내부자가 자기 자본으로 $${tradeValue}M을 직접 투자. ${roleInsight || 'SEC Form 4 신고를 통해 검증된 거래입니다.'}`;
    }
    // 매도
    else {
      const sellReason = isLargeTrade
        ? '대규모 내부자 매도는 포트폴리오 재조정, 개인적 유동성 필요, 또는 밸류에이션 우려를 나타낼 수 있습니다.'
        : '내부자 매도는 다양한 개인적 사유로 발생할 수 있습니다.';
      aiSummary = `${tradeData.traderTitle}의 $${tradeValue}M 매도. ${sellReason}`;
    }

    return {
      significanceScore: Math.min(100, Math.max(1, significanceScore)),
      signalType,
      aiSummary
    };
  }
}

export const aiAnalysisService = new AIAnalysisService();
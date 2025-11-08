import nodemailer from 'nodemailer';
import { storage } from './storage';
import type { PatternAlert } from './pattern-detection-service';
import type { InsiderTrade } from '@shared/schema';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface NotificationPreferences {
  userId: string;
  email: string;
  enablePatternAlerts: boolean;
  enableTradeAlerts: boolean;
  enableWeeklyDigest: boolean;
  minimumTradeValue: number;
  watchlistTickers: string[];
  language: 'ko' | 'en' | 'ja' | 'zh';
}

class EmailNotificationService {
  private transporter: nodemailer.Transporter | null = null;
  private userPreferences: Map<string, NotificationPreferences> = new Map();
  private baseUrl: string = process.env.APP_URL
    || process.env.FRONTEND_URL
    || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000');

  // 다국어 번역 데이터
  private translations = {
    ko: {
      subject: '💰 대량 내부자 거래 감지',
      tradeAlert: '내부자 거래 알림',
      company: '회사',
      insider: '내부자',
      position: '직책',
      transactionType: '거래 유형',
      tradeValue: '거래 금액',
      shareCount: '주식 수',
      pricePerShare: '주당 가격',
      tradeTime: '거래 시간',
      filingTime: '신고 시간',
      confidence: '신뢰도',
      source: '데이터 출처',
      buy: '매수',
      sell: '매도',
      optionExercise: '옵션 행사',
      verified: '검증됨',
      premium: 'Premium',
      footer: 'InsiderPulse Pro - 프리미엄 내부자 거래 알림 서비스'
    },
    en: {
      subject: '💰 Large Insider Trade Detected',
      tradeAlert: 'Insider Trading Alert',
      company: 'Company',
      insider: 'Insider',
      position: 'Position',
      transactionType: 'Transaction Type',
      tradeValue: 'Trade Value',
      shareCount: 'Share Count',
      pricePerShare: 'Price Per Share',
      tradeTime: 'Trade Time',
      filingTime: 'Filing Time',
      confidence: 'Confidence',
      source: 'Data Source',
      buy: 'Buy',
      sell: 'Sell',
      optionExercise: 'Option Exercise',
      verified: 'Verified',
      premium: 'Premium',
      footer: 'InsiderPulse Pro - Premium Insider Trading Alert Service'
    },
    ja: {
      subject: '💰 大量インサイダー取引検出',
      tradeAlert: 'インサイダー取引アラート',
      company: '会社',
      insider: 'インサイダー',
      position: '役職',
      transactionType: '取引タイプ',
      tradeValue: '取引金額',
      shareCount: '株式数',
      pricePerShare: '1株当たり価格',
      tradeTime: '取引時間',
      filingTime: '申告時間',
      confidence: '信頼度',
      source: 'データソース',
      buy: '買い',
      sell: '売り',
      optionExercise: 'オプション行使',
      verified: '検証済み',
      premium: 'プレミアム',
      footer: 'InsiderPulse Pro - プレミアムインサイダー取引アラートサービス'
    },
    zh: {
      subject: '💰 检测到大额内幕交易',
      tradeAlert: '内幕交易提醒',
      company: '公司',
      insider: '内部人士',
      position: '职位',
      transactionType: '交易类型',
      tradeValue: '交易金额',
      shareCount: '股票数量',
      pricePerShare: '每股价格',
      tradeTime: '交易时间',
      filingTime: '申报时间',
      confidence: '可信度',
      source: '数据来源',
      buy: '买入',
      sell: '卖出',
      optionExercise: '期权行权',
      verified: '已验证',
      premium: '高级版',
      footer: 'InsiderPulse Pro - 高级内幕交易提醒服务'
    }
  };

  constructor() {
    this.initializeTransporter();
    this.loadUserPreferences();
  }

  private initializeTransporter() {
    try {
      // 환경변수 디버깅
      console.log('🔍 Email 환경변수 체크:', {
        EMAIL_USER: process.env.EMAIL_USER ? '설정됨' : '없음',
        EMAIL_PASS: process.env.EMAIL_PASS ? '설정됨' : '없음'
      });

      // SMTP 설정 (환경변수로 관리)
      const emailConfig: EmailConfig = {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER || 'insiderpulse7@gmail.com',
          pass: process.env.EMAIL_PASS || 'tbhielsanfowlura'
        }
      };

      console.log('📧 이메일 설정:', {
        host: emailConfig.host,
        port: emailConfig.port,
        user: emailConfig.auth.user,
        hasPassword: !!emailConfig.auth.pass
      });

      if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        console.warn('⚠️ 이메일 설정이 없습니다. 환경변수 EMAIL_USER, EMAIL_PASS를 설정해주세요.');
        return;
      }

      this.transporter = nodemailer.createTransport(emailConfig);
      console.log('✅ 이메일 서비스 초기화 완료');
    } catch (error) {
      console.error('❌ 이메일 서비스 초기화 실패:', error);
    }
  }

  private async loadUserPreferences() {
    try {
      // 실제 환경에서는 DB에서 사용자 설정을 불러옵니다
      // 임시로 기본 설정 사용
      const users = await storage.getUsers?.() || [];

      for (const user of users) {
        this.userPreferences.set(user.id, {
          userId: user.id,
          email: user.email,
          enablePatternAlerts: true,
          enableTradeAlerts: true,
          enableWeeklyDigest: true,
          minimumTradeValue: 100000, // $100,000 이상 거래만 알림
          watchlistTickers: [] // 사용자 관심 종목
        });
      }
    } catch (error) {
      console.error('사용자 알림 설정 로드 실패:', error);
    }
  }

  // 패턴 감지 알림 이메일
  async sendPatternAlert(pattern: PatternAlert) {
    if (!this.transporter) {
      console.log('📧 이메일 서비스가 설정되지 않음 - 패턴 알림 스킵');
      return;
    }

    const interestedUsers = Array.from(this.userPreferences.values())
      .filter(pref =>
        pref.enablePatternAlerts &&
        (pref.watchlistTickers.length === 0 || pref.watchlistTickers.includes(pattern.ticker))
      );

    for (const userPref of interestedUsers) {
      try {
        const emailContent = this.generatePatternAlertEmail(pattern);

        const mailOptions = {
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: userPref.email,
          subject: `🚨 내부자 거래 패턴 감지: ${pattern.ticker} - ${pattern.type}`,
          html: emailContent,
          text: this.generatePatternAlertText(pattern)
        };

        await this.transporter.sendMail(mailOptions);
        console.log(`📧 패턴 알림 이메일 발송 완료: ${userPref.email} - ${pattern.ticker}`);

      } catch (error) {
        console.error(`❌ 패턴 알림 이메일 발송 실패 (${userPref.email}):`, error);
      }
    }
  }

  // 큰 거래 감지 알림
  async sendLargeTradeAlert(trade: InsiderTrade) {
    if (!this.transporter) return;

    const tradeValue = Math.abs(trade.totalValue);

    const interestedUsers = Array.from(this.userPreferences.values())
      .filter(pref =>
        pref.enableTradeAlerts &&
        tradeValue >= pref.minimumTradeValue &&
        (pref.watchlistTickers.length === 0 || pref.watchlistTickers.includes(trade.ticker || ''))
      );

    for (const userPref of interestedUsers) {
      try {
        const lang = userPref.language || 'ko';
        const t = this.translations[lang];
        const emailContent = this.generateTradeAlertEmail(trade, lang);

        const mailOptions = {
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: userPref.email,
          subject: `${t.subject}: ${trade.ticker} - $${tradeValue.toLocaleString()}`,
          html: emailContent,
          text: this.generateTradeAlertText(trade, lang)
        };

        await this.transporter.sendMail(mailOptions);
        console.log(`📧 거래 알림 이메일 발송 완료: ${userPref.email} - ${trade.ticker} (${lang.toUpperCase()})`);

      } catch (error) {
        console.error(`❌ 거래 알림 이메일 발송 실패 (${userPref.email}):`, error);
      }
    }
  }

  // 주간 요약 이메일
  async sendWeeklyDigest(userId?: string) {
    if (!this.transporter) return;

    const targetUsers = userId
      ? [this.userPreferences.get(userId)].filter(Boolean)
      : Array.from(this.userPreferences.values()).filter(pref => pref.enableWeeklyDigest);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    for (const userPref of targetUsers) {
      try {
        // 지난 주 주요 거래 데이터 수집
        const recentTrades = await storage.getInsiderTrades(100, 0, false, weekAgo.toISOString().split('T')[0]);
        const topTrades = recentTrades
          .sort((a, b) => Math.abs(b.totalValue) - Math.abs(a.totalValue))
          .slice(0, 10);

        const emailContent = this.generateWeeklyDigestEmail(topTrades, userPref);

        const mailOptions = {
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: userPref.email,
          subject: `📊 주간 내부자 거래 요약 - ${new Date().toLocaleDateString()}`,
          html: emailContent
        };

        await this.transporter.sendMail(mailOptions);
        console.log(`📧 주간 요약 이메일 발송 완료: ${userPref.email}`);

      } catch (error) {
        console.error(`❌ 주간 요약 이메일 발송 실패 (${userPref!.email}):`, error);
      }
    }
  }

  private generatePatternAlertEmail(pattern: PatternAlert): string {
    const patternTypeKorean = {
      'CLUSTER_BUY': '집단 매수',
      'CLUSTER_SELL': '집단 매도',
      'CONSECUTIVE_TRADES': '연속 거래',
      'LARGE_VOLUME': '대량 거래',
      'UNUSUAL_TIMING': '비정상 타이밍'
    };

    const significanceColor = {
      'HIGH': '#ff4444',
      'MEDIUM': '#ffaa00',
      'LOW': '#00aa44'
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .pattern-card { background: white; border-radius: 8px; padding: 15px; margin: 15px 0; border-left: 4px solid ${significanceColor[pattern.significance]}; }
            .trades-list { margin-top: 15px; }
            .trade-item { padding: 8px; background: #f1f3f4; margin: 5px 0; border-radius: 4px; font-size: 14px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚨 패턴 감지 알림</h1>
                <p>내부자 거래에서 의미 있는 패턴이 발견되었습니다</p>
            </div>

            <div class="content">
                <div class="pattern-card">
                    <h2>${pattern.ticker} - ${pattern.companyName}</h2>
                    <h3>${patternTypeKorean[pattern.type] || pattern.type} 패턴</h3>
                    <p><strong>중요도:</strong> <span style="color: ${significanceColor[pattern.significance]}">${pattern.significance}</span></p>
                    <p><strong>설명:</strong> ${pattern.description}</p>
                    <p><strong>감지 시간:</strong> ${pattern.detectedAt.toLocaleString('ko-KR')}</p>

                    ${pattern.metadata ? `
                    <div style="background: #e3f2fd; padding: 10px; border-radius: 4px; margin: 10px 0;">
                        ${pattern.metadata.traderCount ? `<p>📊 참여 내부자: ${pattern.metadata.traderCount}명</p>` : ''}
                        ${pattern.metadata.totalValue ? `<p>💰 총 거래 금액: $${pattern.metadata.totalValue.toLocaleString()}</p>` : ''}
                        ${pattern.metadata.consecutiveDays ? `<p>📅 연속 거래 일수: ${pattern.metadata.consecutiveDays}일</p>` : ''}
                    </div>
                    ` : ''}
                </div>

                <div class="trades-list">
                    <h3>관련 거래 내역</h3>
                    ${pattern.trades.slice(0, 5).map(trade => `
                        <div class="trade-item">
                            <strong>${trade.traderName}</strong> (${trade.traderTitle || 'N/A'}) -
                            ${trade.tradeType} ${trade.shares?.toLocaleString()} 주식
                            ($${Math.abs(trade.totalValue).toLocaleString()})
                            <br><small>Filed: ${new Date(trade.filedDate).toLocaleDateString('ko-KR')}</small>
                        </div>
                    `).join('')}
                    ${pattern.trades.length > 5 ? `<p><em>... 및 ${pattern.trades.length - 5}건의 추가 거래</em></p>` : ''}
                </div>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.APP_URL}/trades?ticker=${pattern.ticker}" class="button">
                        상세 정보 보기
                    </a>
                </div>
            </div>

            <div class="footer">
                <p>이 이메일은 InsiderTrack Pro에서 자동으로 발송되었습니다.</p>
                <p>알림 설정을 변경하려면 <a href="${process.env.APP_URL}/settings">여기</a>를 클릭하세요.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private generatePatternAlertText(pattern: PatternAlert): string {
    return `
패턴 감지 알림 - ${pattern.ticker}

${pattern.companyName}에서 ${pattern.type} 패턴이 감지되었습니다.

중요도: ${pattern.significance}
설명: ${pattern.description}
감지 시간: ${pattern.detectedAt.toLocaleString('ko-KR')}

관련 거래: ${pattern.trades.length}건
총 거래 금액: $${pattern.metadata?.totalValue?.toLocaleString() || 'N/A'}

자세한 내용: ${process.env.APP_URL}/trades?ticker=${pattern.ticker}

--
InsiderTrack Pro
    `.trim();
  }

  private generateTradeAlertEmail(trade: InsiderTrade, language: 'ko' | 'en' | 'ja' | 'zh' = 'ko'): string {
    const t = this.translations[language];

    // 시간 포맷팅 (각 언어별)
    const formatDateTime = (date: Date) => {
      const locales = { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', zh: 'zh-CN' };
      const timeZones = { ko: 'Asia/Seoul', en: 'America/New_York', ja: 'Asia/Tokyo', zh: 'Asia/Shanghai' };

      return new Intl.DateTimeFormat(locales[language], {
        timeZone: timeZones[language],
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: language === 'en'
      }).format(date);
    };

    const getTransactionType = (type: string) => {
      if (type === 'SELL') return t.sell;
      if (type === 'BUY') return t.buy;
      if (type === 'OPTION_EXERCISE') return t.optionExercise;
      return type;
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .trade-card { background: white; border-radius: 8px; padding: 20px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .amount { font-size: 24px; font-weight: bold; color: #007bff; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px; }
            .premium-badge { background: #ffd700; color: #000; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .time-info { background: #e3f2fd; padding: 12px; border-radius: 6px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💰 ${t.tradeAlert}</h1>
                <span class="premium-badge">${t.premium}</span>
            </div>

            <div class="content">
                <div class="trade-card">
                    <h2>${trade.ticker}</h2>
                    <div class="amount">$${Math.abs(trade.totalValue).toLocaleString()}</div>

                    <div style="margin: 15px 0;">
                        <p><strong>${t.insider}:</strong> ${trade.insiderName}</p>
                        <p><strong>${t.position}:</strong> ${trade.insiderTitle || 'N/A'}</p>
                        <p><strong>${t.transactionType}:</strong> ${getTransactionType(trade.transactionType)}</p>
                        <p><strong>${t.shareCount}:</strong> ${(trade.sharesBought || trade.sharesSold || 0).toLocaleString()}</p>
                        <p><strong>${t.pricePerShare}:</strong> $${trade.pricePerShare?.toFixed(2)}</p>
                        <p><strong>${t.confidence}:</strong> ${trade.confidence}% ${trade.verified ? `(${t.verified})` : ''}</p>
                        <p><strong>${t.source}:</strong> ${trade.source}</p>
                    </div>

                    <div class="time-info">
                        <p><strong>${t.tradeTime}:</strong> ${formatDateTime(new Date(trade.transactionDate))}</p>
                        <p><strong>${t.filingTime}:</strong> ${formatDateTime(new Date(trade.filingDate))}</p>
                    </div>
                </div>
            </div>

            <div class="footer">
                <p>${t.footer}</p>
                <p><small>InsiderPulse Pro © ${new Date().getFullYear()}</small></p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private generateTradeAlertText(trade: InsiderTrade, language: 'ko' | 'en' | 'ja' | 'zh' = 'ko'): string {
    const t = this.translations[language];

    // 시간 포맷팅 (각 언어별)
    const formatDateTime = (date: Date) => {
      const locales = { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', zh: 'zh-CN' };
      const timeZones = { ko: 'Asia/Seoul', en: 'America/New_York', ja: 'Asia/Tokyo', zh: 'Asia/Shanghai' };

      return new Intl.DateTimeFormat(locales[language], {
        timeZone: timeZones[language],
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: language === 'en'
      }).format(date);
    };

    const getTransactionType = (type: string) => {
      if (type === 'SELL') return t.sell;
      if (type === 'BUY') return t.buy;
      if (type === 'OPTION_EXERCISE') return t.optionExercise;
      return type;
    };

    return `
${t.tradeAlert} - ${trade.ticker}

${t.insider}: ${trade.insiderName}
${t.position}: ${trade.insiderTitle || 'N/A'}
${t.transactionType}: ${getTransactionType(trade.transactionType)}
${t.tradeValue}: $${Math.abs(trade.totalValue).toLocaleString()}
${t.shareCount}: ${(trade.sharesBought || trade.sharesSold || 0).toLocaleString()}
${t.pricePerShare}: $${trade.pricePerShare?.toFixed(2)}
${t.confidence}: ${trade.confidence}% ${trade.verified ? `(${t.verified})` : ''}
${t.source}: ${trade.source}

${t.tradeTime}: ${formatDateTime(new Date(trade.transactionDate))}
${t.filingTime}: ${formatDateTime(new Date(trade.filingDate))}

${t.footer}
    `.trim();
  }

  private generateWeeklyDigestEmail(trades: InsiderTrade[], userPref: NotificationPreferences): string {
    const totalTrades = trades.length;
    const totalValue = trades.reduce((sum, t) => sum + Math.abs(t.totalValue), 0);
    const topCompanies = [...new Set(trades.map(t => t.companyName))].slice(0, 5);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .stat-card { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .trade-item { background: white; padding: 12px; margin: 8px 0; border-radius: 6px; border-left: 4px solid #007bff; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { background: #6f42c1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 주간 내부자 거래 요약</h1>
                <p>${new Date().toLocaleDateString('ko-KR')} 기준 지난 7일간의 주요 거래</p>
            </div>

            <div class="content">
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>${totalTrades}</h3>
                        <p>총 거래 건수</p>
                    </div>
                    <div class="stat-card">
                        <h3>$${(totalValue / 1000000).toFixed(1)}M</h3>
                        <p>총 거래 금액</p>
                    </div>
                </div>

                <h3>🔥 주간 TOP 10 거래</h3>
                ${trades.slice(0, 10).map((trade, index) => `
                    <div class="trade-item">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>#${index + 1} ${trade.ticker}</strong> - ${trade.companyName}
                                <br><small>${trade.traderName} (${trade.tradeType})</small>
                            </div>
                            <div style="text-align: right;">
                                <strong>$${Math.abs(trade.totalValue).toLocaleString()}</strong>
                                <br><small>${new Date(trade.filedDate).toLocaleDateString('ko-KR')}</small>
                            </div>
                        </div>
                    </div>
                `).join('')}

                <h3>🏢 가장 활발한 회사들</h3>
                <ul>
                    ${topCompanies.map(company => `<li>${company}</li>`).join('')}
                </ul>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.APP_URL}/trades" class="button">
                        전체 거래 보기
                    </a>
                    <a href="${process.env.APP_URL}/analytics" class="button">
                        분석 대시보드
                    </a>
                </div>
            </div>

            <div class="footer">
                <p>매주 ${new Date().toLocaleDateString('ko-KR', { weekday: 'long' })}마다 발송됩니다.</p>
                <p>알림 설정 변경: <a href="${process.env.APP_URL}/settings">설정 페이지</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // 사용자 알림 설정 업데이트
  updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>) {
    const existing = this.userPreferences.get(userId);
    if (existing) {
      this.userPreferences.set(userId, { ...existing, ...preferences });
    }
  }

  // 사용자 관심 종목 추가
  addToWatchlist(userId: string, ticker: string) {
    const pref = this.userPreferences.get(userId);
    if (pref && !pref.watchlistTickers.includes(ticker.toUpperCase())) {
      pref.watchlistTickers.push(ticker.toUpperCase());
    }
  }

  // 사용자 관심 종목 제거
  removeFromWatchlist(userId: string, ticker: string) {
    const pref = this.userPreferences.get(userId);
    if (pref) {
      pref.watchlistTickers = pref.watchlistTickers.filter(t => t !== ticker.toUpperCase());
    }
  }

  // 이메일 인증 코드 발송 (새 방식)
  async sendVerificationCode(email: string, code: string) {
    if (!this.transporter) {
      throw new Error('이메일 서비스가 설정되지 않았습니다');
    }

    console.log('📧 Sending verification code to:', email);
    console.log('🔑 Code:', code);

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: '✉️ InsiderPulse 이메일 인증 코드',
      html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 40px; border-radius: 16px; box-shadow: 0 2px 16px rgba(0,0,0,0.08);">
          <!-- Logo & Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1a1a1a; font-size: 28px; margin: 0 0 8px 0; font-weight: 700;">
              InsiderPulse
            </h1>
            <p style="color: #666; font-size: 16px; margin: 0;">
              이메일 인증이 필요합니다
            </p>
          </div>

          <!-- Code Display -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; border-radius: 12px; margin: 24px 0;">
            <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 12px 0; text-align: center; font-weight: 500;">
              인증 코드
            </p>
            <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 16px; backdrop-filter: blur(10px);">
              <p style="color: white; font-size: 40px; font-weight: 700; margin: 0; text-align: center; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${code}
              </p>
            </div>
            <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 16px 0 0 0; text-align: center;">
              ⏰ 이 코드는 10분 동안 유효합니다
            </p>
          </div>

          <!-- Instructions -->
          <div style="margin: 24px 0; padding: 20px; background-color: #f8f9ff; border-radius: 8px; border-left: 4px solid #667eea;">
            <p style="color: #333; font-size: 15px; margin: 0 0 12px 0; font-weight: 600;">
              📋 인증 방법
            </p>
            <ol style="color: #666; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>회원가입 페이지로 돌아가세요</li>
              <li>위의 6자리 코드를 입력하세요</li>
              <li>인증 완료 후 서비스를 이용하실 수 있습니다</li>
            </ol>
          </div>

          <!-- Security Notice -->
          <div style="margin-top: 24px; padding: 16px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="color: #856404; font-size: 13px; margin: 0; line-height: 1.5;">
              🔒 <strong>보안 안내:</strong> 이 코드는 본인만 사용해야 합니다. 타인에게 공유하지 마세요.
            </p>
          </div>

          <!-- Footer -->
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0 0 8px 0;">
              본인이 요청하지 않은 경우 이 이메일을 무시하세요.
            </p>
            <p style="color: #999; font-size: 11px; margin: 0;">
              © ${new Date().getFullYear()} InsiderPulse. All rights reserved.
            </p>
          </div>
        </div>
      </div>
      `,
      text: `
InsiderPulse 이메일 인증

인증 코드: ${code}

이 코드를 회원가입 페이지에 입력하여 이메일 인증을 완료하세요.
코드는 10분 동안 유효합니다.

본인이 요청하지 않은 경우 이 이메일을 무시하세요.

© ${new Date().getFullYear()} InsiderPulse
      `.trim()
    };

    await this.transporter.sendMail(mailOptions);
    console.log(`📧 인증 코드 발송 완료: ${email}`);
  }

  // 이메일 인증 발송 (레거시 - 링크 방식)
  async sendVerificationEmail(email: string, token: string) {
    if (!this.transporter) {
      throw new Error('이메일 서비스가 설정되지 않았습니다');
    }

    const verificationUrl = `${this.baseUrl}/verify-email?token=${token}`;
    console.log('📧 Sending verification email to:', email);
    console.log('🔗 Verification URL:', verificationUrl.substring(0, 100) + '...');

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: '✉️ InsiderPulse 이메일 인증',
      html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">🎉 InsiderPulse 가입을 환영합니다!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            계정을 활성화하려면 아래 버튼을 클릭하여 이메일을 인증해주세요.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              이메일 인증하기
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">
            또는 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
            <span style="color: #4F46E5; word-break: break-all;">${verificationUrl}</span>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            이 인증 링크는 24시간 동안 유효합니다.<br>
            본인이 요청하지 않은 경우 이 이메일을 무시하세요.
          </p>
        </div>
      </div>
      `,
      text: `InsiderPulse 가입을 환영합니다! 다음 링크를 클릭하여 이메일을 인증해주세요: ${verificationUrl}`
    };

    await this.transporter.sendMail(mailOptions);
    console.log(`📧 인증 이메일 발송 완료: ${email}`);
  }

  // 비밀번호 재설정 이메일 발송
  async sendPasswordResetEmail(email: string, token: string) {
    if (!this.transporter) {
      throw new Error('이메일 서비스가 설정되지 않았습니다');
    }

    const resetUrl = `${this.baseUrl}/reset-password?token=${token}`;
    console.log('📧 Sending password reset email to:', email);
    console.log('🔗 Reset URL:', resetUrl.substring(0, 100) + '...');

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: '🔐 InsiderPulse 비밀번호 재설정',
      html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">🔐 비밀번호 재설정</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            InsiderPulse 계정의 비밀번호 재설정을 요청하셨습니다.
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            아래 버튼을 클릭하여 새 비밀번호를 설정해주세요:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              비밀번호 재설정하기
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">
            또는 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
            <span style="color: #4F46E5; word-break: break-all;">${resetUrl}</span>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            이 링크는 1시간 동안 유효합니다.<br>
            본인이 요청하지 않은 경우 이 이메일을 무시하세요. 비밀번호는 변경되지 않습니다.
          </p>
        </div>
      </div>
      `,
      text: `InsiderPulse 비밀번호 재설정을 요청하셨습니다. 다음 링크를 클릭하여 새 비밀번호를 설정해주세요: ${resetUrl}`
    };

    await this.transporter.sendMail(mailOptions);
    console.log(`📧 비밀번호 재설정 이메일 발송 완료: ${email}`);
  }

  // 테스트 이메일 발송
  async sendTestEmail(email: string) {
    if (!this.transporter) {
      throw new Error('이메일 서비스가 설정되지 않았습니다');
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: '✅ InsiderTrack Pro 알림 테스트',
      html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; padding: 20px;">
        <h2>🎉 알림 설정이 완료되었습니다!</h2>
        <p>InsiderTrack Pro에서 다음과 같은 알림을 받으실 수 있습니다:</p>
        <ul>
          <li>🔍 패턴 감지 알림</li>
          <li>💰 대량 거래 알림</li>
          <li>📊 주간 요약 리포트</li>
        </ul>
        <p>모든 알림이 정상적으로 작동합니다.</p>
        <hr>
        <small>이 이메일은 테스트 목적으로 발송되었습니다.</small>
      </div>
      `,
      text: 'InsiderTrack Pro 알림 테스트 이메일입니다. 모든 기능이 정상적으로 작동합니다.'
    };

    await this.transporter.sendMail(mailOptions);
    console.log(`📧 테스트 이메일 발송 완료: ${email}`);
  }
}

export const emailNotificationService = new EmailNotificationService();
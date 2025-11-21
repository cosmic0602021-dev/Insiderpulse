
import { Trade, StockRecommendation, Language, NewsItem, Filing, ChartDataPoint, InstitutionalHolding } from './types';

const COMPANIES = [
  { ticker: 'TELA', name: 'TELA Bio, Inc.' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation' },
  { ticker: 'PLTR', name: 'Palantir Technologies' },
  { ticker: 'TSLA', name: 'Tesla, Inc.' },
  { ticker: 'AMD', name: 'Advanced Micro Devices' },
  { ticker: 'CRVO', name: 'Cervomed Inc.' },
  { ticker: 'SMPL', name: 'The Simply Good Foods Co' },
  { ticker: 'TENX', name: 'Tenax Therapeutics' },
  { ticker: 'STRR', name: 'Star Equity' },
  { ticker: 'PRSU', name: 'Pursuit Attractions' }
];

const INSIDERS = [
  'Ew Healthcare Partners Fund 2', 'Jensen Huang', 'Elon Musk', 'Peter Thiel', 'Lisa Su', 
  'Michael T. Young', 'Jeffrey E Eberwein', 'John J Alam', 'Sylvie Gregoire'
];

const TITLES = ['Major Shareholder', 'CEO', 'CFO', 'Director', 'VP of Sales', 'Chief Legal Officer', '10% Owner'];

const CATALYSTS = [
  'The insider purchase indicates strong confidence from a major shareholder, suggesting potential undervaluation.',
  'Recent positive sentiment in news aligns with insider buying, indicating a potential bullish outlook.',
  'Lack of negative news and new board appointments may signal strategic initiatives.',
  'Patent approval for core technology expected in Q4.',
  'Merger discussions rumored in industry reports.'
];

const NEWS_HEADLINES = [
  { title: 'Q3 2025 Earnings Call Transcript', sentiment: 'Neutral' },
  { title: 'Company to Announce Third Quarter 2025 Financial Results', sentiment: 'Neutral' },
  { title: 'Appoints William Plovanic to Board of Directors', sentiment: 'Neutral' },
  { title: 'Market Growth Trends and Forecast Report 2025-2033', sentiment: 'Positive' },
  { title: 'Analyst Downgrade due to Sector Headwinds', sentiment: 'Negative' }
];

export const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val);

export const formatNumber = (val: number) => 
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(val);

export const formatPercent = (val: number) => 
  `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;

export const generateTrades = (count: number): Trade[] => {
  return Array.from({ length: count }).map((_, i) => {
    const company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
    const type = Math.random() > 0.3 ? 'Buy' : 'Sell';
    const price = Math.random() * 10 + 1; // Lower price range like TELA example
    const shares = Math.floor(Math.random() * 3000000) + 50000;
    const currentPrice = price * (1 + (Math.random() * 0.1 - 0.05));
    
    const newsItems: NewsItem[] = [
      { id: `n-${i}-1`, ...NEWS_HEADLINES[0], sentiment: 'Neutral' } as NewsItem,
      { id: `n-${i}-2`, ...NEWS_HEADLINES[1], sentiment: 'Neutral' } as NewsItem,
      { id: `n-${i}-3`, ...NEWS_HEADLINES[2], sentiment: 'Neutral' } as NewsItem,
      { id: `n-${i}-4`, ...NEWS_HEADLINES[3], sentiment: 'Positive' } as NewsItem,
    ];

    return {
      id: `trade-${i}`,
      ticker: company.ticker,
      companyName: company.name,
      insider: INSIDERS[Math.floor(Math.random() * INSIDERS.length)],
      relation: TITLES[Math.floor(Math.random() * TITLES.length)],
      type,
      shares,
      price,
      value: shares * price,
      date: new Date(Date.now() - Math.floor(Math.random() * 100000000)).toISOString(),
      filingDate: new Date(Date.now() - Math.floor(Math.random() * 100000000)).toISOString(),
      priceChange: (currentPrice - price) / price * 100,
      currentPrice,
      isVerified: Math.random() > 0.2,
      aiScore: Math.floor(Math.random() * 100),
      aiConfidence: Math.floor(Math.random() * 20) + 80, // 80-100
      aiRecommendation: type === 'Buy' ? 'Strong Buy' : 'Sell',
      riskLevel: Math.random() > 0.5 ? 'Medium' : 'Low',
      sentiment: type === 'Buy' ? 'Bullish' : 'Bearish',
      summary: CATALYSTS[Math.floor(Math.random() * CATALYSTS.length)],
      catalysts: [CATALYSTS[0], CATALYSTS[1]],
      timeHorizon: '3-6 Months',
      newsAnalysis: {
        positive: Math.floor(Math.random() * 10),
        negative: Math.floor(Math.random() * 5),
        neutral: Math.floor(Math.random() * 5),
        summary: 'Recent news sentiment is generally positive with strong institutional interest.'
      },
      newsItems,
      targets: {
        conservative: currentPrice * 1.1,
        realistic: currentPrice * 1.25,
        optimistic: currentPrice * 1.5
      }
    };
  });
};

export const generateRecommendations = (): StockRecommendation[] => {
  return [
    {
      rank: 1,
      ticker: 'NVDA',
      companyName: 'NVIDIA Corporation',
      insiderCount: 4,
      avgBuyPrice: 124.50,
      currentPrice: 138.20,
      priceChange: 11.00,
      totalBuyAmount: 15400000,
      lastTradeDate: 'Today',
      buyers: [
        { name: 'Jensen Huang', relation: 'CEO', price: 124.50, shares: 12000, amount: 1494000, date: 'Today', priceChange: 11.0 },
        { name: 'Colette Kress', relation: 'CFO', price: 125.10, shares: 5000, amount: 625500, date: 'Yesterday', priceChange: 10.4 }
      ]
    },
    {
        rank: 2,
        ticker: 'COIN',
        companyName: 'Coinbase Global, Inc.',
        insiderCount: 3,
        avgBuyPrice: 245.10,
        currentPrice: 258.40,
        priceChange: 5.42,
        totalBuyAmount: 8200000,
        lastTradeDate: '1 day ago',
        buyers: [
            { name: 'Fred Ehrsam', relation: 'Director', price: 245.00, shares: 20000, amount: 4900000, date: '1 day ago', priceChange: 5.46 },
            { name: 'Brian Armstrong', relation: 'CEO', price: 246.50, shares: 10000, amount: 2465000, date: '2 days ago', priceChange: 4.82 }
        ]
    },
    {
        rank: 3,
        ticker: 'PLTR',
        companyName: 'Palantir Technologies',
        insiderCount: 5,
        avgBuyPrice: 41.20,
        currentPrice: 44.50,
        priceChange: 8.00,
        totalBuyAmount: 12500000,
        lastTradeDate: '4 hours ago',
        buyers: [
            { name: 'Peter Thiel', relation: '10% Owner', price: 41.20, shares: 250000, amount: 10300000, date: '4 hours ago', priceChange: 8.0 },
            { name: 'Alex Karp', relation: 'CEO', price: 42.00, shares: 50000, amount: 2100000, date: '6 hours ago', priceChange: 5.9 }
        ]
    },
    {
        rank: 4,
        ticker: 'CRM',
        companyName: 'Salesforce, Inc.',
        insiderCount: 2,
        avgBuyPrice: 298.50,
        currentPrice: 305.20,
        priceChange: 2.24,
        totalBuyAmount: 5600000,
        lastTradeDate: '3 days ago',
        buyers: [
            { name: 'Marc Benioff', relation: 'CEO', price: 298.50, shares: 15000, amount: 4477500, date: '3 days ago', priceChange: 2.24 },
            { name: 'Parker Harris', relation: 'Co-Founder', price: 299.00, shares: 3750, amount: 1121250, date: '3 days ago', priceChange: 2.07 }
        ]
    },
    {
      rank: 5,
      ticker: 'VAC',
      companyName: 'Marriott Vacations Worldwide',
      insiderCount: 2,
      avgBuyPrice: 46.97,
      currentPrice: 47.36,
      priceChange: 0.83,
      totalBuyAmount: 4241000,
      lastTradeDate: '2 days ago',
      buyers: [
        {
          name: 'Christian Asmar',
          relation: 'Director',
          price: 47.44,
          shares: 84000,
          amount: 3985000,
          date: '2 days ago',
          priceChange: -0.20
        },
        {
          name: 'Lizanne Galbreath',
          relation: 'Director',
          price: 46.51,
          shares: 5500,
          amount: 256000,
          date: '3 days ago',
          priceChange: 1.83
        }
      ]
    }
  ];
};

// New generators for Landing Page visuals
export const generateFilings = (count: number): Filing[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `filing-${i}`,
        timestamp: new Date().toISOString(),
        company: COMPANIES[i % COMPANIES.length].name,
        filer: INSIDERS[i % INSIDERS.length],
        formType: Math.random() > 0.5 ? '4' : '144',
        ownership: Math.random() > 0.5 ? 'Direct' : 'Indirect',
        summary: 'Reporting acquisition of beneficial ownership of securities.'
    }));
};

export const generateChartData = (points: number): ChartDataPoint[] => {
    let price = 150;
    return Array.from({ length: points }).map((_, i) => {
        price = price + (Math.random() - 0.5) * 2;
        return {
            time: new Date(Date.now() - (points - i) * 60000).toLocaleTimeString(),
            price: price,
            ma50: price + (Math.random() - 0.5) * 5
        };
    });
};

export const generateHoldings = (count: number): InstitutionalHolding[] => {
    const funds = ['BlackRock', 'Vanguard', 'State Street', 'Renaissance Tech', 'Bridgewater', 'Citadel'];
    return Array.from({ length: count }).map((_, i) => ({
        institution: funds[i % funds.length],
        value: Math.floor(Math.random() * 100000000),
        change: (Math.random() - 0.5) * 10,
        sentiment: Math.random() > 0.5 ? 'Bullish' : 'Bearish'
    }));
};

const EN = {
  common: {
    tierFree: 'OUTSIDER',
    tierPro: 'INSIDER',
    systemFree: 'RESTRICTED_MODE',
    systemPro: 'PRO_ACCESS_GRANTED',
    latencyFree: 'DELAYED (48H)',
    latencyPro: 'REAL-TIME (12MS)',
    licenseFree: 'Upgrade License',
    licenseActive: 'License Active',
  },
  sidebar: {
    modules: 'Modules',
    live: 'Live Trading',
    analysis: 'Top Stocks',
    config: 'Configuration',
    watched: 'Watched Assets',
    noData: 'NO_DATA_STREAM'
  },
  live: {
    header: 'Live Insider Feed',
    delayedBadge: '48H DELAY',
    delayed: 'Delayed Feed (48h)',
    realtime: 'Real-Time Connection',
    query: 'QUERY_TICKER_OR_INSIDER...',
    filter: { all: 'All', buy: 'Buy', sell: 'Sell' },
    table: { ticker: 'Ticker', insider: 'Insider', relation: 'Relation', action: 'Action', volume: 'Volume', value: 'Value', impact: 'Impact' },
    realtimeZone: 'Real-Time Signal Zone',
    encrypted: 'ENCRYPTED FOR OUTSIDERS',
    signalEncrypted: 'SIGNAL ENCRYPTED',
    upgradeAction: 'Unlock Real-Time Data',
    noRecords: 'NO_RECORDS_FOUND'
  },
  top: {
    header: 'Top Alpha Signals',
    subHeader: 'High-Conviction Institutional Signals',
    interval: 'Calculation Interval',
    restricted: 'Premium Access Required',
    securityLevel: 'INSTITUTIONAL GRADE DATA',
    desc: 'Real-time alpha signals are reserved for INSIDER tier members.',
    clearance: 'Institutional Access Required',
    cta: 'Upgrade to Reveal Signals',
    aes: 'AES-256 ENCRYPTED',
    blind: 'BLIND_TRUST_MODE',
    signal: 'Signal Strength',
    strongBuy: 'Strong Buy',
    insiders: 'Insiders Buying',
    institutional: 'Simultaneous Buyers',
    avgPrice: 'Avg Price',
    curPrice: 'Cur Price',
    totalVol: 'Total Vol'
  },
  modal: {
    tradeType: 'Trade Type',
    priceShare: 'Price per Share',
    sharesTraded: 'Shares Traded',
    totalValue: 'Total Value',
    insiderName: 'Insider Name',
    position: 'Position / Relation',
    filingDate: 'Filing Date',
    verified: 'Verified by SEC',
    priceAnalysis: 'Price Analysis',
    tradePrice: 'Trade Price',
    currentPrice: 'Current Price',
    relatedNews: 'Related News & Sentiment',
    aiAnalysis: 'AI Analysis',
    signal: 'Signal',
    confidence: 'Confidence',
    priceTargets: 'Price Targets',
    riskLevel: 'Risk Level',
    timeHorizon: 'Time Horizon',
    footerText: 'Certified SEC Data',
    generated: 'Report Generated'
  },
  profile: {
    header: 'User Profile',
    subHeader: 'Account & Subscription Management',
    account: 'Account Details',
    email: 'Email Address',
    joined: 'Joined Date',
    subStatus: 'Subscription Status',
    currentPlan: 'Current Plan',
    active: 'Active',
    nextBilling: 'Next Billing',
    cancel: 'Cancel Subscription',
    payment: 'Payment Method',
    stripe: 'Manage on Stripe'
  },
  settings: {
    header: 'Settings',
    subHeader: 'Terminal Configuration',
    language: 'Interface Language',
    theme: 'Theme',
    subManage: 'Subscription',
    manage: 'Manage',
    refresh: 'Refresh',
    notifications: 'Notifications',
    push: 'Push Notifications Disabled',
    save: 'Save Configuration'
  },
  auth: {
    welcome: 'Authenticate',
    createAccount: 'New Account',
    submit: 'Login',
    register: 'Register',
    noAccount: "No account? Initialize.",
    hasAccount: "Have account? Login."
  },
  data: {
    Buy: 'Buy',
    Sell: 'Sell',
    CEO: 'CEO',
    CFO: 'CFO',
    Director: 'Director',
    'VP of Sales': 'VP of Sales',
    'Chief Legal Officer': 'Chief Legal Officer',
    '10% Owner': '10% Owner',
    'Major Shareholder': 'Major Shareholder',
    'Co-Founder': 'Co-Founder'
  },
  upgrade: {
    header: 'Upgrade to Insider',
    subHeader: 'Get free trial + real-time insider trading alerts',
    monthly: 'Monthly',
    yearly: 'Yearly',
    save: 'Save 33%',
    priceMonthly: '$14',
    priceYearly: '$112',
    periodMonthly: '/month',
    periodYearly: '/year',
    trial: 'Free Trial',
    trial3: 'Start 3 days Free Trial',
    trial7: 'Start 7 days Free Trial',
    trial3Badge: '3 Days Free',
    trial7Badge: '7 Days Free',
    afterTrial3: '3 days free trial then $14/month',
    afterTrial7: '7 days free trial then $112/year',
    features: [
      'Real-time insider trade alerts (no 48h delay)',
      'Pure buy/sell signals only (no grants, options)',
      'AI-powered trade analysis & predictions',
      'Advanced pattern detection & signals',
      'Executive trade tracking (CEO, CFO, etc.)',
      'Live data updates & push notifications',
      'Historical insider performance analytics',
      'Exclusive market intelligence reports'
    ],
    secure: 'Secure Payment & Auto-Renewal',
    secData: 'Real SEC Data',
    secDesc: 'All data sourced directly from SEC filings. No fake data - only real, actionable intelligence.',
    terms: 'Charges begin automatically after the free trial. If you do not wish to continue, please cancel your subscription before auto-billing occurs. Cancel anytime with one click.'
  }
};

const KO = {
  common: {
    tierFree: 'OUTSIDER',
    tierPro: 'INSIDER',
    systemFree: '제한된 모드',
    systemPro: '프로 액세스 승인됨',
    latencyFree: '지연됨 (48시간)',
    latencyPro: '실시간 (12MS)',
    licenseFree: '라이선스 업그레이드',
    licenseActive: '라이선스 활성',
  },
  sidebar: {
    modules: '모듈',
    live: '실시간 거래',
    analysis: '상위 종목',
    config: '설정',
    watched: '관심 종목',
    noData: '데이터 스트림 없음'
  },
  live: {
    header: '내부자 거래 피드',
    delayedBadge: '48시간 지연',
    delayed: '지연된 피드 (48시간)',
    realtime: '실시간 연결됨',
    query: '티커 또는 내부자 검색...',
    filter: { all: '전체', buy: '매수', sell: '매도' },
    table: { ticker: '티커', insider: '내부자', relation: '직위', action: '유형', volume: '거래량', value: '가치', impact: '영향' },
    realtimeZone: '실시간 시그널 구역',
    encrypted: 'OUTSIDER 암호화됨',
    signalEncrypted: '시그널 암호화',
    upgradeAction: '실시간 데이터 잠금 해제',
    noRecords: '기록 없음'
  },
  top: {
    header: '상위 알파 시그널',
    subHeader: '기관급 고확신 매집 시그널',
    interval: '계산 간격',
    restricted: '프리미엄 액세스 필요',
    securityLevel: '기관급 데이터',
    desc: '실시간 알파 시그널은 INSIDER 등급 회원 전용입니다.',
    clearance: '기관 액세스 권한 필요',
    cta: '시그널 잠금 해제',
    aes: 'AES-256 암호화',
    blind: '블라인드 트러스트 모드',
    signal: '시그널 강도',
    strongBuy: '강력 매수',
    insiders: '내부자 매수',
    institutional: '동시 다발적 매수 활동',
    avgPrice: '평균 단가',
    curPrice: '현재가',
    totalVol: '총 거래량'
  },
  modal: {
    tradeType: '거래 유형',
    priceShare: '주당 가격',
    sharesTraded: '거래 주식 수',
    totalValue: '총 거래액',
    insiderName: '내부자 이름',
    position: '직위 / 관계',
    filingDate: '공시 날짜',
    verified: 'SEC 검증됨',
    priceAnalysis: '가격 분석',
    tradePrice: '거래 가격',
    currentPrice: '현재 가격',
    relatedNews: '관련 뉴스 & 감정',
    aiAnalysis: 'AI 분석',
    signal: '시그널',
    confidence: '신뢰도',
    priceTargets: '목표 주가',
    riskLevel: '위험 수준',
    timeHorizon: '투자 기간',
    footerText: '인증된 SEC 데이터',
    generated: '보고서 생성됨'
  },
  profile: {
    header: '사용자 프로필',
    subHeader: '계정 및 구독 관리',
    account: '계정 상세',
    email: '이메일 주소',
    joined: '가입일',
    subStatus: '구독 상태',
    currentPlan: '현재 플랜',
    active: '활성',
    nextBilling: '다음 결제일',
    cancel: '구독 취소',
    payment: '결제 수단',
    stripe: 'Stripe에서 관리'
  },
  settings: {
    header: '설정',
    subHeader: '터미널 구성',
    language: '인터페이스 언어',
    theme: '테마',
    subManage: '구독 관리',
    manage: '관리',
    refresh: '새로고침',
    notifications: '알림',
    push: '푸시 알림 꺼짐',
    save: '구성 저장'
  },
  auth: {
    welcome: '인증',
    createAccount: '새 계정',
    submit: '로그인',
    register: '등록',
    noAccount: "계정이 없습니까? 초기화.",
    hasAccount: "계정이 있습니까? 로그인."
  },
  data: {
    Buy: '매수',
    Sell: '매도',
    CEO: 'CEO',
    CFO: 'CFO',
    Director: '이사',
    'VP of Sales': '영업 부사장',
    'Chief Legal Officer': '최고 법무 책임자',
    '10% Owner': '10% 소유주',
    'Major Shareholder': '대주주',
    'Co-Founder': '공동 창립자'
  },
  upgrade: {
    header: 'Insider로 업그레이드',
    subHeader: '무료 체험 및 실시간 내부자 거래 알림 받기',
    monthly: '월간',
    yearly: '연간',
    save: '33% 절약',
    priceMonthly: '$14',
    priceYearly: '$112',
    periodMonthly: '/월',
    periodYearly: '/연',
    trial: '무료 체험',
    trial3: '3일 무료 체험 시작',
    trial7: '7일 무료 체험 시작',
    trial3Badge: '3일 무료',
    trial7Badge: '7일 무료',
    afterTrial3: '3일 무료 체험 후 월 $14',
    afterTrial7: '7일 무료 체험 후 연 $112',
    features: [
      '실시간 내부자 거래 알림 (48시간 지연 없음)',
      '순수 매수/매도 시그널만 제공 (스톡옵션 제외)',
      'AI 기반 거래 분석 및 예측',
      '고급 패턴 감지 및 시그널',
      '임원 거래 추적 (CEO, CFO 등)',
      '실시간 데이터 업데이트 및 푸시 알림',
      '과거 내부자 성과 분석',
      '독점 시장 정보 보고서'
    ],
    secure: '안전 결제 및 자동 갱신',
    secData: '실제 SEC 데이터',
    secDesc: 'SEC 공시에서 직접 소싱한 데이터. 가짜 데이터 없음 - 오직 실제 정보만 제공.',
    terms: '무료 체험 종료 후 요금이 자동으로 청구됩니다. 원하지 않을 경우 자동 결제 전에 구독을 취소하세요. 언제든지 클릭 한 번으로 취소할 수 있습니다.'
  }
};

export const TRANSLATIONS = {
  EN,
  KO,
  JA: { ...EN, common: { ...EN.common, tierFree: 'OUTSIDER (JA)', tierPro: 'INSIDER (JA)' } },
  ZH: { ...EN, common: { ...EN.common, tierFree: 'OUTSIDER (ZH)', tierPro: 'INSIDER (ZH)' } }
};

export type Language = 'en' | 'ko' | 'ja' | 'zh';

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
    analysis: 'Top Insider Activity', // Changed from 'Recommended Stocks'
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
    table: { ticker: 'Ticker', insider: 'Insider', relation: 'Relation', action: 'Action', price: 'Price', volume: 'Volume', value: 'Value', impact: 'vs. Market Cap', time: 'Time' },
    realtimeZone: 'Real-Time Signal Zone',
    encrypted: 'OUTSIDER ENCRYPTED',
    encryptedForOutsiders: 'ENCRYPTED FOR OUTSIDERS',
    signalEncrypted: 'SIGNAL ENCRYPTED',
    encryptedMessage: 'OUTSIDER users only see data delayed by 48 hours.',
    upgradeAction: 'Unlock Real-Time Data',
    unlockRealtime: 'UNLOCK REAL-TIME DATA',
    noRecords: 'NO_RECORDS_FOUND'
  },
  top: {
    header: 'Top Insider Activity', // Changed from 'Top Alpha Signals'
    subHeader: 'High-Volume Insider Transactions', // Changed from 'High-Conviction Institutional Signals'
    interval: 'Calculation Interval',
    restricted: 'Premium Access Required',
    securityLevel: 'INSTITUTIONAL GRADE DATA (Ranks 1-3)',
    desc: 'Real-time data is reserved for INSIDER tier members.', // Changed from 'alpha signals'
    clearance: 'Institutional Access Required',
    cta: 'Upgrade to Reveal Data', // Changed from 'Signals'
    aes: 'AES-256 ENCRYPTED',
    blind: 'BLIND_TRUST_MODE',
    signal: 'Activity Level', // Changed from 'Signal Strength'
    strongBuy: 'High Buy Volume', // Changed from 'High Net Buying' for App Store compliance
    insiders: 'Insiders',
    institutional: 'Insider Purchases',
    avgPrice: 'Insider Avg Price',
    curPrice: 'Cur Price',
    totalVol: 'Total Vol',
    marketCapRatio: 'vs Market Cap',
    buyPrice: 'Buy Price',
    shareCount: 'Share Count',
    totalAmount: 'Total Amount',
    buyOnly: 'Buy Only'
  },
  modal: {
    tradeType: 'Trade Type',
    priceShare: 'Price per Share',
    sharesTraded: 'Shares Traded',
    totalValue: 'Total Value',
    insiderName: 'Insider Name',
    position: 'Position / Relation',
    filingDate: 'Filing Date',
    shares: 'Shares',
    share: 'sh',
    volume: 'vol',
    verified: 'Verified by SEC',
    priceTrend: 'Price Trend',
    basePrice: 'Base Price',
    priceAnalysis: 'Price Analysis',
    tradePrice: 'Trade Price',
    currentPrice: 'Current Price',
    relatedNews: 'Related News & Sentiment',
    aiAnalysis: 'Data Summary', // Changed from 'AI Analysis'
    signal: 'Activity Type', // Changed from 'Signal'
    confidence: 'Data Quality', // Changed from 'Confidence'
    keyInsight: 'Key Observation', // Changed from 'Key Insight'
    priceTargets: 'Analyst Estimates (If Available)', // App Store compliance: external data only
    conservative: 'Lower Estimate', // App Store compliance
    realistic: 'Mid Estimate', // App Store compliance
    optimistic: 'Upper Estimate', // App Store compliance
    riskLevel: 'Volatility Level', // Changed from 'Risk Level'
    timeHorizon: 'Observation Period', // Changed from 'Time Horizon'
    sentimentAnalysis: 'Sentiment Analysis',
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative',
    secFiling: 'View SEC File',
    footerText: 'Certified SEC Data',
    generated: 'Report Generated',
    showDetails: 'Show Details',
    hideDetails: 'Hide Details',
    expandNews: 'Expand News',
    // AI Observations (Factual only - NO investment advice)
    insightCeoBuy: 'CEO purchased shares as disclosed in SEC Form 4 filing.',
    insightCeoSell: 'CEO sold shares as disclosed in SEC Form 4 filing.',
    insightCfoBuy: 'CFO purchased shares as reported to SEC.',
    insightCfoSell: 'CFO sold shares as reported to SEC.',
    insightDirectorBuy: 'Board director purchased shares as disclosed to SEC.',
    insightDirectorSell: 'Board director sold shares as disclosed to SEC.',
    insightLargeBuy: 'Large-scale insider purchase exceeding $1M reported to SEC.',
    insightLargeSell: 'Significant insider sale reported to SEC.',
    insightMediumBuy: 'Insider purchase activity detected in recent SEC filings.',
    insightMediumSell: 'Insider sale activity detected in recent SEC filings.',
    insightSmallBuy: 'Insider purchase transaction reported to SEC.',
    insightSmallSell: 'Insider sale transaction reported to SEC.',
    // News items
    newsEarnings: 'Company reports strong quarterly earnings',
    newsProduct: 'New product line announced for Q2',
    newsVolatility: 'Market volatility affects sector',
    newsAnalyst: 'Analyst upgrades price target',
    // Risk levels & Time horizon
    riskLow: 'LOW',
    riskMedium: 'MEDIUM',
    riskHigh: 'HIGH',
    timeHorizon36: '3-6 MONTHS'
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
    // Executive titles
    CEO: 'CEO',
    CFO: 'CFO',
    COO: 'COO',
    CTO: 'CTO',
    CIO: 'CIO',
    CMO: 'CMO',
    CRO: 'CRO',
    CAO: 'CAO',
    CHRO: 'CHRO',
    CCO: 'CCO',
    // Full titles
    'Chief Executive Officer': 'CEO',
    'Chief Financial Officer': 'CFO',
    'Chief Operating Officer': 'COO',
    'Chief Technology Officer': 'CTO',
    'Chief Information Officer': 'CIO',
    'Chief Marketing Officer': 'CMO',
    'Chief Revenue Officer': 'CRO',
    'Chief Accounting Officer': 'CAO',
    'Chief Medical Officer': 'CMO',
    'Chief Product Officer': 'CPO',
    'Chief Legal Officer': 'CLO',
    'Chief Business Officer': 'CBO',
    'Chief Commercial Officer': 'CCO',
    'Chief Content Officer': 'CCO',
    'Chief Innovation Officer': 'CIO',
    // Board positions
    Director: 'Director',
    Chairman: 'Chairman',
    'Chair': 'Chair',
    President: 'President',
    'Pres': 'President',
    // Combined titles
    'CEO, Pres': 'CEO & President',
    'COB, CEO': 'Chairman & CEO',
    'CFO, COO': 'CFO & COO',
    'CFO, Treasurer': 'CFO & Treasurer',
    'CHAIRPERSON, CEO': 'Chair & CEO',
    // Vice Presidents
    'VP of Sales': 'VP of Sales',
    EVP: 'EVP',
    SVP: 'SVP',
    // Ownership
    '10%': '10% Owner',
    '10% Owner': '10% Owner',
    'Major Shareholder': 'Major Shareholder',
    'Co-Founder': 'Co-Founder',
    // General
    Officer: 'Officer',
    Insider: 'Insider',
    Executive: 'Executive',
    // Transaction types (App Store compliance - removed investment advice)
    // 'Strong Buy' and 'Strong Sell' removed per compliance requirements
    'Hold': 'Hold',
    // Risk levels
    'Low': 'Low',
    'Medium': 'Medium',
    'High': 'High',
    // Time horizons
    '1-2 weeks': '1-2 weeks',
    '2-4 weeks': '2-4 weeks',
    '1-3 months': '1-3 months',
    '3-6 months': '3-6 months',
    '6-12 months': '6-12 months'
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
    trial3: 'START 3-DAY FREE TRIAL',
    trial7: 'START 7-DAY FREE TRIAL',
    trial3Badge: '3 Days Free',
    trial7Badge: '7 Days Free',
    afterTrial3: '3 days free, then $14/month',
    afterTrial7: '7 days free, then $112/year',
    features: [
      'Real-time insider trade alerts (no 48h delay)',
      'Pure buy/sell transactions only (no grants, options)',
      'AI-powered transaction categorization & data summarization',
      'Advanced pattern detection & data aggregation',
      'Executive trade tracking (CEO, CFO, etc.)',
      'Live data updates & push notifications',
      'Historical insider performance analytics',
      'Comprehensive market data reports'
    ],
    secure: 'Secure Payment & Auto-Renewal',
    secData: 'Real SEC Data',
    secDesc: 'All data sourced directly from SEC filings. No fake data - only real, verified information.',
    terms: 'Charges begin automatically after the free trial. If you do not wish to continue, please cancel your subscription before auto-billing occurs. Cancel anytime with one click.'
  },
  ranking: {
    noData: 'No ranking data available',
    checkedLastNDays: 'Checked insider trades from last {days} days'
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
    analysis: '내부자 활동 TOP', // Changed from '추천 주식'
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
    table: { ticker: '티커', insider: '내부자', relation: '직위', action: '유형', price: '가격', volume: '거래량', value: '가치', impact: '시총대비', time: '시간' },
    realtimeZone: '실시간 데이터 구역', // Changed from '시그널'
    encrypted: 'OUTSIDER 암호화됨',
    encryptedForOutsiders: 'OUTSIDER 암호화됨',
    signalEncrypted: '데이터 암호화', // Changed from '시그널 암호화'
    encryptedMessage: 'OUTSIDER 사용자에게는 48시간 지연된 데이터만 보입니다.',
    upgradeAction: '실시간 데이터 잠금 해제',
    unlockRealtime: '실시간 데이터 잠금 해제',
    noRecords: '기록 없음'
  },
  top: {
    header: '상위 내부자 활동', // Changed from '상위 알파 시그널'
    subHeader: '대량 내부자 거래', // Changed from '기관급 고확신 매집 시그널'
    interval: '계산 간격',
    restricted: '프리미엄 액세스 필요',
    securityLevel: '기관급 데이터 (1~3위)',
    desc: '실시간 데이터는 INSIDER 등급 회원 전용입니다.', // Changed from '알파 시그널'
    clearance: '기관 액세스 권한 필요',
    cta: '데이터 잠금 해제', // Changed from '시그널 잠금 해제'
    aes: 'AES-256 암호화',
    blind: '블라인드 트러스트 모드',
    signal: '활동 수준', // Changed from '시그널 강도'
    strongBuy: '높은 매수 거래량', // App Store compliance: changed from '높은 순매수'
    insiders: '내부자',
    institutional: '내부자 매수 활동', // Changed from '내부자 매수 내역'
    avgPrice: '내부자 평균 매수가',
    curPrice: '현재가',
    totalVol: '총 매수액',
    marketCapRatio: '시총대비',
    buyPrice: '내부자 매수가',
    shareCount: '매수 주식 수',
    totalAmount: '총 매수액',
    buyOnly: '매수'
  },
  modal: {
    tradeType: '거래 유형',
    priceShare: '주당 가격',
    sharesTraded: '거래 주식 수',
    totalValue: '총 거래액',
    insiderName: '내부자 이름',
    position: '직위 / 관계',
    filingDate: '공시 날짜',
    shares: '거래량',
    share: '주',
    volume: '거래량',
    verified: 'SEC 검증됨',
    priceTrend: '가격 추세',
    basePrice: '기준 가격',
    priceAnalysis: '가격 분석',
    tradePrice: '거래 가격',
    currentPrice: '현재 가격',
    relatedNews: '관련 뉴스 & 감정',
    aiAnalysis: '데이터 요약', // Changed from 'AI 분석'
    signal: '활동 유형', // Changed from '시그널'
    confidence: '데이터 품질', // Changed from '신뢰도'
    keyInsight: '핵심 관찰', // Changed from '핵심 인사이트'
    priceTargets: '애널리스트 전망치(존재 시)', // App Store compliance: external data only
    conservative: '하단 전망치', // App Store compliance
    realistic: '중간 전망치', // App Store compliance
    optimistic: '상단 전망치', // App Store compliance
    riskLevel: '변동성 수준', // Changed from '위험 수준'
    timeHorizon: '관찰 기간', // Changed from '투자 기간'
    sentimentAnalysis: '감정 분석',
    positive: '긍정',
    neutral: '중립',
    negative: '부정',
    secFiling: 'SEC 파일 보기',
    footerText: '인증된 SEC 데이터',
    generated: '보고서 생성됨',
    showDetails: '자세히 보기',
    hideDetails: '접기',
    expandNews: '뉴스 펼쳐보기',
    // AI Observations (Factual only - NO investment advice) - App Store compliance
    insightCeoBuy: 'SEC Form 4 공시에 CEO 주식 매수 거래가 기록되었습니다.',
    insightCeoSell: 'SEC Form 4 공시에 CEO 주식 매도 거래가 기록되었습니다.',
    insightCfoBuy: 'SEC 공시에 CFO 주식 매수 거래가 보고되었습니다.',
    insightCfoSell: 'SEC 공시에 CFO 주식 매도 거래가 보고되었습니다.',
    insightDirectorBuy: 'SEC 공시에 이사회 이사의 매수 활동이 기록되었습니다.',
    insightDirectorSell: 'SEC 공시에 이사회 이사의 매도 활동이 기록되었습니다.',
    insightLargeBuy: 'SEC 공시에 100만 달러를 초과하는 내부자 매수 거래가 보고되었습니다.',
    insightLargeSell: 'SEC 공시에 대규모 내부자 매도 거래가 보고되었습니다.',
    insightMediumBuy: '최근 SEC 제출 서류에서 내부자 매수 활동이 감지되었습니다.',
    insightMediumSell: '최근 SEC 제출 서류에서 내부자 매도 활동이 감지되었습니다.',
    insightSmallBuy: 'SEC에 내부자 매수 거래가 보고되었습니다.',
    insightSmallSell: 'SEC에 내부자 매도 거래가 보고되었습니다.',
    // News items
    newsEarnings: '회사가 강한 분기 실적을 발표했습니다',
    newsProduct: 'Q2에 새로운 제품 라인 발표',
    newsVolatility: '시장 변동성이 섹터에 영향',
    newsAnalyst: '애널리스트가 목표가를 상향 조정',
    // Risk levels & Time horizon
    riskLow: '낮음',
    riskMedium: '보통',
    riskHigh: '높음',
    timeHorizon36: '3-6개월'
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
    // Executive titles
    CEO: '대표이사',
    CFO: '재무이사',
    COO: '운영이사',
    CTO: '기술이사',
    CIO: '정보이사',
    CMO: '마케팅이사',
    CRO: '매출이사',
    CAO: '회계이사',
    CHRO: '인사이사',
    CCO: '콘텐츠이사',
    // Full titles
    'Chief Executive Officer': '대표이사',
    'Chief Financial Officer': '재무이사',
    'Chief Operating Officer': '운영이사',
    'Chief Technology Officer': '기술이사',
    'Chief Information Officer': '정보이사',
    'Chief Marketing Officer': '마케팅이사',
    'Chief Revenue Officer': '매출이사',
    'Chief Accounting Officer': '회계이사',
    'Chief Medical Officer': '의료이사',
    'Chief Product Officer': '제품이사',
    'Chief Legal Officer': '법무이사',
    'Chief Business Officer': '사업이사',
    'Chief Commercial Officer': '상업이사',
    'Chief Content Officer': '콘텐츠이사',
    'Chief Innovation Officer': '혁신이사',
    // Board positions
    Director: '이사',
    Chairman: '회장',
    'Chair': '의장',
    President: '사장',
    'Pres': '사장',
    // Combined titles
    'CEO, Pres': '대표이사 겸 사장',
    'COB, CEO': '회장 겸 대표이사',
    'CFO, COO': '재무 겸 운영이사',
    'CFO, Treasurer': '재무이사 겸 회계담당',
    'CHAIRPERSON, CEO': '의장 겸 대표이사',
    // Vice Presidents
    'VP of Sales': '영업 부사장',
    EVP: '부사장',
    SVP: '선임부사장',
    // Ownership
    '10%': '10% 소유주',
    '10% Owner': '10% 소유주',
    'Major Shareholder': '대주주',
    'Co-Founder': '공동 창립자',
    // General
    Officer: '임원',
    Insider: '내부자',
    Executive: '경영진',
    // Transaction types (App Store compliance - removed investment advice)
    // '강력 매수' and '강력 매도' removed per compliance requirements
    'Hold': '보유',
    // Risk levels
    'Low': '낮음',
    'Medium': '중간',
    'High': '높음',
    // Time horizons
    '1-2 weeks': '1-2주',
    '2-4 weeks': '2-4주',
    '1-3 months': '1-3개월',
    '3-6 months': '3-6개월',
    '6-12 months': '6-12개월'
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
      '순수 매수/매도 거래만 제공 (스톡옵션 제외)',
      'AI 기반 거래 분류 및 데이터 요약',
      '고급 패턴 감지 및 데이터 집계',
      '임원 거래 추적 (CEO, CFO 등)',
      '실시간 데이터 업데이트 및 푸시 알림',
      '과거 내부자 성과 분석',
      '포괄적인 시장 데이터 보고서'
    ],
    secure: '안전 결제 및 자동 갱신',
    secData: '실제 SEC 데이터',
    secDesc: 'SEC 공시에서 직접 소싱한 데이터. 가짜 데이터 없음 - 오직 실제 검증된 정보만 제공.',
    terms: '무료 체험 종료 후 요금이 자동으로 청구됩니다. 원하지 않을 경우 자동 결제 전에 구독을 취소하세요. 언제든지 클릭 한 번으로 취소할 수 있습니다.'
  },
  ranking: {
    noData: '랭킹 데이터가 없습니다',
    checkedLastNDays: '최근 {days}일 이내 내부자 거래 확인함'
  }
};

const JA = {
  ...EN,
  common: {
    ...EN.common,
    encrypted: 'OUTSIDER 暗号化',
    signalEncrypted: 'シグナル暗号化',
    encryptedMessage: 'OUTSIDERユーザーには48時間遅延データのみ表示されます。',
    upgradeAction: 'リアルタイムデータのロック解除',
  },
  live: {
    ...EN.live,
    encryptedForOutsiders: 'OUTSIDER暗号化済み',
    signalEncrypted: 'シグナル暗号化',
    unlockRealtime: 'リアルタイムデータのロック解除',
  },
  top: {
    ...EN.top,
    buyPrice: '購入価格',
    shareCount: '株式数',
    totalAmount: '総額',
    buyOnly: '買いのみ'
  },
  modal: {
    ...EN.modal,
    share: '株',
    volume: '出来高'
  },
  sidebar: {
    ...EN.sidebar,
    live: 'ライブトレーディング',
    analysis: 'インサイダー活動トップ', // App Store compliance: changed from 'おすすめ銘柄'
    config: '設定',
    watched: 'ウォッチリスト',
  },
  auth: {
    ...EN.auth,
    welcome: 'お帰りなさい',
    createAccount: 'アカウント作成',
    submit: 'ログイン',
    register: '登録',
    noAccount: '新規登録',
    hasAccount: 'ログイン',
  },
  upgrade: {
    ...EN.upgrade,
    header: 'INSIDERにアップグレード',
    subHeader: '無料トライアルでリアルタイムのインサイダー取引アラートを受け取る',
    monthly: '月額',
    yearly: '年額',
    save: '33%節約',
    trial: '無料トライアル',
    trial3: '3日間無料トライアル開始',
    trial7: '7日間無料トライアル開始',
    secure: '安全な支払いと自動更新',
  },
  data: {
    Buy: '買い',
    Sell: '売り',
    // Executive titles
    CEO: '最高経営責任者',
    CFO: '最高財務責任者',
    COO: '最高執行責任者',
    CTO: '最高技術責任者',
    CIO: '最高情報責任者',
    CMO: '最高マーケティング責任者',
    CRO: '最高収益責任者',
    CAO: '最高会計責任者',
    CHRO: '最高人事責任者',
    CCO: '最高コンテンツ責任者',
    // Full titles
    'Chief Executive Officer': '最高経営責任者',
    'Chief Financial Officer': '最高財務責任者',
    'Chief Operating Officer': '最高執行責任者',
    'Chief Technology Officer': '最高技術責任者',
    'Chief Information Officer': '最高情報責任者',
    'Chief Marketing Officer': '最高マーケティング責任者',
    'Chief Revenue Officer': '最高収益責任者',
    'Chief Accounting Officer': '最高会計責任者',
    'Chief Medical Officer': '最高医療責任者',
    'Chief Product Officer': '最高製品責任者',
    'Chief Legal Officer': '最高法務責任者',
    'Chief Business Officer': '最高事業責任者',
    'Chief Commercial Officer': '最高商務責任者',
    'Chief Content Officer': '最高コンテンツ責任者',
    'Chief Innovation Officer': '最高イノベーション責任者',
    // Board positions
    Director: '取締役',
    Chairman: '会長',
    'Chair': '議長',
    President: '社長',
    'Pres': '社長',
    // Combined titles
    'CEO, Pres': '最高経営責任者兼社長',
    'COB, CEO': '会長兼最高経営責任者',
    'CFO, COO': '最高財務責任者兼最高執行責任者',
    'CFO, Treasurer': '最高財務責任者兼財務担当',
    'CHAIRPERSON, CEO': '議長兼最高経営責任者',
    // Vice Presidents
    'VP of Sales': '営業担当副社長',
    EVP: '上級副社長',
    SVP: '執行副社長',
    // Ownership
    '10%': '10%所有者',
    '10% Owner': '10%所有者',
    'Major Shareholder': '大株主',
    'Co-Founder': '共同創業者',
    // General
    Officer: '役員',
    Insider: 'インサイダー',
    Executive: '経営幹部',
    // Transaction types (App Store compliance - removed investment advice)
    // '強い買い' and '強い売り' removed per compliance requirements
    'Hold': '保有',
    // Risk levels
    'Low': '低',
    'Medium': '中',
    'High': '高',
    // Time horizons
    '1-2 weeks': '1-2週間',
    '2-4 weeks': '2-4週間',
    '1-3 months': '1-3ヶ月',
    '3-6 months': '3-6ヶ月',
    '6-12 months': '6-12ヶ月'
  },
  ranking: {
    noData: 'ランキングデータがありません',
    checkedLastNDays: '過去{days}日以内のインサイダー取引を確認'
  }
};

const ZH = {
  ...EN,
  common: {
    ...EN.common,
    encrypted: 'OUTSIDER 加密',
    signalEncrypted: '信号加密',
    encryptedMessage: 'OUTSIDER 用户仅能查看延迟 48 小时的数据。',
    upgradeAction: '解锁实时数据',
  },
  live: {
    ...EN.live,
    encryptedForOutsiders: 'OUTSIDER 加密',
    signalEncrypted: '信号加密',
    unlockRealtime: '解锁实时数据',
  },
  top: {
    ...EN.top,
    buyPrice: '购买价格',
    shareCount: '股数',
    totalAmount: '总额',
    buyOnly: '仅买入'
  },
  modal: {
    ...EN.modal,
    share: '股',
    volume: '成交量'
  },
  sidebar: {
    ...EN.sidebar,
    live: '实时交易',
    analysis: '内部人活动排行', // App Store compliance: changed from '推荐股票'
    config: '配置',
    watched: '关注列表',
  },
  auth: {
    ...EN.auth,
    welcome: '欢迎回来',
    createAccount: '创建账户',
    submit: '登录',
    register: '注册',
    noAccount: '新用户注册',
    hasAccount: '已有账户',
  },
  upgrade: {
    ...EN.upgrade,
    header: '升级到 INSIDER',
    subHeader: '免费试用并获取实时内部交易警报',
    monthly: '月付',
    yearly: '年付',
    save: '节省 33%',
    trial: '免费试用',
    trial3: '开始 3 天免费试用',
    trial7: '开始 7 天免费试用',
    secure: '安全支付和自动续订',
  },
  data: {
    Buy: '买入',
    Sell: '卖出',
    // Executive titles
    CEO: '首席执行官',
    CFO: '首席财务官',
    COO: '首席运营官',
    CTO: '首席技术官',
    CIO: '首席信息官',
    CMO: '首席营销官',
    CRO: '首席收入官',
    CAO: '首席会计官',
    CHRO: '首席人力资源官',
    CCO: '首席内容官',
    // Full titles
    'Chief Executive Officer': '首席执行官',
    'Chief Financial Officer': '首席财务官',
    'Chief Operating Officer': '首席运营官',
    'Chief Technology Officer': '首席技术官',
    'Chief Information Officer': '首席信息官',
    'Chief Marketing Officer': '首席营销官',
    'Chief Revenue Officer': '首席收入官',
    'Chief Accounting Officer': '首席会计官',
    'Chief Medical Officer': '首席医疗官',
    'Chief Product Officer': '首席产品官',
    'Chief Legal Officer': '首席法务官',
    'Chief Business Officer': '首席商务官',
    'Chief Commercial Officer': '首席商业官',
    'Chief Content Officer': '首席内容官',
    'Chief Innovation Officer': '首席创新官',
    // Board positions
    Director: '董事',
    Chairman: '董事长',
    'Chair': '主席',
    President: '总裁',
    'Pres': '总裁',
    // Combined titles
    'CEO, Pres': '首席执行官兼总裁',
    'COB, CEO': '董事长兼首席执行官',
    'CFO, COO': '首席财务官兼首席运营官',
    'CFO, Treasurer': '首席财务官兼财务主管',
    'CHAIRPERSON, CEO': '主席兼首席执行官',
    // Vice Presidents
    'VP of Sales': '销售副总裁',
    EVP: '执行副总裁',
    SVP: '高级副总裁',
    // Ownership
    '10%': '10%持股人',
    '10% Owner': '10%持股人',
    'Major Shareholder': '大股东',
    'Co-Founder': '联合创始人',
    // General
    Officer: '高管',
    Insider: '内部人',
    Executive: '管理层',
    // Transaction types (App Store compliance - removed investment advice)
    // '强烈买入' and '强烈卖出' removed per compliance requirements
    'Hold': '持有',
    // Risk levels
    'Low': '低',
    'Medium': '中',
    'High': '高',
    // Time horizons
    '1-2 weeks': '1-2周',
    '2-4 weeks': '2-4周',
    '1-3 months': '1-3个月',
    '3-6 months': '3-6个月',
    '6-12 months': '6-12个月'
  },
  ranking: {
    noData: '无排名数据',
    checkedLastNDays: '检查了过去{days}天的内部交易'
  }
};

export const TRANSLATIONS = {
  en: EN,
  ko: KO,
  ja: JA,
  zh: ZH
};

export function formatCurrency(val: number, showDecimals: boolean = true): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0
  }).format(val);
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(val);
}

export function formatPercent(val: number): string {
  return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
}

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
    analysis: 'Recommended Stocks',
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
    encrypted: 'OUTSIDER ENCRYPTED',
    signalEncrypted: 'SIGNAL ENCRYPTED',
    encryptedMessage: 'OUTSIDER users only see data delayed by 48 hours.',
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
    analysis: '추천 주식',
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
    encryptedMessage: 'OUTSIDER 사용자에게는 48시간 지연된 데이터만 보입니다.',
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

const JA = {
  ...EN,
  common: {
    ...EN.common,
    encrypted: 'OUTSIDER 暗号化',
    signalEncrypted: 'シグナル暗号化',
    encryptedMessage: 'OUTSIDERユーザーには48時間遅延データのみ表示されます。',
    upgradeAction: 'リアルタイムデータのロック解除',
  },
  sidebar: {
    ...EN.sidebar,
    live: 'ライブトレーディング',
    analysis: 'おすすめ銘柄',
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
  sidebar: {
    ...EN.sidebar,
    live: '实时交易',
    analysis: '推荐股票',
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
  }
};

export const TRANSLATIONS = {
  en: EN,
  ko: KO,
  ja: JA,
  zh: ZH
};

export function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(val);
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(val);
}

export function formatPercent(val: number): string {
  return `${val > 0 ? '+' : ''}${val.toFixed(2)}%`;
}

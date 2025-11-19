import React, { useState, useEffect } from 'react';
import { AlertTriangle, Star, Users, Zap, Brain, Target, Bell, DollarSign, BarChart3, Shield, Copy, ExternalLink, Calculator, Timer, Eye, Bookmark, Mail, Check, X, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, Treemap, Sankey } from 'recharts';
import { useLanguage } from '@/contexts/language-context';

const EnhancedInsiderTradingDashboard = () => {
  const { t, language } = useLanguage();
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trades');
  const [alertsCount, setAlertsCount] = useState(3);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [watchlist, setWatchlist] = useState(['AAPL', 'TSLA']); // 기본 워치리스트
  const [userEmail] = useState('user@example.com'); // 실제로는 로그인 정보에서 가져옴
  const [selectedCompanyForAlert, setSelectedCompanyForAlert] = useState('');
  const [displayedTradesCount, setDisplayedTradesCount] = useState(50); // 초기 50개 표시
  const [chartAnimationKey, setChartAnimationKey] = useState(0);

  // 차트 색상 팔레트
  const chartColors = {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#06B6D4',
    purple: '#8B5CF6',
    pink: '#EC4899',
    gradient: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4']
  };

  // 가격 추이 차트 데이터
  const priceChartData = [
    { date: '2024-09-20', AAPL: 191.45, TSLA: 248.75, NVDA: 875.28, META: 312.80, MSFT: 425.60, AMZN: 175.30 },
    { date: '2024-09-21', AAPL: 192.10, TSLA: 250.20, NVDA: 882.15, META: 315.40, MSFT: 428.30, AMZN: 176.80 },
    { date: '2024-09-22', AAPL: 190.85, TSLA: 252.40, NVDA: 879.50, META: 318.20, MSFT: 430.10, AMZN: 178.50 },
    { date: '2024-09-23', AAPL: 189.30, TSLA: 255.80, NVDA: 865.30, META: 322.10, MSFT: 432.80, AMZN: 180.20 },
    { date: '2024-09-24', AAPL: 191.80, TSLA: 258.20, NVDA: 857.60, META: 325.50, MSFT: 434.20, AMZN: 181.90 },
    { date: '2024-09-25', AAPL: 189.90, TSLA: 262.10, NVDA: 849.80, META: 329.80, MSFT: 436.50, AMZN: 183.45 },
    { date: '2024-09-26', AAPL: 188.50, TSLA: 265.80, NVDA: 834.20, META: 334.20, MSFT: 431.80, AMZN: 183.45 },
    { date: '2024-09-27', AAPL: 189.23, TSLA: 265.80, NVDA: 834.20, META: 334.20, MSFT: 431.80, AMZN: 183.45 }
  ];

  // 거래량 및 영향도 분석 데이터
  const impactAnalysisData = [
    { company: 'AAPL', tradeValue: 98.0, impact: -5.2, confidence: 87, riskLevel: 8 },
    { company: 'TSLA', tradeValue: 12.4, impact: 8.5, confidence: 91, riskLevel: 2 },
    { company: 'NVDA', tradeValue: 105.0, impact: -4.8, confidence: 79, riskLevel: 6 },
    { company: 'META', tradeValue: 23.5, impact: 6.8, confidence: 93, riskLevel: 3 },
    { company: 'MSFT', tradeValue: 10.6, impact: 1.2, confidence: 68, riskLevel: 4 },
    { company: 'AMZN', tradeValue: 0, impact: 4.5, confidence: 85, riskLevel: 2 }
  ];

  // 섹터별 내부자 거래 분포
  const sectorDistributionData = [
    { name: 'Technology', value: 45, count: 156 },
    { name: 'Healthcare', value: 20, count: 68 },
    { name: 'Financial', value: 15, count: 52 },
    { name: 'Consumer', value: 12, count: 41 },
    { name: 'Energy', value: 5, count: 17 },
    { name: 'Industrial', value: 3, count: 10 }
  ];

  // AI 예측 정확도 추이
  const accuracyTrendData = [
    { week: 'W1', accuracy: 85.2, predictions: 45 },
    { week: 'W2', accuracy: 87.8, predictions: 52 },
    { week: 'W3', accuracy: 89.5, predictions: 48 },
    { week: 'W4', accuracy: 91.2, predictions: 61 },
    { week: 'W5', accuracy: 88.9, predictions: 55 },
    { week: 'W6', accuracy: 93.1, predictions: 58 },
    { week: 'W7', accuracy: 91.8, predictions: 62 }
  ];

  // 거래 유형별 성과 분석
  const tradeTypePerformanceData = [
    { type: 'CEO Buy', avgReturn: 7.2, successRate: 78, count: 15 },
    { type: 'CEO Sell', avgReturn: -4.8, successRate: 82, count: 23 },
    { type: 'CFO Buy', avgReturn: 4.5, successRate: 71, count: 12 },
    { type: 'CFO Sell', avgReturn: -2.1, successRate: 68, count: 18 },
    { type: 'Director Buy', avgReturn: 3.8, successRate: 65, count: 34 },
    { type: 'Option Exercise', avgReturn: 1.2, successRate: 55, count: 28 }
  ];

  // 시장 시간대별 거래 패턴
  const timePatternData = [
    { hour: '09:00', buyCount: 12, sellCount: 8, totalValue: 45.2 },
    { hour: '10:00', buyCount: 15, sellCount: 11, totalValue: 62.8 },
    { hour: '11:00', buyCount: 18, sellCount: 14, totalValue: 78.5 },
    { hour: '12:00', buyCount: 9, sellCount: 7, totalValue: 34.1 },
    { hour: '13:00', buyCount: 11, sellCount: 9, totalValue: 41.7 },
    { hour: '14:00', buyCount: 22, sellCount: 16, totalValue: 95.3 },
    { hour: '15:00', buyCount: 28, sellCount: 19, totalValue: 112.6 },
    { hour: '16:00', buyCount: 35, sellCount: 25, totalValue: 138.9 }
  ];

  // 리스크-수익률 매트릭스 데이터
  const riskReturnData = trades.map(trade => ({
    x: trade.riskLevel,
    y: parseFloat(trade.impactPrediction.replace('%', '')),
    z: trade.totalValue / 1000000, // 백만달러 단위
    company: trade.ticker,
    color: trade.tradeType === 'Buy' || trade.tradeType === 'Purchase' ? chartColors.success : chartColors.danger
  }));

  // 통합 비교 차트 데이터 (정규화된 값)
  const comparisonChartData = [
    {
      date: '2024-09-20',
      marketCap: 85,
      tradeVolume: 45,
      aiAccuracy: 85.2,
      riskLevel: 65,
      confidence: 87
    },
    {
      date: '2024-09-21',
      marketCap: 87,
      tradeVolume: 52,
      aiAccuracy: 87.8,
      riskLevel: 62,
      confidence: 89
    },
    {
      date: '2024-09-22',
      marketCap: 82,
      tradeVolume: 48,
      aiAccuracy: 89.5,
      riskLevel: 58,
      confidence: 91
    },
    {
      date: '2024-09-23',
      marketCap: 78,
      tradeVolume: 61,
      aiAccuracy: 91.2,
      riskLevel: 55,
      confidence: 93
    },
    {
      date: '2024-09-24',
      marketCap: 80,
      tradeVolume: 55,
      aiAccuracy: 88.9,
      riskLevel: 60,
      confidence: 88
    },
    {
      date: '2024-09-25',
      marketCap: 83,
      tradeVolume: 58,
      aiAccuracy: 93.1,
      riskLevel: 52,
      confidence: 95
    },
    {
      date: '2024-09-26',
      marketCap: 85,
      tradeVolume: 62,
      aiAccuracy: 91.8,
      riskLevel: 54,
      confidence: 94
    }
  ];

  // 회사 로고 데이터 - 다중 소스로 안정성 확보
  const companyLogos = {
    'AAPL': [
      'https://logo.clearbit.com/apple.com',
      'https://companiesmarketcap.com/img/company-logos/64/AAPL.webp',
      'https://logos-world.net/wp-content/uploads/2020/04/Apple-Logo.png'
    ],
    'TSLA': [
      'https://logo.clearbit.com/tesla.com',
      'https://companiesmarketcap.com/img/company-logos/64/TSLA.webp',
      'https://logos-world.net/wp-content/uploads/2021/01/Tesla-Logo.png'
    ],
    'NVDA': [
      'https://logo.clearbit.com/nvidia.com',
      'https://companiesmarketcap.com/img/company-logos/64/NVDA.webp',
      'https://logos-world.net/wp-content/uploads/2020/09/Nvidia-Logo.png'
    ],
    'META': [
      'https://logo.clearbit.com/meta.com',
      'https://companiesmarketcap.com/img/company-logos/64/META.webp',
      'https://logos-world.net/wp-content/uploads/2021/11/Meta-Logo.png'
    ],
    'MSFT': [
      'https://logo.clearbit.com/microsoft.com',
      'https://companiesmarketcap.com/img/company-logos/64/MSFT.webp',
      'https://logos-world.net/wp-content/uploads/2020/04/Microsoft-Logo.png'
    ],
    'AMZN': [
      'https://logo.clearbit.com/amazon.com',
      'https://companiesmarketcap.com/img/company-logos/64/AMZN.webp',
      'https://logos-world.net/wp-content/uploads/2020/04/Amazon-Logo.png'
    ],
    'GOOGL': [
      'https://logo.clearbit.com/google.com',
      'https://companiesmarketcap.com/img/company-logos/64/GOOGL.webp',
      'https://logos-world.net/wp-content/uploads/2020/09/Google-Logo.png'
    ],
    'NFLX': [
      'https://logo.clearbit.com/netflix.com',
      'https://companiesmarketcap.com/img/company-logos/64/NFLX.webp',
      'https://logos-world.net/wp-content/uploads/2020/04/Netflix-Logo.png'
    ]
  };

  // 로고 로딩 상태 관리
  const [logoErrors, setLogoErrors] = useState({});

  // 로고 로딩 실패시 다음 소스로 시도하는 함수
  const handleLogoError = (ticker, currentIndex = 0) => {
    const sources = companyLogos[ticker];
    if (sources && currentIndex < sources.length - 1) {
      return sources[currentIndex + 1];
    }
    return null;
  };

  // 실제 내부자 거래 데이터 (성과 추적 포함)
  const sampleTrades = [
    {
      id: 1,
      company: "Apple Inc.",
      ticker: "AAPL",
      insider: "Timothy D. Cook",
      position: "Chief Executive Officer",
      tradeType: "Sale",
      shares: 511757,
      price: 191.45,
      totalValue: 98002563,
      date: "2024-10-02",
      time: "16:32",
      timezone: "EDT",
      credibilityScore: 60,
      riskLevel: 8,
      aiInsight: "🚨 CEO 대량매도 - 실적발표 1주 전 타이밍 의심. 과거 패턴상 3-7% 하락 예상",
      impactPrediction: "-5.2%",
      confidence: 87,
      isHot: true,
      priceAfter1Day: 189.23,
      priceAfter7Day: 185.67,
      priceAfter30Day: 182.45,
      actualReturn1Day: -1.16,
      actualReturn7Day: -3.02,
      actualReturn30Day: -4.69,
      predictionAccuracy: 95,
      similarTrades: 12,
      avgReturnAfterSimilar: -4.8,
      recommendedBuyPrice: 185.20,
      currentPrice: 189.23,
      // 고급 AI 분석 데이터
      psychologyPattern: "DEFENSIVE_SELLING",
      marketTiming: "PRE_EARNINGS_CAUTION",
      institutionalSentiment: "BEARISH",
      volumeAnomaly: 3.4,
      correlatedSectors: ["Technology", "Consumer Electronics"],
      riskMatrix: {
        volatility: 0.23,
        marketCorrelation: 0.87,
        liquidityRisk: 0.12,
        fundamentalRisk: 0.45
      },
      aiConfidenceMetrics: {
        patternRecognition: 94,
        sentimentAnalysis: 78,
        fundamentalAlignment: 82,
        technicalSignals: 91
      },
      deepInsight: "CEO의 대량 매도는 일반적으로 계획된 매도일 수 있으나, 실적발표 1주 전 타이밍과 시장 최고점 근처에서의 매도는 내재적 리스크를 시사. 과거 5년간 유사 패턴에서 평균 -4.8% 조정 발생.",
      strategicRecommendation: "SELL_SIGNAL",
      buySignalPrice: 185.20,
      entryStrategy: "DCA_ON_DECLINE",
      positionSizing: "CONSERVATIVE"
    },
    {
      id: 2,
      company: "Tesla Inc.",
      ticker: "TSLA",
      insider: "Elon Musk",
      position: "Chief Executive Officer",
      tradeType: "Purchase",
      shares: 50000,
      price: 248.75,
      totalValue: 12437500,
      date: "2024-09-30",
      time: "09:45",
      timezone: "EDT",
      credibilityScore: 100,
      riskLevel: 2,
      aiInsight: "🚀 CEO 추가 매수 - 강한 신뢰 신호. 상승 모멘텀 기대되는 강력 매수 추천",
      impactPrediction: "+8.5%",
      confidence: 91,
      isHot: true,
      priceAfter1Day: 252.10,
      priceAfter7Day: 265.80,
      priceAfter30Day: 275.30,
      actualReturn1Day: 1.35,
      actualReturn7Day: 6.86,
      actualReturn30Day: 10.67,
      predictionAccuracy: 98,
      similarTrades: 8,
      avgReturnAfterSimilar: 7.2,
      recommendedBuyPrice: 255.30,
      currentPrice: 265.80,
      // 고급 AI 분석 데이터
      psychologyPattern: "AGGRESSIVE_ACCUMULATION",
      marketTiming: "GROWTH_MOMENTUM",
      institutionalSentiment: "BULLISH",
      volumeAnomaly: 1.8,
      correlatedSectors: ["Electric Vehicles", "Clean Energy", "Autonomous Driving"],
      riskMatrix: {
        volatility: 0.35,
        marketCorrelation: 0.65,
        liquidityRisk: 0.08,
        fundamentalRisk: 0.25
      },
      aiConfidenceMetrics: {
        patternRecognition: 96,
        sentimentAnalysis: 92,
        fundamentalAlignment: 89,
        technicalSignals: 94
      },
      deepInsight: "CEO의 추가 매수는 강한 내재적 신뢰를 의미하며, 특히 시장 조정 이후 저점 매수 타이밍이 탁월. EV 시장 회복세와 AI/로봇택시 촉매 기대로 중장기 강세 전망.",
      strategicRecommendation: "STRONG_BUY",
      buySignalPrice: 255.30,
      entryStrategy: "MOMENTUM_FOLLOW",
      positionSizing: "AGGRESSIVE"
    },
    {
      id: 3,
      company: "NVIDIA Corporation",
      ticker: "NVDA",
      insider: "Jensen Huang",
      position: "President and Chief Executive Officer",
      tradeType: "Sale",
      shares: 120000,
      price: 875.28,
      totalValue: 105033600,
      date: "2024-09-29",
      time: "11:22",
      timezone: "EDT",
      credibilityScore: 20,
      riskLevel: 6,
      aiInsight: "⚠️ AI 붐 정점 신호? 대량 매도로 인한 매수 비추천",
      impactPrediction: "-4.8%",
      confidence: 79,
      isHot: true,
      priceAfter1Day: 862.45,
      priceAfter7Day: 834.20,
      priceAfter30Day: 820.15,
      actualReturn1Day: -1.47,
      actualReturn7Day: -4.69,
      actualReturn30Day: -6.30,
      predictionAccuracy: 88,
      similarTrades: 15,
      avgReturnAfterSimilar: -5.1,
      recommendedBuyPrice: 830.50,
      currentPrice: 834.20,
      // 고급 AI 분석 데이터
      psychologyPattern: "PROFIT_TAKING",
      marketTiming: "BUBBLE_PEAK_WARNING",
      institutionalSentiment: "NEUTRAL_TO_BEARISH",
      volumeAnomaly: 2.7,
      correlatedSectors: ["Semiconductors", "AI Hardware", "Data Centers"],
      riskMatrix: {
        volatility: 0.41,
        marketCorrelation: 0.78,
        liquidityRisk: 0.15,
        fundamentalRisk: 0.62
      },
      aiConfidenceMetrics: {
        patternRecognition: 88,
        sentimentAnalysis: 71,
        fundamentalAlignment: 65,
        technicalSignals: 84
      },
      deepInsight: "CEO의 지속적 매도는 단순 차익실현을 넘어 AI 버블 정점 우려를 암시. 높은 밸류에이션과 경쟁 심화로 단기 조정 불가피. 하지만 장기적 AI 성장 스토리는 여전히 유효.",
      strategicRecommendation: "CAUTIOUS_SELL",
      buySignalPrice: 830.50,
      entryStrategy: "SYSTEMATIC_ENTRY_ON_DECLINE",
      positionSizing: "MODERATE"
    },
    {
      id: 4,
      company: "Meta Platforms Inc.",
      ticker: "META",
      insider: "Mark Zuckerberg",
      position: "Chairman and Chief Executive Officer",
      tradeType: "Buy",
      shares: 75000,
      price: 312.80,
      totalValue: 23460000,
      date: "2024-09-28",
      time: "14:15",
      timezone: "EDT",
      credibilityScore: 85,
      riskLevel: 3,
      aiInsight: "🚀 CEO 추가 매수 - 메타버스 & AI 투자 신뢰 신호. 강력한 상승 동력 예상",
      impactPrediction: "+6.8%",
      confidence: 93,
      isHot: true,
      priceAfter1Day: 318.45,
      priceAfter7Day: 334.20,
      priceAfter30Day: 342.60,
      actualReturn1Day: 1.81,
      actualReturn7Day: 6.84,
      actualReturn30Day: 9.51,
      predictionAccuracy: 96,
      similarTrades: 9,
      avgReturnAfterSimilar: 6.3,
      recommendedBuyPrice: 315.00,
      currentPrice: 334.20,
      psychologyPattern: "STRATEGIC_ACCUMULATION",
      marketTiming: "AI_MOMENTUM_ENTRY",
      institutionalSentiment: "BULLISH",
      volumeAnomaly: 2.1,
      correlatedSectors: ["Social Media", "AI", "VR/AR"],
      riskMatrix: {
        volatility: 0.28,
        marketCorrelation: 0.72,
        liquidityRisk: 0.09,
        fundamentalRisk: 0.21
      },
      aiConfidenceMetrics: {
        patternRecognition: 93,
        sentimentAnalysis: 89,
        fundamentalAlignment: 91,
        technicalSignals: 88
      },
      deepInsight: "CEO의 전략적 매수는 메타버스와 AI 투자에 대한 강한 확신을 보여줌. Reality Labs 손실 감소와 광고 수익 회복으로 중장기 성장 기대.",
      strategicRecommendation: "BUY",
      buySignalPrice: 315.00,
      entryStrategy: "ACCUMULATE_ON_STRENGTH",
      positionSizing: "MODERATE_TO_AGGRESSIVE"
    },
    {
      id: 5,
      company: "Microsoft Corporation",
      ticker: "MSFT",
      insider: "Amy E. Hood",
      position: "Executive Vice President and Chief Financial Officer",
      tradeType: "Option Exercise",
      shares: 25000,
      price: 425.60,
      totalValue: 10640000,
      date: "2024-09-27",
      time: "10:30",
      timezone: "EDT",
      credibilityScore: 75,
      riskLevel: 4,
      aiInsight: "💼 CFO 옵션 행사 - 정상적인 보상 실현. 중립적 신호로 해석",
      impactPrediction: "+1.2%",
      confidence: 68,
      isHot: false,
      priceAfter1Day: 427.35,
      priceAfter7Day: 431.80,
      priceAfter30Day: 438.90,
      actualReturn1Day: 0.41,
      actualReturn7Day: 1.46,
      actualReturn30Day: 3.12,
      predictionAccuracy: 72,
      similarTrades: 22,
      avgReturnAfterSimilar: 1.8,
      recommendedBuyPrice: 430.00,
      currentPrice: 431.80,
      psychologyPattern: "COMPENSATION_EXERCISE",
      marketTiming: "ROUTINE_EXECUTION",
      institutionalSentiment: "NEUTRAL",
      volumeAnomaly: 1.0,
      correlatedSectors: ["Cloud Computing", "Enterprise Software", "AI"],
      riskMatrix: {
        volatility: 0.19,
        marketCorrelation: 0.83,
        liquidityRisk: 0.06,
        fundamentalRisk: 0.18
      },
      aiConfidenceMetrics: {
        patternRecognition: 72,
        sentimentAnalysis: 65,
        fundamentalAlignment: 86,
        technicalSignals: 71
      },
      deepInsight: "CFO의 옵션 행사는 일반적인 보상 실현으로 투자 결정에 미치는 영향은 제한적. 하지만 기업의 견고한 펀더멘털은 지속적 성장 기대.",
      strategicRecommendation: "HOLD",
      buySignalPrice: 430.00,
      entryStrategy: "WAIT_FOR_PULLBACK",
      positionSizing: "CONSERVATIVE"
    },
    {
      id: 6,
      company: "Amazon.com Inc.",
      ticker: "AMZN",
      insider: "Andrew R. Jassy",
      position: "President and Chief Executive Officer",
      tradeType: "Grant",
      shares: 100000,
      price: 0.00,
      totalValue: 0,
      date: "2024-09-26",
      time: "16:00",
      timezone: "EDT",
      credibilityScore: 90,
      riskLevel: 2,
      aiInsight: "📈 CEO 스톡 그랜트 - 장기 인센티브 정렬. 강한 성장 신뢰 신호",
      impactPrediction: "+4.5%",
      confidence: 85,
      isHot: true,
      priceAfter1Day: 178.90,
      priceAfter7Day: 183.45,
      priceAfter30Day: 189.20,
      actualReturn1Day: 2.12,
      actualReturn7Day: 4.73,
      actualReturn30Day: 8.06,
      predictionAccuracy: 89,
      similarTrades: 6,
      avgReturnAfterSimilar: 4.2,
      recommendedBuyPrice: 180.00,
      currentPrice: 183.45,
      psychologyPattern: "LONG_TERM_ALIGNMENT",
      marketTiming: "GROWTH_INCENTIVE",
      institutionalSentiment: "BULLISH",
      volumeAnomaly: 1.5,
      correlatedSectors: ["E-commerce", "Cloud Computing", "Logistics"],
      riskMatrix: {
        volatility: 0.24,
        marketCorrelation: 0.79,
        liquidityRisk: 0.07,
        fundamentalRisk: 0.19
      },
      aiConfidenceMetrics: {
        patternRecognition: 89,
        sentimentAnalysis: 87,
        fundamentalAlignment: 92,
        technicalSignals: 85
      },
      deepInsight: "CEO 스톡 그랜트는 장기적 성과와 보상을 연계하는 강한 신호. AWS 성장과 AI 투자 확대로 중장기 가치 상승 기대.",
      strategicRecommendation: "STRONG_BUY",
      buySignalPrice: 180.00,
      entryStrategy: "DOLLAR_COST_AVERAGE",
      positionSizing: "AGGRESSIVE"
    }
  ];

  // 실시간 알림 데이터
  const recentAlerts = [
    {
      id: 1,
      type: "buy_recommendation",
      ticker: "AAPL",
      message: "AI 추천 매수가격 도달: $185.20 (현재가 $189.23)",
      time: "2분 전",
      severity: "high"
    },
    {
      id: 2,
      type: "pattern_alert",
      ticker: "TSLA",
      message: "Tesla CEO 매수 패턴이 2021년과 유사합니다. 당시 +23% 상승",
      time: "15분 전",
      severity: "medium"
    },
    {
      id: 3,
      type: "opportunity_alert",
      ticker: "META",
      message: "메타 임원진 3명이 동시 매수. 강한 상승 신호",
      time: "1시간 전",
      severity: "high"
    }
  ];

  useEffect(() => {
    setTimeout(() => {
      setTrades(sampleTrades);
      setLoading(false);
    }, 1500);
  }, []);

  // 탭 변경시 차트 애니메이션 재시작
  useEffect(() => {
    setChartAnimationKey(prev => prev + 1);
  }, [activeTab]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getRiskColor = (level) => {
    if (level >= 7) return 'text-red-500 bg-red-500/10';
    if (level >= 4) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-green-500 bg-green-500/10';
  };

  const getTradeTypeColor = (type) => {
    switch(type) {
      case 'Sale':
      case 'Sell':
        return 'text-red-400 bg-red-500/10';
      case 'Buy':
      case 'Purchase':
        return 'text-green-400 bg-green-500/10';
      case 'Option Exercise':
        return 'text-blue-400 bg-blue-500/10';
      case 'Grant':
        return 'text-purple-400 bg-purple-500/10';
      case 'Gift':
        return 'text-orange-400 bg-orange-500/10';
      default:
        return 'text-slate-400 bg-slate-500/10';
    }
  };

  const getTradeTypeIcon = (type) => {
    switch(type) {
      case 'Sale':
      case 'Sell':
        return '📉';
      case 'Buy':
      case 'Purchase':
        return '📈';
      case 'Option Exercise':
        return '🎯';
      case 'Grant':
        return '🎁';
      case 'Gift':
        return '💝';
      default:
        return '🔄';
    }
  };

  const getRecommendationColor = (recommendation) => {
    switch(recommendation) {
      case 'STRONG_BUY':
      case 'BUY':
        return 'text-green-400';
      case 'HOLD':
        return 'text-yellow-400';
      case 'SELL_SIGNAL':
      case 'CAUTIOUS_SELL':
        return 'text-red-400';
      case 'WAIT_FOR_DIP':
        return 'text-orange-400';
      default:
        return 'text-slate-400';
    }
  };

  // 차트 클릭 핸들러
  const handleChartClick = (data, event) => {
    if (data && data.activePayload && data.activePayload[0]) {
      console.log('Chart clicked:', data.activePayload[0].payload);
    }
  };

  // 커스텀 툴팁 컴포넌트
  const CustomTooltip = ({ active, payload, label, formatter }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur border border-slate-600 rounded-lg p-3 shadow-xl">
          <p className="font-semibold text-white mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-slate-300 text-sm">{entry.dataKey}</span>
              </div>
              <span className="font-semibold text-white">
                {formatter ? formatter(entry.value, entry.dataKey) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // 개선된 회사 로고 컴포넌트
  const CompanyLogo = ({ ticker, size = 'md', className = '' }) => {
    const [currentSrc, setCurrentSrc] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-16 h-16',
      xl: 'w-20 h-20'
    };

    const sources = companyLogos[ticker] || [];

    const handleImageError = () => {
      if (currentSrc < sources.length - 1) {
        setCurrentSrc(prev => prev + 1);
      } else {
        setHasError(true);
        setIsLoading(false);
      }
    };

    const handleImageLoad = () => {
      setIsLoading(false);
      setHasError(false);
    };

    if (hasError || sources.length === 0) {
      return (
        <div className={`${sizeClasses[size]} bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md ${className}`}>
          {ticker.charAt(0)}
        </div>
      );
    }

    return (
      <div className={`${sizeClasses[size]} bg-white rounded-lg flex items-center justify-center p-2 shadow-md ${className}`}>
        <img
          src={sources[currentSrc]}
          alt={ticker}
          className="w-full h-full object-contain"
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{ display: isLoading ? 'none' : 'block' }}
        />
        {isLoading && (
          <div className="w-full h-full bg-slate-200 rounded animate-pulse"></div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mb-4"></div>
          <p className="text-white text-lg">실시간 내부자 거래 데이터 로딩중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                InsiderTrack Pro
              </h1>
              <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                LIVE
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="w-5 h-5 text-slate-400 cursor-pointer hover:text-white" />
                {alertsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {alertsCount}
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-400">
                3일 무료 체험 중 • 2일 남음
              </div>
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition">
                프리미엄 구독
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex space-x-1 bg-slate-800/30 p-1 rounded-lg w-fit">
          {[
            { id: 'trades', label: '실시간 거래', icon: Zap },
            { id: 'watchlist', label: '내 워치리스트', icon: Bookmark },
            { id: 'patterns', label: '패턴 분석', icon: BarChart3 },
            { id: 'alerts', label: '스마트 알림', icon: Bell }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'trades' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trade List */}
            <div className="lg:col-span-2">
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl">
                <div className="p-6 border-b border-slate-700">
                  <h2 className="text-xl font-bold mb-2">실시간 내부자 거래</h2>
                  <p className="text-slate-400 text-sm">AI 분석 + 추천 매수가격이 포함된 내부자 거래 정보</p>
                </div>

                <div className="p-6 space-y-4">
                  {trades.slice(0, displayedTradesCount).map((trade) => (
                    <div
                      key={trade.id}
                      className={`bg-slate-900/50 border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 ${
                        selectedTrade?.id === trade.id ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-slate-700'
                      }`}
                      onClick={() => setSelectedTrade(trade)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <CompanyLogo ticker={trade.ticker} size="md" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold">{trade.company}</h3>
                              <span className="text-slate-400">({trade.ticker})</span>
                              {trade.isHot && <span className="text-orange-400">🔥</span>}
                            </div>
                            <p className="text-sm text-slate-400">{trade.insider} • {trade.position}</p>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end space-y-1">
                          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-semibold ${getTradeTypeColor(trade.tradeType)}`}>
                            <span>{getTradeTypeIcon(trade.tradeType)}</span>
                            <span>{trade.tradeType}</span>
                          </div>
                          <p className="text-sm text-slate-400">{trade.time} {trade.timezone}</p>
                          <p className="text-xs text-slate-500">{trade.date}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-slate-400">{t('trades.shares')}</p>
                          <p className="font-semibold">{trade.shares.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">단가</p>
                          <p className="font-semibold">${trade.price}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">총액</p>
                          <p className="font-semibold">{formatCurrency(trade.totalValue)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">AI 예측 정확도</p>
                          <p className={`font-semibold ${trade.predictionAccuracy >= 90 ? 'text-green-400' : trade.predictionAccuracy >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {trade.predictionAccuracy}%
                          </p>
                          <p className="text-xs text-slate-500">주가 변동 예측</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">위험도</p>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(trade.riskLevel)}`}>
                            {trade.riskLevel}/10
                          </div>
                        </div>
                      </div>

                      {/* 고급 AI 분석 미리보기 */}
                      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-purple-400 flex items-center space-x-1">
                            <Brain className="w-3 h-3" />
                            <span>AI 심층 분석</span>
                          </h4>
                          <span className="text-xs text-slate-400">{trade.psychologyPattern.replace(/_/g, ' ')}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-2">
                          <div className="bg-slate-800/50 rounded p-2">
                            <p className="text-xs text-slate-400">패턴 인식 신뢰도</p>
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                                <div
                                  className="bg-green-400 h-1.5 rounded-full"
                                  style={{width: `${trade.aiConfidenceMetrics.patternRecognition}%`}}
                                ></div>
                              </div>
                              <span className="text-xs font-bold text-green-400">{trade.aiConfidenceMetrics.patternRecognition}%</span>
                            </div>
                          </div>
                          <div className="bg-slate-800/50 rounded p-2">
                            <p className="text-xs text-slate-400">기관 심리</p>
                            <p className="text-xs font-semibold text-cyan-400">{trade.institutionalSentiment.replace(/_/g, ' ')}</p>
                          </div>
                        </div>

                        <div className="text-xs text-slate-300">
                          🎯 전략: <span className={`font-semibold ${getRecommendationColor(trade.strategicRecommendation)}`}>{trade.strategicRecommendation.replace(/_/g, ' ')}</span>
                          {' • '}포지션: <span className="font-semibold text-yellow-400">{trade.positionSizing}</span>
                        </div>
                      </div>

                      {/* 추천 매수가격 */}
                      <div className="bg-slate-800/30 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-green-400">💰 AI 추천 매수가격</span>
                          <span className="text-xs text-slate-400">현재가: ${trade.currentPrice}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-bold text-green-400">${trade.recommendedBuyPrice}</p>
                            <p className="text-xs text-slate-400">
                              {((trade.currentPrice - trade.recommendedBuyPrice) / trade.recommendedBuyPrice * 100).toFixed(1)}%
                              {trade.currentPrice > trade.recommendedBuyPrice ? ' 위' : ' 아래'}
                            </p>
                          </div>
                          <div className="text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCompanyForAlert(trade.ticker);
                                setShowAlertModal(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded-md transition flex items-center space-x-1"
                            >
                              <Mail className="w-3 h-3" />
                              <span>알림 설정</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 매수 추천 + 액션 버튼 */}
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Brain className="w-4 h-4 text-purple-400" />
                            <span className="text-xs font-medium text-purple-400">매수 추천</span>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < Math.floor(trade.credibilityScore / 20) ? 'text-yellow-400 fill-current' : 'text-slate-600'}`} />
                              ))}
                            </div>
                          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCompanyForAlert(trade.ticker);
                setShowAlertModal(true);
              }}
              className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded-md transition"
              title="이메일 알림 설정"
            >
              <Mail className="w-3 h-3" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTrade(trade);
                setShowWatchlistModal(true);
              }}
              className="p-1.5 bg-green-600 hover:bg-green-700 rounded-md transition"
              title="워치리스트 추가"
            >
              <Bookmark className="w-3 h-3" />
            </button>

            <button className="p-1.5 bg-slate-600 hover:bg-slate-500 rounded-md transition" title="SEC 원본 보기">
              <ExternalLink className="w-3 h-3" />
            </button>

            <button className="p-1.5 bg-purple-600 hover:bg-purple-700 rounded-md transition" title="계산기">
              <Calculator className="w-3 h-3" />
            </button>
          </div>
                        </div>

                        <p className="text-sm mb-2">{trade.aiInsight}</p>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">
                            예상 영향: <span className={trade.impactPrediction.startsWith('+') ? 'text-green-400' : 'text-red-400'}>{trade.impactPrediction}</span>
                          </span>
                          <span className="text-slate-400">
                            유사 거래: {trade.similarTrades}건 (평균 {trade.avgReturnAfterSimilar > 0 ? '+' : ''}{trade.avgReturnAfterSimilar}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Load More 버튼 */}
                  {displayedTradesCount < trades.length && (
                    <div className="text-center pt-4">
                      <button
                        onClick={() => setDisplayedTradesCount(prev => Math.min(prev + 50, trades.length))}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 mx-auto"
                      >
                        <span>더보기 ({Math.min(50, trades.length - displayedTradesCount)}개 더)</span>
                        <Target className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-slate-400 mt-2">
                        {displayedTradesCount}개 / {trades.length}개 거래 표시 중
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Sidebar */}
            <div className="space-y-6">
              {/* 실시간 시장 요약 차트 */}
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  <span>실시간 시장 펄스</span>
                </h3>

                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={accuracyTrendData}>
                      <defs>
                        <linearGradient id="marketPulseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColors.success} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={chartColors.success} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="week" stroke="#9CA3AF" fontSize={10} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                        formatter={(value) => [`${value}%`, 'AI 정확도']}
                      />
                      <Area
                        type="monotone"
                        dataKey="accuracy"
                        stroke={chartColors.success}
                        fillOpacity={1}
                        fill="url(#marketPulseGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">91.8%</div>
                    <div className="text-xs text-slate-400">AI 정확도</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">247</div>
                    <div className="text-xs text-slate-400">오늘 거래</div>
                  </div>
                </div>
              </div>

              {/* 섹터별 히트맵 */}
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <span>섹터 히트맵</span>
                </h3>

                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectorDistributionData} layout="horizontal">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={10} width={60} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                        formatter={(value) => [`${value}%`, '비율']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {sectorDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors.gradient[index % chartColors.gradient.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 실시간 알림 */}
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-orange-400" />
                  <span>실시간 스마트 알림</span>
                </h3>

                <div className="space-y-3">
                  {recentAlerts.map(alert => (
                    <div key={alert.id} className={`border-l-4 pl-3 py-2 ${
                      alert.severity === 'high' ? 'border-red-500 bg-red-500/5' : 'border-yellow-500 bg-yellow-500/5'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{alert.ticker}</span>
                        <span className="text-xs text-slate-400">{alert.time}</span>
                      </div>
                      <p className="text-xs text-slate-300">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 투자 성과 미니 차트 */}
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <span>투자 성과</span>
                </h3>

                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { day: 'Mon', return: 2.3 },
                      { day: 'Tue', return: -1.1 },
                      { day: 'Wed', return: 4.5 },
                      { day: 'Thu', return: 1.8 },
                      { day: 'Fri', return: 3.2 },
                      { day: 'Sat', return: -0.5 },
                      { day: 'Sun', return: 2.7 }
                    ]}>
                      <Line type="monotone" dataKey="return" stroke={chartColors.info} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 text-center">
                  <div className="text-xl font-bold text-green-400">+12.9%</div>
                  <div className="text-xs text-slate-400">이번 주 수익률</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">스마트 액션</h3>

                <div className="space-y-3">
                  <button
                    onClick={() => setShowAlertModal(true)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg text-sm hover:opacity-90 transition flex items-center justify-center space-x-2"
                  >
                    <Mail className="w-4 h-4" />
                    <span>이메일 알림 설정</span>
                  </button>
                  <button className="w-full bg-slate-700 text-white py-2 px-4 rounded-lg text-sm hover:bg-slate-600 transition">
                    📱 모바일 알림 설정
                  </button>
                  <button className="w-full bg-slate-700 text-white py-2 px-4 rounded-lg text-sm hover:bg-slate-600 transition">
                    맞춤 대시보드
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'watchlist' && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">내 워치리스트</h2>
              <span className="text-sm text-slate-400">{watchlist.length}개 종목 추적 중</span>
            </div>

            {watchlist.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <Bookmark className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>워치리스트가 비어있습니다.</p>
                <p className="text-sm mt-2">관심 있는 종목을 추가해보세요.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trades.filter(trade => watchlist.includes(trade.ticker)).map(trade => (
                  <div key={trade.id} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <CompanyLogo ticker={trade.ticker} size="sm" />
                        <div>
                          <h3 className="font-bold text-lg">{trade.ticker}</h3>
                          <p className="text-sm text-slate-400">{trade.company}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setWatchlist(prev => prev.filter(t => t !== trade.ticker));
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>최근 거래:</span>
                        <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getTradeTypeColor(trade.tradeType)}`}>
                          <span>{getTradeTypeIcon(trade.tradeType)}</span>
                          <span>{trade.tradeType}</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>추천 매수가:</span>
                        <span className="text-green-400">${trade.recommendedBuyPrice}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>현재가:</span>
                        <span>${trade.currentPrice}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedTrade(trade)}
                      className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm transition"
                    >
                      상세 보기
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="space-y-6">
            {/* 통합 멀티 메트릭 비교 차트 - 풀 와이드 */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center space-x-2">
                  <Activity className="w-6 h-6 text-cyan-400" />
                  <span>종합 투자 메트릭 분석</span>
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-slate-400">실시간 다중 지표 비교</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-slate-400">상승 추세</span>
                  </div>
                </div>
              </div>

              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={comparisonChartData}
                    onClick={handleChartClick}
                    key={`comparison-chart-${chartAnimationKey}`}
                  >
                    <defs>
                      <linearGradient id="marketCapGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="aiAccuracyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.success} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={chartColors.success} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('ko', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#9CA3AF" fontSize={12} domain={[40, 100]} />
                    <Tooltip
                      content={<CustomTooltip
                        formatter={(value, name) => {
                          if (name === 'marketCap') return [`${value}%`, '시가총액 지수'];
                          if (name === 'tradeVolume') return [`${value}%`, '거래량 지수'];
                          if (name === 'aiAccuracy') return [`${value}%`, 'AI 정확도'];
                          if (name === 'riskLevel') return [`${value}%`, '리스크 레벨'];
                          if (name === 'confidence') return [`${value}%`, '투자 신뢰도'];
                          return [value, name];
                        }}
                      />}
                    />
                    <Legend />

                    {/* 메인 메트릭들 */}
                    <Line
                      type="monotone"
                      dataKey="aiAccuracy"
                      stroke={chartColors.success}
                      strokeWidth={4}
                      dot={{ fill: chartColors.success, strokeWidth: 3, r: 6 }}
                      activeDot={{ r: 10, stroke: chartColors.success, strokeWidth: 3, fill: '#fff' }}
                      animationDuration={2500}
                      name="AI 정확도"
                    />

                    <Line
                      type="monotone"
                      dataKey="confidence"
                      stroke={chartColors.info}
                      strokeWidth={3}
                      strokeDasharray="8 4"
                      dot={{ fill: chartColors.info, strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 8, stroke: chartColors.info, strokeWidth: 2, fill: '#fff' }}
                      animationDuration={2500}
                      animationBegin={300}
                      name="투자 신뢰도"
                    />

                    <Line
                      type="monotone"
                      dataKey="marketCap"
                      stroke={chartColors.primary}
                      strokeWidth={3}
                      dot={{ fill: chartColors.primary, strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 8, stroke: chartColors.primary, strokeWidth: 2, fill: '#fff' }}
                      animationDuration={2500}
                      animationBegin={600}
                      name="시가총액 지수"
                    />

                    <Line
                      type="monotone"
                      dataKey="riskLevel"
                      stroke={chartColors.danger}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: chartColors.danger, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 7, stroke: chartColors.danger, strokeWidth: 2, fill: '#fff' }}
                      animationDuration={2500}
                      animationBegin={900}
                      name="리스크 레벨"
                    />

                    <Line
                      type="monotone"
                      dataKey="tradeVolume"
                      stroke={chartColors.warning}
                      strokeWidth={2}
                      dot={{ fill: chartColors.warning, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 7, stroke: chartColors.warning, strokeWidth: 2, fill: '#fff' }}
                      animationDuration={2500}
                      animationBegin={1200}
                      name="거래량 지수"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 메트릭 요약 카드들 - 더 전문적인 스타일 */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-slate-700">
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-4 text-center border border-green-500/30 hover:border-green-400/50 transition-all duration-300 group cursor-pointer">
                  <div className="flex items-center justify-center mb-2">
                    <Brain className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl font-bold text-green-400 group-hover:text-green-300">93.1%</div>
                  <div className="text-xs text-slate-400 mt-1 group-hover:text-slate-300">AI 정확도</div>
                  <div className="text-xs text-green-400 flex items-center justify-center space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>+1.3%</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 rounded-xl p-4 text-center border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 group cursor-pointer">
                  <div className="flex items-center justify-center mb-2">
                    <Shield className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl font-bold text-cyan-400 group-hover:text-cyan-300">94%</div>
                  <div className="text-xs text-slate-400 mt-1 group-hover:text-slate-300">투자 신뢰도</div>
                  <div className="text-xs text-cyan-400 flex items-center justify-center space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>+2.1%</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-4 text-center border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 group cursor-pointer">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl font-bold text-blue-400 group-hover:text-blue-300">85%</div>
                  <div className="text-xs text-slate-400 mt-1 group-hover:text-slate-300">시가총액 지수</div>
                  <div className="text-xs text-blue-400 flex items-center justify-center space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>+2.4%</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-xl p-4 text-center border border-red-500/30 hover:border-red-400/50 transition-all duration-300 group cursor-pointer">
                  <div className="flex items-center justify-center mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl font-bold text-red-400 group-hover:text-red-300">54%</div>
                  <div className="text-xs text-slate-400 mt-1 group-hover:text-slate-300">리스크 레벨</div>
                  <div className="text-xs text-green-400 flex items-center justify-center space-x-1">
                    <TrendingDown className="w-3 h-3" />
                    <span>-2.0%</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-xl p-4 text-center border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 group cursor-pointer">
                  <div className="flex items-center justify-center mb-2">
                    <BarChart3 className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl font-bold text-yellow-400 group-hover:text-yellow-300">62%</div>
                  <div className="text-xs text-slate-400 mt-1 group-hover:text-slate-300">거래량 지수</div>
                  <div className="text-xs text-yellow-400 flex items-center justify-center space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>+6.9%</span>
                  </div>
                </div>
              </div>

              {/* 실시간 지표 변화 알림 */}
              <div className="mt-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-slate-300">실시간 업데이트</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {t('dashboard.lastUpdated')}: {new Date().toLocaleTimeString(
                      language === 'ko' ? 'ko-KR' : language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US'
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 섹터별 분포 파이 차트 */}
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-pink-400" />
                    <span>섹터별 분포</span>
                  </h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sectorDistributionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {sectorDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors.gradient[index % chartColors.gradient.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                        formatter={(value, name) => [`${value}% (${sectorDistributionData.find(d => d.value === value)?.count || 0}건)`, '비율']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI 정확도 추이 */}
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-cyan-400" />
                    <span>AI 정확도 추이</span>
                  </h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={accuracyTrendData}>
                      <defs>
                        <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColors.info} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={chartColors.info} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="week" stroke="#9CA3AF" fontSize={12} />
                      <YAxis domain={[80, 100]} stroke="#9CA3AF" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                        formatter={(value, name) => {
                          if (name === 'accuracy') return [`${value}%`, 'AI 정확도'];
                          if (name === 'predictions') return [`${value}건`, '예측 횟수'];
                          return [value, name];
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="accuracy"
                        stroke={chartColors.info}
                        fillOpacity={1}
                        fill="url(#accuracyGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 거래 유형별 성과 */}
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center space-x-2">
                    <Target className="w-5 h-5 text-green-400" />
                    <span>거래 유형별 성과</span>
                  </h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tradeTypePerformanceData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                      <YAxis dataKey="type" type="category" stroke="#9CA3AF" fontSize={10} width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                        formatter={(value, name) => {
                          if (name === 'avgReturn') return [`${value}%`, '평균 수익률'];
                          if (name === 'successRate') return [`${value}%`, '성공률'];
                          return [value, name];
                        }}
                      />
                      <Bar dataKey="avgReturn" fill={chartColors.success} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 시간대별 거래 패턴 */}
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center space-x-2">
                    <Timer className="w-5 h-5 text-orange-400" />
                    <span>시간대별 거래 패턴</span>
                  </h3>
                  <div className="text-sm text-slate-400">거래 집중 시간</div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={timePatternData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={12} />
                      <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} />
                      <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                        formatter={(value, name) => {
                          if (name === 'buyCount') return [`${value}건`, '매수 거래'];
                          if (name === 'sellCount') return [`${value}건`, '매도 거래'];
                          if (name === 'totalValue') return [`$${value}M`, '총 거래금액'];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="buyCount" fill={chartColors.success} name="매수" radius={[2, 2, 0, 0]} />
                      <Bar yAxisId="left" dataKey="sellCount" fill={chartColors.danger} name="매도" radius={[2, 2, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="totalValue" stroke={chartColors.warning} strokeWidth={3} dot={{ fill: chartColors.warning, strokeWidth: 2, r: 6 }} name="총 거래금액" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 리스크-수익률 매트릭스 */}
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-red-400" />
                    <span>리스크-수익률 매트릭스</span>
                  </h3>
                  <div className="text-sm text-slate-400">버블 크기 = 거래금액</div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart data={riskReturnData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="x" name="리스크" stroke="#9CA3AF" fontSize={12} domain={[0, 10]} />
                      <YAxis dataKey="y" name="수익률" stroke="#9CA3AF" fontSize={12} domain={[-10, 10]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                        formatter={(value, name) => {
                          if (name === 'x') return [`${value}/10`, '리스크 레벨'];
                          if (name === 'y') return [`${value}%`, '예상 수익률'];
                          if (name === 'z') return [`$${value.toFixed(1)}M`, '거래금액'];
                          return [value, name];
                        }}
                        labelFormatter={(label, payload) => {
                          const point = payload?.[0]?.payload;
                          return point ? `${point.company}` : label;
                        }}
                      />
                      <Scatter dataKey="y" fill={chartColors.primary}>
                        {riskReturnData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 인사이트 요약 */}
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-400" />
                <span>AI 패턴 분석 인사이트</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-semibold text-green-400">최고 성과 패턴</span>
                  </div>
                  <p className="text-sm text-slate-300">Tesla CEO 매수 패턴이 최고 수익률 (+8.5%) 기록</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-semibold text-orange-400">거래 집중 시간</span>
                  </div>
                  <p className="text-sm text-slate-300">오후 3-4시 대량 거래 집중 (총 $138.9M)</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Brain className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-semibold text-cyan-400">AI 정확도</span>
                  </div>
                  <p className="text-sm text-slate-300">이번 주 예측 정확도 91.8% 달성</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-semibold text-red-400">리스크 경고</span>
                  </div>
                  <p className="text-sm text-slate-300">NVIDIA 고위험 매도 신호 감지</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">스마트 알림 센터</h2>
            <div className="space-y-4">
              {recentAlerts.map(alert => (
                <div key={alert.id} className="bg-slate-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold">{alert.ticker}</span>
                    <span className="text-sm text-slate-400">{alert.time}</span>
                  </div>
                  <p className="text-slate-300">{alert.message}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      alert.severity === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {alert.severity === 'high' ? '높음' : '보통'}
                    </span>
                    <div className="flex space-x-2">
                      <button className="text-blue-400 text-xs hover:underline">상세보기</button>
                      <button className="text-slate-400 text-xs hover:underline">무시</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 하단 고정 요약 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-xs text-slate-400">오늘 수집된 거래</p>
                <p className="text-lg font-bold text-white">247</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">추천 매수가격 도달</p>
                <p className="text-lg font-bold text-green-400">3개</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">AI 예측 정확도</p>
                <p className="text-lg font-bold text-green-400">91.2%</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition">
                🚨 긴급 알림 (3)
              </button>
              <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition">
                💰 매수가격 알림
              </button>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition">
                🤖 AI 추천 실행
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 모달 - 거래 상세 정보 */}
      {selectedTrade && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <CompanyLogo ticker={selectedTrade.ticker} size="lg" />
                  <div>
                    <h2 className="text-xl font-bold">상세 분석: {selectedTrade.ticker}</h2>
                    <p className="text-sm text-slate-400">{selectedTrade.company}</p>
                  </div>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-semibold ${getTradeTypeColor(selectedTrade.tradeType)}`}>
                    <span>{getTradeTypeIcon(selectedTrade.tradeType)}</span>
                    <span>{selectedTrade.tradeType}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTrade(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* AI 추천 매수/매도 가격 정보 */}
              <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
                <h3 className="font-bold mb-3 flex items-center space-x-2">
                  <span>💰 AI 추천 가격 분석</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getRecommendationColor(selectedTrade.strategicRecommendation)} bg-opacity-20`}>
                    {selectedTrade.strategicRecommendation.replace(/_/g, ' ')}
                  </span>
                </h3>

                {/* 가격 비교 꺾은선 그래프 */}
                <div className="mb-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-3 text-slate-300 flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>가격 비교 차트</span>
                    </h4>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            { category: '내부자 거래가', value: selectedTrade.price },
                            { category: 'AI 추천 매수가', value: selectedTrade.recommendedBuyPrice },
                            { category: '현재 시장가', value: selectedTrade.currentPrice },
                            { category: 'AI 추천 매도가', value: selectedTrade.currentPrice * (1 + (parseFloat(selectedTrade.impactPrediction.replace('%', '')) / 100)) }
                          ]}
                          key={`modal-price-chart-${selectedTrade.ticker}`}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="category" stroke="#9CA3AF" fontSize={10} />
                          <YAxis stroke="#9CA3AF" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#F9FAFB'
                            }}
                            formatter={(value) => [`$${value.toFixed(2)}`, '가격']}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={chartColors.primary}
                            strokeWidth={3}
                            dot={(props) => {
                              const colors = [chartColors.primary, chartColors.success, chartColors.warning, chartColors.danger];
                              return (
                                <circle
                                  cx={props.cx}
                                  cy={props.cy}
                                  r={6}
                                  fill={colors[props.index]}
                                  stroke="#fff"
                                  strokeWidth={2}
                                />
                              );
                            }}
                            activeDot={{ r: 8, stroke: chartColors.primary, strokeWidth: 2, fill: '#fff' }}
                            animationDuration={2000}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

              </div>

              {/* AI 분석 및 유사 거래 */}
              <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
                <h3 className="font-bold mb-3">🤖 AI 심층 분석</h3>
                <p className="text-slate-300 mb-4">{selectedTrade.aiInsight}</p>

                {/* 깊이 있는 분석 */}
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 mb-4">
                  <h4 className="font-semibold text-purple-400 mb-2">🧠 고급 AI 인사이트</h4>
                  <p className="text-sm text-slate-300 mb-3">{selectedTrade.deepInsight}</p>

                  {/* AI 신뢰도 메트릭 */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-slate-800/50 rounded p-2">
                      <p className="text-xs text-slate-400">패턴 인식</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-green-400 h-2 rounded-full"
                            style={{width: `${selectedTrade.aiConfidenceMetrics.patternRecognition}%`}}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-green-400">{selectedTrade.aiConfidenceMetrics.patternRecognition}%</span>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <p className="text-xs text-slate-400">감정 분석</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-400 h-2 rounded-full"
                            style={{width: `${selectedTrade.aiConfidenceMetrics.sentimentAnalysis}%`}}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-blue-400">{selectedTrade.aiConfidenceMetrics.sentimentAnalysis}%</span>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <p className="text-xs text-slate-400">펀더멘털 정렬</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{width: `${selectedTrade.aiConfidenceMetrics.fundamentalAlignment}%`}}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-yellow-400">{selectedTrade.aiConfidenceMetrics.fundamentalAlignment}%</span>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded p-2">
                      <p className="text-xs text-slate-400">기술적 신호</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-purple-400 h-2 rounded-full"
                            style={{width: `${selectedTrade.aiConfidenceMetrics.technicalSignals}%`}}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-purple-400">{selectedTrade.aiConfidenceMetrics.technicalSignals}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 심리적 패턴 & 시장 타이밍 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <h4 className="font-semibold text-orange-400 mb-2">🧭 심리적 패턴</h4>
                    <p className="text-sm text-slate-300">{selectedTrade.psychologyPattern.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400 mt-1">시장 타이밍: {selectedTrade.marketTiming.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <h4 className="font-semibold text-cyan-400 mb-2">기관 심리</h4>
                    <p className="text-sm text-slate-300">{selectedTrade.institutionalSentiment.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400 mt-1">거래량 이상: {selectedTrade.volumeAnomaly}x 평소</p>
                  </div>
                </div>

                {/* 리스크 매트릭스 */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                  <h4 className="font-semibold text-red-400 mb-2">⚡ 리스크 매트릭스</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span>변동성 리스크:</span>
                      <span className={`font-bold ${selectedTrade.riskMatrix.volatility > 0.3 ? 'text-red-400' : 'text-green-400'}`}>
                        {(selectedTrade.riskMatrix.volatility * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>시장 상관성:</span>
                      <span className="font-bold text-blue-400">{(selectedTrade.riskMatrix.marketCorrelation * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>유동성 리스크:</span>
                      <span className={`font-bold ${selectedTrade.riskMatrix.liquidityRisk > 0.2 ? 'text-red-400' : 'text-green-400'}`}>
                        {(selectedTrade.riskMatrix.liquidityRisk * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>펀더멘털 리스크:</span>
                      <span className={`font-bold ${selectedTrade.riskMatrix.fundamentalRisk > 0.5 ? 'text-red-400' : 'text-yellow-400'}`}>
                        {(selectedTrade.riskMatrix.fundamentalRisk * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* 전략적 추천 */}
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4">
                  <h4 className="font-semibold text-green-400 mb-2">🎯 AI 전략 추천</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>투자 추천:</span>
                      <span className={`font-bold ${getRecommendationColor(selectedTrade.strategicRecommendation)}`}>{selectedTrade.strategicRecommendation.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>진입 전략:</span>
                      <span className="font-bold text-blue-400">{selectedTrade.entryStrategy.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>포지션 크기:</span>
                      <span className="font-bold text-yellow-400">{selectedTrade.positionSizing}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <h4 className="font-semibold text-blue-400 mb-2">📈 유사 패턴 분석</h4>
                  <p className="text-sm text-slate-300">
                    과거 {selectedTrade.similarTrades}건의 유사한 {selectedTrade.insider} 거래에서
                    평균 <span className={`font-bold ${selectedTrade.avgReturnAfterSimilar > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedTrade.avgReturnAfterSimilar > 0 ? '+' : ''}{selectedTrade.avgReturnAfterSimilar}%
                    </span>의 수익률을 기록했습니다.
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    현재 예측 정확도: {selectedTrade.predictionAccuracy}% | 연관 섹터: {selectedTrade.correlatedSectors.join(', ')}
                  </p>
                </div>
              </div>

              {/* 액션 버튼들 */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setSelectedCompanyForAlert(selectedTrade.ticker);
                    setShowAlertModal(true);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm transition flex items-center justify-center space-x-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>이메일 알림 설정</span>
                </button>

                <button
                  onClick={() => setShowWatchlistModal(true)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm transition flex items-center justify-center space-x-2"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>워치리스트 추가</span>
                </button>

                <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm transition flex items-center justify-center space-x-2">
                  <Calculator className="w-4 h-4" />
                  <span>포지션 계산기</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 이메일 알림 설정 모달 */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center space-x-2">
                  <Mail className="w-6 h-6 text-blue-400" />
                  <span>이메일 알림 설정</span>
                </h2>
                <button
                  onClick={() => setShowAlertModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">알림 받을 이메일</label>
                  <input
                    type="email"
                    value={userEmail}
                    disabled
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">회사 선택</label>
                  <select
                    value={selectedCompanyForAlert}
                    onChange={(e) => setSelectedCompanyForAlert(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">회사를 선택하세요</option>
                    {trades.map(trade => (
                      <option key={trade.ticker} value={trade.ticker}>
                        {trade.ticker} - {trade.company}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <h4 className="font-semibold text-blue-400 mb-2">알림 조건</h4>
                  <div className="space-y-2 text-sm text-slate-300">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span>내부자 거래 발생 시</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span>대량 거래 ($10M+)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span>추천 매수가격 도달 시</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAlertModal(false)}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-lg text-sm transition"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    // 실제 이메일 알림 설정 로직
                    alert(`${selectedCompanyForAlert} 알림이 ${userEmail}로 설정되었습니다!`);
                    setShowAlertModal(false);
                  }}
                  disabled={!selectedCompanyForAlert}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm transition"
                >
                  알림 설정
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 워치리스트 추가 모달 */}
      {showWatchlistModal && selectedTrade && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center space-x-2">
                  <Bookmark className="w-6 h-6 text-green-400" />
                  <span>워치리스트 추가</span>
                </h2>
                <button
                  onClick={() => setShowWatchlistModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center space-y-4">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="flex justify-center mb-4">
                    <CompanyLogo ticker={selectedTrade.ticker} size="lg" />
                  </div>
                  <h3 className="font-bold text-lg">{selectedTrade.ticker}</h3>
                  <p className="text-slate-400">{selectedTrade.company}</p>
                  <p className="text-sm text-slate-500 mt-2">
                    {selectedTrade.insider} • {selectedTrade.position}
                  </p>
                </div>

                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="font-semibold text-green-400">워치리스트 추가 완료!</span>
                  </div>
                  <p className="text-sm text-slate-300">
                    이제 '내 워치리스트' 탭에서 {selectedTrade.ticker}의
                    내부자 거래 정보만 따로 볼 수 있습니다.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowWatchlistModal(false)}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-lg text-sm transition"
                >
                  닫기
                </button>
                <button
                  onClick={() => {
                    if (!watchlist.includes(selectedTrade.ticker)) {
                      setWatchlist(prev => [...prev, selectedTrade.ticker]);
                    }
                    setActiveTab('watchlist');
                    setShowWatchlistModal(false);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm transition"
                >
                  워치리스트 보기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedInsiderTradingDashboard;
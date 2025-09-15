import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'ko' | 'ja' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.livetrading': 'Live Trading',
    'nav.analytics': 'Analytics', 
    'nav.alerts': 'Alerts',
    'nav.search': 'Search',
    'nav.settings': 'Settings',
    
    // Dashboard
    'dashboard.title': 'InsiderTrack Pro',
    'dashboard.subtitle': 'AI-Powered Insider Trading Monitor',
    'dashboard.lastUpdated': 'Last updated',
    'dashboard.stats.todayTrades': 'Today\'s Trades',
    'dashboard.stats.totalVolume': 'Total Volume',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.marketCoverage': 'Market Coverage',
    'dashboard.topMoversToday': 'Top Movers Today',
    
    // Trades
    'trades.loadingStats': 'Loading trading statistics...',
    'trades.failedStats': 'Failed to load trading statistics. Please refresh the page.',
    'trades.recentTrades': 'Recent Insider Trades',
    'trades.loadingTrades': 'Loading trades...',
    'trades.viewDetails': 'View Details',
    'trades.loadMore': 'Load More Trades',
    'trades.noTrades': 'No trades available',
    'trades.company': 'Company',
    'trades.shares': 'Shares',
    'trades.price': 'Price',
    'trades.total': 'Total Value',
    'trades.signal': 'Signal',
    'trades.significance': 'Significance',
    'trades.filed': 'Filed',
    
    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.notifications': 'Notifications',
    'settings.language.english': 'English',
    'settings.language.korean': '한국어',
    'settings.language.japanese': '日本語',
    'settings.language.chinese': '中文',
    'settings.theme.light': 'Light',
    'settings.theme.dark': 'Dark',
    'settings.theme.system': 'System',
    'settings.description': 'Manage your application preferences and settings.',
    'settings.themeDescription': 'Choose your preferred theme',
    'settings.notificationsFuture': 'Notification settings will be available in a future update.',
    
    // WebSocket Status
    'websocket.connected': 'Connected to live feed',
    'websocket.disconnected': 'Disconnected from live feed',
    'websocket.connecting': 'Connecting to live feed...',
    
    // General
    'general.loading': 'Loading...',
    'general.error': 'Error',
    'general.success': 'Success',
    'general.refresh': 'Refresh',
    'general.save': 'Save',
    'general.cancel': 'Cancel',
    'general.delete': 'Delete',
    
    // Page specific
    'page.dashboard.subtitle': 'Real-time insider trading monitoring and market intelligence',
    'page.livetrading.title': 'Live Trading',
    'page.livetrading.subtitle': 'Real-time insider trading activity with AI-powered analysis',
    'page.search.placeholder': 'Search companies, tickers, traders, or titles...',
    'page.alerts.title': 'Smart Alerts',
    'page.alerts.subtitle': 'Set up intelligent alerts for insider trading activity',
    'page.analytics.title': 'Market Analytics',
    'page.analytics.subtitle': 'Comprehensive analysis of insider trading patterns',
    
    // WebSocket and Connection
    'connection.liveFeedActive': 'Live data feed active - Real-time SEC filing monitoring',
    'connection.connectionLost': 'Connection lost - Attempting to reconnect...',
    'connection.liveFeed': 'Live Feed',
    'connection.disconnected': 'Disconnected',
    
    // Statistics and Data
    'stats.todayTrades': 'Today\'s Trades',
    'stats.totalVolume': 'Total Volume',
    'stats.tradingSummary': 'Trading Summary',
    'stats.failedLoad': 'Failed to load trading statistics. Please refresh the page.',
    'stats.fromLastWeek': 'from last week',
    
    // Filters and Search
    'filter.allTypes': 'All Types',
    'filter.buyOrders': 'Buy Orders',
    'filter.sellOrders': 'Sell Orders',
    'filter.allSignals': 'All Signals',
    'filter.buySignal': 'Buy Signal',
    'filter.sellSignal': 'Sell Signal',
    'filter.holdSignal': 'Hold Signal',
    'filter.buyOnly': 'Buy Only',
    'filter.sellOnly': 'Sell Only',
    
    // Placeholders
    'placeholder.searchCompany': 'Search company...',
    'placeholder.searchTrader': 'Search trader...',
    'placeholder.noLimit': 'No limit',
    'placeholder.preferredLanguage': 'Choose your preferred language',
    
    // Alert types
    'alerts.type.volume': 'Trade Volume',
    'alerts.type.company': 'Company Name',
    'alerts.type.trader': 'Trader Title',
    
    // Search page
    'search.title': 'Search & Filter',
    'search.subtitle': 'Search and filter insider trading data with advanced criteria',
    'search.filters': 'Filters',
    'search.clear': 'Clear',
    'search.tradeType': 'Trade Type',
    'search.dateRange': 'Date Range',
    'search.sortBy': 'Sort By',
    'search.dateRange.all': 'All Time',
    'search.dateRange.7d': 'Last 7 days',
    'search.dateRange.30d': 'Last 30 days',
    'search.dateRange.90d': 'Last 90 days',
    'search.sort.recent': 'Most Recent',
    'search.sort.value': 'Highest Value',
    'search.sort.company': 'Company Name',
    'search.results': 'Results',
    'search.buyTrades': 'Buy Trades',
    'search.sellTrades': 'Sell Trades',
    'search.totalVolume': 'Total Volume',
    'search.companies': 'Companies',
    'search.traders': 'Traders',
    'search.totalFound': 'Total trades found',
    'search.combinedValue': 'Combined value',
    'search.uniqueEntities': 'Unique entities',
    'search.uniqueInsiders': 'Unique insiders',
    'search.searchResults': 'Search Results',
    'search.noTrades': 'No trades found',
    'search.placeholder.minValue': '1000000',
    'search.value': 'Min Value',
    
    // Alerts page
    'alerts.title': 'Smart Alerts',
    'alerts.subtitle': 'Set up intelligent alerts for insider trading activity',
    'alerts.active': 'Active Alerts',
    'alerts.createNew': 'Create New Alert',
    'alerts.alertName': 'Alert Name',
    'alerts.alertType': 'Alert Type',
    'alerts.condition': 'Condition',
    'alerts.value': 'Value',
    'alerts.paused': 'Paused',
    'alerts.noAlerts': 'No alerts configured yet',
    'alerts.createFirst': 'Create your first alert below',
    'alerts.noMatches': 'No recent matches',
    'alerts.setupMatches': 'Set up alerts to see matches here',
    'alerts.condition.greaterThan': 'Greater than',
    'alerts.condition.lessThan': 'Less than',
    'alerts.condition.equals': 'Equals',
    'alerts.condition.contains': 'Contains',
    'alerts.placeholder.name': 'e.g., Large Apple Trades',
    'alerts.recentMatches': 'Recent Matches',
    
    // Live Trading page
    'liveTrading.filtersAndSearch': 'Filters & Search',
    'liveTrading.tradeType': 'Trade Type',
    'liveTrading.aiSignal': 'AI Signal',
    'liveTrading.companyTicker': 'Company/Ticker',
    'liveTrading.traderName': 'Trader Name',
    'liveTrading.minValue': 'Min Value ($)',
    'liveTrading.maxValue': 'Max Value ($)',
    'liveTrading.liveFeed': 'Live Trading Feed',
    'liveTrading.tradesShown': 'trades shown',
    'liveTrading.noTrades': 'No trades found',
    'liveTrading.adjustFilters': 'Try adjusting your filters',
    'liveTrading.insider': 'Insider',
    'liveTrading.tradeDetails': 'Trade Details',
    'liveTrading.totalValue': 'Total Value',
    'liveTrading.score': 'Score:',
    'liveTrading.loadMore': 'Load More Trades',
    'liveTrading.activeNow': 'Active Now',
    'liveTrading.alertsSet': 'Alerts Set',
    
    // Trade Card
    'tradeCard.filed': 'Filed',
    'tradeCard.shares': 'Shares',
    'tradeCard.avgPrice': 'Avg Price',
    'tradeCard.totalValue': 'Total Value',
    'tradeCard.ownership': 'ownership',
    'tradeCard.details': 'Details',
    
    // Trade List
    'tradeList.recentTrades': 'Recent Insider Trades',
    'tradeList.searchCompanies': 'Search companies...',
    'tradeList.sort': 'Sort:',
    'tradeList.date': 'Date',
    'tradeList.value': 'Value',
    'tradeList.noTradesFound': 'No trades found matching your criteria.',
    'tradeList.loading': 'Loading...',
    'tradeList.loadMore': 'Load More Trades',
    'tradeList.noMatches': 'No trades found matching your criteria.',
    'tradeList.searchPlaceholder': 'Search companies...',
    
    // Dashboard Stats
    'dashboardStats.todayTrades': "Today's Trades",
    'dashboardStats.totalVolume': 'Total Volume',
    'dashboardStats.fromLastWeek': 'from last week',
    'dashboardStats.recentActivity': 'Recent Activity',
    'dashboardStats.monitoring': 'Monitoring insider trades across all major exchanges',
    'dashboardStats.marketCoverage': 'Market Coverage',
    'dashboardStats.realTimeAnalysis': 'Real-time SEC filing analysis and trade classification',
    'dashboardStats.topMovers': 'Top Movers Today',
    
    // Analytics page
    'analytics.subtitle': 'Comprehensive insider trading market analysis and insights',
    'analytics.totalTrades': 'Total Trades',
    'analytics.transactionsRecorded': 'Insider transactions recorded',
    'analytics.totalVolume': 'Total Volume',
    'analytics.combinedValue': 'Combined transaction value',
    'analytics.avgTradeSize': 'Avg Trade Size',
    'analytics.averageValue': 'Average transaction value',
    'analytics.companies': 'Companies',
    'analytics.uniqueTracked': 'Unique companies tracked',
    'analytics.tradeDistribution': 'Trade Type Distribution',
    'analytics.monthlyActivity': 'Monthly Trading Activity',
    'analytics.topCompanies': 'Top Companies by Trading Volume',
    'analytics.trades': 'trades',
    'analytics.combinedTransactionValue': 'Combined transaction value',
    'analytics.averageTransactionValue': 'Average transaction value',
    'analytics.uniqueCompaniesTracked': 'Unique companies tracked',
    'analytics.tradeTypeDistribution': 'Trade Type Distribution',
    'analytics.monthlyTradingActivity': 'Monthly Trading Activity',
    'analytics.topCompaniesByVolume': 'Top Companies by Trading Volume',
    'analytics.buys': 'Buys',
    'analytics.sells': 'Sells',
    
    // Trade Detail page
    'tradeDetail.notFound': 'Trade Not Found',
    'tradeDetail.notFoundMessage': 'The requested trade could not be found.',
    'tradeDetail.backToDashboard': 'Back to Dashboard',
    'tradeDetail.back': 'Back',
    'tradeDetail.title': 'Trade Details',
    'tradeDetail.companyInfo': 'Company Information',
    'tradeDetail.company': 'Company',
    'tradeDetail.tickerSymbol': 'Ticker Symbol',
    'tradeDetail.tradeType': 'Trade Type',
    'tradeDetail.traderInfo': 'Trader Information',
    'tradeDetail.name': 'Name',
    'tradeDetail.titlePosition': 'Title/Position',
    'tradeDetail.ownership': 'Ownership',
    'tradeDetail.transactionDetails': 'Transaction Details',
    'tradeDetail.sharesTraded': 'Shares Traded',
    'tradeDetail.pricePerShare': 'Price per Share',
    'tradeDetail.totalValue': 'Total Transaction Value',
    'tradeDetail.filingDate': 'Filing Date',
    'tradeDetail.currentPrice': 'Current Stock Price',
    'tradeDetail.volume': 'Volume',
    'tradeDetail.lastUpdated': 'Last Updated',
    'tradeDetail.analysis': 'Detailed Analysis',
    'tradeDetail.priceComparison': 'Price Comparison',
    'tradeDetail.tradePrice': 'Trade Price:',
    'tradeDetail.currentPriceLabel': 'Current Price:',
    'tradeDetail.perShareComparison': 'Per share comparison',
    'tradeDetail.secFiling': 'SEC Filing #',
    'tradeDetail.totalTransactionValue': 'Total Transaction Value',
    'tradeDetail.currentStockPrice': 'Current Stock Price',
    'tradeDetail.detailedAnalysis': 'Detailed Analysis',
    
    // Price Comparison Chart
    'priceChart.title': 'Price Comparison Chart',
    'priceChart.tradePrice': 'Trade Price',
    'priceChart.currentPrice': 'Current Price',
    'priceChart.today': 'Today',
    'priceChart.insiderTrade': 'INSIDER TRADE',
    'priceChart.movement': 'Price Movement Since Trade',
    'priceChart.increased': 'Price Increased',
    'priceChart.decreased': 'Price Decreased',
    'priceChart.tradePriceLabel': 'Trade Price:',
    'priceChart.currentLabel': 'Current:',
    
    // Not Found page
    'notFound.title': '404 - Page Not Found',
    'notFound.message': 'The page you are looking for does not exist.',
  },
  ko: {
    // Navigation
    'nav.dashboard': '대시보드',
    'nav.livetrading': '실시간 거래',
    'nav.analytics': '분석',
    'nav.alerts': '알림',
    'nav.search': '검색',
    'nav.settings': '설정',
    
    // Dashboard
    'dashboard.title': '인사이더트랙 프로',
    'dashboard.subtitle': 'AI 기반 내부자 거래 모니터',
    'dashboard.lastUpdated': '최종 업데이트',
    'dashboard.stats.todayTrades': '오늘의 거래',
    'dashboard.stats.totalVolume': '총 거래량',
    'dashboard.recentActivity': '최근 활동',
    'dashboard.marketCoverage': '시장 커버리지',
    'dashboard.topMoversToday': '오늘의 급등주',
    
    // Trades
    'trades.loadingStats': '거래 통계를 불러오는 중...',
    'trades.failedStats': '거래 통계를 불러오지 못했습니다. 페이지를 새로고침 해주세요.',
    'trades.recentTrades': '최근 내부자 거래',
    'trades.loadingTrades': '거래 정보를 불러오는 중...',
    'trades.viewDetails': '자세히 보기',
    'trades.loadMore': '더 많은 거래 보기',
    'trades.noTrades': '거래 정보가 없습니다',
    'trades.company': '회사',
    'trades.shares': '주식 수',
    'trades.price': '가격',
    'trades.total': '총 가치',
    'trades.signal': '신호',
    'trades.significance': '중요도',
    'trades.filed': '신고일',
    
    // Settings
    'settings.title': '설정',
    'settings.language': '언어',
    'settings.theme': '테마',
    'settings.notifications': '알림',
    'settings.language.english': 'English',
    'settings.language.korean': '한국어',
    'settings.language.japanese': '日本語',
    'settings.language.chinese': '中文',
    'settings.theme.light': '라이트',
    'settings.theme.dark': '다크',
    'settings.theme.system': '시스템',
    'settings.description': '애플리케이션 환경설정과 설정을 관리합니다.',
    'settings.themeDescription': '선호하는 테마를 선택하세요',
    'settings.notificationsFuture': '알림 설정은 향후 업데이트에서 제공됩니다.',
    
    // WebSocket Status
    'websocket.connected': '실시간 피드에 연결됨',
    'websocket.disconnected': '실시간 피드 연결 끊김',
    'websocket.connecting': '실시간 피드에 연결 중...',
    
    // General
    'general.loading': '로딩 중...',
    'general.error': '오류',
    'general.success': '성공',
    'general.refresh': '새로고침',
    'general.save': '저장',
    'general.cancel': '취소',
    'general.delete': '삭제',
    
    // Page specific
    'page.dashboard.subtitle': '실시간 내부자 거래 모니터링 및 시장 인텔리전스',
    'page.livetrading.title': '실시간 거래',
    'page.livetrading.subtitle': 'AI 기반 분석과 함께하는 실시간 내부자 거래 활동',
    'page.search.placeholder': '회사명, 티커, 거래자, 직책 검색...',
    'page.alerts.title': '스마트 알림',
    'page.alerts.subtitle': '내부자 거래 활동에 대한 지능형 알림 설정',
    'page.analytics.title': '시장 분석',
    'page.analytics.subtitle': '내부자 거래 패턴의 포괄적 분석',
    
    // WebSocket and Connection
    'connection.liveFeedActive': '실시간 데이터 피드 활성화 - 실시간 SEC 신고 모니터링',
    'connection.connectionLost': '연결이 끊어졌습니다 - 재연결을 시도하는 중...',
    'connection.liveFeed': '실시간 피드',
    'connection.disconnected': '연결 끊김',
    
    // Statistics and Data
    'stats.todayTrades': '오늘의 거래',
    'stats.totalVolume': '총 거래량',
    'stats.tradingSummary': '거래 요약',
    'stats.failedLoad': '거래 통계를 불러오지 못했습니다. 페이지를 새로고침 해주세요.',
    'stats.fromLastWeek': '지난주 대비',
    
    // Filters and Search
    'filter.allTypes': '모든 유형',
    'filter.buyOrders': '매수 주문',
    'filter.sellOrders': '매도 주문',
    'filter.allSignals': '모든 신호',
    'filter.buySignal': '매수 신호',
    'filter.sellSignal': '매도 신호',
    'filter.holdSignal': '보유 신호',
    'filter.buyOnly': '매수만',
    'filter.sellOnly': '매도만',
    
    // Placeholders
    'placeholder.searchCompany': '회사 검색...',
    'placeholder.searchTrader': '거래자 검색...',
    'placeholder.noLimit': '제한 없음',
    'placeholder.preferredLanguage': '선호하는 언어를 선택하세요',
    
    // Alert types
    'alerts.type.volume': '거래량',
    'alerts.type.company': '회사명',
    'alerts.type.trader': '거래자 직책',
    
    // Search page
    'search.title': '검색 및 필터',
    'search.subtitle': '고급 기준으로 내부자 거래 데이터를 검색하고 필터링',
    'search.filters': '필터',
    'search.clear': '지우기',
    'search.tradeType': '거래 유형',
    'search.dateRange': '날짜 범위',
    'search.sortBy': '정렬 기준',
    'search.dateRange.all': '전체 기간',
    'search.dateRange.7d': '최근 7일',
    'search.dateRange.30d': '최근 30일',
    'search.dateRange.90d': '최근 90일',
    'search.sort.recent': '최신순',
    'search.sort.value': '금액순',
    'search.sort.company': '회사명',
    'search.results': '결과',
    'search.buyTrades': '매수 거래',
    'search.sellTrades': '매도 거래',
    'search.totalVolume': '총 거래량',
    'search.companies': '회사',
    'search.traders': '거래자',
    'search.totalFound': '총 거래 건수',
    'search.combinedValue': '통합 가치',
    'search.uniqueEntities': '고유 기업',
    'search.uniqueInsiders': '고유 내부자',
    'search.searchResults': '검색 결과',
    'search.noTrades': '거래가 없습니다',
    'search.placeholder.minValue': '1000000',
    'search.value': '최소 값',
    
    // Alerts page
    'alerts.title': '스마트 알림',
    'alerts.subtitle': '내부자 거래 활동에 대한 지능형 알림 설정',
    'alerts.active': '활성 알림',
    'alerts.createNew': '새 알림 만들기',
    'alerts.alertName': '알림 이름',
    'alerts.alertType': '알림 유형',
    'alerts.condition': '조건',
    'alerts.value': '값',
    'alerts.paused': '일시정지',
    'alerts.noAlerts': '아직 설정된 알림이 없습니다',
    'alerts.createFirst': '아래에서 첫 번째 알림을 생성하세요',
    'alerts.noMatches': '최근 일치하는 항목이 없습니다',
    'alerts.setupMatches': '일치하는 항목을 보려면 알림을 설정하세요',
    'alerts.condition.greaterThan': '초과',
    'alerts.condition.lessThan': '미만',
    'alerts.condition.equals': '같음',
    'alerts.condition.contains': '포함',
    'alerts.placeholder.name': '예: 대형 애플 거래',
    'alerts.recentMatches': '최근 일치',
    
    // Live Trading page
    'liveTrading.filtersAndSearch': '필터 및 검색',
    'liveTrading.tradeType': '거래 유형',
    'liveTrading.aiSignal': 'AI 신호',
    'liveTrading.companyTicker': '회사/티커',
    'liveTrading.traderName': '거래자 이름',
    'liveTrading.minValue': '최소 값 ($)',
    'liveTrading.maxValue': '최대 값 ($)',
    'liveTrading.liveFeed': '최근 내부자 거래 (1개월치만 표시)',
    'liveTrading.tradesShown': '거래 표시됨',
    'liveTrading.noTrades': '거래가 없습니다',
    'liveTrading.adjustFilters': '필터를 조정해 보세요',
    'liveTrading.insider': '내부자',
    'liveTrading.tradeDetails': '거래 세부정보',
    'liveTrading.totalValue': '총 가치',
    'liveTrading.score': '점수:',
    'liveTrading.loadMore': '더 많은 거래 불러오기',
    'liveTrading.activeNow': '현재 활성',
    'liveTrading.alertsSet': '알림 설정',
    
    // Trade Card
    'tradeCard.filed': '신고됨',
    'tradeCard.shares': '주식수',
    'tradeCard.avgPrice': '평균 가격',
    'tradeCard.totalValue': '총 가치',
    'tradeCard.ownership': '소유권',
    'tradeCard.details': '세부정보',
    
    // Trade List
    'tradeList.recentTrades': '최근 내부자 거래',
    'tradeList.searchCompanies': '회사 검색...',
    'tradeList.sort': '정렬:',
    'tradeList.date': '날짜',
    'tradeList.value': '가치',
    'tradeList.noTradesFound': '조건에 맞는 거래가 없습니다.',
    'tradeList.loading': '로딩 중...',
    'tradeList.loadMore': '더 많은 거래 불러오기',
    'tradeList.noMatches': '조건에 맞는 거래가 없습니다.',
    'tradeList.searchPlaceholder': '회사 검색...',
    
    // Dashboard Stats
    'dashboardStats.todayTrades': '오늘의 거래',
    'dashboardStats.totalVolume': '총 거래량',
    'dashboardStats.fromLastWeek': '지난주 대비',
    'dashboardStats.recentActivity': '최근 활동',
    'dashboardStats.monitoring': '모든 주요 거래소에서 내부자 거래 모니터링',
    'dashboardStats.marketCoverage': '시장 커버리지',
    'dashboardStats.realTimeAnalysis': '실시간 SEC 신고 분석 및 거래 분류',
    'dashboardStats.topMovers': '오늘의 최고 상승주',
    
    // Analytics page
    'analytics.subtitle': '포괄적인 내부자 거래 시장 분석 및 인사이트',
    'analytics.totalTrades': '총 거래',
    'analytics.transactionsRecorded': '기록된 내부자 거래',
    'analytics.totalVolume': '총 거래량',
    'analytics.combinedValue': '통합 거래 가치',
    'analytics.avgTradeSize': '평균 거래 규모',
    'analytics.averageValue': '평균 거래 가치',
    'analytics.companies': '회사',
    'analytics.uniqueTracked': '추적된 고유 회사',
    'analytics.tradeDistribution': '거래 유형 분포',
    'analytics.monthlyActivity': '월별 거래 활동',
    'analytics.topCompanies': '거래량 상위 회사',
    'analytics.trades': '거래',
    'analytics.combinedTransactionValue': '통합 거래 가치',
    'analytics.averageTransactionValue': '평균 거래 가치',
    'analytics.uniqueCompaniesTracked': '추적된 고유 회사',
    'analytics.tradeTypeDistribution': '거래 유형 분포',
    'analytics.monthlyTradingActivity': '월별 거래 활동',
    'analytics.topCompaniesByVolume': '거래량 상위 회사',
    'analytics.buys': '매수',
    'analytics.sells': '매도',
    
    // Trade Detail page
    'tradeDetail.notFound': '거래를 찾을 수 없음',
    'tradeDetail.notFoundMessage': '요청한 거래를 찾을 수 없습니다.',
    'tradeDetail.backToDashboard': '대시보드로 돌아가기',
    'tradeDetail.back': '뒤로',
    'tradeDetail.title': '거래 세부정보',
    'tradeDetail.companyInfo': '회사 정보',
    'tradeDetail.company': '회사',
    'tradeDetail.tickerSymbol': '티커 심볼',
    'tradeDetail.tradeType': '거래 유형',
    'tradeDetail.traderInfo': '거래자 정보',
    'tradeDetail.name': '이름',
    'tradeDetail.titlePosition': '직책/지위',
    'tradeDetail.ownership': '소유권',
    'tradeDetail.transactionDetails': '거래 세부정보',
    'tradeDetail.sharesTraded': '거래된 주식수',
    'tradeDetail.pricePerShare': '주당 가격',
    'tradeDetail.totalValue': '총 거래 가치',
    'tradeDetail.filingDate': '신고 날짜',
    'tradeDetail.currentPrice': '현재 주가',
    'tradeDetail.volume': '거래량',
    'tradeDetail.lastUpdated': '최종 업데이트',
    'tradeDetail.analysis': '상세 분석',
    'tradeDetail.priceComparison': '가격 비교',
    'tradeDetail.tradePrice': '거래 가격:',
    'tradeDetail.currentPriceLabel': '현재 가격:',
    'tradeDetail.perShareComparison': '주당 비교',
    'tradeDetail.secFiling': 'SEC 신고 #',
    'tradeDetail.totalTransactionValue': '총 거래 가치',
    'tradeDetail.currentStockPrice': '현재 주가',
    'tradeDetail.detailedAnalysis': '상세 분석',
    
    // Price Comparison Chart
    'priceChart.title': '가격 비교 차트',
    'priceChart.tradePrice': '거래 가격',
    'priceChart.currentPrice': '현재 가격',
    'priceChart.today': '오늘',
    'priceChart.insiderTrade': '내부자 거래',
    'priceChart.movement': '거래 이후 가격 변동',
    'priceChart.increased': '가격 상승',
    'priceChart.decreased': '가격 하락',
    'priceChart.tradePriceLabel': '거래 가격:',
    'priceChart.currentLabel': '현재:',
    
    // Not Found page
    'notFound.title': '404 - 페이지를 찾을 수 없습니다',
    'notFound.message': '요청하신 페이지가 존재하지 않습니다.',
  },
  ja: {
    // Navigation
    'nav.dashboard': 'ダッシュボード',
    'nav.livetrading': 'ライブトレーディング',
    'nav.analytics': '分析',
    'nav.alerts': 'アラート',
    'nav.search': '検索',
    'nav.settings': '設定',
    
    // Dashboard
    'dashboard.title': 'インサイダートラック プロ',
    'dashboard.subtitle': 'AI搭載インサイダー取引モニター',
    'dashboard.lastUpdated': '最終更新',
    'dashboard.stats.todayTrades': '今日の取引',
    'dashboard.stats.totalVolume': '総取引量',
    'dashboard.recentActivity': '最近の活動',
    'dashboard.marketCoverage': '市場カバレッジ',
    'dashboard.topMoversToday': '今日の値上がり株',
    
    // Trades
    'trades.loadingStats': '取引統計を読み込み中...',
    'trades.failedStats': '取引統計の読み込みに失敗しました。ページを更新してください。',
    'trades.recentTrades': '最近のインサイダー取引',
    'trades.loadingTrades': '取引を読み込み中...',
    'trades.viewDetails': '詳細を見る',
    'trades.loadMore': 'さらに取引を読み込む',
    'trades.noTrades': '取引がありません',
    'trades.company': '会社',
    'trades.shares': '株式数',
    'trades.price': '価格',
    'trades.total': '総価値',
    'trades.signal': 'シグナル',
    'trades.significance': '重要度',
    'trades.filed': '提出日',
    
    // Settings
    'settings.title': '設定',
    'settings.language': '言語',
    'settings.theme': 'テーマ',
    'settings.notifications': '通知',
    'settings.language.english': 'English',
    'settings.language.korean': '한국어',
    'settings.language.japanese': '日本語',
    'settings.language.chinese': '中文',
    'settings.theme.light': 'ライト',
    'settings.theme.dark': 'ダーク',
    'settings.theme.system': 'システム',
    'settings.description': 'アプリケーションの設定と環境設定を管理します。',
    'settings.themeDescription': '好みのテーマを選択してください',
    'settings.notificationsFuture': '通知設定は今後のアップデートで利用可能になります。',
    
    // WebSocket Status
    'websocket.connected': 'ライブフィードに接続済み',
    'websocket.disconnected': 'ライブフィードから切断',
    'websocket.connecting': 'ライブフィードに接続中...',
    
    // General
    'general.loading': '読み込み中...',
    'general.error': 'エラー',
    'general.success': '成功',
    'general.refresh': '更新',
    'general.save': '保存',
    'general.cancel': 'キャンセル',
    'general.delete': '削除',
    
    // Page specific
    'page.dashboard.subtitle': 'リアルタイムインサイダー取引監視と市場インテリジェンス',
    'page.livetrading.title': 'ライブトレーディング',
    'page.livetrading.subtitle': 'AI搭載分析によるリアルタイムインサイダー取引活動',
    'page.search.placeholder': '企業、ティッカー、トレーダー、役職を検索...',
    'page.alerts.title': 'スマートアラート',
    'page.alerts.subtitle': 'インサイダー取引活動のインテリジェントアラート設定',
    'page.analytics.title': '市場分析',
    'page.analytics.subtitle': 'インサイダー取引パターンの包括的分析',
    
    // WebSocket and Connection
    'connection.liveFeedActive': 'ライブデータフィード有効 - リアルタイムSEC申告監視',
    'connection.connectionLost': '接続が失われました - 再接続を試行中...',
    'connection.liveFeed': 'ライブフィード',
    'connection.disconnected': '切断済み',
    
    // Statistics and Data
    'stats.todayTrades': '今日の取引',
    'stats.totalVolume': '総取引量',
    'stats.tradingSummary': '取引サマリー',
    'stats.failedLoad': '取引統計の読み込みに失敗しました。ページを更新してください。',
    'stats.fromLastWeek': '先週比',
    
    // Filters and Search
    'filter.allTypes': 'すべてのタイプ',
    'filter.buyOrders': '買い注文',
    'filter.sellOrders': '売り注文',
    'filter.allSignals': 'すべてのシグナル',
    'filter.buySignal': '買いシグナル',
    'filter.sellSignal': '売りシグナル',
    'filter.holdSignal': 'ホールドシグナル',
    'filter.buyOnly': '買いのみ',
    'filter.sellOnly': '売りのみ',
    
    // Placeholders
    'placeholder.searchCompany': '企業を検索...',
    'placeholder.searchTrader': 'トレーダーを検索...',
    'placeholder.noLimit': '制限なし',
    'placeholder.preferredLanguage': '好みの言語を選択してください',
    
    // Alert types
    'alerts.type.volume': '取引量',
    'alerts.type.company': '会社名',
    'alerts.type.trader': 'トレーダー役職',
    
    // Search page
    'search.title': '検索とフィルター',
    'search.subtitle': '高度な条件でインサイダー取引データを検索・フィルタリング',
    'search.filters': 'フィルター',
    'search.clear': 'クリア',
    'search.tradeType': '取引タイプ',
    'search.dateRange': '日付範囲',
    'search.sortBy': '並び順',
    'search.dateRange.all': '全期間',
    'search.dateRange.7d': '過去7日',
    'search.dateRange.30d': '過去30日',
    'search.dateRange.90d': '過去90日',
    'search.sort.recent': '最新順',
    'search.sort.value': '金額順',
    'search.sort.company': '会社名',
    'search.results': '結果',
    'search.buyTrades': '買い取引',
    'search.sellTrades': '売り取引',
    'search.totalVolume': '総取引量',
    'search.companies': '企業',
    'search.traders': 'トレーダー',
    'search.totalFound': '総取引数',
    'search.combinedValue': '合計価値',
    'search.uniqueEntities': 'ユニーク企業',
    'search.uniqueInsiders': 'ユニークインサイダー',
    'search.searchResults': '検索結果',
    'search.noTrades': '取引が見つかりません',
    'search.placeholder.minValue': '1000000',
    'search.value': '最小値',
    
    // Alerts page
    'alerts.title': 'スマートアラート',
    'alerts.subtitle': 'インサイダー取引活動のインテリジェントアラート設定',
    'alerts.active': 'アクティブアラート',
    'alerts.createNew': '新しいアラートを作成',
    'alerts.alertName': 'アラート名',
    'alerts.alertType': 'アラートタイプ',
    'alerts.condition': '条件',
    'alerts.value': '値',
    'alerts.paused': '一時停止',
    'alerts.noAlerts': 'アラートが設定されていません',
    'alerts.createFirst': '下で最初のアラートを作成してください',
    'alerts.noMatches': '最近の一致がありません',
    'alerts.setupMatches': 'アラートを設定して一致を確認してください',
    'alerts.condition.greaterThan': '以上',
    'alerts.condition.lessThan': '未満',
    'alerts.condition.equals': '等しい',
    'alerts.condition.contains': '含む',
    'alerts.placeholder.name': '例：大型アップル取引',
    'alerts.recentMatches': '最近の一致',
    
    // Live Trading page
    'liveTrading.filtersAndSearch': 'フィルターと検索',
    'liveTrading.tradeType': '取引タイプ',
    'liveTrading.aiSignal': 'AIシグナル',
    'liveTrading.companyTicker': '企業/ティッカー',
    'liveTrading.traderName': 'トレーダー名',
    'liveTrading.minValue': '最小値 ($)',
    'liveTrading.maxValue': '最大値 ($)',
    'liveTrading.liveFeed': 'ライブ取引フィード',
    'liveTrading.tradesShown': '取引表示中',
    'liveTrading.noTrades': '取引が見つかりません',
    'liveTrading.adjustFilters': 'フィルターを調整してください',
    'liveTrading.insider': 'インサイダー',
    'liveTrading.tradeDetails': '取引詳細',
    'liveTrading.totalValue': '総価値',
    'liveTrading.score': 'スコア:',
    'liveTrading.loadMore': 'さらに取引を読み込む',
    'liveTrading.activeNow': '現在アクティブ',
    'liveTrading.alertsSet': 'アラート設定',
    
    // Trade Card
    'tradeCard.filed': '提出済み',
    'tradeCard.shares': '株式数',
    'tradeCard.avgPrice': '平均価格',
    'tradeCard.totalValue': '総価値',
    'tradeCard.ownership': '所有権',
    'tradeCard.details': '詳細',
    
    // Trade List
    'tradeList.recentTrades': '最近のインサイダー取引',
    'tradeList.searchCompanies': '企業を検索...',
    'tradeList.sort': 'ソート:',
    'tradeList.date': '日付',
    'tradeList.value': '価値',
    'tradeList.noTradesFound': '条件に一致する取引が見つかりません。',
    'tradeList.loading': '読み込み中...',
    'tradeList.loadMore': 'さらに取引を読み込む',
    'tradeList.noMatches': '条件に一致する取引が見つかりません。',
    'tradeList.searchPlaceholder': '企業を検索...',
    
    // Dashboard Stats
    'dashboardStats.todayTrades': '今日の取引',
    'dashboardStats.totalVolume': '総取引量',
    'dashboardStats.fromLastWeek': '先週比',
    'dashboardStats.recentActivity': '最近の活動',
    'dashboardStats.monitoring': 'すべての主要取引所でインサイダー取引を監視',
    'dashboardStats.marketCoverage': '市場カバレッジ',
    'dashboardStats.realTimeAnalysis': 'リアルタイムSEC申告分析と取引分類',
    'dashboardStats.topMovers': '今日のトップムーバー',
    
    // Analytics page
    'analytics.subtitle': '包括的なインサイダー取引市場分析とインサイト',
    'analytics.totalTrades': '総取引数',
    'analytics.transactionsRecorded': '記録されたインサイダー取引',
    'analytics.totalVolume': '総取引量',
    'analytics.combinedValue': '合計取引価値',
    'analytics.avgTradeSize': '平均取引規模',
    'analytics.averageValue': '平均取引価値',
    'analytics.companies': '企業',
    'analytics.uniqueTracked': '追跡されたユニーク企業',
    'analytics.tradeDistribution': '取引タイプ分布',
    'analytics.monthlyActivity': '月次取引活動',
    'analytics.topCompanies': '取引量上位企業',
    'analytics.trades': '取引',
    'analytics.combinedTransactionValue': '合計取引価値',
    'analytics.averageTransactionValue': '平均取引価値',
    'analytics.uniqueCompaniesTracked': '追跡されたユニーク企業',
    'analytics.tradeTypeDistribution': '取引タイプ分布',
    'analytics.monthlyTradingActivity': '月次取引活動',
    'analytics.topCompaniesByVolume': '取引量上位企業',
    'analytics.buys': '買い',
    'analytics.sells': '売り',
    
    // Trade Detail page
    'tradeDetail.notFound': '取引が見つかりません',
    'tradeDetail.notFoundMessage': '要求された取引が見つかりませんでした。',
    'tradeDetail.backToDashboard': 'ダッシュボードに戻る',
    'tradeDetail.back': '戻る',
    'tradeDetail.title': '取引詳細',
    'tradeDetail.companyInfo': '企業情報',
    'tradeDetail.company': '企業',
    'tradeDetail.tickerSymbol': 'ティッカーシンボル',
    'tradeDetail.tradeType': '取引タイプ',
    'tradeDetail.traderInfo': 'トレーダー情報',
    'tradeDetail.name': '名前',
    'tradeDetail.titlePosition': '役職/地位',
    'tradeDetail.ownership': '所有権',
    'tradeDetail.transactionDetails': '取引詳細',
    'tradeDetail.sharesTraded': '取引株式数',
    'tradeDetail.pricePerShare': '1株当たり価格',
    'tradeDetail.totalValue': '総取引価値',
    'tradeDetail.filingDate': '申告日',
    'tradeDetail.currentPrice': '現在の株価',
    'tradeDetail.volume': '取引量',
    'tradeDetail.lastUpdated': '最終更新',
    'tradeDetail.analysis': '詳細分析',
    'tradeDetail.priceComparison': '価格比較',
    'tradeDetail.tradePrice': '取引価格:',
    'tradeDetail.currentPriceLabel': '現在価格:',
    'tradeDetail.perShareComparison': '1株当たり比較',
    'tradeDetail.secFiling': 'SEC申告 #',
    'tradeDetail.totalTransactionValue': '総取引価値',
    'tradeDetail.currentStockPrice': '現在の株価',
    'tradeDetail.detailedAnalysis': '詳細分析',
    
    // Price Comparison Chart
    'priceChart.title': '価格比較チャート',
    'priceChart.tradePrice': '取引価格',
    'priceChart.currentPrice': '現在価格',
    'priceChart.today': '今日',
    'priceChart.insiderTrade': 'インサイダー取引',
    'priceChart.movement': '取引以降の価格変動',
    'priceChart.increased': '価格上昇',
    'priceChart.decreased': '価格下落',
    'priceChart.tradePriceLabel': '取引価格:',
    'priceChart.currentLabel': '現在:',
    
    // Not Found page
    'notFound.title': '404 - ページが見つかりません',
    'notFound.message': 'お探しのページは存在しません。',
  },
  zh: {
    // Navigation
    'nav.dashboard': '仪表盘',
    'nav.livetrading': '实时交易',
    'nav.analytics': '分析',
    'nav.alerts': '提醒',
    'nav.search': '搜索',
    'nav.settings': '设置',
    
    // Dashboard
    'dashboard.title': '内幕交易追踪专业版',
    'dashboard.subtitle': 'AI驱动的内幕交易监控器',
    'dashboard.lastUpdated': '最后更新',
    'dashboard.stats.todayTrades': '今日交易',
    'dashboard.stats.totalVolume': '总交易量',
    'dashboard.recentActivity': '最近活动',
    'dashboard.marketCoverage': '市场覆盖',
    'dashboard.topMoversToday': '今日热门股',
    
    // Trades
    'trades.loadingStats': '正在加载交易统计...',
    'trades.failedStats': '加载交易统计失败。请刷新页面。',
    'trades.recentTrades': '最近的内幕交易',
    'trades.loadingTrades': '正在加载交易...',
    'trades.viewDetails': '查看详情',
    'trades.loadMore': '加载更多交易',
    'trades.noTrades': '没有可用的交易',
    'trades.company': '公司',
    'trades.shares': '股份',
    'trades.price': '价格',
    'trades.total': '总价值',
    'trades.signal': '信号',
    'trades.significance': '重要性',
    'trades.filed': '提交日期',
    
    // Settings
    'settings.title': '设置',
    'settings.language': '语言',
    'settings.theme': '主题',
    'settings.notifications': '通知',
    'settings.language.english': 'English',
    'settings.language.korean': '한국어',
    'settings.language.japanese': '日本語',
    'settings.language.chinese': '中文',
    'settings.theme.light': '浅色',
    'settings.theme.dark': '深色',
    'settings.theme.system': '系统',
    'settings.description': '管理您的应用程序偏好和设置。',
    'settings.themeDescription': '选择您喜欢的主题',
    'settings.notificationsFuture': '通知设置将在未来更新中提供。',
    
    // WebSocket Status
    'websocket.connected': '已连接到实时推送',
    'websocket.disconnected': '实时推送已断开',
    'websocket.connecting': '正在连接到实时推送...',
    
    // General
    'general.loading': '加载中...',
    'general.error': '错误',
    'general.success': '成功',
    'general.refresh': '刷新',
    'general.save': '保存',
    'general.cancel': '取消',
    'general.delete': '删除',
    
    // Page specific
    'page.dashboard.subtitle': '实时内幕交易监控和市场情报',
    'page.livetrading.title': '实时交易',
    'page.livetrading.subtitle': '带AI分析的实时内幕交易活动',
    'page.search.placeholder': '搜索公司、股票代码、交易员或职位...',
    'page.alerts.title': '智能提醒',
    'page.alerts.subtitle': '为内幕交易活动设置智能提醒',
    'page.analytics.title': '市场分析',
    'page.analytics.subtitle': '内幕交易模式的综合分析',
    
    // WebSocket and Connection
    'connection.liveFeedActive': '实时数据推送已激活 - 实时SEC文件监控',
    'connection.connectionLost': '连接已断开 - 正在尝试重新连接...',
    'connection.liveFeed': '实时推送',
    'connection.disconnected': '已断开',
    
    // Statistics and Data
    'stats.todayTrades': '今日交易',
    'stats.totalVolume': '总交易量',
    'stats.tradingSummary': '交易摘要',
    'stats.failedLoad': '加载交易统计失败。请刷新页面。',
    'stats.fromLastWeek': '与上周相比',
    
    // Filters and Search
    'filter.allTypes': '所有类型',
    'filter.buyOrders': '买入订单',
    'filter.sellOrders': '卖出订单',
    'filter.allSignals': '所有信号',
    'filter.buySignal': '买入信号',
    'filter.sellSignal': '卖出信号',
    'filter.holdSignal': '持有信号',
    'filter.buyOnly': '仅买入',
    'filter.sellOnly': '仅卖出',
    
    // Placeholders
    'placeholder.searchCompany': '搜索公司...',
    'placeholder.searchTrader': '搜索交易员...',
    'placeholder.noLimit': '无限制',
    'placeholder.preferredLanguage': '选择您的首选语言',
    
    // Alert types
    'alerts.type.volume': '交易量',
    'alerts.type.company': '公司名称',
    'alerts.type.trader': '交易员职位',
    
    // Search page
    'search.title': '搜索和筛选',
    'search.subtitle': '使用高级条件搜索和筛选内幕交易数据',
    'search.filters': '筛选器',
    'search.clear': '清除',
    'search.tradeType': '交易类型',
    'search.dateRange': '日期范围',
    'search.sortBy': '排序方式',
    'search.dateRange.all': '全部时间',
    'search.dateRange.7d': '过去7天',
    'search.dateRange.30d': '过去30天',
    'search.dateRange.90d': '过去90天',
    'search.sort.recent': '最新',
    'search.sort.value': '金额最高',
    'search.sort.company': '公司名称',
    'search.results': '结果',
    'search.buyTrades': '买入交易',
    'search.sellTrades': '卖出交易',
    'search.totalVolume': '总交易量',
    'search.companies': '公司',
    'search.traders': '交易员',
    'search.totalFound': '找到的总交易数',
    'search.combinedValue': '综合价值',
    'search.uniqueEntities': '独特实体',
    'search.uniqueInsiders': '独特内幕人士',
    'search.searchResults': '搜索结果',
    'search.noTrades': '未找到交易',
    'search.placeholder.minValue': '1000000',
    'search.value': '最小值',
    
    // Alerts page
    'alerts.title': '智能提醒',
    'alerts.subtitle': '为内幕交易活动设置智能提醒',
    'alerts.active': '活动提醒',
    'alerts.createNew': '创建新提醒',
    'alerts.alertName': '提醒名称',
    'alerts.alertType': '提醒类型',
    'alerts.condition': '条件',
    'alerts.value': '值',
    'alerts.paused': '暂停',
    'alerts.noAlerts': '尚未配置提醒',
    'alerts.createFirst': '在下方创建您的第一个提醒',
    'alerts.noMatches': '最近没有匹配',
    'alerts.setupMatches': '设置提醒以在此查看匹配',
    'alerts.condition.greaterThan': '大于',
    'alerts.condition.lessThan': '小于',
    'alerts.condition.equals': '等于',
    'alerts.condition.contains': '包含',
    'alerts.placeholder.name': '例如：大型苹果交易',
    'alerts.recentMatches': '最近匹配',
    
    // Live Trading page
    'liveTrading.filtersAndSearch': '筛选器和搜索',
    'liveTrading.tradeType': '交易类型',
    'liveTrading.aiSignal': 'AI信号',
    'liveTrading.companyTicker': '公司/股票代码',
    'liveTrading.traderName': '交易员姓名',
    'liveTrading.minValue': '最小值 ($)',
    'liveTrading.maxValue': '最大值 ($)',
    'liveTrading.liveFeed': '实时交易推送',
    'liveTrading.tradesShown': '显示的交易',
    'liveTrading.noTrades': '未找到交易',
    'liveTrading.adjustFilters': '尝试调整您的筛选器',
    'liveTrading.insider': '内幕人士',
    'liveTrading.tradeDetails': '交易详情',
    'liveTrading.totalValue': '总价值',
    'liveTrading.score': '评分:',
    'liveTrading.loadMore': '加载更多交易',
    'liveTrading.activeNow': '当前活跃',
    'liveTrading.alertsSet': '提醒设置',
    
    // Trade Card
    'tradeCard.filed': '已提交',
    'tradeCard.shares': '股数',
    'tradeCard.avgPrice': '平均价格',
    'tradeCard.totalValue': '总价值',
    'tradeCard.ownership': '所有权',
    'tradeCard.details': '详情',
    
    // Trade List
    'tradeList.recentTrades': '最近内幕交易',
    'tradeList.searchCompanies': '搜索公司...',
    'tradeList.sort': '排序:',
    'tradeList.date': '日期',
    'tradeList.value': '价值',
    'tradeList.noTradesFound': '未找到符合您条件的交易。',
    'tradeList.loading': '加载中...',
    'tradeList.loadMore': '加载更多交易',
    'tradeList.noMatches': '未找到符合您条件的交易。',
    'tradeList.searchPlaceholder': '搜索公司...',
    
    // Dashboard Stats
    'dashboardStats.todayTrades': '今日交易',
    'dashboardStats.totalVolume': '总交易量',
    'dashboardStats.fromLastWeek': '与上周相比',
    'dashboardStats.recentActivity': '最近活动',
    'dashboardStats.monitoring': '监控所有主要交易所的内幕交易',
    'dashboardStats.marketCoverage': '市场覆盖',
    'dashboardStats.realTimeAnalysis': '实时SEC文件分析和交易分类',
    'dashboardStats.topMovers': '今日热门',
    
    // Analytics page
    'analytics.subtitle': '全面的内幕交易市场分析和洞察',
    'analytics.totalTrades': '总交易数',
    'analytics.transactionsRecorded': '记录的内幕交易',
    'analytics.totalVolume': '总交易量',
    'analytics.combinedValue': '综合交易价值',
    'analytics.avgTradeSize': '平均交易规模',
    'analytics.averageValue': '平均交易价值',
    'analytics.companies': '公司',
    'analytics.uniqueTracked': '跟踪的独特公司',
    'analytics.tradeDistribution': '交易类型分布',
    'analytics.monthlyActivity': '月度交易活动',
    'analytics.topCompanies': '按交易量排名的顶级公司',
    'analytics.trades': '交易',
    'analytics.combinedTransactionValue': '综合交易价值',
    'analytics.averageTransactionValue': '平均交易价值',
    'analytics.uniqueCompaniesTracked': '跟踪的独特公司',
    'analytics.tradeTypeDistribution': '交易类型分布',
    'analytics.monthlyTradingActivity': '月度交易活动',
    'analytics.topCompaniesByVolume': '按交易量排名的顶级公司',
    'analytics.buys': '买入',
    'analytics.sells': '卖出',
    
    // Trade Detail page
    'tradeDetail.notFound': '未找到交易',
    'tradeDetail.notFoundMessage': '无法找到请求的交易。',
    'tradeDetail.backToDashboard': '返回仪表盘',
    'tradeDetail.back': '返回',
    'tradeDetail.title': '交易详情',
    'tradeDetail.companyInfo': '公司信息',
    'tradeDetail.company': '公司',
    'tradeDetail.tickerSymbol': '股票代码',
    'tradeDetail.tradeType': '交易类型',
    'tradeDetail.traderInfo': '交易员信息',
    'tradeDetail.name': '姓名',
    'tradeDetail.titlePosition': '职位/地位',
    'tradeDetail.ownership': '所有权',
    'tradeDetail.transactionDetails': '交易详情',
    'tradeDetail.sharesTraded': '交易股数',
    'tradeDetail.pricePerShare': '每股价格',
    'tradeDetail.totalValue': '总交易价值',
    'tradeDetail.filingDate': '提交日期',
    'tradeDetail.currentPrice': '当前股价',
    'tradeDetail.volume': '交易量',
    'tradeDetail.lastUpdated': '最后更新',
    'tradeDetail.analysis': '详细分析',
    'tradeDetail.priceComparison': '价格比较',
    'tradeDetail.tradePrice': '交易价格：',
    'tradeDetail.currentPriceLabel': '当前价格：',
    'tradeDetail.perShareComparison': '每股比较',
    'tradeDetail.secFiling': 'SEC文件 #',
    'tradeDetail.totalTransactionValue': '总交易价值',
    'tradeDetail.currentStockPrice': '当前股价',
    'tradeDetail.detailedAnalysis': '详细分析',
    
    // Price Comparison Chart
    'priceChart.title': '价格比较图表',
    'priceChart.tradePrice': '交易价格',
    'priceChart.currentPrice': '当前价格',
    'priceChart.today': '今天',
    'priceChart.insiderTrade': '内幕交易',
    'priceChart.movement': '交易后价格变动',
    'priceChart.increased': '价格上涨',
    'priceChart.decreased': '价格下跌',
    'priceChart.tradePriceLabel': '交易价格：',
    'priceChart.currentLabel': '当前：',
    
    // Not Found page
    'notFound.title': '404 - 页面未找到',
    'notFound.message': '您要查找的页面不存在。',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Check localStorage for saved language
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && Object.keys(translations).includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('ko')) {
        setLanguage('ko');
      } else if (browserLang.startsWith('ja')) {
        setLanguage('ja');
      } else if (browserLang.startsWith('zh')) {
        setLanguage('zh');
      } else {
        setLanguage('en');
      }
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    const currentTranslations = translations[language] as Record<string, string>;
    const fallbackTranslations = translations.en as Record<string, string>;
    return currentTranslations[key] || fallbackTranslations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    'dashboard.title': '内幕追踪专业版',
    'dashboard.subtitle': 'AI驱动的内幕交易监控器',
    'dashboard.lastUpdated': '最后更新',
    'dashboard.stats.todayTrades': '今日交易',
    'dashboard.stats.totalVolume': '总交易量',
    
    // Trades
    'trades.loadingStats': '正在加载交易统计...',
    'trades.failedStats': '加载交易统计失败。请刷新页面。',
    'trades.recentTrades': '最近的内幕交易',
    'trades.loadingTrades': '正在加载交易...',
    'trades.viewDetails': '查看详情',
    'trades.loadMore': '加载更多交易',
    'trades.noTrades': '没有交易',
    'trades.company': '公司',
    'trades.shares': '股数',
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
    
    // WebSocket Status
    'websocket.connected': '已连接到实时源',
    'websocket.disconnected': '实时源连接断开',
    'websocket.connecting': '正在连接实时源...',
    
    // General
    'general.loading': '加载中...',
    'general.error': '错误',
    'general.success': '成功',
    'general.refresh': '刷新',
    'general.save': '保存',
    'general.cancel': '取消',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
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
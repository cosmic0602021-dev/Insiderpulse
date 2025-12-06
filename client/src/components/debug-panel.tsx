import { useState, useEffect } from 'react';
import { ENV_CONFIG } from '@/lib/environment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface DebugInfo {
  // 환경 감지
  isAppintos: boolean;
  apiBaseUrl: string;
  wsBaseUrl: string;
  environment: string;

  // 브라우저 정보
  userAgent: string;
  hostname: string;
  protocol: string;
  pathname: string;
  search: string;

  // 앱인토스 특정 검사
  hasReactNativeWebView: boolean;
  hasAppintosGlobal: boolean;
  urlParams: Record<string, string>;

  // API 테스트 결과
  rankingsTest: 'pending' | 'success' | 'error';
  rankingsError: string | null;
  tradesTest: 'pending' | 'success' | 'error';
  tradesError: string | null;
}

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isTestingApis, setIsTestingApis] = useState(false);

  useEffect(() => {
    collectDebugInfo();
  }, []);

  const collectDebugInfo = () => {
    const params: Record<string, string> = {};
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.forEach((value, key) => {
      params[key] = value;
    });

    setDebugInfo({
      // 환경 설정
      isAppintos: ENV_CONFIG.isAppintos,
      apiBaseUrl: ENV_CONFIG.apiBaseUrl,
      wsBaseUrl: ENV_CONFIG.wsBaseUrl,
      environment: ENV_CONFIG.environment,

      // 브라우저
      userAgent: navigator.userAgent,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      pathname: window.location.pathname,
      search: window.location.search,

      // 앱인토스 검사
      hasReactNativeWebView: !!(window as any).ReactNativeWebView,
      hasAppintosGlobal: !!(window as any).__APPINTOS__,
      urlParams: params,

      // API 테스트
      rankingsTest: 'pending',
      rankingsError: null,
      tradesTest: 'pending',
      tradesError: null,
    });
  };

  const testApis = async () => {
    setIsTestingApis(true);

    // Test Rankings API
    try {
      const rankingsUrl = `${ENV_CONFIG.apiBaseUrl}/rankings?language=en`;
      console.log('[DEBUG] Testing Rankings API:', rankingsUrl);
      const rankingsRes = await fetch(rankingsUrl);

      setDebugInfo(prev => prev ? {
        ...prev,
        rankingsTest: rankingsRes.ok ? 'success' : 'error',
        rankingsError: rankingsRes.ok ? null : `HTTP ${rankingsRes.status}: ${rankingsRes.statusText}`
      } : null);
    } catch (error) {
      setDebugInfo(prev => prev ? {
        ...prev,
        rankingsTest: 'error',
        rankingsError: error instanceof Error ? error.message : String(error)
      } : null);
    }

    // Test Trades API
    try {
      const tradesUrl = `${ENV_CONFIG.apiBaseUrl}/trades?limit=1`;
      console.log('[DEBUG] Testing Trades API:', tradesUrl);
      const tradesRes = await fetch(tradesUrl);

      setDebugInfo(prev => prev ? {
        ...prev,
        tradesTest: tradesRes.ok ? 'success' : 'error',
        tradesError: tradesRes.ok ? null : `HTTP ${tradesRes.status}: ${tradesRes.statusText}`
      } : null);
    } catch (error) {
      setDebugInfo(prev => prev ? {
        ...prev,
        tradesTest: 'error',
        tradesError: error instanceof Error ? error.message : String(error)
      } : null);
    }

    setIsTestingApis(false);
  };

  if (!debugInfo) return null;

  const StatusIcon = ({ status }: { status: 'pending' | 'success' | 'error' | boolean }) => {
    if (status === 'success' || status === true) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'error' || status === false) return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 border-t-2 border-yellow-500 text-white font-mono text-xs">
      <div className="container mx-auto max-w-4xl">
        <div
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500 animate-pulse" />
            <span className="font-bold text-yellow-500">DEBUG MODE (앱인토스 테스트 진단)</span>
            <Badge variant="destructive" className="text-xs">
              {debugInfo.isAppintos ? '앱인토스 모드' : '브라우저 모드'}
            </Badge>
          </div>
          {isOpen ? <ChevronDown /> : <ChevronUp />}
        </div>

        {isOpen && (
          <div className="p-4 max-h-96 overflow-y-auto space-y-4">
            {/* 환경 설정 */}
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <StatusIcon status={debugInfo.isAppintos} />
                  환경 설정 (ENV_CONFIG)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <div><span className="text-yellow-500">isAppintos:</span> {String(debugInfo.isAppintos)}</div>
                <div><span className="text-yellow-500">apiBaseUrl:</span> {debugInfo.apiBaseUrl}</div>
                <div><span className="text-yellow-500">wsBaseUrl:</span> {debugInfo.wsBaseUrl}</div>
                <div><span className="text-yellow-500">environment:</span> {debugInfo.environment}</div>
              </CardContent>
            </Card>

            {/* 브라우저 정보 */}
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">브라우저 정보</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <div><span className="text-yellow-500">hostname:</span> {debugInfo.hostname}</div>
                <div><span className="text-yellow-500">protocol:</span> {debugInfo.protocol}</div>
                <div><span className="text-yellow-500">pathname:</span> {debugInfo.pathname}</div>
                <div><span className="text-yellow-500">search:</span> {debugInfo.search || '(없음)'}</div>
                <div className="truncate"><span className="text-yellow-500">userAgent:</span> {debugInfo.userAgent}</div>
              </CardContent>
            </Card>

            {/* 앱인토스 감지 결과 */}
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">앱인토스 감지 결과</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <StatusIcon status={debugInfo.hasReactNativeWebView} />
                  <span className="text-yellow-500">ReactNativeWebView:</span> {String(debugInfo.hasReactNativeWebView)}
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon status={debugInfo.hasAppintosGlobal} />
                  <span className="text-yellow-500">__APPINTOS__:</span> {String(debugInfo.hasAppintosGlobal)}
                </div>
                <div><span className="text-yellow-500">URL 파라미터:</span> {JSON.stringify(debugInfo.urlParams)}</div>
              </CardContent>
            </Card>

            {/* API 테스트 */}
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>API 연결 테스트</span>
                  <Button
                    size="sm"
                    onClick={testApis}
                    disabled={isTestingApis}
                    className="h-6 text-xs"
                  >
                    {isTestingApis ? '테스트 중...' : '테스트 실행'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <StatusIcon status={debugInfo.rankingsTest} />
                  <span className="text-yellow-500">Rankings API:</span>
                  <span>{debugInfo.rankingsTest}</span>
                </div>
                {debugInfo.rankingsError && (
                  <div className="text-red-400 pl-6 text-[10px]">{debugInfo.rankingsError}</div>
                )}

                <div className="flex items-center gap-2">
                  <StatusIcon status={debugInfo.tradesTest} />
                  <span className="text-yellow-500">Trades API:</span>
                  <span>{debugInfo.tradesTest}</span>
                </div>
                {debugInfo.tradesError && (
                  <div className="text-red-400 pl-6 text-[10px]">{debugInfo.tradesError}</div>
                )}
              </CardContent>
            </Card>

            {/* 로그 저장 안내 */}
            <div className="text-center text-yellow-500 text-xs p-2 bg-yellow-500/10 rounded">
              이 정보를 스크린샷으로 저장하여 개발팀에 공유해주세요
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

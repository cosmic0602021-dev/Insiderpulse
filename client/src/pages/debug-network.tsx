import { useState, useEffect } from 'react';
import { ENV_CONFIG, isAppintosEnvironment } from '@/lib/environment';

export default function DebugNetwork() {
  const [results, setResults] = useState<string[]>([]);
  const [envInfo, setEnvInfo] = useState<Record<string, string>>({});

  const addLog = (msg: string) => {
    setResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    // 환경 정보 수집
    const info: Record<string, string> = {
      'hostname': window.location.hostname,
      'origin': window.location.origin,
      'href': window.location.href,
      'protocol': window.location.protocol,
      'userAgent': navigator.userAgent.substring(0, 100),
      'isAppintos (감지)': String(isAppintosEnvironment()),
      'ENV_CONFIG.isAppintos': String(ENV_CONFIG.isAppintos),
      'ENV_CONFIG.apiBaseUrl': ENV_CONFIG.apiBaseUrl,
    };
    setEnvInfo(info);
    addLog('환경 정보 수집 완료');
  }, []);

  const testFetch = async (mode: string) => {
    const url = 'https://insiderpulse.pro/api/health';
    addLog(`테스트 시작: ${mode} - ${url}`);

    try {
      let response: Response;

      if (mode === 'normal') {
        response = await fetch(url);
      } else if (mode === 'no-cors') {
        response = await fetch(url, { mode: 'no-cors' });
      } else if (mode === 'cors') {
        response = await fetch(url, { mode: 'cors' });
      } else {
        response = await fetch(url);
      }

      addLog(`응답 status: ${response.status}, type: ${response.type}`);

      if (response.type !== 'opaque') {
        const text = await response.text();
        addLog(`응답 body: ${text.substring(0, 200)}`);
      } else {
        addLog('opaque 응답 - body 읽기 불가');
      }
    } catch (error: any) {
      addLog(`에러: ${error.name} - ${error.message}`);
    }
  };

  const testRelativeFetch = async () => {
    const url = '/api/health';
    addLog(`상대경로 테스트: ${url}`);

    try {
      const response = await fetch(url);
      addLog(`응답 status: ${response.status}`);
      const text = await response.text();
      addLog(`응답: ${text.substring(0, 200)}`);
    } catch (error: any) {
      addLog(`에러: ${error.name} - ${error.message}`);
    }
  };

  const testImage = () => {
    addLog('이미지 로드 테스트 시작');
    const img = new Image();
    img.onload = () => addLog('이미지 로드 성공!');
    img.onerror = () => addLog('이미지 로드 실패');
    img.src = 'https://insiderpulse.pro/favicon.ico?' + Date.now();
  };

  return (
    <div className="min-h-screen bg-black text-green-400 p-4 font-mono text-sm">
      <h1 className="text-xl mb-4">네트워크 디버그</h1>

      <div className="mb-6 p-4 bg-gray-900 rounded">
        <h2 className="text-yellow-400 mb-2">환경 정보</h2>
        {Object.entries(envInfo).map(([key, value]) => (
          <div key={key} className="flex">
            <span className="text-gray-500 w-48">{key}:</span>
            <span className="text-white break-all">{value}</span>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => testFetch('normal')} className="px-3 py-1 bg-blue-600 rounded">
          fetch (normal)
        </button>
        <button onClick={() => testFetch('cors')} className="px-3 py-1 bg-blue-600 rounded">
          fetch (cors)
        </button>
        <button onClick={() => testFetch('no-cors')} className="px-3 py-1 bg-blue-600 rounded">
          fetch (no-cors)
        </button>
        <button onClick={testRelativeFetch} className="px-3 py-1 bg-purple-600 rounded">
          fetch (/api/health)
        </button>
        <button onClick={testImage} className="px-3 py-1 bg-green-600 rounded">
          이미지 로드
        </button>
        <button onClick={() => setResults([])} className="px-3 py-1 bg-red-600 rounded">
          로그 지우기
        </button>
      </div>

      <div className="p-4 bg-gray-900 rounded h-96 overflow-y-auto">
        <h2 className="text-yellow-400 mb-2">로그</h2>
        {results.map((log, i) => (
          <div key={i} className="text-xs mb-1">{log}</div>
        ))}
      </div>
    </div>
  );
}

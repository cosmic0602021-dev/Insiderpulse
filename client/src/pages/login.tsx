import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Lock, Globe, ShieldCheck, ArrowRight, Database, Scan, Target, Crosshair, Activity } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { TRANSLATIONS } from '@/lib/translations';

interface RadarTarget {
  id: number;
  x: number;
  y: number;
  type: 'buy' | 'sell' | 'neutral';
  label?: string;
}

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { language } = useLanguage();
  const langKey = language.toLowerCase() as 'en' | 'ko' | 'ja' | 'zh';
  const t = TRANSLATIONS[langKey].auth;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Radar animation states
  const [logs, setLogs] = useState<string[]>([]);
  const [targets, setTargets] = useState<RadarTarget[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Financial/Insider specific boot sequence
  useEffect(() => {
    const bootSequence = [
      "ESTABLISHING_SEC_UPLINK...",
      "HANDSHAKE_EDGAR_DB: [OK]",
      "LOADING_INSTITUTIONAL_LEDGERS...",
      "FILTERING_10B5-1_PLANS (NOISE_REDUCTION)...",
      "LOADING_INSIDER_PROFILES_V2.4...",
      "QUANT_MODEL_INIT: ALPHA_SCORE",
      "CROSS_REFERENCING_DARK_POOLS...",
      "ENCRYPTING_SESSION_KEYS...",
      "TERMINAL_READY."
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < bootSequence.length) {
        setLogs(prev => [...prev, `> ${bootSequence[currentIndex]}`]);
        currentIndex++;
      } else {
        if (Math.random() > 0.7) {
          const commands = [
            "SCANNING_FORM_4: NVDA [CEO_BUY]",
            "DETECTING_CLUSTER_BUYING: BIOTECH_SECTOR",
            "ANALYZING_FILING: 0001193125-24-123456",
            "SENTIMENT_ANALYSIS: BULLISH_DIVERGENCE",
            "WHALE_ALERT: $5.2M PURCHASE DETECTED",
            "UPDATING_REAL_TIME_PRICE_TARGETS..."
          ];
          const cmd = commands[Math.floor(Math.random() * commands.length)];
          setLogs(prev => {
            const newLogs = [...prev, `> ${cmd}`];
            return newLogs.slice(-8);
          });
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Dynamic Radar Targets System
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      if (document.hidden) return;

      const id = Date.now();
      const angle = Math.random() * 2 * Math.PI;
      const r = Math.sqrt(Math.random()) * 40;
      const x = 50 + r * Math.cos(angle);
      const y = 50 + r * Math.sin(angle);

      const typeRand = Math.random();
      let type: RadarTarget['type'] = 'neutral';
      let label = '';

      if (typeRand > 0.85) {
        type = 'buy';
        label = `CEO BUY +$${(Math.random() * 10).toFixed(1)}M`;
      } else if (typeRand > 0.75) {
        type = 'sell';
        label = 'WHALE DUMP';
      }

      const newTarget = { id, x, y, type, label };
      setTargets(prev => [...prev, newTarget]);

      setTimeout(() => {
        setTargets(prev => prev.filter(t => t.id !== id));
      }, 3000);
    }, 800);

    return () => clearInterval(spawnInterval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.login(email, password);

      if (response.success && response.user && response.token) {
        login(response.user, response.token);
        navigate('/trades');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex bg-[#030303] text-neutral-300 overflow-hidden font-mono selection:bg-emerald-900 selection:text-emerald-50">
      <style>{`
        @keyframes radar-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes blip {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.5); opacity: 1; }
            100% { transform: scale(1); opacity: 0; }
        }
        @keyframes lock-on {
            0% { width: 40px; height: 40px; opacity: 0; transform: scale(1.5); }
            20% { opacity: 1; }
            100% { width: 24px; height: 24px; opacity: 1; transform: scale(1); }
        }
        @keyframes scan-bar {
            0% { left: -50%; }
            100% { left: 150%; }
        }
        @keyframes fade-in {
            0% { opacity: 0; transform: translateY(5px); }
            100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Left Panel: Visuals */}
      <div className="hidden lg:flex w-2/3 relative flex-col justify-between p-16 bg-[#020202] border-r border-neutral-900 overflow-hidden">
        {/* Background Tech Grid */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#121212_1px,transparent_1px),linear-gradient(to_bottom,#121212_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
          <div className="absolute inset-0 bg-radial-gradient(circle at 30% 50%, #05966908 0%, transparent 50%)"></div>
        </div>

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex gap-1">
              <div className="w-1 h-4 bg-emerald-600"></div>
              <div className="w-1 h-4 bg-emerald-800/50"></div>
              <div className="w-1 h-4 bg-emerald-900/30"></div>
            </div>
            <span className="text-[10px] font-bold tracking-[0.3em] text-emerald-500 uppercase animate-pulse">
              DETECTING_SMART_MONEY_FLOW
            </span>
          </div>
          <h1 className="text-6xl font-black tracking-tighter text-white mb-2 uppercase leading-none">
            Insider<span className="text-neutral-700">Pulse</span>
          </h1>
          <p className="text-neutral-500 text-xs tracking-widest uppercase mt-2 flex items-center gap-2">
            <Database size={12} />
            SEC Form 4 Intelligence Platform
          </p>
        </div>

        {/* Center Graphic: Signal Capture Radar */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="relative w-[500px] h-[500px] flex items-center justify-center">
            <div className="absolute inset-0 border border-neutral-800/30 rounded-full"></div>
            <div className="absolute inset-[15%] border border-neutral-800/50 rounded-full border-dashed opacity-50"></div>
            <div className="absolute inset-[35%] border border-neutral-800 rounded-full"></div>
            <div className="absolute inset-[48%] border border-emerald-900/30 rounded-full"></div>

            <div className="absolute w-full h-[1px] bg-neutral-900"></div>
            <div className="absolute h-full w-[1px] bg-neutral-900"></div>

            <div className="absolute w-full h-full rounded-full animate-[radar-spin_4s_linear_infinite] origin-center bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(16,185,129,0.1)_360deg)]"></div>

            <div className="absolute w-12 h-12 bg-[#050505] border border-emerald-900/50 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)] z-20">
              <Target size={20} className="text-emerald-600 animate-pulse" />
            </div>

            {/* Dynamic Targets */}
            {targets.map(target => (
              <div
                key={target.id}
                className="absolute w-0 h-0 flex items-center justify-center"
                style={{ left: `${target.x}%`, top: `${target.y}%` }}
              >
                {target.type === 'buy' && (
                  <>
                    <div className="absolute border-2 border-emerald-500/50 rounded-sm animate-[lock-on_0.5s_forwards]"></div>
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_10px_#10b981] animate-[pulse_1s_infinite]"></div>
                    {target.label && (
                      <div className="absolute left-4 top-0 bg-emerald-900/90 text-[9px] text-emerald-100 px-2 py-0.5 rounded backdrop-blur-md whitespace-nowrap border border-emerald-500/30 animate-[fade-in_0.3s_ease-out]">
                        {target.label}
                      </div>
                    )}
                    <div className="absolute h-[1px] w-16 bg-emerald-800/50 rotate-45 origin-top-left top-0 left-0 -z-10 opacity-50"></div>
                  </>
                )}

                {target.type === 'sell' && (
                  <>
                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_15px_#f43f5e]"></div>
                    <div className="absolute w-8 h-8 border border-rose-900/50 rounded-full animate-[ping_1.5s_infinite]"></div>
                    {target.label && (
                      <div className="absolute right-4 top-0 bg-rose-900/90 text-[9px] text-rose-100 px-2 py-0.5 rounded backdrop-blur-md whitespace-nowrap border border-rose-500/30 animate-[fade-in_0.3s_ease-out]">
                        {target.label}
                      </div>
                    )}
                  </>
                )}

                {target.type === 'neutral' && (
                  <div className="w-1 h-1 bg-neutral-600 rounded-full animate-pulse opacity-50"></div>
                )}
              </div>
            ))}

            {/* Scanning Info UI */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-full">
              <div className="flex items-center gap-2 text-[9px] text-emerald-500 tracking-[0.2em] uppercase font-bold">
                <Activity size={12} className="animate-bounce" />
                Tracking Signals
              </div>
              <div className="w-32 h-0.5 bg-neutral-800 overflow-hidden rounded-full relative">
                <div className="absolute top-0 h-full bg-emerald-500 w-16 animate-[scan-bar_2s_linear_infinite] shadow-[0_0_8px_#10b981] opacity-80"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Terminal Logs */}
        <div className="relative z-10 bg-black/50 border-t border-neutral-900 backdrop-blur-sm pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[10px] text-neutral-500 uppercase tracking-wider">
              <Scan size={12} />
              <span>System Log</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-emerald-700 animate-pulse">
              <Crosshair size={12} />
              <span>LIVE FEED</span>
            </div>
          </div>
          <div ref={scrollRef} className="h-24 overflow-hidden font-mono text-[10px] space-y-1.5 opacity-80">
            {logs.map((log, i) => (
              <div key={i} className="text-neutral-400 truncate border-l border-neutral-800 pl-2">
                <span className="text-neutral-600 mr-2">{(new Date().getTime() + i).toString().slice(-6)}</span>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="w-full lg:w-1/3 flex items-center justify-center bg-[#050505] relative z-20 border-l border-neutral-900">
        {/* Mobile Branding */}
        <div className="absolute top-8 left-8 lg:hidden">
          <span className="font-bold text-white tracking-tight text-lg">INSIDERPULSE</span>
        </div>

        <div className="w-full max-w-sm px-8">
          <div className="mb-10 text-center">
            <div className="w-16 h-16 mx-auto bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <Lock size={24} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight uppercase">
              {t.welcome}
            </h2>
            <p className="text-neutral-500 text-xs font-mono leading-relaxed max-w-[240px] mx-auto">
              Please authenticate to access real-time insider trading data streams.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="group">
              <div className="relative flex items-center">
                <Globe size={14} className="absolute left-3 text-neutral-600 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="email"
                  className="block w-full bg-[#0a0a0a] border border-neutral-800 rounded text-sm text-neutral-200 pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 transition-all placeholder-neutral-700 font-mono"
                  placeholder="ENTER_EMAIL_ADDRESS"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  data-testid="input-email"
                />
              </div>
            </div>

            <div className="group">
              <div className="relative flex items-center">
                <Lock size={14} className="absolute left-3 text-neutral-600 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="password"
                  className="block w-full bg-[#0a0a0a] border border-neutral-800 rounded text-sm text-neutral-200 pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 transition-all placeholder-neutral-700 font-mono"
                  placeholder="ENTER_PASSWORD"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  data-testid="input-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-900/20 hover:bg-emerald-900/30 border border-emerald-900/50 text-emerald-500 font-bold uppercase tracking-widest py-4 text-xs transition-all flex items-center justify-center gap-2 mt-4 group shadow-[0_0_15px_rgba(16,185,129,0.1)]"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  LOGGING IN...
                </>
              ) : (
                <>
                  <span>{t.submit}</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 flex justify-between items-center border-t border-neutral-900 pt-6">
            <button
              onClick={() => navigate('/signup')}
              className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors uppercase tracking-wider font-bold"
              data-testid="button-signup"
            >
              {t.noAccount}
            </button>

            <div className="flex items-center gap-2 text-neutral-700">
              <ShieldCheck size={12} />
              <span className="text-[9px] font-mono">AES-256 ENCRYPTION</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

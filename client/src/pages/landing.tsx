import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { ArrowRight, Terminal, FileText, Hash, ShieldCheck, Building2, TrendingUp, TrendingDown } from "lucide-react";
import { LandingDisclaimerModal } from "@/components/landing-disclaimer-modal";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
  Line,
  ComposedChart,
} from 'recharts';

// Background Component 1: TradeLog
const TradeLogBackground = () => {
  const trades = [
    { id: 1, ticker: 'NVDA', insider: 'Jensen Huang', relation: 'CEO', type: 'Buy', shares: 125000, value: 15400000 },
    { id: 2, ticker: 'TSLA', insider: 'Elon Musk', relation: 'CEO', type: 'Sell', shares: 50000, value: 8750000 },
    { id: 3, ticker: 'PLTR', insider: 'Peter Thiel', relation: '10% Owner', type: 'Buy', shares: 250000, value: 10300000 },
    { id: 4, ticker: 'AMD', insider: 'Lisa Su', relation: 'CEO', type: 'Buy', shares: 30000, value: 4200000 },
    { id: 5, ticker: 'CRM', insider: 'Marc Benioff', relation: 'CEO', type: 'Buy', shares: 15000, value: 4477500 },
    { id: 6, ticker: 'COIN', insider: 'Brian Armstrong', relation: 'CEO', type: 'Buy', shares: 10000, value: 2465000 },
    { id: 7, ticker: 'AAPL', insider: 'Tim Cook', relation: 'CEO', type: 'Sell', shares: 75000, value: 13500000 },
    { id: 8, ticker: 'MSFT', insider: 'Satya Nadella', relation: 'CEO', type: 'Buy', shares: 20000, value: 8400000 },
    { id: 9, ticker: 'GOOGL', insider: 'Sundar Pichai', relation: 'CEO', type: 'Buy', shares: 5000, value: 875000 },
    { id: 10, ticker: 'META', insider: 'Mark Zuckerberg', relation: 'CEO', type: 'Sell', shares: 100000, value: 50000000 },
  ];

  return (
    <div className="w-full h-full p-8 flex flex-col bg-neutral-950">
      <div className="mb-6 flex justify-between items-end border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-neutral-200 uppercase">Live Insider Feed</h2>
          <p className="text-xs text-neutral-500 mt-1 tracking-widest uppercase">Securities & Exchange Commission / Form 4 Stream</p>
        </div>
        <div className="flex space-x-4 text-xs text-neutral-600 font-mono">
          <span>LATENCY: 12ms</span>
          <span>BUFFER: 98%</span>
          <span className="text-emerald-900 animate-pulse">● LIVE</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs text-neutral-600 uppercase tracking-wider border-b border-neutral-900">
              <th className="pb-3 font-medium pl-2">Ticker</th>
              <th className="pb-3 font-medium">Insider</th>
              <th className="pb-3 font-medium">Relation</th>
              <th className="pb-3 font-medium text-right">Type</th>
              <th className="pb-3 font-medium text-right">Shares</th>
              <th className="pb-3 font-medium text-right">Value</th>
              <th className="pb-3 font-medium text-right pr-2">Time</th>
            </tr>
          </thead>
          <tbody className="font-mono text-sm">
            {trades.map((trade, idx) => (
              <tr key={trade.id} className={`${idx % 2 === 0 ? 'bg-neutral-950' : 'bg-neutral-900/30'} border-b border-neutral-900/50 hover:bg-neutral-900 transition-colors`}>
                <td className="py-3 pl-2 font-bold text-neutral-300">{trade.ticker}</td>
                <td className="py-3 text-neutral-400">{trade.insider}</td>
                <td className="py-3 text-neutral-500 text-xs">{trade.relation}</td>
                <td className="py-3 text-right">
                  <span className={`px-2 py-1 rounded text-xs ${trade.type === 'Buy' ? 'bg-emerald-900/20 text-emerald-500' : 'bg-rose-900/20 text-rose-500'}`}>
                    {trade.type}
                  </span>
                </td>
                <td className="py-3 text-right text-neutral-400">{(trade.shares / 1000).toFixed(0)}K</td>
                <td className="py-3 text-right text-neutral-300">${(trade.value / 1000000).toFixed(1)}M</td>
                <td className="py-3 text-right text-neutral-600 pr-2 text-xs">
                  {new Date().toLocaleTimeString('en-US', { hour12: false })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-neutral-900/5 to-transparent opacity-20" style={{ backgroundSize: '100% 3px' }}></div>
      </div>
    </div>
  );
};

// Background Component 2: Form4Summary
const Form4SummaryBackground = () => {
  const filings = [
    { id: 1, company: 'NVIDIA Corp', filer: 'Jensen Huang', formType: '4', ownership: 'Direct', summary: 'Purchase of common stock at market price' },
    { id: 2, company: 'Tesla Inc', filer: 'Elon Musk', formType: '4', ownership: 'Indirect', summary: 'Sale of shares through trust' },
    { id: 3, company: 'Palantir', filer: 'Peter Thiel', formType: '4', ownership: 'Direct', summary: 'Open market purchase' },
    { id: 4, company: 'AMD', filer: 'Lisa Su', formType: '4', ownership: 'Direct', summary: 'Exercise of stock options' },
    { id: 5, company: 'Salesforce', filer: 'Marc Benioff', formType: '4', ownership: 'Direct', summary: 'Planned purchase under 10b5-1' },
    { id: 6, company: 'Coinbase', filer: 'Brian Armstrong', formType: '4', ownership: 'Direct', summary: 'Acquisition of restricted stock' },
    { id: 7, company: 'Apple Inc', filer: 'Tim Cook', formType: '4', ownership: 'Direct', summary: 'Disposition to cover taxes' },
    { id: 8, company: 'Microsoft', filer: 'Satya Nadella', formType: '4', ownership: 'Direct', summary: 'Open market acquisition' },
    { id: 9, company: 'Alphabet', filer: 'Sundar Pichai', formType: '4', ownership: 'Indirect', summary: 'Gift to family trust' },
  ];

  return (
    <div className="w-full h-full bg-neutral-950 p-8">
      <div className="flex items-center justify-between mb-8 border-b border-neutral-800 pb-4">
        <h2 className="text-3xl font-bold text-neutral-100 tracking-tight">FILING STREAM</h2>
        <div className="flex gap-2">
          <div className="h-2 w-2 bg-neutral-700 rounded-full"></div>
          <div className="h-2 w-2 bg-neutral-700 rounded-full"></div>
          <div className="h-2 w-2 bg-neutral-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-[80vh] content-start">
        {filings.map((filing) => (
          <div key={filing.id} className="bg-neutral-900 border border-neutral-800 p-5 rounded-sm hover:border-neutral-600 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-neutral-800 p-2 rounded-md text-neutral-400 group-hover:text-white transition-colors">
                <FileText size={18} />
              </div>
              <span className="font-mono text-xs text-neutral-600">12:34:56</span>
            </div>

            <h3 className="text-lg font-medium text-neutral-200 mb-1">{filing.company}</h3>
            <p className="text-sm text-neutral-500 mb-4 uppercase tracking-wide text-xs font-bold">{filing.filer}</p>

            <div className="grid grid-cols-2 gap-y-2 text-xs text-neutral-400 border-t border-neutral-800 pt-3">
              <div className="flex items-center gap-1">
                <Hash size={12} className="text-neutral-600" />
                <span>Form {filing.formType}</span>
              </div>
              <div className="flex items-center gap-1 justify-end">
                <ShieldCheck size={12} className="text-neutral-600" />
                <span>{filing.ownership}</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-neutral-800/50">
              <p className="text-[10px] text-neutral-600 leading-relaxed">{filing.summary}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Background Component 3: EquityChart
const EquityChartBackground = () => {
  const data = useMemo(() => {
    // Generate more volatile, realistic price data
    let price = 150;
    return Array.from({ length: 100 }).map((_, i) => {
      // More dramatic price movements
      const volatility = Math.random() * 8 - 4;
      const trend = Math.sin(i * 0.15) * 20;
      const spike = i % 20 === 0 ? (Math.random() - 0.5) * 30 : 0;
      price = Math.max(100, Math.min(220, price + volatility + trend * 0.1 + spike));

      // Calculate moving average
      const ma50 = 150 + Math.sin(i * 0.08) * 15 + (i * 0.15);

      return {
        time: i,
        price: price,
        ma50: ma50,
      };
    });
  }, []);

  const lastPrice = data[data.length - 1]?.price || 0;

  return (
    <div className="w-full h-full bg-neutral-950 p-6 flex flex-col relative">
      {/* Large watermark text in top left */}
      <h2 className="text-6xl font-black text-neutral-800 tracking-tighter absolute select-none opacity-20 pointer-events-none left-4 top-4">MARKET</h2>

      <div className="flex justify-between items-start mb-2 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-neutral-200">MARKET_AGGREGATE / USD</h3>
          <p className="text-xs text-neutral-500 font-mono">1M INTERVAL • REAL-TIME • CROSS-EXCHANGE</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-medium text-neutral-200 font-mono">{lastPrice.toFixed(2)}</div>
          <div className="text-xs text-emerald-500 bg-emerald-900/20 px-2 py-0.5 rounded inline-block font-mono">+0.42%</div>
        </div>
      </div>

      <div className="flex-1 w-full relative mt-6 border border-neutral-800 bg-neutral-900/20 rounded-lg p-4">
        {/* Grid lines overlay for 'terminal' feel */}
        <div className="absolute inset-0 pointer-events-none border-b border-r border-neutral-800/30" style={{ backgroundImage: 'linear-gradient(to right, #262626 1px, transparent 1px), linear-gradient(to bottom, #262626 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.1 }}></div>

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#525252" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#525252" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis
              domain={['auto', 'auto']}
              orientation="right"
              tick={{fill: '#525252', fontSize: 10, fontFamily: 'monospace'}}
              axisLine={false}
              tickLine={false}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#737373"
              fillOpacity={1}
              fill="url(#colorPrice)"
              strokeWidth={2}
              isAnimationActive={false}
            />
            {/* MA50 dotted line */}
            <Line
              type="monotone"
              dataKey="ma50"
              stroke="#404040"
              dot={false}
              strokeWidth={1}
              strokeDasharray="5 5"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Volume bars at bottom */}
      <div className="h-16 flex mt-4 gap-1">
        {Array.from({length: 40}).map((_, i) => (
          <div key={i} className="flex-1 bg-neutral-800/50 rounded-sm h-full flex items-end">
            <div className="w-full bg-neutral-600 opacity-40" style={{ height: `${Math.random() * 100}%`}}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Background Component 4: InstitutionalActivity
const InstitutionalActivityBackground = () => {
  const holdings = [
    { institution: 'Vanguard Group Inc', value: 15620000000, change: 2.4, sentiment: 'Bullish' },
    { institution: 'BlackRock Inc', value: 14280000000, change: 1.8, sentiment: 'Bullish' },
    { institution: 'State Street Corp', value: 8940000000, change: -0.5, sentiment: 'Bearish' },
    { institution: 'FMR LLC', value: 6720000000, change: 3.1, sentiment: 'Bullish' },
    { institution: 'Geode Capital', value: 3480000000, change: 0.8, sentiment: 'Neutral' },
    { institution: 'Northern Trust', value: 2810000000, change: -0.2, sentiment: 'Bearish' },
  ];

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="w-full h-full bg-neutral-950 p-8 grid grid-rows-[auto_1fr_auto] gap-8">
      <div className="border-b border-neutral-800 pb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Building2 className="text-neutral-500" size={24} />
          <h2 className="text-xl font-medium text-neutral-300 uppercase tracking-wider">Dark Pool & Institutional Flow</h2>
        </div>
        <div className="text-right">
          <div className="text-xs text-neutral-600 uppercase">Net Flow (24h)</div>
          <div className="text-lg font-mono text-neutral-400">-$142.5M</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Stats Column */}
        <div className="space-y-2">
          {holdings.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-neutral-900/40 border-l-2 border-neutral-800 hover:border-neutral-500 hover:bg-neutral-900 transition-all">
              <div>
                <div className="text-sm font-bold text-neutral-300">{item.institution}</div>
                <div className="text-xs text-neutral-500 font-mono mt-1">Pos: {formatCurrency(item.value)}</div>
              </div>
              <div className="text-right">
                <div className={`flex items-center justify-end gap-1 text-sm font-mono ${item.change > 0 ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {item.change > 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                  {Math.abs(item.change).toFixed(2)}%
                </div>
                <div className={`text-[10px] uppercase tracking-widest font-bold mt-1 ${
                  item.sentiment === 'Bullish' ? 'text-emerald-900' :
                  item.sentiment === 'Bearish' ? 'text-rose-900' : 'text-neutral-700'
                }`}>
                  {item.sentiment}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Column */}
        <div className="bg-neutral-900/20 border border-neutral-900 p-4 flex flex-col">
          <h3 className="text-xs text-neutral-500 uppercase mb-4">Volume Distribution</h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={holdings}
                layout="vertical"
                margin={{ left: 80, right: 20, top: 10, bottom: 10 }}
              >
                <XAxis type="number" hide domain={[-3, 4]} />
                <YAxis
                  type="category"
                  dataKey="institution"
                  tick={{ fill: '#525252', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  width={75}
                />
                <ReferenceLine x={0} stroke="#404040" />
                <Bar dataKey="change" fill="#525252" radius={[0, 2, 2, 0]}>
                  {holdings.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.change > 0 ? '#525252' : '#262626'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 pt-4 border-t border-neutral-800">
        {['BlackRock', 'Vanguard', 'State Street', 'Fidelity'].map(name => (
          <div key={name} className="text-center">
            <div className="text-[10px] text-neutral-600 uppercase">{name}</div>
            <div className="h-1 w-full bg-neutral-800 mt-2 overflow-hidden rounded-full">
              <div className="h-full bg-neutral-600" style={{ width: `${Math.random() * 100}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function LandingPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Redirect authenticated users to ranking page (Top Insider Stocks)
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/ranking');
    }
  }, [isAuthenticated, navigate]);

  const components = [
    <TradeLogBackground key="trade" />,
    <Form4SummaryBackground key="form4" />,
    <EquityChartBackground key="chart" />,
    <InstitutionalActivityBackground key="inst" />
  ];

  // Fast-cut loop effect
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % components.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [components.length]);

  // Check if disclaimer was already accepted
  const handleEnter = () => {
    const hasAccepted = localStorage.getItem('disclaimer-accepted');
    if (hasAccepted) {
      navigate('/ranking');
    } else {
      setShowDisclaimer(true);
    }
  };

  const handleDisclaimerAccept = () => {
    setShowDisclaimer(false);
    navigate('/ranking');
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#050505] flex items-center justify-center">
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes noise {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -5%); }
          20% { transform: translate(-10%, 5%); }
          30% { transform: translate(5%, -10%); }
          40% { transform: translate(-5%, 15%); }
          50% { transform: translate(-10%, 5%); }
          60% { transform: translate(15%, 0); }
          70% { transform: translate(0, 10%); }
          80% { transform: translate(-15%, 0); }
          90% { transform: translate(10%, 5%); }
        }
      `}</style>

      {/* 1. Background Layer: Fast-Cut Dashboards */}
      <div className="absolute inset-0 z-0 opacity-30 grayscale contrast-125 pointer-events-none overflow-hidden">
        {/* Noise Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-20"></div>

        {/* Scanline */}
        <div className="absolute inset-0 z-30 bg-gradient-to-b from-transparent via-white/5 to-transparent h-1/4 w-full animate-[scanline_4s_linear_infinite]"></div>

        {components.map((comp, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-0 ${activeIndex === idx ? 'opacity-100' : 'opacity-0'}`}
          >
            {/* Force full height/width for background components */}
            <div className="w-full h-full scale-105">
              {comp}
            </div>
          </div>
        ))}
      </div>

      {/* 2. Vignette & Darkening Overlay */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_90%)]"></div>
      <div className="absolute inset-0 z-10 bg-black/20"></div>

      {/* 3. Central Static Label */}
      <div className="relative z-50 flex flex-col items-center">
        {/* The Matte-Dark Rectangular Label */}
        <div className="bg-[#080808] border border-neutral-800 px-8 py-6 shadow-2xl flex flex-col items-center relative group">
          {/* Subtle top highlight */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-neutral-700/50"></div>

          <div className="flex items-center gap-3 mb-1 opacity-60">
            <Terminal size={14} className="text-neutral-500" />
            <span className="text-[10px] tracking-[0.4em] text-neutral-500 font-mono uppercase">System Ready</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-neutral-200 tracking-tighter uppercase m-0 leading-none select-none">
            Insider<span className="text-neutral-600">Pulse</span>
          </h1>

          {/* Tech decorations corners */}
          <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-neutral-600"></div>
          <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-neutral-600"></div>
        </div>

        {/* 4. Entry Action */}
        <button
          onClick={handleEnter}
          className="mt-12 group flex items-center gap-3 text-neutral-500 hover:text-emerald-500 transition-all duration-300"
          data-testid="button-initialize-system"
        >
          <span className="text-xs font-mono tracking-[0.2em] uppercase border-b border-transparent group-hover:border-emerald-500/50 pb-1">Initialize_System</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
        </button>
      </div>

      {/* Disclaimer Modal - Shows after Initialize_System button click */}
      <LandingDisclaimerModal 
        open={showDisclaimer} 
        onAccept={handleDisclaimerAccept}
        onClose={() => setShowDisclaimer(false)}
      />
    </div>
  );
}

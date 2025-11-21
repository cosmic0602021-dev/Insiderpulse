
import React, { useEffect, useState, useMemo } from 'react';
import TradeLog from './TradeLog';
import Form4Summary from './Form4Summary';
import EquityChart from './EquityChart';
import InstitutionalActivity from './InstitutionalActivity';
import { generateTrades, generateFilings, generateChartData, generateHoldings } from '../utils';
import { ArrowRight, Terminal } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Generate static data for background components
  const trades = useMemo(() => generateTrades(15), []);
  const filings = useMemo(() => generateFilings(12), []);
  const chartData = useMemo(() => generateChartData(100), []);
  const holdings = useMemo(() => generateHoldings(6), []);

  const components = [
    <TradeLog data={trades} />,
    <Form4Summary data={filings} />,
    <EquityChart data={chartData} ticker="MARKET_AGGREGATE" />,
    <InstitutionalActivity data={holdings} />
  ];

  // Fast-cut loop effect
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % components.length);
    }, 1200); // Switch every 1.2 seconds
    return () => clearInterval(interval);
  }, []);

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
             onClick={onEnter}
             className="mt-12 group flex items-center gap-3 text-neutral-500 hover:text-emerald-500 transition-all duration-300"
          >
              <span className="text-xs font-mono tracking-[0.2em] uppercase border-b border-transparent group-hover:border-emerald-500/50 pb-1">Initialize_System</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
          </button>
      </div>
    </div>
  );
};

export default LandingPage;

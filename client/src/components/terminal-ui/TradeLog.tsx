import React from 'react';
import { Trade } from './types';
import { formatCurrency, formatNumber } from '@/lib/translations';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface TradeLogProps {
  data: Trade[];
}

const TradeLog: React.FC<TradeLogProps> = ({ data }) => {
  return (
    <div className="w-full h-full p-8 flex flex-col bg-neutral-950">
      <div className="mb-6 flex justify-between items-end border-b border-neutral-800 pb-4">
        <div>
           <h2 className="text-2xl font-light tracking-wide text-neutral-200 uppercase">Live Insider Feed</h2>
           <p className="text-xs text-neutral-500 mt-1 tracking-widest uppercase">Securities & Exchange Commission / Form 4 Stream</p>
        </div>
        <div className="flex space-x-4 text-xs text-neutral-600 mono">
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
          <tbody className="mono text-sm">
            {data.map((trade, idx) => (
              <tr key={trade.id} className={`${idx % 2 === 0 ? 'bg-neutral-950' : 'bg-neutral-900/30'} border-b border-neutral-900/50 hover:bg-neutral-900 transition-colors`}>
                <td className="py-3 pl-2 font-bold text-neutral-300">{trade.ticker}</td>
                <td className="py-3 text-neutral-400">{trade.insider}</td>
                <td className="py-3 text-neutral-500 text-xs">{trade.relation}</td>
                <td className={`py-3 text-right font-bold ${trade.type === 'Buy' ? 'text-emerald-900' : 'text-rose-900'}`}>
                  <span className={`px-2 py-1 rounded text-xs ${trade.type === 'Buy' ? 'bg-emerald-900/20 text-emerald-500' : 'bg-rose-900/20 text-rose-500'}`}>
                    {trade.type}
                  </span>
                </td>
                <td className="py-3 text-right text-neutral-400">{formatNumber(trade.shares)}</td>
                <td className="py-3 text-right text-neutral-300">{formatCurrency(trade.value)}</td>
                <td className="py-3 text-right text-neutral-600 pr-2 text-xs">
                    {new Date().toLocaleTimeString('en-US', { hour12: false })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Scanline effect overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-neutral-900/5 to-transparent opacity-20" style={{ backgroundSize: '100% 3px' }}></div>
      </div>
    </div>
  );
};

export default TradeLog;
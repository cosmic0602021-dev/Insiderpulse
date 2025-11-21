import { InstitutionalHolding } from './types';
import { formatNumber, formatCurrency } from '@/lib/translations';
import { BarChart, Bar, Cell, ResponsiveContainer, XAxis, ReferenceLine } from 'recharts';
import { Building2, TrendingUp, TrendingDown } from 'lucide-react';

interface InstitutionalActivityProps {
  data: InstitutionalHolding[];
}

const InstitutionalActivity: React.FC<InstitutionalActivityProps> = ({ data }) => {
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
         <div className="space-y-2">
            {data.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-neutral-900/40 border-l-2 border-neutral-800 hover:border-neutral-500 hover:bg-neutral-900 transition-all">
                    <div>
                        <div className="text-sm font-bold text-neutral-300">{item.institution}</div>
                        <div className="text-xs text-neutral-500 mono mt-1">Pos: {formatCurrency(item.value)}</div>
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

         <div className="bg-neutral-900/20 border border-neutral-900 p-4 flex flex-col">
             <h3 className="text-xs text-neutral-500 uppercase mb-4">Volume Distribution</h3>
             <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 0, right: 0 }}>
                        <XAxis type="number" hide />
                        <ReferenceLine x={0} stroke="#404040" />
                        <Bar dataKey="change" fill="#525252" radius={[0, 2, 2, 0]}>
                            {data.map((entry, index) => (
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

export default InstitutionalActivity;

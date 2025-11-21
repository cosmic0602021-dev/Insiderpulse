import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line
} from 'recharts';
import { ChartDataPoint } from './types';

interface EquityChartProps {
  data: ChartDataPoint[];
  ticker?: string;
}

const EquityChart: React.FC<EquityChartProps> = ({ data, ticker = "INDEX" }) => {
  return (
    <div className="w-full h-full bg-neutral-950 p-6 flex flex-col">
      <div className="flex justify-between items-start mb-2">
         <div>
            <h2 className="text-6xl font-black text-neutral-800 tracking-tighter absolute select-none opacity-20 pointer-events-none left-4 top-4">{ticker}</h2>
            <h3 className="text-xl font-bold text-neutral-200 relative z-10">{ticker} / USD</h3>
            <p className="text-xs text-neutral-500 mono relative z-10">1M INTERVAL • REAL-TIME • CROSS-EXCHANGE</p>
         </div>
         <div className="text-right">
            <div className="text-3xl font-medium text-neutral-200 mono">{data[data.length-1]?.price.toFixed(2)}</div>
            <div className="text-xs text-emerald-500 bg-emerald-900/20 px-2 py-0.5 rounded inline-block mono">+0.42%</div>
         </div>
      </div>

      <div className="flex-1 w-full relative mt-6 border border-neutral-800 bg-neutral-900/20 rounded-lg p-4">
        <div className="absolute inset-0 pointer-events-none border-b border-r border-neutral-800/30" style={{ backgroundImage: 'linear-gradient(to right, #262626 1px, transparent 1px), linear-gradient(to bottom, #262626 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.1 }}></div>

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
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
            <Tooltip 
                contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '4px' }}
                itemStyle={{ color: '#a3a3a3', fontFamily: 'monospace', fontSize: '12px' }}
                labelStyle={{ display: 'none' }}
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
            <Line type="monotone" dataKey="ma50" stroke="#404040" dot={false} strokeWidth={1} strokeDasharray="5 5" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="h-16 flex mt-4 gap-1">
          {Array.from({length: 40}).map((_, i) => (
             <div key={i} className="flex-1 bg-neutral-800/50 rounded-sm h-full flex items-end">
                 <div 
                    className="w-full bg-neutral-600 opacity-40" 
                    style={{ height: `${Math.random() * 100}%`}}
                 ></div>
             </div>
          ))}
      </div>
    </div>
  );
};

export default EquityChart;

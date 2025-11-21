import React from 'react';
import { Filing } from '../types';
import { FileText, Hash, Calendar, ShieldCheck } from 'lucide-react';

interface Form4SummaryProps {
  data: Filing[];
}

const Form4Summary: React.FC<Form4SummaryProps> = ({ data }) => {
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
        {data.map((filing) => (
          <div key={filing.id} className="bg-neutral-900 border border-neutral-800 p-5 rounded-sm hover:border-neutral-600 transition-colors group">
            <div className="flex justify-between items-start mb-4">
                <div className="bg-neutral-800 p-2 rounded-md text-neutral-400 group-hover:text-white transition-colors">
                    <FileText size={18} />
                </div>
                <span className="mono text-xs text-neutral-600">{filing.timestamp.split('T')[1].substring(0,8)}</span>
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

export default Form4Summary;
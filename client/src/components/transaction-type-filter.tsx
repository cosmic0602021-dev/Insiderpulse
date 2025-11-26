interface TransactionTypeFilterProps {
  value: 'core' | 'all';
  onChange: (value: 'core' | 'all') => void;
}

export function TransactionTypeFilter({ value, onChange }: TransactionTypeFilterProps) {
  return (
    <div className="flex items-center gap-3 w-full">
      <button
        onClick={() => onChange('core')}
        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          value === 'core'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
            : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
        }`}
      >
        핵심 거래만 보기
      </button>

      <button
        onClick={() => onChange('all')}
        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          value === 'all'
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
            : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
        }`}
      >
        전체 거래 보기 (고급)
      </button>
    </div>
  );
}

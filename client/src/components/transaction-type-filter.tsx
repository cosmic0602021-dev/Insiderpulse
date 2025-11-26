interface TransactionTypeFilterProps {
  value: 'core' | 'all';
  onChange: (value: 'core' | 'all') => void;
}

export function TransactionTypeFilter({ value, onChange }: TransactionTypeFilterProps) {
  return (
    <div className="flex items-center gap-3 justify-center">
      <span className={`text-sm font-medium transition-colors ${
        value === 'core' ? 'text-emerald-300' : 'text-slate-500'
      }`}>
        핵심 거래만
      </span>

      <button
        onClick={() => onChange(value === 'core' ? 'all' : 'core')}
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
          value === 'core'
            ? 'bg-emerald-500/30 border border-emerald-500/50'
            : 'bg-amber-500/30 border border-amber-500/50'
        }`}
        role="switch"
        aria-checked={value === 'all'}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full transition-transform ${
            value === 'core'
              ? 'translate-x-1 bg-emerald-400'
              : 'translate-x-8 bg-amber-400'
          }`}
        />
      </button>

      <span className={`text-sm font-medium transition-colors ${
        value === 'all' ? 'text-amber-300' : 'text-slate-500'
      }`}>
        전체 거래 (고급)
      </span>
    </div>
  );
}

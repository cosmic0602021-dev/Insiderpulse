import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface TransactionTypeFilterProps {
  value: 'core' | 'all';
  onChange: (value: 'core' | 'all') => void;
}

export function TransactionTypeFilter({ value, onChange }: TransactionTypeFilterProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 w-full">
        {/* Filter Buttons */}
        <div className="flex gap-2 flex-1 bg-neutral-900/60 p-1 rounded-lg border border-neutral-700/50">
          <button
            onClick={() => onChange('core')}
            className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
              value === 'core'
                ? 'bg-neutral-700 text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            핵심 거래만
          </button>

          <button
            onClick={() => onChange('all')}
            className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
              value === 'all'
                ? 'bg-neutral-700 text-neutral-100'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            전체 거래
          </button>
        </div>

        {/* Help Icon */}
        <button
          onClick={() => setShowHelp(true)}
          className="p-2 text-neutral-500 hover:text-neutral-300 transition-colors"
          aria-label="필터 설명 보기"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-white">거래 필터 설명</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-l-2 border-neutral-400 pl-4">
                <h4 className="font-semibold text-white mb-1">핵심 거래만 보기 (추천)</h4>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  내부자가 실제로 <span className="text-white">자기 돈을 써서 산 매수</span> 또는 <span className="text-white">스스로 판단해 판 매도</span>만 보여줍니다. 이런 거래는 실제 자금 이동을 나타내는 거래입니다.
                </p>
              </div>

              <div className="border-l-2 border-neutral-600 pl-4">
                <h4 className="font-semibold text-neutral-300 mb-1">전체 거래 보기 (고급)</h4>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  옵션 행사, 보상성 주식 지급(RSU), 자동 매도(10b5-1), 채권 전환 등 내부자의 의지와 관련 없는 거래까지 모두 표시합니다. 전문가용이며 초보에게는 다소 복잡할 수 있습니다.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full bg-neutral-700 hover:bg-neutral-600 text-white font-medium py-2 rounded transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}

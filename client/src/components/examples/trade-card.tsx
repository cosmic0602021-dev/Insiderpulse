import TradeCard from '../trade-card';
import type { InsiderTrade, AIAnalysis } from '@shared/schema';

export default function TradeCardExample() {
  // Mock data for prototype
  const mockTrade: InsiderTrade & { aiAnalysis: AIAnalysis } = {
    id: 'mock-1',
    accessionNumber: '0001234567-24-000123',
    companyName: 'Apple Inc',
    ticker: 'AAPL',
    shares: 25000,
    pricePerShare: 182.50,
    totalValue: 4562500,
    filedDate: new Date('2024-01-15T10:30:00Z'),
    significanceScore: 87,
    signalType: 'BUY',
    createdAt: new Date(),
    aiAnalysis: {
      significance_score: 87,
      signal_type: 'BUY',
      key_insights: [
        'Large institutional purchase indicates strong confidence',
        'Timing aligns with positive earnings outlook',
        'Historical pattern suggests continued momentum'
      ],
      risk_level: 'LOW',
      recommendation: 'Strong buy signal based on insider confidence and market conditions'
    }
  };

  return (
    <div className="w-full max-w-md">
      <TradeCard 
        trade={mockTrade} 
        onViewDetails={(trade) => console.log('Details requested for:', trade.companyName)}
      />
    </div>
  );
}
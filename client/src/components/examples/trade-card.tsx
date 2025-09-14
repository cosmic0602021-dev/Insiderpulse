import TradeCard from '../trade-card';
import type { InsiderTrade } from '@shared/schema';

export default function TradeCardExample() {
  // Mock data for prototype
  const mockTrade: InsiderTrade = {
    id: 'mock-1',
    accessionNumber: '0001234567-24-000123',
    companyName: 'Apple Inc',
    ticker: 'AAPL',
    shares: 25000,
    pricePerShare: 182.50,
    totalValue: 4562500,
    filedDate: new Date('2024-01-15T10:30:00Z'),
    aiAnalysis: null,
    createdAt: new Date()
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
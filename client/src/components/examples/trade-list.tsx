import TradeList from '../trade-list';
import type { InsiderTrade } from '@shared/schema';

export default function TradeListExample() {
  // Mock data for prototype
  const mockTrades: InsiderTrade[] = [
    {
      id: 'trade-1',
      accessionNumber: '0001234567-24-000123',
      companyName: 'Apple Inc',
      ticker: 'AAPL',
      shares: 25000,
      pricePerShare: 182.50,
      totalValue: 4562500,
      filedDate: new Date('2024-01-15T10:30:00Z'),
      aiAnalysis: null,
      createdAt: new Date()
    },
    {
      id: 'trade-2',
      accessionNumber: '0001234567-24-000124',
      companyName: 'Microsoft Corporation',
      ticker: 'MSFT',
      shares: 15000,
      pricePerShare: 420.75,
      totalValue: 6311250,
      filedDate: new Date('2024-01-14T14:20:00Z'),
      aiAnalysis: null,
      createdAt: new Date()
    },
    {
      id: 'trade-3',
      accessionNumber: '0001234567-24-000125',
      companyName: 'Tesla Inc',
      ticker: 'TSLA',
      shares: 5000,
      pricePerShare: 248.30,
      totalValue: 1241500,
      filedDate: new Date('2024-01-13T09:15:00Z'),
      aiAnalysis: null,
      createdAt: new Date()
    }
  ];

  return (
    <div className="w-full max-w-4xl">
      <TradeList 
        trades={mockTrades}
        loading={false}
        onLoadMore={() => console.log('Load more trades requested')}
      />
    </div>
  );
}
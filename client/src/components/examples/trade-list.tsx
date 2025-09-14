import TradeList from '../trade-list';
import type { InsiderTrade, AIAnalysis } from '@shared/schema';

export default function TradeListExample() {
  // Mock data for prototype
  const mockTrades: (InsiderTrade & { aiAnalysis: AIAnalysis })[] = [
    {
      id: 'trade-1',
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
        key_insights: ['Large institutional purchase', 'Positive earnings outlook'],
        risk_level: 'LOW',
        recommendation: 'Strong buy signal'
      }
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
      significanceScore: 92,
      signalType: 'BUY',
      createdAt: new Date(),
      aiAnalysis: {
        significance_score: 92,
        signal_type: 'BUY',
        key_insights: ['Executive confidence signal', 'Cloud growth momentum'],
        risk_level: 'LOW',
        recommendation: 'Very strong buy signal'
      }
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
      significanceScore: 65,
      signalType: 'HOLD',
      createdAt: new Date(),
      aiAnalysis: {
        significance_score: 65,
        signal_type: 'HOLD',
        key_insights: ['Mixed market signals', 'Regulatory uncertainty'],
        risk_level: 'MEDIUM',
        recommendation: 'Wait and see approach'
      }
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
// 테스트 데이터 추가
async function addTestData() {
  const testTrades = [
    {
      id: 'test-1',
      companyName: 'Apple Inc',
      ticker: 'AAPL',
      traderName: 'Tim Cook',
      traderTitle: 'CEO',
      tradeType: 'SALE',
      shares: 223000,
      pricePerShare: 190.5,
      totalValue: 42481500,
      filedDate: new Date('2024-09-25'),
      tradeDate: new Date('2024-09-24'),
      sharesAfter: 3280000,
      ownershipPercentage: 0.021,
      significanceScore: 92
    },
    {
      id: 'test-2',
      companyName: 'Tesla Inc',
      ticker: 'TSLA',
      traderName: 'Elon Musk',
      traderTitle: 'CEO',
      tradeType: 'BUY',
      shares: 50000,
      pricePerShare: 245.8,
      totalValue: 12290000,
      filedDate: new Date('2024-09-26'),
      tradeDate: new Date('2024-09-25'),
      sharesAfter: 411000000,
      ownershipPercentage: 13.2,
      significanceScore: 88
    },
    {
      id: 'test-3',
      companyName: 'Microsoft Corporation',
      ticker: 'MSFT',
      traderName: 'Satya Nadella',
      traderTitle: 'CEO',
      tradeType: 'SALE',
      shares: 328596,
      pricePerShare: 420.15,
      totalValue: 138100000,
      filedDate: new Date('2024-09-27'),
      tradeDate: new Date('2024-09-26'),
      sharesAfter: 1750000,
      ownershipPercentage: 0.023,
      significanceScore: 95
    }
  ];

  try {
    for (const trade of testTrades) {
      const response = await fetch('http://localhost:5001/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trade)
      });

      if (response.ok) {
        console.log(`✅ Added trade: ${trade.companyName}`);
      } else {
        console.log(`❌ Failed to add trade: ${trade.companyName}`);
      }
    }

    // 확인
    const checkResponse = await fetch('http://localhost:5001/api/trades?limit=5');
    const trades = await checkResponse.json();
    console.log(`🎉 Total trades now: ${trades.length}`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

addTestData();
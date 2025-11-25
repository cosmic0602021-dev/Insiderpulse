const fs = require('fs');

const data = JSON.parse(fs.readFileSync('/tmp/final_rankings.json', 'utf-8'));
const total = data.rankings.length;
const withMC = data.rankings.filter(r => r.marketCap && r.marketCap > 0).length;
const zeroMC = data.rankings.filter(r => !r.marketCap || r.marketCap === 0).length;

console.log('🎉 최종 결과:\n');
console.log('전체 종목 수:', total);
console.log('시총 있음: ✅', withMC, '(' + ((withMC/total)*100).toFixed(1) + '%)');
console.log('시총 없음: ❌', zeroMC);
console.log('');

if (zeroMC > 0) {
  const missing = data.rankings.filter(r => !r.marketCap || r.marketCap === 0);
  console.log('❌ 시총이 없는 종목:', missing.map(r => r.ticker).join(', '));
} else {
  console.log('✅ 모든 종목의 시총대비가 정상적으로 표시됩니다!');
  console.log('');
  console.log('Top 5 예시:');
  data.rankings.slice(0, 5).forEach((r, i) => {
    const ratio = ((r.netBuying / r.marketCap) * 100).toFixed(3);
    console.log('  ' + (i+1) + '. ' + r.ticker.padEnd(6) + ' 시총대비: ' + ratio + '%  (매수: $' + (r.netBuying/1000).toFixed(0) + 'K / 시총: $' + (r.marketCap/1e9).toFixed(2) + 'B)');
  });
}

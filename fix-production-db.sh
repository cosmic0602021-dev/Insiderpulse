#!/bin/bash

# Production DB에 연결해서 NULL 값 수정
# Replit secrets에서 PRODUCTION_DATABASE_URL을 설정해야 합니다

if [ -z "$PRODUCTION_DATABASE_URL" ]; then
  echo "❌ PRODUCTION_DATABASE_URL 환경변수가 설정되지 않았습니다."
  echo "Replit Secrets에서 production database URL을 PRODUCTION_DATABASE_URL로 설정하세요."
  exit 1
fi

echo "=== Production DB의 NULL 값 확인 중 ==="
psql "$PRODUCTION_DATABASE_URL" -c "SELECT COUNT(*) as null_count FROM insider_trades WHERE transaction_date IS NULL;"

echo ""
echo "=== NULL 값을 filed_date로 업데이트 중 ==="
psql "$PRODUCTION_DATABASE_URL" -c "UPDATE insider_trades SET transaction_date = filed_date WHERE transaction_date IS NULL;"

echo ""
echo "=== 업데이트 결과 확인 ==="
psql "$PRODUCTION_DATABASE_URL" -c "SELECT COUNT(*) as null_count FROM insider_trades WHERE transaction_date IS NULL;"

echo ""
echo "✅ 완료! 이제 다시 배포하세요."

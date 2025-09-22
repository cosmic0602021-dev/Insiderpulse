/**
 * 새로운 API 라우트 - 향상된 데이터 수집 시스템용
 */

import { Router } from 'express';
import { newDataCollectionService } from '../new-data-collection-service';
import { unifiedScraperSystem } from '../scrapers/unified-scraper-system';

const router = Router();

/**
 * GET /api/v2/trades - 최신 내부자 거래 데이터
 * 새로운 통합 스크래핑 시스템에서 데이터 제공
 */
router.get('/trades', async (req, res) => {
  try {
    const {
      limit = 50,
      ticker,
      minValue,
      maxValue,
      transactionType,
      minConfidence = 70,
      verifiedOnly = false
    } = req.query;

    const filters = {
      ticker: ticker as string,
      minValue: minValue ? parseInt(minValue as string) : undefined,
      maxValue: maxValue ? parseInt(maxValue as string) : undefined,
      transactionType: transactionType as string,
      minConfidence: parseInt(minConfidence as string),
      verifiedOnly: verifiedOnly === 'true'
    };

    const trades = newDataCollectionService.getLatestTrades(
      parseInt(limit as string),
      filters
    );

    res.json({
      success: true,
      count: trades.length,
      data: trades,
      meta: {
        filters,
        timestamp: new Date().toISOString(),
        source: 'unified-scraper-system-v2'
      }
    });

  } catch (error) {
    console.error('❌ API 오류 (/trades):', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/v2/stats - 데이터 수집 통계
 */
router.get('/stats', async (req, res) => {
  try {
    const statistics = unifiedScraperSystem.getStatistics();

    res.json({
      success: true,
      statistics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ API 오류 (/stats):', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v2/collect - 수동 데이터 수집 실행
 */
router.post('/collect', async (req, res) => {
  try {
    console.log('🔧 수동 데이터 수집 API 호출됨');

    const result = await newDataCollectionService.executeManualCollection();

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ API 오류 (/collect):', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v2/status - 서비스 상태 확인
 */
router.get('/status', async (req, res) => {
  try {
    const status = newDataCollectionService.getServiceStatus();

    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ API 오류 (/status):', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v2/jobs - 데이터 수집 작업 상태
 */
router.get('/jobs', async (req, res) => {
  try {
    const jobs = newDataCollectionService.getJobStatuses();

    res.json({
      success: true,
      jobs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ API 오류 (/jobs):', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v2/jobs/:jobId/toggle - 작업 활성화/비활성화
 */
router.post('/jobs/:jobId/toggle', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { enabled } = req.body;

    const success = newDataCollectionService.toggleJob(jobId, enabled);

    if (success) {
      res.json({
        success: true,
        message: `작업 ${jobId} ${enabled ? '활성화' : '비활성화'} 완료`,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: '작업을 찾을 수 없습니다'
      });
    }

  } catch (error) {
    console.error('❌ API 오류 (/jobs/toggle):', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v2/search - 고급 거래 검색
 */
router.get('/search', async (req, res) => {
  try {
    const {
      q, // 검색 쿼리
      ticker,
      insider,
      company,
      minValue,
      maxValue,
      startDate,
      endDate,
      transactionType,
      minConfidence = 0,
      verifiedOnly = false,
      limit = 100,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // 기본 필터
    const filters = {
      ticker: ticker as string,
      minValue: minValue ? parseInt(minValue as string) : undefined,
      maxValue: maxValue ? parseInt(maxValue as string) : undefined,
      transactionType: transactionType as string,
      minConfidence: parseInt(minConfidence as string),
      verifiedOnly: verifiedOnly === 'true'
    };

    let trades = unifiedScraperSystem.getFilteredTrades(filters);

    // 텍스트 검색 (쿼리가 있는 경우)
    if (q) {
      const query = (q as string).toLowerCase();
      trades = trades.filter(trade =>
        trade.ticker.toLowerCase().includes(query) ||
        trade.companyName.toLowerCase().includes(query) ||
        trade.insiderName.toLowerCase().includes(query)
      );
    }

    // 개별 텍스트 필터
    if (insider) {
      const insiderQuery = (insider as string).toLowerCase();
      trades = trades.filter(trade =>
        trade.insiderName.toLowerCase().includes(insiderQuery)
      );
    }

    if (company) {
      const companyQuery = (company as string).toLowerCase();
      trades = trades.filter(trade =>
        trade.companyName.toLowerCase().includes(companyQuery)
      );
    }

    // 날짜 범위 필터
    if (startDate) {
      trades = trades.filter(trade =>
        trade.transactionDate >= (startDate as string)
      );
    }

    if (endDate) {
      trades = trades.filter(trade =>
        trade.transactionDate <= (endDate as string)
      );
    }

    // 정렬
    const sortField = sortBy as string;
    const order = sortOrder === 'desc' ? -1 : 1;

    trades.sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case 'value':
          aVal = a.totalValue;
          bVal = b.totalValue;
          break;
        case 'confidence':
          aVal = a.confidence;
          bVal = b.confidence;
          break;
        case 'date':
        default:
          aVal = new Date(a.transactionDate).getTime();
          bVal = new Date(b.transactionDate).getTime();
          break;
      }

      return (aVal - bVal) * order;
    });

    // 제한
    const limitedTrades = trades.slice(0, parseInt(limit as string));

    res.json({
      success: true,
      count: limitedTrades.length,
      totalCount: trades.length,
      data: limitedTrades,
      meta: {
        query: {
          q,
          ticker,
          insider,
          company,
          minValue,
          maxValue,
          startDate,
          endDate,
          transactionType,
          minConfidence,
          verifiedOnly,
          limit,
          sortBy,
          sortOrder
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ API 오류 (/search):', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v2/ticker/:ticker - 특정 티커의 내부자 거래
 */
router.get('/ticker/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { limit = 50 } = req.query;

    const trades = unifiedScraperSystem.getFilteredTrades({
      ticker: ticker.toUpperCase()
    });

    // 최신순 정렬
    const sortedTrades = trades
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .slice(0, parseInt(limit as string));

    // 통계 계산
    const stats = {
      totalTrades: trades.length,
      totalValue: trades.reduce((sum, t) => sum + t.totalValue, 0),
      averageValue: trades.reduce((sum, t) => sum + t.totalValue, 0) / trades.length || 0,
      buyTrades: trades.filter(t => t.transactionType === 'BUY').length,
      sellTrades: trades.filter(t => t.transactionType === 'SELL').length,
      averageConfidence: trades.reduce((sum, t) => sum + t.confidence, 0) / trades.length || 0
    };

    res.json({
      success: true,
      ticker: ticker.toUpperCase(),
      count: sortedTrades.length,
      totalCount: trades.length,
      data: sortedTrades,
      statistics: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ API 오류 (/ticker):', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v2/health - 헬스 체크
 */
router.get('/health', async (req, res) => {
  try {
    const stats = unifiedScraperSystem.getStatistics();
    const serviceStatus = newDataCollectionService.getServiceStatus();

    const health = {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      dataCount: stats.totalTrades,
      lastUpdate: stats.lastUpdated,
      services: {
        dataCollection: serviceStatus.initialized,
        unifiedScraper: true
      }
    };

    res.json({
      success: true,
      health,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ API 오류 (/health):', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

export default router;
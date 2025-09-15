/**
 * 🚀 MEGA DATA COLLECTION API ENDPOINTS
 * API routes for triggering massive data collection operations
 */

import type { Express } from "express";
import { megaSecBulkCollector } from './mega-sec-bulk-collector';
import { megaOpenInsiderScraper } from './mega-openinsider-scraper';
import { openInsiderUltraScraper } from './openinsider-ultra-scraper';
import { protectAdminEndpoint } from './security-middleware';

export function registerMegaApiEndpoints(app: Express): void {
  
  /**
   * 🚀 TRIGGER MEGA SEC BULK COLLECTION
   * Collects 15+ years of SEC insider trading data (500,000+ trades)
   */
  app.post('/api/admin/mega/sec-bulk-collection', protectAdminEndpoint, async (req, res) => {
    try {
      console.log('🚀 API: Starting mega SEC bulk collection...');
      
      // Start collection in background
      const progress = megaSecBulkCollector.collectMegaHistoricalData();
      
      res.json({
        success: true,
        message: 'Mega SEC bulk collection started',
        estimatedDuration: '2-4 hours',
        expectedRecords: '500,000+ trades',
        checkProgressAt: '/api/admin/mega/sec-bulk-progress'
      });
      
    } catch (error) {
      console.error('❌ Error starting mega SEC collection:', error);
      res.status(500).json({ 
        error: 'Failed to start mega SEC collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * 📊 GET MEGA SEC COLLECTION PROGRESS
   */
  app.get('/api/admin/mega/sec-bulk-progress', protectAdminEndpoint, async (req, res) => {
    try {
      const progress = megaSecBulkCollector.getProgress();
      
      if (!progress) {
        return res.json({
          status: 'not_started',
          message: 'Mega SEC collection has not been started'
        });
      }
      
      res.json({
        status: progress.status,
        progress: {
          currentYear: progress.currentYear,
          totalYears: progress.endYear - progress.startYear + 1,
          collectedTrades: progress.totalCollected,
          expectedTrades: progress.totalExpected,
          percentComplete: Math.round((progress.totalCollected / progress.totalExpected) * 100),
          estimatedTimeRemaining: progress.estimatedTimeRemaining,
          dataLayers: {
            hotLayer: progress.hotLayerCount,
            warmLayer: progress.warmLayerCount,
            coldLayer: progress.coldLayerCount
          }
        },
        lastError: progress.lastError
      });
      
    } catch (error) {
      console.error('❌ Error getting SEC collection progress:', error);
      res.status(500).json({ error: 'Failed to get progress' });
    }
  });

  /**
   * 🕷️ TRIGGER MEGA OPENINSIDER SCRAPING
   * Scrapes ALL available OpenInsider data (potentially 100,000+ trades)
   */
  app.post('/api/admin/mega/openinsider-scraping', protectAdminEndpoint, async (req, res) => {
    try {
      const { maxPages = 1000 } = req.body;
      
      console.log('🕷️ API: Starting mega OpenInsider scraping...');
      
      // Start scraping in background
      const progress = megaOpenInsiderScraper.scrapeCompleteOpenInsider(maxPages);
      
      res.json({
        success: true,
        message: 'Mega OpenInsider scraping started',
        maxPages,
        estimatedDuration: '1-3 hours',
        expectedRecords: `${maxPages * 10} trades`,
        checkProgressAt: '/api/admin/mega/openinsider-progress'
      });
      
    } catch (error) {
      console.error('❌ Error starting mega OpenInsider scraping:', error);
      res.status(500).json({ 
        error: 'Failed to start mega OpenInsider scraping',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * 📊 GET MEGA OPENINSIDER SCRAPING PROGRESS
   */
  app.get('/api/admin/mega/openinsider-progress', protectAdminEndpoint, async (req, res) => {
    try {
      const progress = megaOpenInsiderScraper.getProgress();
      
      if (!progress) {
        return res.json({
          status: 'not_started',
          message: 'Mega OpenInsider scraping has not been started'
        });
      }
      
      res.json({
        status: progress.status,
        progress: {
          currentPage: progress.currentPage,
          maxPages: progress.maxPagesToProcess,
          tradesFound: progress.totalTradesFound,
          tradesProcessed: progress.totalTradesProcessed,
          duplicatesSkipped: progress.duplicatesSkipped,
          percentComplete: Math.round((progress.currentPage / progress.maxPagesToProcess) * 100),
          estimatedTimeRemaining: progress.estimatedTimeRemaining,
          avgTradesPerPage: progress.avgTradesPerPage,
          pagesWithNoNewData: progress.pagesWithNoNewData
        },
        lastError: progress.lastError
      });
      
    } catch (error) {
      console.error('❌ Error getting OpenInsider scraping progress:', error);
      res.status(500).json({ error: 'Failed to get progress' });
    }
  });

  /**
   * 🎯 TRIGGER TARGETED HIGH-VALUE SCRAPING
   * Focuses on transactions >$1M for premium features
   */
  app.post('/api/admin/mega/high-value-scraping', protectAdminEndpoint, async (req, res) => {
    try {
      const { minValue = 1000000, maxPages = 500 } = req.body;
      
      console.log(`💰 API: Starting high-value scraping (>${minValue.toLocaleString()})...`);
      
      // Start high-value scraping
      const progress = megaOpenInsiderScraper.scrapeHighValueTransactions(minValue, maxPages);
      
      res.json({
        success: true,
        message: 'High-value transaction scraping started',
        minValue,
        maxPages,
        expectedHighValueTrades: Math.floor(maxPages * 2), // Estimate 2 high-value per page
        checkProgressAt: '/api/admin/mega/openinsider-progress'
      });
      
    } catch (error) {
      console.error('❌ Error starting high-value scraping:', error);
      res.status(500).json({ 
        error: 'Failed to start high-value scraping',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * ⏸️ PAUSE/RESUME MEGA COLLECTIONS
   */
  app.post('/api/admin/mega/pause', protectAdminEndpoint, async (req, res) => {
    try {
      megaSecBulkCollector.pauseCollection();
      megaOpenInsiderScraper.pauseScraping();
      openInsiderUltraScraper.pauseScraping();
      
      res.json({
        success: true,
        message: 'All mega collections paused'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to pause collections' });
    }
  });

  app.post('/api/admin/mega/resume', protectAdminEndpoint, async (req, res) => {
    try {
      megaOpenInsiderScraper.resumeScraping();
      openInsiderUltraScraper.resumeScraping();
      
      res.json({
        success: true,
        message: 'Mega collections resumed'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to resume collections' });
    }
  });

  /**
   * 📊 MEGA COLLECTION OVERVIEW
   * Get status of all mega collection systems
   */
  app.get('/api/admin/mega/overview', protectAdminEndpoint, async (req, res) => {
    try {
      const secProgress = megaSecBulkCollector.getProgress();
      const openinsiderProgress = megaOpenInsiderScraper.getProgress();
      const ultraProgress = openInsiderUltraScraper.getProgress();
      
      res.json({
        systems: {
          secBulkCollection: {
            status: secProgress?.status || 'not_started',
            progress: secProgress ? Math.round((secProgress.totalCollected / secProgress.totalExpected) * 100) : 0,
            collectedTrades: secProgress?.totalCollected || 0
          },
          openinsiderScraping: {
            status: openinsiderProgress?.status || 'not_started', 
            progress: openinsiderProgress ? Math.round((openinsiderProgress.currentPage / openinsiderProgress.maxPagesToProcess) * 100) : 0,
            processedTrades: openinsiderProgress?.totalTradesProcessed || 0
          },
          ultraScraping: {
            status: ultraProgress?.status || 'not_started',
            progress: ultraProgress ? Math.round((ultraProgress.currentTargetIndex / ultraProgress.totalTargetsToProcess) * 100) : 0,
            processedTrades: ultraProgress?.totalTradesProcessed || 0,
            highValueTrades: ultraProgress?.highValueTrades || 0
          }
        },
        totalEstimatedCapacity: '500,000+ insider trades',
        dataLayering: {
          hotLayer: secProgress?.hotLayerCount || 0,
          warmLayer: secProgress?.warmLayerCount || 0,
          coldLayer: secProgress?.coldLayerCount || 0
        }
      });
      
    } catch (error) {
      console.error('❌ Error getting mega overview:', error);
      res.status(500).json({ error: 'Failed to get overview' });
    }
  });

  /**
   * 🚀 ULTRA SCRAPING ENDPOINTS
   * For collecting tens of thousands of insider trades
   */
  app.post('/api/admin/mega/ultra-scraping/start', protectAdminEndpoint, async (req, res) => {
    try {
      const options = req.body || {};
      console.log('🚀 Starting OpenInsider Ultra Scraping...', options);
      
      // Start scraping in background (fire-and-forget pattern like other mega endpoints)
      openInsiderUltraScraper.startUltraScraping(options);
      
      res.json({
        success: true,
        message: 'Ultra scraping started - targeting tens of thousands of trades',
        estimatedCapacity: '50,000+ insider trades',
        estimatedDuration: '1-3 hours',
        expectedRecords: options.includeHistorical ? '50,000+ trades' : '10,000+ trades',
        checkProgressAt: '/api/admin/mega/ultra-scraping/progress'
      });
    } catch (error) {
      console.error('❌ Ultra scraping failed:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.get('/api/admin/mega/ultra-scraping/progress', protectAdminEndpoint, async (req, res) => {
    try {
      const progress = openInsiderUltraScraper.getProgress();
      
      if (!progress) {
        return res.json({
          status: 'not_started',
          message: 'Ultra scraping has not been started'
        });
      }
      
      res.json({
        status: progress.status,
        progress: {
          currentTarget: progress.currentTarget,
          targetIndex: progress.currentTargetIndex,
          totalTargets: progress.totalTargetsToProcess,
          percentComplete: Math.round((progress.currentTargetIndex / progress.totalTargetsToProcess) * 100),
          processedTrades: progress.totalTradesProcessed,
          duplicatesSkipped: progress.duplicatesSkipped,
          valueDistribution: {
            highValue: progress.highValueTrades,
            mediumValue: progress.mediumValueTrades,
            lowValue: progress.lowValueTrades
          },
          performance: {
            elapsedTime: progress.elapsedTime,
            estimatedTimeRemaining: progress.estimatedTimeRemaining,
            avgTradesPerMinute: progress.avgTradesPerMinute
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to get ultra scraping progress:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.post('/api/admin/mega/ultra-scraping/pause', protectAdminEndpoint, async (req, res) => {
    try {
      openInsiderUltraScraper.pauseScraping();
      res.json({ success: true, message: 'Ultra scraping paused' });
    } catch (error) {
      console.error('❌ Failed to pause ultra scraping:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.post('/api/admin/mega/ultra-scraping/resume', protectAdminEndpoint, async (req, res) => {
    try {
      openInsiderUltraScraper.resumeScraping();
      res.json({ success: true, message: 'Ultra scraping resumed' });
    } catch (error) {
      console.error('❌ Failed to resume ultra scraping:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  console.log('🚀 Mega API endpoints registered successfully (with Ultra Scraping!)');
  console.log('📊 Ultra Scraping: /api/admin/mega/ultra-scraping/*');
}
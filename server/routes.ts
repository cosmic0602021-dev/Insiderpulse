import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertInsiderTradeSchema } from "@shared/schema";
import { stockPriceService } from "./stock-price-service";
import { z } from "zod";
import { protectAdminEndpoint } from "./security-middleware";

// Global WebSocket server for real-time updates
let wss: WebSocketServer;

export async function registerRoutes(app: Express): Promise<Server> {
  // Get trading statistics (verified trades only by default)
  app.get('/api/stats', async (req, res) => {
    try {
      const verifiedOnly = req.query.verified === 'true'; // Default to false (show all trades) unless explicitly set to true
      const stats = await storage.getTradingStats(verifiedOnly);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch trading statistics' });
    }
  });

  // Get insider trades with pagination and date filtering (verified trades only by default)
  app.get('/api/trades', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const verifiedOnly = req.query.verified === 'true'; // Default to false (show all trades) unless explicitly set to true
      const fromDate = req.query.from as string;
      const toDate = req.query.to as string;
      const sortBy = (req.query.sortBy as 'createdAt' | 'filedDate') || 'filedDate';
      
      const trades = await storage.getInsiderTrades(limit, offset, verifiedOnly, fromDate, toDate, sortBy);
      res.json(trades);
    } catch (error) {
      console.error('Error fetching trades:', error);
      res.status(500).json({ error: 'Failed to fetch insider trades' });
    }
  });

  // Get specific trade by ID
  app.get('/api/trades/:id', async (req, res) => {
    try {
      const trade = await storage.getInsiderTradeById(req.params.id);
      if (!trade) {
        return res.status(404).json({ error: 'Trade not found' });
      }
      res.json(trade);
    } catch (error) {
      console.error('Error fetching trade:', error);
      res.status(500).json({ error: 'Failed to fetch trade' });
    }
  });

  // Create new insider trade (for data ingestion)
  app.post('/api/trades', async (req, res) => {
    try {
      const validatedData = insertInsiderTradeSchema.parse(req.body);
      const trade = await storage.createInsiderTrade(validatedData);
      
      // Broadcast all trades to WebSocket clients (verified and unverified)
      if (wss) {
        const message = JSON.stringify({
          type: 'NEW_TRADE',
          data: trade
        });
        
        wss.clients.forEach(client => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(message);
          }
        });
      }
      
      res.status(201).json(trade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid data format', 
          details: error.errors 
        });
      }
      
      console.error('Error creating trade:', error);
      res.status(500).json({ error: 'Failed to create insider trade' });
    }
  });

  // Get stock price by ticker
  app.get('/api/stocks/:ticker', async (req, res) => {
    try {
      const ticker = req.params.ticker.toUpperCase();
      const priceData = await stockPriceService.getStockPrice(ticker);
      res.json(priceData);
    } catch (error) {
      console.error('Error fetching stock price:', error);
      res.status(500).json({ error: 'Failed to fetch stock price' });
    }
  });

  // Get stock price history by ticker
  app.get('/api/stocks/:ticker/history', async (req, res) => {
    try {
      const ticker = req.params.ticker.toUpperCase();
      const period = (req.query.period as string) || '1y';
      const fromDate = req.query.from as string;
      const toDate = req.query.to as string;
      
      // First try to get from database
      let historyData = [];
      if (fromDate && toDate) {
        historyData = await storage.getStockPriceHistoryRange(ticker, fromDate, toDate);
      } else {
        historyData = await storage.getStockPriceHistory(ticker);
      }
      
      // If no data in database, fetch from service and save
      if (historyData.length === 0) {
        console.log(`📈 Fetching historical data for ${ticker} (${period})`);
        const serviceData = await stockPriceService.getStockPriceHistory(ticker, period);
        
        // Save to database for future use
        if (serviceData.length > 0) {
          await stockPriceService.updateHistoricalPricesForTicker(ticker, period);
          // Fetch again from database to get consistent format
          historyData = await storage.getStockPriceHistory(ticker);
        }
      }
      
      res.json(historyData);
    } catch (error) {
      console.error(`Failed to fetch history for ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to fetch stock price history' });
    }
  });

  // Trigger historical data collection for a ticker (admin endpoint)
  app.post('/api/stocks/:ticker/history/collect', protectAdminEndpoint, async (req, res) => {
    try {
      const ticker = req.params.ticker.toUpperCase();
      const period = (req.body.period as string) || '1y';
      
      console.log(`🔄 Manual trigger: Collecting historical data for ${ticker} (${period})`);
      await stockPriceService.updateHistoricalPricesForTicker(ticker, period);
      
      const historyData = await storage.getStockPriceHistory(ticker);
      res.json({ 
        success: true, 
        ticker, 
        period, 
        recordsCollected: historyData.length,
        data: historyData
      });
    } catch (error) {
      console.error(`Failed to collect history for ${req.params.ticker}:`, error);
      res.status(500).json({ error: 'Failed to collect stock price history' });
    }
  });

  // Get multiple stock prices
  app.get('/api/stocks', async (req, res) => {
    try {
      const tickersParam = req.query.tickers as string;
      if (!tickersParam) {
        return res.status(400).json({ error: 'Missing tickers parameter' });
      }

      const tickers = tickersParam.split(',').map(t => t.trim().toUpperCase());
      const prices = await storage.getStockPrices(tickers);
      
      // If no cached prices, fetch from API
      if (prices.length === 0 && tickers.length > 0) {
        const freshPrices = [];
        for (const ticker of tickers.slice(0, 5)) { // Limit to 5 to avoid rate limits
          try {
            const priceData = await stockPriceService.getStockPrice(ticker);
            freshPrices.push(priceData);
          } catch (error) {
            console.error(`Failed to fetch price for ${ticker}:`, error);
          }
        }
        return res.json(freshPrices);
      }
      
      res.json(prices);
    } catch (error) {
      console.error('Error fetching stock prices:', error);
      res.status(500).json({ error: 'Failed to fetch stock prices' });
    }
  });

  // Search stock by company name
  app.get('/api/stocks/search/:companyName', async (req, res) => {
    try {
      const companyName = req.params.companyName;
      const priceData = await stockPriceService.getStockPriceByCompanyName(companyName);
      
      if (!priceData) {
        return res.status(404).json({ error: 'Stock not found' });
      }
      
      res.json(priceData);
    } catch (error) {
      console.error('Error searching stock:', error);
      res.status(500).json({ error: 'Failed to search stock' });
    }
  });

  // Admin endpoints for historical data collection
  app.post('/api/admin/collect/historical', protectAdminEndpoint, async (req, res) => {
    try {
      const months = parseInt(req.body.months) || 6;
      
      console.log(`🔄 Admin trigger: Starting ${months}-month historical collection`);
      
      // Import here to avoid circular dependencies
      const { historicalCollector } = await import('./sec-historical-collector');
      
      // Start collection in background
      const progressPromise = historicalCollector.collectHistoricalData(months);
      
      // Return immediately with job info
      res.json({
        success: true,
        message: `Historical collection started for ${months} months`,
        months: months,
        startTime: new Date().toISOString()
      });
      
      // Continue processing in background
      progressPromise.catch(error => {
        console.error('Background historical collection failed:', error);
      });
      
    } catch (error) {
      console.error('Failed to start historical collection:', error);
      res.status(500).json({ 
        error: 'Failed to start historical collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/admin/collect/status', protectAdminEndpoint, async (req, res) => {
    try {
      const { historicalCollector } = await import('./sec-historical-collector');
      const progress = historicalCollector.getProgress();
      
      res.json({
        hasActiveCollection: !!progress,
        progress: progress
      });
    } catch (error) {
      console.error('Failed to get collection status:', error);
      res.status(500).json({ error: 'Failed to get collection status' });
    }
  });

  // Finviz data collection endpoints
  app.post('/api/admin/collect/finviz', protectAdminEndpoint, async (req, res) => {
    try {
      const limit = parseInt(req.body.limit) || 100;
      
      console.log(`🔄 Admin trigger: Starting Finviz data collection (limit: ${limit})`);
      
      // Import Finviz collector with cache busting
      const { finvizCollector, setBroadcaster } = await import(`./finviz-collector.ts?ts=${Date.now()}`);
      
      // Inject broadcaster to break circular dependency
      setBroadcaster(broadcastUpdate);
      
      // Start collection
      const processedCount = await finvizCollector.collectLatestTrades(limit);
      
      res.json({
        success: true,
        message: `Finviz collection completed`,
        processedTrades: processedCount,
        limit: limit,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Failed to collect Finviz data:', error);
      res.status(500).json({ 
        error: 'Failed to collect Finviz data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // OpenInsider data collection endpoint
  app.post('/api/admin/openinsider', protectAdminEndpoint, async (req, res) => {
    try {
      const maxPages = parseInt(req.body.maxPages) || 15;
      const perPage = parseInt(req.body.perPage) || 100;
      
      console.log(`🔄 Admin trigger: Starting OpenInsider data collection (maxPages: ${maxPages}, perPage: ${perPage})`);
      
      // Import OpenInsider collector with cache busting
      const { advancedOpenInsiderCollector, setBroadcaster } = await import(`./openinsider-collector-advanced.ts?ts=${Date.now()}`);
      
      // Inject broadcaster to break circular dependency
      setBroadcaster(broadcastUpdate);
      
      // Start collection
      const processedCount = await advancedOpenInsiderCollector.collectLatestTrades({ maxPages, perPage });
      
      res.json({
        success: true,
        message: `OpenInsider collection completed`,
        processedTrades: processedCount,
        maxPages: maxPages,
        perPage: perPage,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Failed to collect OpenInsider data:', error);
      res.status(500).json({ 
        error: 'Failed to collect OpenInsider data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // MASSIVE OpenInsider backfill endpoint (for thousands of trades)
  app.post('/api/admin/openinsider/backfill', protectAdminEndpoint, async (req, res) => {
    try {
      const maxPages = parseInt(req.body.maxPages) || 50;
      const perPage = parseInt(req.body.perPage) || 100;
      const mode = req.body.mode || 'backfill';
      
      console.log(`🚀 Admin trigger: Starting MASSIVE OpenInsider backfill (${maxPages} pages × ${perPage} trades = ${maxPages * perPage} potential trades)`);
      
      // Import OpenInsider collector with cache busting
      const { advancedOpenInsiderCollector, setBroadcaster } = await import(`./openinsider-collector-advanced.ts?ts=${Date.now()}`);
      
      // Inject broadcaster to break circular dependency
      setBroadcaster(broadcastUpdate);
      
      // Use massive collection with backfill mode
      const processedCount = await advancedOpenInsiderCollector.collectMassive({
        mode: mode as 'backfill' | 'incremental',
        maxPages,
        perPage,
        bypassDuplicates: true
      });
      
      res.json({
        success: true,
        message: 'MASSIVE OpenInsider backfill completed',
        processedTrades: processedCount,
        maxPages,
        perPage,
        mode,
        estimatedTotal: maxPages * perPage,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ OpenInsider massive collection error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to perform massive OpenInsider collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // MarketBeat data collection endpoint
  app.post('/api/admin/collect/marketbeat', protectAdminEndpoint, async (req, res) => {
    try {
      const limit = parseInt(req.body.limit) || 100;
      
      console.log(`🔄 Admin trigger: Starting MarketBeat data collection (limit: ${limit})`);
      
      // Import MarketBeat collector with cache busting
      const { marketBeatCollector, setBroadcaster } = await import(`./marketbeat-collector.ts?ts=${Date.now()}`);
      
      // Inject broadcaster to break circular dependency
      setBroadcaster(broadcastUpdate);
      
      // Start collection
      const processedCount = await marketBeatCollector.collectLatestTrades(limit);
      
      res.json({
        success: true,
        message: `MarketBeat collection completed`,
        processedTrades: processedCount,
        limit: limit,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Failed to collect MarketBeat data:', error);
      res.status(500).json({ 
        error: 'Failed to collect MarketBeat data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // OpenInsider data collection endpoint - PRIMARY SOURCE
  app.post('/api/admin/collect/openinsider', protectAdminEndpoint, async (req, res) => {
    try {
      const limit = parseInt(req.body.limit) || 150;
      
      console.log(`🔄 Admin trigger: Starting OpenInsider data collection (limit: ${limit})`);
      
      // Import OpenInsider collector with cache busting
      const { openInsiderCollector, setBroadcaster } = await import(`./openinsider-collector.ts?ts=${Date.now()}`);
      
      // Inject broadcaster to break circular dependency
      setBroadcaster(broadcastUpdate);
      
      // Start collection
      const processedCount = await openInsiderCollector.collectLatestTrades(limit);
      
      res.json({
        success: true,
        message: `OpenInsider collection completed`,
        processedTrades: processedCount,
        limit: limit,
        timestamp: new Date().toISOString(),
        note: 'OpenInsider is the primary comprehensive data source'
      });
      
    } catch (error) {
      console.error('Failed to collect OpenInsider data:', error);
      res.status(500).json({ 
        error: 'Failed to collect OpenInsider data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Auto scheduler management endpoints
  app.post('/api/admin/scheduler/start', protectAdminEndpoint, async (req, res) => {
    try {
      const { autoScheduler } = await import('./auto-scheduler');
      autoScheduler.start();
      
      res.json({
        success: true,
        message: 'Auto scheduler started',
        status: autoScheduler.getStatus(),
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Failed to start auto scheduler:', error);
      res.status(500).json({ 
        error: 'Failed to start auto scheduler',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/admin/scheduler/stop', protectAdminEndpoint, async (req, res) => {
    try {
      const { autoScheduler } = await import('./auto-scheduler');
      autoScheduler.stop();
      
      res.json({
        success: true,
        message: 'Auto scheduler stopped',
        status: autoScheduler.getStatus(),
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Failed to stop auto scheduler:', error);
      res.status(500).json({ 
        error: 'Failed to stop auto scheduler',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/admin/scheduler/status', protectAdminEndpoint, async (req, res) => {
    try {
      const { autoScheduler } = await import('./auto-scheduler');
      const status = autoScheduler.getStatus();
      
      res.json({
        success: true,
        status,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Failed to get scheduler status:', error);
      res.status(500).json({ 
        error: 'Failed to get scheduler status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Manual collection triggers through scheduler
  app.post('/api/admin/scheduler/collect/openinsider', protectAdminEndpoint, async (req, res) => {
    try {
      const limit = parseInt(req.body.limit) || 100;
      
      const { autoScheduler } = await import('./auto-scheduler');
      const processedCount = await autoScheduler.manualOpenInsiderRun(limit);
      
      res.json({
        success: true,
        message: 'Manual OpenInsider collection completed via scheduler',
        processedTrades: processedCount,
        limit,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Failed to run manual OpenInsider collection:', error);
      res.status(500).json({ 
        error: 'Failed to run manual OpenInsider collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/admin/scheduler/collect/marketbeat', protectAdminEndpoint, async (req, res) => {
    try {
      const limit = parseInt(req.body.limit) || 50;
      
      const { autoScheduler } = await import('./auto-scheduler');
      const processedCount = await autoScheduler.manualMarketBeatRun(limit);
      
      res.json({
        success: true,
        message: 'Manual MarketBeat collection completed via scheduler',
        processedTrades: processedCount,
        limit,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Failed to run manual MarketBeat collection:', error);
      res.status(500).json({ 
        error: 'Failed to run manual MarketBeat collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Enhanced health check endpoint with scheduler status
  app.get('/api/health', async (req, res) => {
    try {
      let schedulerStatus: any = { isRunning: false, error: 'Not loaded' };
      
      try {
        const { autoScheduler } = await import('./auto-scheduler');
        schedulerStatus = autoScheduler.getStatus();
      } catch (error) {
        schedulerStatus.error = 'Failed to load scheduler';
      }
      
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        websocket: wss ? 'connected' : 'disconnected',
        autoScheduler: schedulerStatus
      });
    } catch (error) {
      res.status(500).json({ 
        status: 'error',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  const httpServer = createServer(app);

  // Set up WebSocket server for real-time updates on a different path
  wss = new WebSocketServer({ 
    server: httpServer,
    path: '/api/ws'
  });
  
  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection established');
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'WELCOME',
      message: 'Connected to InsiderTrack Pro live feed'
    }));
    
    // Handle client messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('WebSocket message received:', message.type);
        
        switch (message.type) {
          case 'PING':
            ws.send(JSON.stringify({ type: 'PONG' }));
            break;
          case 'SUBSCRIBE_TRADES':
            // Client wants to subscribe to trade updates
            ws.send(JSON.stringify({ 
              type: 'SUBSCRIBED', 
              channel: 'trades' 
            }));
            break;
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('✅ API routes registered with WebSocket support');
  return httpServer;
}

// Function to broadcast updates to all connected clients
export function broadcastUpdate(type: string, data: any) {
  if (wss) {
    const message = JSON.stringify({ type, data });
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  }
}

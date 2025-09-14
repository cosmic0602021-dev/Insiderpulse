import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertInsiderTradeSchema } from "@shared/schema";
import { z } from "zod";

// Global WebSocket server for real-time updates
let wss: WebSocketServer;

export async function registerRoutes(app: Express): Promise<Server> {
  // Get trading statistics
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await storage.getTradingStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch trading statistics' });
    }
  });

  // Get insider trades with pagination
  app.get('/api/trades', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const trades = await storage.getInsiderTrades(limit, offset);
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
      
      // Broadcast new trade to all connected WebSocket clients
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

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      websocket: wss ? 'connected' : 'disconnected'
    });
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

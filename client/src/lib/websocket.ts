import { useEffect, useRef, useState } from 'react';
import { ENV_CONFIG } from './environment';

type WebSocketMessage = {
  type: string;
  data?: any;
  message?: string;
  channel?: string;
};

type WebSocketHook = {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
};

export function useWebSocket(url: string): WebSocketHook {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = Infinity; // Never give up on reconnection

  const startHeartbeat = () => {
    // Clear any existing heartbeat
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }

    // Send PING every 2 minutes to keep connection alive (was 30s) - Cost optimization
    heartbeatInterval.current = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'PING' }));
        console.log('💓 Heartbeat PING sent');
      }
    }, 2 * 60 * 1000); // 2 minutes
  };

  const connect = () => {
    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        startHeartbeat(); // Start sending heartbeat pings
      };
      
      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // Handle PONG response from heartbeat
          if (message.type === 'PONG') {
            console.log('💓 Heartbeat PONG received');
            return;
          }

          setLastMessage(message);
          console.log('WebSocket message received:', message.type);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);

        // Stop heartbeat when disconnected
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
          heartbeatInterval.current = null;
        }

        // Attempt to reconnect with much longer delays
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(10000 * Math.pow(2, reconnectAttempts.current), 120000); // 10s, 20s, 40s up to 2 min

          reconnectTimeout.current = setTimeout(() => {
            console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
            connect();
          }, delay);
        }
      };
      
      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  };

  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  useEffect(() => {
    connect();

    return () => {
      // Cleanup on unmount
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url]);

  return {
    isConnected,
    lastMessage,
    sendMessage
  };
}

export function getWebSocketUrl(): string {
  console.log('🔌 [WS] WebSocket URL:', ENV_CONFIG.wsBaseUrl);
  return ENV_CONFIG.wsBaseUrl;
}
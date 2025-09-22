import { useEffect, useRef, useState } from 'react';

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
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    try {
      ws.current = new WebSocket(url);
      
      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };
      
      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
          console.log('WebSocket message received:', message.type);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
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
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
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
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  
  // Prefer using window.location.host directly when available and valid
  if (window.location.host && !window.location.host.includes('undefined')) {
    return `${protocol}//${window.location.host}/api/ws`;
  }
  
  // Fallback to hostname with proper port handling
  let host = window.location.hostname || 'localhost';
  
  // Get port from current location, environment variable, or default to 5000
  let port = window.location.port;
  if (!port || port === 'undefined') {
    port = import.meta.env.VITE_PORT || '5000';
  }
  
  // Only add port if it's not default for the protocol
  if (port && port !== '80' && port !== '443') {
    host = `${host}:${port}`;
  }
  
  return `${protocol}//${host}/api/ws`;
}
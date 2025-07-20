import { Order } from '@/utils/api/types';
import { useEffect, useState, useCallback, useRef } from 'react';

interface WebSocketProps {
    userId: string;
    onNewOrder: (order: Order) => void;
    onConnectionChange: (isConnected: boolean) => void;
}

export function useOrdersWebSocket({ userId, onNewOrder, onConnectionChange }: WebSocketProps) {
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const maxReconnectDelay = 30000; // 30 seconds max
    const baseReconnectDelay = 1000; // Start with 1 second
    const reconnectAttemptsRef = useRef(0);

    const connect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
        }

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        const ws = new WebSocket(`${process.env.NEXT_PUBLIC_BACKEND_WS}/v1/users/${userId}/orders/ws`);
        wsRef.current = ws;

        // Connection opened
        ws.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
            onConnectionChange(true);
            reconnectAttemptsRef.current = 0; // Reset attempts on successful connection
        };

        // Listen for messages
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                switch (data.type) {
                    case 'order':
                        onNewOrder(data.data);
                        break;
                    case 'connected':
                        console.log('Connection confirmed:', data.data.message);
                        break;
                    case 'pong':
                        console.debug('Received pong from server');
                        break;
                    default:
                        console.log('Received message:', data);
                }
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        // Handle errors
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        // Connection closed
        ws.onclose = (event) => {
            setIsConnected(false);
            onConnectionChange(false);
            console.log(`WebSocket disconnected: ${event.code} ${event.reason || 'No reason provided'}`);

            // Implement exponential backoff for reconnections
            if (event.code !== 1000) { // Not a normal closure
                reconnectAttemptsRef.current++;

                // Calculate delay with exponential backoff and jitter
                const delay = Math.min(
                    baseReconnectDelay * Math.pow(1.5, reconnectAttemptsRef.current) +
                    Math.random() * 1000, // Add jitter
                    maxReconnectDelay
                );

                console.log(`Reconnecting in ${Math.round(delay / 1000)} seconds (attempt ${reconnectAttemptsRef.current})`);

                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('Attempting to reconnect...');
                    connect();
                }, delay);
            }
        };

        // Setup ping mechanism - less aggressive interval
        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    // Send application-level ping
                    ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
                } catch (e) {
                    console.error('Failed to send ping:', e);
                }
            }
        }, 45000); // Every 45 seconds

        // Clear ping interval when connection closes
        ws.onclose = () => {
            clearInterval(pingInterval);
        };

        return () => {
            ws.close();
        };
    }, [userId, onNewOrder, onConnectionChange]);

    // Connect on component mount
    useEffect(() => {
        connect();

        // Handle visibility change - reconnect if page becomes visible again
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' &&
                (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)) {
                console.log('Page became visible, reconnecting WebSocket');
                connect();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup on unmount
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);

            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };
    }, [connect]);

    // Return connection status and manual reconnect function
    return {
        isConnected,
        reconnect: connect
    };
}
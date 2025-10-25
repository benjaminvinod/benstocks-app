// src/context/WebSocketContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
    const [livePrices, setLivePrices] = useState({});

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8000/ws");

        ws.onopen = () => {
            console.log("WebSocket Connected");
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === "live_prices") {
                    setLivePrices(prevPrices => ({ ...prevPrices, ...message.data }));
                }
            } catch (error) {
                console.error("Error parsing WebSocket message:", error);
            }
        };

        ws.onclose = () => {
            console.log("WebSocket Disconnected");
        };

        ws.onerror = (error) => {
            console.error("WebSocket Error:", error);
        };

        // Cleanup function to close the socket when the component unmounts
        return () => {
            ws.close();
        };
    }, []); // Empty dependency array ensures this runs only once

    const value = { livePrices };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
}

// Custom hook to easily access the live prices
export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
}
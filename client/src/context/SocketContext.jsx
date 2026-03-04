import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);

    const connect = (token) => {
        if (socketRef.current?.connected) return;
        const socketUrl = `http://${window.location.hostname}:5000`;
        socketRef.current = io(socketUrl, {
            auth: { token },
            transports: ['websocket'],
        });
        socketRef.current.on('connect', () => setConnected(true));
        socketRef.current.on('disconnect', () => setConnected(false));
    };

    const disconnect = () => {
        socketRef.current?.disconnect();
        setConnected(false);
    };

    const getSocket = () => socketRef.current;

    return (
        <SocketContext.Provider value={{ connect, disconnect, getSocket, connected }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => useContext(SocketContext);

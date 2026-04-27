import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChatMessage } from '../lib/collaborative-types';

export function useCollaborativeSession(sessionId: string | undefined, userId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionState, setSessionState] = useState<{ files: Record<string, string>; lockOwner: string | null }>({
    files: {},
    lockOwner: null
  });
  
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!sessionId || !userId || userId === "undefined") {
      console.warn("useCollaborativeSession: Missing sessionId or userId, skipping connection", { sessionId, userId });
      return;
    }

    // Obtener la URL base desde las variables de entorno o fallback
    const baseUrl = (import.meta.env.PUBLIC_API_URL || "http://localhost:8080").replace(/\/$/, "");
    // Cambiar http:// o https:// a ws:// o wss://
    const wsBaseUrl = baseUrl.replace(/^http/, "ws");
    
    // El backend de Quarkus espera /ws/collaborative/{sessionId}?userId={userId}
    const wsUrl = `${wsBaseUrl}/ws/collaborative/${sessionId}?userId=${userId}`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('Connected to session', sessionId);
      setIsConnected(true);
    };
    
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Manejar mensajes de estado del código en tiempo real
        if (data.type === 'STATE') {
          console.log('Received STATE update:', data);
          setSessionState({
            files: data.files || {},
            lockOwner: data.lockOwner || null
          });
          return;
        }

        if (data.type === 'ERROR') {
          const message = typeof data.message === 'string' && data.message.trim()
            ? data.message
            : 'Error de servidor';
          setMessages((prev) => [
            ...prev,
            {
              senderId: 'system',
              senderName: 'Servidor',
              content: `⚠ ${message}`,
              timestamp: new Date().toISOString(),
              type: 'SYSTEM',
            }
          ]);

          if (typeof window !== "undefined" && (window as any).__vscode) {
            const vscode = (window as any).__vscode;
            vscode.postMessage({
              command: 'notifyChat',
              text: `Error de Servidor: ${message}`
            });
          }
          return;
        }

        // Manejar mensajes de chat normales
        if (data.type === 'TEXT' || data.type === 'SYSTEM' || data.type === 'GIT_LINK') {
          const normalized: ChatMessage = {
            senderId: typeof data.senderId === 'string' ? data.senderId : 'system',
            senderName: typeof data.senderName === 'string' ? data.senderName : undefined,
            content: typeof data.content === 'string' ? data.content : '',
            timestamp: typeof data.timestamp === 'string' ? data.timestamp : new Date().toISOString(),
            type: data.type,
          };
          setMessages((prev) => [...prev, normalized]);
        }

        // Notificar a VS Code cuando llega mensaje de otro usuario
        if (typeof window !== "undefined" && (window as any).__vscode) {
          const vscode = (window as any).__vscode;
          if ((data.type === 'TEXT' || data.type === 'GIT_LINK') && data.senderId !== userId) {
            vscode.postMessage({ 
              command: 'notifyChat', 
              text: `Nuevo mensaje de ${data.senderName || 'Usuario'}: ${data.content}` 
            });
          }
        }
      } catch (err) {
        console.error("Error parsing websocket message", err);
      }
    };

    wsRef.current.onclose = (event) => {
      console.log('Disconnected from session', sessionId, 'Code:', event.code, 'Reason:', event.reason);
      setIsConnected(false);
      
      // Notify VS Code or show error directly if it's an abnormal closure
      if (event.code !== 1000 && event.code !== 1001) {
        if (typeof window !== "undefined" && (window as any).__vscode) {
          (window as any).__vscode.postMessage({
            command: 'notifyChat',
            text: `Desconectado (Código: ${event.code}). Razón: ${event.reason || 'Desconocida'}`
          });
        }
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [sessionId, userId]);

  const sendMessage = useCallback((content: string, type: 'TEXT' | 'SYSTEM' | 'GIT_LINK' = 'TEXT') => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ content, type }));
    } else {
      console.error('Cannot send message: WebSocket is not open');
    }
  }, []);

  // --- NUEVAS FUNCIONES DE COLABORACIÓN ---

  const requestLock = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'LOCK' }));
    }
  }, []);

  const releaseLock = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'UNLOCK' }));
    }
  }, []);

  const updateContent = useCallback((fileName: string, content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'UPDATE', fileName, content }));
    }
  }, []);

  return { 
    messages, 
    isConnected, 
    sessionState, 
    sendMessage, 
    setMessages,
    requestLock,
    releaseLock,
    updateContent
  };
}

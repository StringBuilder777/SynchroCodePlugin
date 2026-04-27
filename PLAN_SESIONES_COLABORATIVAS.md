# Plan de Implementación: Sesiones Colaborativas en SynchroCodePlugin

Este documento detalla los pasos para integrar en el frontend (Astro/React) y en la extensión de VS Code la nueva funcionalidad de **Sesiones Colaborativas** y **Chat en Tiempo Real** proporcionada por el backend (`synchrocode`).

## 1. Definición de Tipos y DTOs (`src/lib/collaborative-types.ts`)

Es necesario mapear las estructuras de datos esperadas y devueltas por el backend:

```typescript
export interface CreateCollaborativeSessionRequest {
  projectId: string; // UUID
  name: string;
}

export interface StartCollaborativeSessionResponse {
  sessionId: string; // UUID
  websocketUrl: string; // Opcional, si el backend lo retorna, si no, se arma en el frontend
}

export interface JoinCollaborativeSessionRequest {
  sessionId: string;
}

export interface JoinCollaborativeSessionResponse {
  sessionId: string;
  name: string;
  history: ChatMessage[];
  participants: string[]; // Lista de IDs o nombres
}

export interface CollaborativeSessionSummaryResponse {
  id: string;
  name: string;
  startedAt: string;
  participantCount: number;
}

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderName?: string;
  content: string;
  timestamp: string;
  type: 'TEXT' | 'SYSTEM' | 'GIT_LINK';
}
```

## 2. Creación del Servicio REST (`src/lib/collaborativeSessions.ts`)

Añadir las llamadas a los nuevos endpoints utilizando el cliente HTTP existente (probablemente `api.ts` o un `fetch` wrapper).

1. `createSession(data: CreateCollaborativeSessionRequest): Promise<StartCollaborativeSessionResponse>` -> Llama a `POST /collaborative-sessions`.
2. `getActiveSessions(): Promise<CollaborativeSessionSummaryResponse[]>` -> Llama a `GET /collaborative-sessions/active`.
3. `joinSession(data: JoinCollaborativeSessionRequest): Promise<JoinCollaborativeSessionResponse>` -> Llama a `POST /collaborative-sessions/join`.

## 3. Integración de WebSockets (React Hook)

Crear un Custom Hook `useCollaborativeSession` (por ejemplo, en `src/hooks/useCollaborativeSession.ts`) que gestione el ciclo de vida del WebSocket nativo:

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';

export function useCollaborativeSession(sessionId: string, userId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // URL base que coincida con el backend (ws:// o wss://)
    const wsUrl = `ws://localhost:8080/collaborative-session/${sessionId}/${userId}`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => setIsConnected(true);
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
      // Emitir evento a VS Code para notificar (ver punto 5)
    };

    wsRef.current.onclose = () => setIsConnected(false);

    return () => {
      wsRef.current?.close();
    };
  }, [sessionId, userId]);

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ content }));
    }
  }, []);

  return { messages, isConnected, sendMessage, setMessages };
}
```

## 4. Desarrollo de Componentes UI (React)

En `src/components/collaborative/` (nueva carpeta recomendada) o dentro de `proyectos/`:

### 4.1 Panel de Sesiones Activas (`ActiveSessionsList.tsx`)
- Consume `getActiveSessions()`.
- Renderiza una lista de sesiones activas (`CollaborativeSessionSummaryResponse`).
- Botón **"Unirse a Sesión"** que llama a `joinSession` y redirige o abre el componente del chat.
- Botón **"Crear Sesión"** (si está dentro del detalle de un proyecto).

### 4.2 Sala de Chat (`CollaborativeChat.tsx`)
- Utiliza el hook `useCollaborativeSession`.
- Carga el historial previo (`JoinCollaborativeSessionResponse.history`) al montarse.
- Renderiza una lista de `ChatMessage`.
- Integra un `textarea` o `input` para enviar nuevos mensajes.
- Indicador visual de estado (Conectado 🟢 / Desconectado 🔴).
- **Integración Git:** Posibilidad de reconocer URLs de Commits/PRs en el chat y mostrar un componente o enlace especial gracias a las nuevas entidades del backend.

## 5. Integración Nativa con VS Code Extension (`extension/src/extension.ts`)

La extensión de VS Code aloja la UI (Webview). Es ideal aprovechar la API de VS Code para una mejor experiencia.

1. **Notificaciones Push en VS Code:**
   Cuando llega un mensaje por WebSocket mientras el usuario está en el chat o en otra pestaña del panel, el frontend puede enviar un postMessage a la extensión:
   ```javascript
   // En React
   vscode.postMessage({ type: 'notifyChat', text: 'Nuevo mensaje de Alice en la Sesión de Fixes' });
   ```
   En `extension.ts`, escuchar este evento y mostrar un popup nativo:
   ```typescript
   panel.webview.onDidReceiveMessage(message => {
     if (message.type === 'notifyChat') {
       vscode.window.showInformationMessage(message.text);
     }
   });
   ```

2. **Comandos para unirse rápido:**
   Registrar un nuevo comando en `package.json` y `extension.ts` (ej. `synchrocode.joinSession`) que abra la Webview y pase el ID de la sesión para autoconectarse.

## 6. Manejo de Fallos y Experiencia de Usuario
- **Reconexión Automática:** Añadir lógica al hook para intentar reconectar si el WebSocket se cierra accidentalmente.
- **Autorización:** Asegurar que el `userId` utilizado en el path del WebSocket corresponda con el token JWT activo o la sesión en Supabase/Backend.
- **Scroll del Chat:** Mantener el auto-scroll hacia abajo cuando llega un nuevo mensaje.

## Resumen del Flujo Completo
1. El usuario en la barra lateral de VS Code entra al detalle de un **Proyecto**.
2. Pulsa **"Iniciar Sesión Colaborativa"** -> Llamada REST `createSession()`.
3. Al recibir respuesta, se abre la vista del Chat.
4. El componente `CollaborativeChat` inicializa el **WebSocket** conectando a `/collaborative-session/{sessionId}/{userId}`.
5. Otro usuario del mismo proyecto ve la sesión en su lista de **"Sesiones Activas"** -> Pulsa **Unirse**.
6. Su plugin llama a `joinSession()`, obtiene historial y conecta al WebSocket.
7. Ambos interactúan enviando y recibiendo JSON por WebSockets, almacenados en `ChatMessage` por el backend y alertados mediante notificaciones nativas en VS Code.
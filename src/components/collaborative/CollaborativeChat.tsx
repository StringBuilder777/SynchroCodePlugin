import React, { useState, useRef, useEffect } from 'react';
import { useCollaborativeSession } from '../../hooks/useCollaborativeSession';
import { Send, Terminal, GitMerge, UserCircle, Activity, Lock, Unlock, Code2 } from 'lucide-react';
import { usersService } from '../../lib/users';
import { collaborativeSessionsService } from '../../lib/collaborativeSessions';

interface CollaborativeChatProps {
  sessionId: string;
  sessionName: string;
  passcode?: string;
  onBack?: () => void;
}

export function CollaborativeChat({ sessionId, sessionName, passcode, onBack }: CollaborativeChatProps) {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [userName, setUserName] = useState<string>('Usuario');
  const [inputText, setInputText] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  
  const { 
    messages, 
    isConnected, 
    sessionState, 
    sendMessage, 
    setMessages,
    requestLock,
    releaseLock,
    updateContent
  } = useCollaborativeSession(
    sessionId, 
    isInitializing ? undefined : userId
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Escuchar actualizaciones del editor local de VS Code
  useEffect(() => {
    const handleEditorUpdate = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.command === 'editorUpdate' && isConnected) {
        // Si nosotros tenemos el candado (lock), enviamos el contenido al servidor
        if (sessionState.lockOwner === userId) {
          // Optimization: only send if it's different from the known state
          const currentContent = sessionState.files?.[msg.fileName];
          if (currentContent !== msg.content) {
            updateContent(msg.fileName, msg.content);
          }
        }
      }
    };

    window.addEventListener('message', handleEditorUpdate);
    return () => window.removeEventListener('message', handleEditorUpdate);
  }, [isConnected, sessionState.lockOwner, sessionState.files, userId, updateContent]);

  // Sincronizar el editor local cuando recibimos cambios de otros
  useEffect(() => {
    if (isConnected && sessionState.lockOwner && sessionState.lockOwner !== userId && sessionState.files) {
      if (typeof window !== 'undefined' && (window as any).__vscode) {
        Object.entries(sessionState.files).forEach(([fileName, content]) => {
          (window as any).__vscode.postMessage({
            command: 'applyEditorUpdate',
            fileName,
            content
          });
        });
      }
    }
  }, [isConnected, sessionState.files, sessionState.lockOwner, userId]);

  useEffect(() => {
    // 1. Get current user
    usersService.getMe().then(user => {
      setUserId(user.id);
      setUserName(user.name);
      
      // La petición de unirse (REST) ya la hizo el componente padre (CollabApp)
      // para validar el passcode antes de entrar aquí.
      setMessages([]);
      setIsInitializing(false);
    }).catch(err => {
      console.error("Error fetching user for session:", err);
      setIsInitializing(false);
    });
  }, [sessionId, setMessages]);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleRequestLock = () => {
    requestLock();
    if (typeof window !== 'undefined' && (window as any).__vscode) {
      (window as any).__vscode.postMessage({ command: 'requestCurrentEditor' });
    }
  };

  // Cuando nosotros tomamos el control, pedimos el código actual a VS Code para sincronizar a todos
  useEffect(() => {
    if (isConnected && sessionState.lockOwner === userId && userId) {
      console.log('Gain lock: syncing editor...');
      if (typeof window !== 'undefined' && (window as any).__vscode) {
        (window as any).__vscode.postMessage({ command: 'requestCurrentEditor' });
      }
    }
  }, [isConnected, sessionState.lockOwner, userId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !isConnected) return;
    
    // Check if it's a git link manually (basic detection)
    let type: 'TEXT' | 'SYSTEM' | 'GIT_LINK' = 'TEXT';
    if (inputText.includes('github.com') && (inputText.includes('/commit/') || inputText.includes('/pull/'))) {
      type = 'GIT_LINK';
    }

    sendMessage(inputText.trim(), type);
    setInputText('');
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
        <Activity className="w-8 h-8 mb-4 animate-pulse" />
        <p>Conectando a la sesión de trabajo...</p>
      </div>
    );
  }

  const isMyLock = sessionState.lockOwner === userId;
  const isLockedByOther = sessionState.lockOwner && sessionState.lockOwner !== userId;

  return (
    <div className="flex flex-col h-full min-h-[600px] border border-zinc-800 rounded-lg bg-zinc-950 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-blue-500/10 rounded-md">
            <Terminal className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100 text-sm leading-tight">{sessionName}</h3>
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              </span>
              <span className="text-xs text-zinc-500">{isConnected ? 'En vivo' : 'Desconectado'}</span>
            </div>
          </div>
        </div>
        {onBack && (
          <button 
            onClick={onBack}
            className="text-xs text-zinc-400 hover:text-white transition-colors bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-md"
          >
            Cerrar Sesión
          </button>
        )}
      </div>

      {passcode && (
        <div className="bg-blue-900/20 border-b border-blue-900/40 px-4 py-2 flex items-center justify-between shrink-0">
          <span className="text-xs text-blue-300">Código de invitación:</span>
          <code className="text-sm font-mono font-bold text-white bg-blue-950/50 px-2 py-0.5 rounded border border-blue-800/50 select-all">{passcode}</code>
        </div>
      )}

      {/* Editor Area (Real-time Code) */}
      <div className="flex-1 flex flex-col bg-zinc-900/30 overflow-hidden border-b border-zinc-800">
        <div className="px-4 py-2 bg-zinc-900/50 flex items-center justify-between shrink-0 border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            <Code2 className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[11px] font-medium text-zinc-300 uppercase tracking-tight">Editor Compartido</span>
          </div>

          <div className="flex items-center gap-2">
            {isMyLock ? (
              <button 
                onClick={releaseLock}
                className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[10px] font-bold hover:bg-amber-500/30 transition-all"
              >
                <Unlock className="w-3 h-3" /> SOLTAR CONTROL
              </button>
            ) : isLockedByOther ? (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[10px] font-medium italic">
                <Lock className="w-3 h-3" /> OTRO USUARIO EDITANDO
              </div>
            ) : (
              <button 
                onClick={handleRequestLock}
                className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold hover:bg-emerald-500/30 transition-all"
              >
                <Lock className="w-3 h-3" /> TOMAR CONTROL
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-zinc-950 p-4 font-mono text-[11px] leading-relaxed text-zinc-400 custom-scrollbar">
          {Object.keys(sessionState.files || {}).length > 0 ? (
            Object.entries(sessionState.files).map(([fileName, content]) => (
              <div key={fileName} className="mb-6">
                <div className="text-zinc-500 font-bold mb-2">📄 {fileName}</div>
                <pre className="whitespace-pre-wrap break-all select-none border border-zinc-800 p-2 rounded bg-zinc-900/50">
                  <code>{content}</code>
                </pre>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2 italic">
              <Activity className="w-5 h-5 opacity-20" />
              <p>Esperando transmisión de código...</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="h-[200px] overflow-y-auto p-4 space-y-4 scroll-smooth border-b border-zinc-800 bg-zinc-950/50 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center py-10 opacity-30">
            <p className="text-xs">No hay mensajes en esta sesión aún.</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === userId;
          const isSystem = msg.type === 'SYSTEM';

          if (isSystem) {
            return (
              <div key={idx} className="flex justify-center my-4">
                <span className="bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-xs px-3 py-1 rounded-full flex items-center shadow-sm">
                  <Activity className="w-3 h-3 mr-2 text-blue-400" />
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-end space-x-2 max-w-[90%] ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                {!isMe && (
                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700">
                    <UserCircle className="w-4 h-4 text-zinc-400" />
                  </div>
                )}
                
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-[10px] text-zinc-500 mb-1 ml-1">{msg.senderName || 'Usuario'}</span>}
                  <div 
                    className={`px-4 py-2 rounded-2xl text-sm shadow-sm
                      ${isMe 
                        ? 'bg-blue-600 text-white rounded-br-sm' 
                        : 'bg-zinc-800 border border-zinc-700/50 text-zinc-200 rounded-bl-sm'}
                    `}
                  >
                    {msg.type === 'GIT_LINK' ? (
                      <div className="flex flex-col">
                        <span className="flex items-center text-xs font-medium opacity-80 mb-1">
                          <GitMerge className="w-3 h-3 mr-1" />
                          Referencia de Git
                        </span>
                        <a href={msg.content} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:opacity-80 break-all text-blue-300">
                          {msg.content}
                        </a>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-600 mt-1 mr-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-zinc-900 shrink-0">
        <form onSubmit={handleSend} className="relative flex items-end gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder={isConnected ? "Escribe un mensaje..." : "Desconectado..."}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none min-h-[44px] max-h-[80px] custom-scrollbar"
            rows={1}
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || !isConnected}
            className={`p-3 rounded-xl shrink-0 transition-all ${
              inputText.trim() && isConnected
                ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-900/20'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

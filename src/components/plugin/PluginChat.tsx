import React, { useState, useEffect, useRef } from "react";
import { chatService, type ChatChannel, type ChatMessage } from "@/lib/chat";
import { usersService } from "@/lib/users";
import { projectsService } from "@/lib/projects";
import { getInitials, getAvatarColor } from "@/components/proyectos/types";

function formatTime(isoString: string | number | undefined) {
  if (!isoString) return "";
  try {
    const date = typeof isoString === 'number' 
      ? new Date(isoString * (isoString < 10000000000 ? 1000 : 1)) 
      : new Date(isoString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const minStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minStr} ${ampm}`;
  } catch {
    return "";
  }
}

function shouldGroupWithPrev(messages: ChatMessage[], index: number) {
  if (index === 0) return false;
  const curr = messages[index];
  const prev = messages[index - 1];
  if (!curr || !prev) return false;
  return curr.userId === prev.userId;
}

export function PluginChat() {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("Chat");

  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const userData = await usersService.getMe();
        if (!isMounted) return;
        setCurrentUser(userData);

        // Get the first active project for this user
        const projects = await projectsService.getAll();
        if (projects.length > 0) {
          const p = projects[0]; // Simplification for plugin
          setProjectId(p.id);
          setProjectName(p.name);
          
          try {
            const membersData = await projectsService.getMembers(p.id);
            let allUsers: any[] = [];
            try {
              allUsers = await usersService.getAll();
            } catch(e) {
              console.warn("Non-admin user, cannot fetch all users.");
            }
            const members = membersData.map((m: any) => {
              const u = allUsers.find((user: any) => user.id === m.userId);
              return { id: m.userId, name: m.name || u?.name || "Usuario", role: m.role || u?.role || "Miembro" };
            });
            setTeamMembers(members);
          } catch(e) {
            console.warn("Could not load project members", e);
          }

          const channelsData = await chatService.listChannels(p.id);
          setChannels(channelsData || []);
          if (channelsData && channelsData.length > 0) {
            setActiveChannel(channelsData[0]);
          }
        }
      } catch (error) {
        console.error("Error initializing plugin chat:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!activeChannel || !currentUser) {
      setMessages([]);
      setIsConnected(false);
      return;
    }
    setMessages([]);
    setIsConnected(false);
    let ws: WebSocket | null = null;
    try {
      const wsUrl = chatService.getWsUrl(activeChannel.websocketPath, currentUser.id, activeChannel.channelId);
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => setIsConnected(true);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (!data) return;
          switch (data.type) {
            case "HISTORY":
              const historyMessages = Array.isArray(data.messages) ? data.messages : [];
              setMessages([...historyMessages].reverse());
              break;
            case "MESSAGE_SENT":
              if (data.message) setMessages(prev => [...prev, data.message]);
              break;
            case "ERROR":
              console.error("Chat WebSocket error:", data.message);
              break;
          }
        } catch (error) {}
      };
      ws.onclose = () => setIsConnected(false);
      ws.onerror = () => setIsConnected(false);
    } catch (e) {
      setIsConnected(false);
    }
    return () => { if (ws) ws.close(); wsRef.current = null; };
  }, [activeChannel?.channelId, currentUser]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage() {
    const text = draft.trim();
    if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    try {
      wsRef.current.send(JSON.stringify({ type: "SEND", text: text, imageUrls: [] }));
      setDraft("");
      setTimeout(() => inputRef.current?.focus(), 0);
    } catch (e) {
      console.error("Failed to send message:", e);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function getUserInfo(userId: string) {
    const member = teamMembers.find(m => m.id === userId);
    if (member) return { name: member.name, avatar: getInitials(member.name) };
    if (userId === currentUser?.id) return { name: currentUser.name || "Tú", avatar: getInitials(currentUser.name || "Tú") };
    return { name: "Usuario", avatar: "?" };
  }

  function navigate(path: string) {
    const nav = (window as any).__navigate;
    if (typeof nav === 'function') nav(path);
    else window.location.href = '/plugin/' + path;
  }

  const myName = currentUser?.name || currentUser?.email || "Usuario";
  const myInitials = getInitials(myName);

  return (
    <div className="flex flex-col h-full bg-[var(--plugin-bg)] text-zinc-200">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 shrink-0 rounded-full bg-[#2e75b8]/10 border border-[#2e75b8]/20 flex items-center justify-center text-xs font-bold text-[#2e75b8]">{myInitials}</div>
          <span className="text-[13px] font-semibold text-slate-200 truncate max-w-[120px]">{myName}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => navigate('notificaciones')} className="relative p-1.5 hover:bg-zinc-800 rounded transition-colors">
            <span className="material-symbols-outlined text-[20px] text-zinc-400">notifications</span>
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </button>
          <button className="p-1.5 hover:bg-zinc-800 rounded transition-colors text-zinc-400">
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </button>
        </div>
      </header>

      {/* Canales */}
      <div className="flex gap-1.5 px-3 py-2 border-b border-zinc-800 bg-zinc-950 overflow-x-auto shrink-0" style={{ scrollbarWidth: "none" }}>
        {loading ? (
          <span className="text-xs text-zinc-500 italic">Cargando canales...</span>
        ) : channels.length === 0 ? (
          <span className="text-xs text-zinc-500 italic">No hay canales</span>
        ) : channels.map(ch => {
          const isActive = activeChannel?.channelId === ch.channelId;
          return (
            <button key={ch.channelId} onClick={() => setActiveChannel(ch)}
              className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border ${isActive ? "bg-zinc-800 text-[#2e75b8] border-zinc-700" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border-transparent"}`}>
              <span className={isActive ? "text-zinc-500" : "text-zinc-600"}>#</span>{ch.name}
            </button>
          );
        })}
      </div>

      {/* Mensajes por canal */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: "thin" }}>
        {loading ? (
          <div className="text-center text-xs text-zinc-500 py-10">Cargando mensajes...</div>
        ) : !activeChannel ? (
          <div className="text-center text-xs text-zinc-500 py-10">Selecciona un canal</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-xs text-zinc-500 py-10">No hay mensajes en #{activeChannel.name}</div>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.userId === currentUser?.id;
            const grouped = shouldGroupWithPrev(messages, i);
            const user = getUserInfo(msg.userId);

            return (
              <div key={msg.id || i} className={`flex gap-2 ${isOwn ? "justify-end" : ""}`}>
                {!isOwn && (
                  <div className="w-8 h-8 rounded bg-zinc-700 text-zinc-100 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {!grouped ? user.avatar : ""}
                  </div>
                )}
                
                <div className={`flex-grow min-w-0 ${isOwn ? "text-right" : ""}`}>
                  {!grouped && (
                    <div className={`flex items-baseline gap-2 mb-1 ${isOwn ? "justify-end" : ""}`}>
                      {!isOwn && <span className="text-[12px] font-semibold text-zinc-200">{user.name}</span>}
                      <span className="text-[9px] text-zinc-600">{formatTime(msg.sentAt)}</span>
                      {isOwn && <span className="text-[12px] font-semibold text-zinc-200">Tú</span>}
                    </div>
                  )}
                  <div className={`px-3 py-2 rounded-lg text-[12px] inline-block max-w-full break-words text-left ${isOwn ? "bg-[#2e75b8]/80 text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-200"}`}>
                    {msg.text}
                  </div>
                </div>

                {isOwn && (
                  <div className="w-8 h-8 rounded bg-[#2e75b8]/60 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {!grouped ? user.avatar : ""}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} className="h-px" />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950 shrink-0">
        <div className="relative">
          <textarea 
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            rows={2}
            disabled={!activeChannel || !isConnected}
            placeholder={!isConnected && activeChannel ? "Conectando..." : (activeChannel ? `Mensaje en #${activeChannel.name}` : "Selecciona un canal")}
            className="w-full border border-zinc-800 bg-zinc-900 text-zinc-200 rounded-lg text-[12px] p-3 pr-12 focus:ring-1 focus:ring-[#2e75b8]/50 resize-none placeholder-zinc-600 outline-none disabled:opacity-50"
          />
          <button 
            onClick={sendMessage}
            disabled={!draft.trim() || !activeChannel || !isConnected}
            className="absolute bottom-2.5 right-2.5 bg-[#2e75b8]/20 p-1.5 rounded text-[#2e75b8] hover:bg-[#2e75b8]/40 transition-colors disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-2 border-t border-zinc-800 bg-zinc-950 flex items-center justify-around shrink-0">
        <button onClick={() => navigate('dashboard')} className="flex flex-col items-center gap-0.5 px-2 py-1 text-zinc-500 hover:text-zinc-300">
          <span className="material-symbols-outlined text-[20px]">grid_view</span>
          <span className="text-[9px] font-medium">Dashboard</span>
        </button>
        <button onClick={() => navigate('tareas')} className="flex flex-col items-center gap-0.5 px-2 py-1 text-zinc-500 hover:text-zinc-300">
          <span className="material-symbols-outlined text-[20px]">list_alt</span>
          <span className="text-[9px] font-medium">Tareas</span>
        </button>
        <button onClick={() => navigate('chat')} className="flex flex-col items-center gap-0.5 px-2 py-1 text-[#2e75b8]">
          <span className="material-symbols-outlined text-[20px]">forum</span>
          <span className="text-[9px] font-medium">Chat</span>
        </button>
        <button onClick={() => navigate('colaboracion')} className="flex flex-col items-center gap-0.5 px-2 py-1 text-zinc-500 hover:text-zinc-300">
          <span className="material-symbols-outlined text-[20px]">screen_share</span>
          <span className="text-[9px] font-medium">Colab</span>
        </button>
      </footer>
    </div>
  );
}

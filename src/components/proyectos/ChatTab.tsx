import { useState, useRef, useEffect } from "react";
import { chatService, type ChatMessage, type ChatChannel } from "@/lib/chat";
import { usersService } from "@/lib/users";
import type { TeamMember } from "./types";
import { getInitials, getAvatarColor } from "./types";

interface Props {
  projectId: string;
  teamMembers: TeamMember[];
}

function shouldGroupWithPrev(messages: ChatMessage[], index: number) {
  if (index === 0) return false;
  const curr = messages[index];
  const prev = messages[index - 1];
  if (!curr || !prev) return false;
  return curr.userId === prev.userId;
}

function formatTime(isoString: string | number | undefined) {
  if (!isoString) return "";
  try {
    // Si es un número (timestamp de Unix en segundos o ms), lo convertimos
    const date = typeof isoString === 'number' 
      ? new Date(isoString * (isoString < 10000000000 ? 1000 : 1)) 
      : new Date(isoString);
    return date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function Attachment({ url }: { url: string }) {
  if (!url) return null;
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  if (isImage) {
    return (
      <div className="mt-2 rounded-lg border overflow-hidden max-w-xs bg-secondary">
        <img src={url} alt="Attachment" className="max-h-60 object-contain w-full" />
      </div>
    );
  }
  const fileName = url.split("/").pop() || "Archivo";
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border bg-secondary px-3 py-2 text-xs max-w-xs">
      <div className="flex size-8 items-center justify-center rounded bg-violet-500/10 text-violet-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
      </div>
      <div><div className="font-medium truncate max-w-[180px]">{fileName}</div></div>
    </div>
  );
}

export function ChatTab({ projectId, teamMembers = [] }: Props) {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [showMembers, setShowMembers] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const [channelsData, userData] = await Promise.all([
          chatService.listChannels(projectId),
          usersService.getMe()
        ]);
        if (!isMounted) return;
        setChannels(channelsData || []);
        setCurrentUserId(userData.id);
        if (channelsData && channelsData.length > 0) {
          setActiveChannel(channelsData[0]);
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    init();
    return () => { isMounted = false; };
  }, [projectId]);

  useEffect(() => {
    if (!activeChannel || !currentUserId) {
      setMessages([]);
      setIsConnected(false);
      return;
    }
    setMessages([]);
    setIsConnected(false);
    let ws: WebSocket | null = null;
    try {
      const wsUrl = chatService.getWsUrl(activeChannel.websocketPath, currentUserId, activeChannel.channelId);
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
            case "MESSAGE_EDITED":
              if (data.message) setMessages(prev => prev.map(m => m.id === data.message.id ? data.message : m));
              break;
            case "ERROR":
              console.error("Chat WebSocket error:", data.message);
              break;
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
      ws.onclose = () => setIsConnected(false);
      ws.onerror = () => setIsConnected(false);
    } catch (e) {
      setIsConnected(false);
    }
    return () => { if (ws) ws.close(); wsRef.current = null; };
  }, [activeChannel?.channelId, currentUserId]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleCreateChannel() {
    const name = prompt("Nombre del nuevo canal:");
    if (!name || !name.trim()) return;
    try {
      const newChannel = await chatService.createChannel(projectId, name.trim());
      if (newChannel) {
        setChannels(prev => [...prev, newChannel]);
        setActiveChannel(newChannel);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al crear el canal");
    }
  }

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
    const member = (teamMembers || []).find(m => m.id === userId);
    if (member) {
      return { name: member.name, avatar: getInitials(member.name), colorCls: getAvatarColor(member.name), role: member.role };
    }
    return { name: "Usuario", avatar: "?", colorCls: "bg-secondary text-foreground", role: "Miembro" };
  }

  if (loading) return <div className="flex h-64 items-center justify-center text-muted-foreground">Cargando chat...</div>;

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[480px] rounded-lg border overflow-hidden bg-background shadow-sm">
      {/* ── Channel list ─────────────────────────────────────────────────────── */}
      <div className="flex w-64 flex-col border-r bg-secondary/15">
        <div className="p-4 border-b bg-background/50">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input type="text" placeholder="Buscar canal..." className="w-full rounded-md border bg-background pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="flex items-center justify-between px-3 py-2 mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Canales</p>
            <button onClick={handleCreateChannel} className="rounded-full p-1 hover:bg-primary/10 text-primary transition-colors" title="Crear canal">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
          {(channels || []).map((ch) => (
            <button key={ch.channelId} onClick={() => setActiveChannel(ch)} className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all mb-0.5 ${activeChannel?.channelId === ch.channelId ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"}`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className={activeChannel?.channelId === ch.channelId ? "text-primary-foreground/70" : "text-muted-foreground/60"}>#</span>
                <span className="truncate">{ch.name}</span>
              </div>
            </button>
          ))}
          {(!channels || channels.length === 0) && <p className="px-3 py-4 text-xs text-muted-foreground text-center italic">No hay canales</p>}
        </div>
      </div>

      {/* ── Message area ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 bg-background">
        <div className="flex items-center justify-between px-6 py-3 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl text-primary font-light">#</span>
            <span className="font-bold text-sm tracking-tight">{activeChannel?.name || "Selecciona un canal"}</span>
            {activeChannel && <span className={`size-2 rounded-full ml-1 ${isConnected ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-rose-500 animate-pulse"}`} />}
          </div>
          <button onClick={() => setShowMembers((v) => !v)} className={`rounded-full p-2 transition-colors ${showMembers ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="flex flex-1 flex-col min-w-0">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-secondary/5">
              {!activeChannel && <div className="flex h-full items-center justify-center text-muted-foreground text-sm italic">Selecciona un canal para conversar</div>}
              {activeChannel && messages.map((msg, i) => {
                const isOwn = msg.userId === currentUserId;
                const grouped = shouldGroupWithPrev(messages, i);
                const user = getUserInfo(msg.userId);

                return (
                  <div key={msg.id || `msg-${i}`} className={`flex flex-col ${isOwn ? "items-end" : "items-start"} ${grouped ? "mt-1" : "mt-6"}`}>
                    {!grouped && (
                      <div className={`flex items-center gap-2 mb-1 px-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                        <span className="text-xs font-bold text-foreground/80">{isOwn ? "Tú" : user.name}</span>
                        <span className="text-[10px] text-muted-foreground/60">{formatTime(msg.sentAt)}</span>
                      </div>
                    )}
                    <div className={`flex gap-2 max-w-[85%] ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                      {!grouped && (
                        <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold shadow-sm ${user.colorCls}`}>
                          {user.avatar}
                        </div>
                      )}
                      {grouped && <div className="w-8 shrink-0" />}
                      <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                        <div className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${isOwn ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-background border rounded-tl-none"}`}>
                          <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text || ""}</p>
                        </div>
                        {msg.imageUrls && msg.imageUrls.map((url, j) => <Attachment key={`att-${msg.id}-${j}`} url={url} />)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} className="h-px" />
            </div>
            <div className="px-6 py-4 border-t bg-background">
              <div className="flex items-end gap-3 rounded-2xl border bg-secondary/20 px-4 py-2.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <textarea ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={handleKey} disabled={!activeChannel || !isConnected} placeholder={!isConnected && activeChannel ? "Conectando..." : (activeChannel ? `Mensaje en #${activeChannel.name}` : "Selecciona un canal")} rows={1} className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground py-1 min-h-[24px] max-h-32" />
                <button onClick={sendMessage} disabled={!draft.trim() || !activeChannel || !isConnected} className="rounded-xl p-2 bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:grayscale disabled:opacity-30 shadow-sm shadow-primary/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                </button>
              </div>
            </div>
          </div>
          {showMembers && (
            <div className="w-56 shrink-0 border-l overflow-y-auto p-4 space-y-4 bg-secondary/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 px-1">En el equipo · {teamMembers.length}</p>
              <div className="space-y-1">
                {teamMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-background transition-colors">
                    <div className={`flex size-8 items-center justify-center rounded-full text-[10px] font-bold shadow-sm ${getAvatarColor(m.name)}`}>{getInitials(m.name)}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{m.name === "Usuario" ? "Tú" : m.name.split(" ")[0]}</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-medium">{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

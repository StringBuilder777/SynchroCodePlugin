import { useState, useRef, useEffect } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
  attachments?: { name: string; size: string; type: "image" | "file" }[];
}

interface Channel {
  id: string;
  name: string;
  unread?: number;
  lastMessage?: string;
}

interface Member {
  id: string;
  name: string;
  role: string;
  online: boolean;
  avatar: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const CHANNELS: Channel[] = [
  { id: "general", name: "general", unread: 3, lastMessage: "¿Alguien revisó el diseño mobile?" },
  { id: "diseno-ui", name: "diseño-ui", unread: 1, lastMessage: "Subí los nuevos mockups" },
  { id: "backend", name: "backend", lastMessage: "La API ya está en staging" },
  { id: "deploy", name: "deploy", lastMessage: "Deploy a prod exitoso" },
];

const MEMBERS: Member[] = [
  { id: "m1", name: "Sarah Connor", role: "Project Manager", online: true, avatar: "SC" },
  { id: "m2", name: "James Reese", role: "Frontend Dev", online: true, avatar: "JR" },
  { id: "m3", name: "Elena Lopez", role: "UI/UX Designer", online: true, avatar: "EL" },
  { id: "m4", name: "Marcus Chen", role: "Backend Dev", online: false, avatar: "MC" },
];

const AVATAR_COLORS: Record<string, string> = {
  SC: "bg-violet-500/20 text-violet-500",
  JR: "bg-blue-500/20 text-blue-500",
  EL: "bg-amber-500/20 text-amber-500",
  MC: "bg-emerald-500/20 text-emerald-500",
};

const MESSAGES_BY_CHANNEL: Record<string, Message[]> = {
  general: [
    { id: "1", author: "Sarah Connor", avatar: "SC", content: "Buenos días equipo! Hoy tenemos revisión del sprint a las 3pm.", time: "09:15" },
    { id: "2", author: "James Reese", avatar: "JR", content: "Confirmado, ya tengo lista la demo del navbar nuevo.", time: "09:22" },
    {
      id: "3", author: "Elena Lopez", avatar: "EL",
      content: "Subí los nuevos mockups al drive. Por favor revísenlos antes de la reunión.",
      time: "09:45",
      attachments: [{ name: "mockups_navbar_v3.png", size: "2.4 MB", type: "image" }],
    },
    { id: "4", author: "Marcus Chen", avatar: "MC", content: "La API de autenticación ya está lista en staging. Pueden integrar.", time: "10:30" },
    { id: "5", author: "Sarah Connor", avatar: "SC", content: "¿Alguien revisó el diseño mobile? Necesitamos validarlo hoy.", time: "11:02" },
  ],
  "diseno-ui": [
    { id: "1", author: "Elena Lopez", avatar: "EL", content: "Aquí están los tokens de diseño actualizados para el sistema.", time: "08:50" },
    {
      id: "2", author: "Elena Lopez", avatar: "EL",
      content: "También subí el sistema de componentes completo.",
      time: "08:55",
      attachments: [{ name: "design_system_v2.fig", size: "8.1 MB", type: "file" }],
    },
    { id: "3", author: "James Reese", avatar: "JR", content: "Perfecto, ya lo estoy implementando en el frontend.", time: "09:10" },
  ],
  backend: [
    { id: "1", author: "Marcus Chen", avatar: "MC", content: "Actualicé la documentación de los endpoints en Swagger.", time: "Yesterday" },
    { id: "2", author: "James Reese", avatar: "JR", content: "La API ya está en staging y funciona correctamente.", time: "Yesterday" },
  ],
  deploy: [
    { id: "1", author: "Sarah Connor", avatar: "SC", content: "Deploy a prod exitoso! Version 2.4.1 en producción.", time: "Hace 2 días" },
    { id: "2", author: "Marcus Chen", avatar: "MC", content: "Sin errores reportados en Sentry. Todo verde.", time: "Hace 2 días" },
  ],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function shouldGroupWithPrev(messages: Message[], index: number) {
  if (index === 0) return false;
  return messages[index].author === messages[index - 1].author;
}

// ── Attachment preview ─────────────────────────────────────────────────────────

function Attachment({ a }: { a: { name: string; size: string; type: "image" | "file" } }) {
  if (a.type === "image") {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-lg border bg-secondary px-3 py-2 text-xs max-w-xs">
        <div className="flex size-8 items-center justify-center rounded bg-primary/10 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
        </div>
        <div>
          <div className="font-medium truncate max-w-[180px]">{a.name}</div>
          <div className="text-muted-foreground">{a.size}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border bg-secondary px-3 py-2 text-xs max-w-xs">
      <div className="flex size-8 items-center justify-center rounded bg-violet-500/10 text-violet-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
      </div>
      <div>
        <div className="font-medium truncate max-w-[180px]">{a.name}</div>
        <div className="text-muted-foreground">{a.size}</div>
      </div>
    </div>
  );
}

// ── Main ChatTab ───────────────────────────────────────────────────────────────

export function ChatTab() {
  const [activeChannel, setActiveChannel] = useState("general");
  const [messagesByChannel, setMessagesByChannel] = useState(MESSAGES_BY_CHANNEL);
  const [draft, setDraft] = useState("");
  const [showMembers, setShowMembers] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = messagesByChannel[activeChannel] ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChannel, messages.length]);

  function sendMessage() {
    const text = draft.trim();
    if (!text) return;
    const newMsg: Message = {
      id: Date.now().toString(),
      author: "Sarah Connor",
      avatar: "SC",
      content: text,
      time: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessagesByChannel((prev) => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] ?? []), newMsg],
    }));
    setDraft("");
    inputRef.current?.focus();
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function switchChannel(id: string) {
    setActiveChannel(id);
  }

  const onlineCount = MEMBERS.filter((m) => m.online).length;

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[480px] rounded-lg border overflow-hidden">
      {/* ── Channel list ─────────────────────────────────────────────────────── */}
      <div className="flex w-56 flex-col border-r bg-secondary/30">
        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full rounded-md border bg-background pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto p-2">
          <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Canales del proyecto
          </p>
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => switchChannel(ch.id)}
              className={`w-full flex items-center justify-between gap-2 rounded-md px-2 py-2 text-sm transition-colors text-left ${activeChannel === ch.id ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-muted-foreground">#</span>
                <span className="truncate">{ch.name}</span>
              </div>
              {ch.unread && ch.id !== activeChannel ? (
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                  {ch.unread}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* ── Message area ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Channel header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">#</span>
            <span className="font-semibold text-sm">{activeChannel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{onlineCount} online</span>
            <button
              onClick={() => setShowMembers((v) => !v)}
              className={`rounded-md p-1.5 transition-colors ${showMembers ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
              title="Miembros"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Messages */}
          <div className="flex flex-1 flex-col min-w-0">
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {messages.map((msg, i) => {
                const grouped = shouldGroupWithPrev(messages, i);
                return (
                  <div key={msg.id} className={`flex gap-3 group ${grouped ? "mt-0.5" : "mt-4"}`}>
                    {/* Avatar or spacer */}
                    {grouped ? (
                      <div className="w-8 shrink-0 flex items-center justify-center">
                        <span className="hidden group-hover:block text-[10px] text-muted-foreground/50">{msg.time}</span>
                      </div>
                    ) : (
                      <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${AVATAR_COLORS[msg.avatar] ?? "bg-secondary text-foreground"}`}>
                        {msg.avatar}
                      </div>
                    )}
                    <div className="min-w-0">
                      {!grouped && (
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="text-sm font-semibold">{msg.author}</span>
                          <span className="text-[11px] text-muted-foreground">{msg.time}</span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      {msg.attachments?.map((a, j) => <Attachment key={j} a={a} />)}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-2 border-t">
              <div className="flex items-end gap-2 rounded-lg border bg-secondary/50 px-3 py-2">
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={`Mensaje en #${activeChannel}`}
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground max-h-32"
                  style={{ fieldSizing: "content" } as React.CSSProperties}
                />
                <div className="flex items-center gap-1 shrink-0">
                  {/* Attach */}
                  <button className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  </button>
                  {/* Emoji */}
                  <button className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>
                  </button>
                  {/* Send */}
                  <button
                    onClick={sendMessage}
                    disabled={!draft.trim()}
                    className="rounded p-1 text-primary hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                  </button>
                </div>
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                Enter para enviar · Shift+Enter para nueva línea
              </p>
            </div>
          </div>

          {/* Members sidebar */}
          {showMembers && (
            <div className="w-44 shrink-0 border-l overflow-y-auto p-3 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1">
                Miembros · {MEMBERS.length}
              </p>

              {/* Online */}
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground/70 px-1 mb-1">En línea — {onlineCount}</p>
                {MEMBERS.filter((m) => m.online).map((m) => (
                  <div key={m.id} className="flex items-center gap-2 rounded-md px-1 py-1.5 hover:bg-accent transition-colors">
                    <div className="relative">
                      <div className={`flex size-7 items-center justify-center rounded-full text-[10px] font-medium ${AVATAR_COLORS[m.avatar] ?? "bg-secondary"}`}>
                        {m.avatar}
                      </div>
                      <span className="absolute bottom-0 right-0 block size-2 rounded-full bg-emerald-500 ring-1 ring-background" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{m.name.split(" ")[0]}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Offline */}
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground/70 px-1 mb-1">Fuera de línea</p>
                {MEMBERS.filter((m) => !m.online).map((m) => (
                  <div key={m.id} className="flex items-center gap-2 rounded-md px-1 py-1.5 hover:bg-accent transition-colors opacity-60">
                    <div className="relative">
                      <div className={`flex size-7 items-center justify-center rounded-full text-[10px] font-medium ${AVATAR_COLORS[m.avatar] ?? "bg-secondary"}`}>
                        {m.avatar}
                      </div>
                      <span className="absolute bottom-0 right-0 block size-2 rounded-full bg-muted-foreground/30 ring-1 ring-background" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{m.name.split(" ")[0]}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{m.role}</p>
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

import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: "task" | "role" | "comment" | "deadline" | "github";
  title: string;
  body: string;
  time: string;
  read: boolean;
  href?: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const INITIAL: Notification[] = [
  { id: "n1", type: "task", title: "Tarea asignada", body: "Se te asignó \"Rediseño del navbar\" en Redesign Website.", time: "hace 5 min", read: false, href: "/proyectos/1" },
  { id: "n2", type: "comment", title: "Nuevo comentario", body: "Elena Lopez comentó en \"Integración de íconos\": ¿Podemos revisar la paleta?", time: "hace 32 min", read: false, href: "/proyectos/1" },
  { id: "n3", type: "github", title: "PR mergeado", body: "PR #12 \"feat: redesign homepage hero\" fue mergeado en Redesign Website.", time: "hace 2 h", read: false, href: "/proyectos/1" },
  { id: "n4", type: "deadline", title: "Entrega próxima", body: "El proyecto \"Portal de clientes v2\" vence en 3 días.", time: "hace 4 h", read: true, href: "/proyectos/2" },
  { id: "n5", type: "role", title: "Rol actualizado", body: "Tu rol cambió de \"Developer\" a \"Tech Lead\" en Portal de clientes v2.", time: "Ayer", read: true },
];

// ── Icons ──────────────────────────────────────────────────────────────────────

function NotifIcon({ type }: { type: Notification["type"] }) {
  const cls = {
    task: "bg-primary/15 text-primary",
    comment: "bg-amber-500/15 text-amber-500",
    github: "bg-violet-500/15 text-violet-500",
    deadline: "bg-rose-500/15 text-rose-500",
    role: "bg-emerald-500/15 text-emerald-500",
  }[type];

  const icon = {
    task: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
    comment: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
    github: null,
    deadline: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
    role: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  }[type];

  return (
    <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${cls}`}>
      {type === "github" ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function NotificationsDropdown() {
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifs.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function markAll() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markOne(id: string) {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  function removeOne(id: string) {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        aria-label="Notificaciones"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 top-10 z-50 w-[380px] rounded-xl border bg-popover shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Notificaciones</span>
              {unread > 0 && (
                <Badge variant="outline" className="text-[10px] bg-destructive/15 text-destructive border-destructive/30">
                  {unread} nuevas
                </Badge>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs text-primary hover:underline">
                Marcar todo como leído
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y">
            {notifs.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No tienes notificaciones
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 hover:bg-accent/50 transition-colors group ${!n.read ? "bg-primary/5" : ""}`}
                >
                  <NotifIcon type={n.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium leading-tight ${!n.read ? "" : "text-muted-foreground"}`}>
                        {n.title}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        {!n.read && (
                          <button
                            onClick={() => markOne(n.id)}
                            className="hidden group-hover:flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                            title="Marcar como leído"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                          </button>
                        )}
                        <button
                          onClick={() => removeOne(n.id)}
                          className="hidden group-hover:flex size-5 items-center justify-center rounded text-muted-foreground hover:text-destructive"
                          title="Descartar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.body}</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">{n.time}</p>
                  </div>
                  {!n.read && <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div className="border-t px-4 py-2.5 text-center">
              <a href="#" className="text-xs text-primary hover:underline">Ver historial completo</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

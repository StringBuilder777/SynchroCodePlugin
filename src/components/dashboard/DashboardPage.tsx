import { Badge } from "@/components/ui/badge";

// ── Mock data ──────────────────────────────────────────────────────────────────

const KPI_CARDS = [
  {
    label: "Proyectos activos",
    value: 5,
    sub: "+2 nuevos este mes",
    subColor: "text-emerald-500",
    iconColor: "bg-primary/10 text-primary",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
    ),
  },
  {
    label: "Tareas pendientes",
    value: 24,
    sub: "↑5 desde ayer",
    subColor: "text-amber-500",
    iconColor: "bg-amber-500/10 text-amber-500",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 12h6"/><path d="M12 9v6"/></svg>
    ),
  },
  {
    label: "Completadas hoy",
    value: 8,
    sub: "+3 vs. ayer",
    subColor: "text-emerald-500",
    iconColor: "bg-emerald-500/10 text-emerald-500",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
    ),
  },
  {
    label: "Miembros activos",
    value: 12,
    sub: "Sin cambios",
    subColor: "text-muted-foreground",
    iconColor: "bg-violet-500/10 text-violet-500",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ),
  },
];

const ACTIVE_PROJECTS = [
  { name: "Redesign Website 2024", status: "Activo", tasks: 12, total: 20, pct: 60, barColor: "bg-primary" },
  { name: "Mobile App V2", status: "Activo", tasks: 45, total: 48, pct: 94, barColor: "bg-emerald-500" },
  { name: "API Integration Hub", status: "En revisión", tasks: 5, total: 30, pct: 17, barColor: "bg-amber-500" },
];

const STATUS_BADGE: Record<string, string> = {
  "Activo": "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  "En revisión": "bg-amber-500/15 text-amber-500 border-amber-500/30",
};

const RECENT_ACTIVITY = [
  { text: "Alex R. completó tarea", detail: "Figma Setup", color: "bg-primary/15 text-primary", icon: <><path d="m9 12 2 2 4-4"/><rect width="18" height="18" x="3" y="3" rx="2"/></> },
  { text: "Elena L. agregada al equipo", detail: "UX Design", color: "bg-emerald-500/15 text-emerald-500", icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M5 12h14"/><path d="M12 5v14"/></> },
  { text: "Mensaje nuevo en", detail: "canal #general", color: "bg-violet-500/15 text-violet-500", icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/> },
  { text: "Tarea por vencer", detail: "Auth API", color: "bg-rose-500/15 text-rose-500", icon: <><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></> },
];

const DEADLINES = [
  { task: "Rediseño de Dashboard", project: "Redesign Website 2024", assignee: "Alex R.", date: "Hoy", status: "urgente" },
  { task: "Documentación de API", project: "API Integration Hub", assignee: "Elena L.", date: "En 3 días", status: "pendiente" },
  { task: "Integración Stripe", project: "Mobile App V2", assignee: "Marc T.", date: "En 8 días", status: "en_tiempo" },
];

const DEADLINE_BADGE: Record<string, { label: string; cls: string }> = {
  urgente: { label: "Urgente", cls: "bg-rose-500/15 text-rose-500 border-rose-500/30" },
  pendiente: { label: "Pendiente", cls: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  en_tiempo: { label: "En tiempo", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
};

const WEEK_DAYS = [
  { day: "Lun", done: 6, total: 8 },
  { day: "Mar", done: 4, total: 6 },
  { day: "Mié", done: 8, total: 8 },
  { day: "Jue", done: 5, total: 9 },
  { day: "Vie", done: 3, total: 7 },
  { day: "Sáb", done: 2, total: 4 },
  { day: "Hoy", done: 8, total: 10 },
];

// ── Component ──────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const today = new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const todayLabel = today.charAt(0).toUpperCase() + today.slice(1);
  const weekPct = Math.round((WEEK_DAYS.reduce((a, d) => a + d.done, 0) / WEEK_DAYS.reduce((a, d) => a + d.total, 0)) * 100);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Bienvenido de vuelta, Admin User</p>
        </div>
        <span className="text-sm text-muted-foreground hidden sm:block">{todayLabel}</span>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((k) => (
          <div key={k.label} className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</p>
              <div className={`flex size-9 items-center justify-center rounded-lg ${k.iconColor}`}>
                {k.icon}
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold">{k.value}</p>
              <p className={`text-xs mt-1 ${k.subColor}`}>{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Middle row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Active projects */}
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Mis proyectos activos</h2>
            <a href="/proyectos" className="text-sm text-primary hover:underline">Ver todos</a>
          </div>
          <div className="space-y-4">
            {ACTIVE_PROJECTS.map((p) => (
              <div key={p.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <a href="/proyectos/1" className="text-sm font-medium hover:text-primary transition-colors truncate">{p.name}</a>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${STATUS_BADGE[p.status] ?? ""}`}>{p.status}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{p.tasks}/{p.total} tareas</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${p.barColor} transition-all`} style={{ width: `${p.pct}%` }} />
                  </div>
                  <span className="text-xs font-medium w-8 text-right">{p.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: activity + weekly progress */}
        <div className="space-y-4">
          {/* Recent activity */}
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <h2 className="font-semibold">Actividad reciente</h2>
            <div className="space-y-3">
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${a.color}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {a.icon}
                    </svg>
                  </div>
                  <p className="text-sm">
                    {a.text} <span className="font-medium">{a.detail}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly progress */}
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Progreso semanal</h2>
              <span className="text-lg font-bold text-primary">{weekPct}%</span>
            </div>
            <div className="flex items-end gap-1.5 h-20">
              {WEEK_DAYS.map((d) => {
                const pct = d.total > 0 ? (d.done / d.total) * 100 : 0;
                const isToday = d.day === "Hoy";
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col justify-end h-16 rounded-sm overflow-hidden bg-muted">
                      <div
                        className={`w-full rounded-sm transition-all ${isToday ? "bg-primary" : "bg-primary/50"}`}
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-[10px] ${isToday ? "text-primary font-semibold" : "text-muted-foreground"}`}>{d.day}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Meta semanal: 90%</span>
              <span className="text-emerald-500">+5% vs. semana anterior</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Deadlines table ─────────────────────────────────────────────────── */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold">Próximas fechas límite</h2>
          <a href="/tareas" className="text-sm text-primary hover:underline">Ver todas las tareas</a>
        </div>
        <div className="grid grid-cols-[1fr_180px_120px_100px_100px] gap-4 px-5 py-3 border-b bg-muted/50 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>Tarea</span>
          <span>Proyecto</span>
          <span>Responsable</span>
          <span>Fecha límite</span>
          <span className="text-right">Estado</span>
        </div>
        {DEADLINES.map((d, i) => {
          const s = DEADLINE_BADGE[d.status];
          return (
            <div key={i} className="grid grid-cols-[1fr_180px_120px_100px_100px] gap-4 px-5 py-3.5 border-b last:border-0 items-center text-sm hover:bg-accent/30 transition-colors">
              <span className="font-medium truncate">{d.task}</span>
              <span className="text-muted-foreground truncate">{d.project}</span>
              <span className="text-muted-foreground">{d.assignee}</span>
              <span className={`font-medium ${d.status === "urgente" ? "text-rose-500" : ""}`}>{d.date}</span>
              <div className="flex justify-end">
                <Badge variant="outline" className={`text-[10px] ${s.cls}`}>{s.label}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

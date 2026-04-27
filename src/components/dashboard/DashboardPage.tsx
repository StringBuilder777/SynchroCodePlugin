import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { projectsService } from "@/lib/projects";
import { tasksService } from "@/lib/tasks";
import { usersService } from "@/lib/users";
import type { Project } from "@/components/proyectos/types";
import type { Task } from "@/components/tareas/types";

const STATUS_BADGE: Record<string, string> = {
  "activo": "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  "en_proceso": "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  "archivado": "bg-muted text-muted-foreground border-muted",
  "en revisión": "bg-amber-500/15 text-amber-500 border-amber-500/30",
};

const DEADLINE_BADGE: Record<string, { label: string; cls: string }> = {
  urgente: { label: "Urgente", cls: "bg-rose-500/15 text-rose-500 border-rose-500/30" },
  pendiente: { label: "Pendiente", cls: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  en_tiempo: { label: "En tiempo", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
};

function formatShortDate(dateStr: string) {
  if (!dateStr) return "Sin fecha";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(d);
  } catch (e) {
    return dateStr;
  }
}

export function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<{task: Task, project: Project}[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Usuario");

  const today = new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const todayLabel = today.charAt(0).toUpperCase() + today.slice(1);

  useEffect(() => {
    async function loadData() {
      try {
        const [me, allProjects] = await Promise.all([
          usersService.getMe(),
          projectsService.getAll(),
        ]);
        
        setUserName(me.name || "Usuario");
        setProjects(allProjects);

        // Load tasks for all projects
        const tasksPromises = allProjects.map(async (p) => {
          const projectTasks = await tasksService.getProjectTasks(p.id);
          return projectTasks.map(t => ({ task: t, project: p }));
        });
        
        const tasksArrays = await Promise.all(tasksPromises);
        const allTasks = tasksArrays.flat();
        setTasks(allTasks);

        try {
          const allUsers = await usersService.getAll();
          setUserCount(allUsers.length);
          const map: Record<string, string> = {};
          allUsers.forEach(u => { map[u.id] = u.name; });
          setUsersMap(map);
        } catch (e) {
          console.warn("Could not fetch all users", e);
          setUserCount(0); // non-admins might fail
        }

      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex h-64 items-center justify-center text-muted-foreground">
        Cargando dashboard...
      </div>
    );
  }

  // Calculate metrics
  const activeProjects = projects.filter(p => p.status === "activo" || p.status === "en_revision");
  
  const pendingTasks = tasks.filter(t => t.task.status === "pendiente" || t.task.status === "en_proceso");
  const completedTasks = tasks.filter(t => t.task.status === "terminado");
  
  const KPI_CARDS = [
    {
      label: "Proyectos activos",
      value: activeProjects.length,
      sub: `De ${projects.length} en total`,
      subColor: "text-emerald-500",
      iconColor: "bg-primary/10 text-primary",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
      ),
    },
    {
      label: "Tareas pendientes",
      value: pendingTasks.length,
      sub: "Por realizar",
      subColor: "text-amber-500",
      iconColor: "bg-amber-500/10 text-amber-500",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 12h6"/><path d="M12 9v6"/></svg>
      ),
    },
    {
      label: "Tareas completadas",
      value: completedTasks.length,
      sub: "En todos los proyectos",
      subColor: "text-emerald-500",
      iconColor: "bg-emerald-500/10 text-emerald-500",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
      ),
    },
    {
      label: "Miembros en organización",
      value: userCount > 0 ? userCount : "—",
      sub: "Usuarios registrados",
      subColor: "text-muted-foreground",
      iconColor: "bg-violet-500/10 text-violet-500",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      ),
    },
  ];

  const ACTIVE_PROJECTS_DATA = activeProjects.map(p => {
    const pTasks = tasks.filter(t => t.project.id === p.id);
    const completed = pTasks.filter(t => t.task.status === "terminado").length;
    const total = pTasks.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    let barColor = "bg-primary";
    if (pct > 80) barColor = "bg-emerald-500";
    else if (pct < 30) barColor = "bg-amber-500";

    return {
      id: p.id,
      name: p.name,
      status: p.status,
      tasks: completed,
      total,
      pct,
      barColor
    };
  });

  const DEADLINES_DATA = pendingTasks
    .map(t => {
      let daysLeft = 999999;
      let statusStr = "en_tiempo";
      
      if (t.task.dueDate) {
        daysLeft = Math.max(0, Math.ceil((new Date(t.task.dueDate).getTime() - Date.now()) / 86400000));
        if (daysLeft === 0) statusStr = "urgente";
        else if (daysLeft <= 3) statusStr = "pendiente";
      } else {
        statusStr = "pendiente";
      }

      return {
        id: t.task.id,
        task: t.task.title,
        project: t.project.name,
        assignee: usersMap[t.task.assignee] || t.task.assignee || "Sin asignar",
        date: formatShortDate(t.task.dueDate),
        status: statusStr,
        daysLeft
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  const RECENT_ACTIVITY = [
    { text: "Dashboard", detail: "Datos actualizados en tiempo real", color: "bg-primary/15 text-primary", icon: <><path d="m9 12 2 2 4-4"/><rect width="18" height="18" x="3" y="3" rx="2"/></> },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Bienvenido de vuelta, {userName}</p>
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
            {ACTIVE_PROJECTS_DATA.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay proyectos activos.</p>
            ) : ACTIVE_PROJECTS_DATA.map((p) => (
              <div key={p.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <a href={`/proyectos/${p.id}`} className="text-sm font-medium hover:text-primary transition-colors truncate">{p.name}</a>
                    <Badge variant="outline" className={`text-[10px] shrink-0 uppercase ${STATUS_BADGE[p.status.toLowerCase()] ?? ""}`}>{p.status}</Badge>
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

        {/* Right column: activity */}
        <div className="space-y-4">
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
        </div>
      </div>

      {/* ── Deadlines table ─────────────────────────────────────────────────── */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold">Próximas fechas límite</h2>
        </div>
        <div className="grid grid-cols-[1fr_180px_120px_100px_100px] gap-4 px-5 py-3 border-b bg-muted/50 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>Tarea</span>
          <span>Proyecto</span>
          <span>Responsable</span>
          <span>Fecha límite</span>
          <span className="text-right">Estado</span>
        </div>
        {DEADLINES_DATA.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">No hay tareas próximas a vencer.</div>
        ) : DEADLINES_DATA.map((d) => {
          const s = DEADLINE_BADGE[d.status];
          return (
            <div key={d.id} className="grid grid-cols-[1fr_180px_120px_100px_100px] gap-4 px-5 py-3.5 border-b last:border-0 items-center text-sm hover:bg-accent/30 transition-colors">
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

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProjectFormDialog } from "./ProjectFormDialog";
import type { Project } from "./types";
import { STATUS_CONFIG, getInitials, getAvatarColor } from "./types";
import { projectsService } from "@/lib/projects";
import { tasksService } from "@/lib/tasks";
import { usersService } from "@/lib/users";
import { normalizeUserError } from "@/lib/errors";

const TABS = [
  { key: "activos", label: "Activos" },
  { key: "archivados", label: "Archivados" },
  { key: "todos", label: "Todos" },
];

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("activos");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<Record<string, any[]>>({});
  const [projectMembers, setProjectMembers] = useState<Record<string, any[]>>({});

  useEffect(() => {
    async function loadData() {
      try {
        const [projectsData, userData, allUsers] = await Promise.all([
          projectsService.getAll(),
          usersService.getMe(),
          usersService.getAll().catch(() => [])
        ]);
        setProjects(projectsData);
        setUserRole(userData.role);

        const uMap: Record<string, any> = {};
        allUsers.forEach(u => uMap[u.id] = u);

        const tasksMap: Record<string, any[]> = {};
        const membersMap: Record<string, any[]> = {};

        await Promise.all(projectsData.map(async (p) => {
          try {
            const pTasks = await tasksService.getProjectTasks(p.id);
            tasksMap[p.id] = pTasks;
            
            const pMembers = await projectsService.getMembers(p.id);
            membersMap[p.id] = pMembers.map(m => {
              const u = uMap[m.userId] || {};
              return { id: m.userId, name: m.name || u.name || "Miembro" };
            });
          } catch (e) {
            tasksMap[p.id] = [];
            membersMap[p.id] = [];
          }
        }));

        setProjectTasks(tasksMap);
        setProjectMembers(membersMap);
      } catch (e: unknown) {
        setError(normalizeUserError(e, { fallback: "No se pudieron cargar los proyectos." }));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const isManagement = userRole === "Administrador" || userRole === "Gerente";

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchTab =
        tab === "todos" ||
        (tab === "activos" ? p.status !== "archivado" : p.status === "archivado");
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [projects, tab, search]);

  async function handleSave(data: Pick<Project, "name" | "description" | "startDate" | "endDate">) {
    try {
      if (editingProject) {
        const updated = await projectsService.update(editingProject.id, data);
        setProjects((prev) => prev.map((p) => (p.id === editingProject.id ? updated : p)));
      } else {
        const created = await projectsService.create(data);
        setProjects((prev) => [...prev, created]);
      }
      setEditingProject(null);
      setFormOpen(false);
    } catch (e) {
      console.error("Error al guardar proyecto:", e);
      throw e;
    }
  }

  function formatDate(d: string) {
    if (!d) return "";
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("es", { day: "2-digit", month: "short" });
  }

  function getProgressColor(completed: number, total: number) {
    if (total === 0) return "bg-muted";
    const pct = completed / total;
    if (pct >= 0.9) return "bg-amber-500";
    return "bg-primary";
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Cargando proyectos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Error al cargar proyectos: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proyectos</h1>
          <p className="text-sm text-muted-foreground">
            {isManagement 
              ? "Gestiona y monitorea el progreso de todos los proyectos activos." 
              : "Visualiza el progreso de tu proyecto asignado."}
          </p>
        </div>
        {isManagement && (
          <Button onClick={() => { setEditingProject(null); setFormOpen(true); }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Nuevo Proyecto
          </Button>
        )}
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 rounded-lg border p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-64">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <Input placeholder="Buscar proyecto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const cfg = STATUS_CONFIG[p.status];
          const pTasks = projectTasks[p.id] || [];
          const completedCount = pTasks.filter(t => t.status === 'terminado').length;
          const totalCount = pTasks.length;
          const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          const pMems = projectMembers[p.id] || [];
          return (
            <a key={p.id} href={`/proyectos/${p.id}`} className="group rounded-xl border p-5 space-y-4 hover:border-primary/50 transition-colors">
              <Badge variant="outline" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
              <div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">{p.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
              </div>
              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progreso</span>
                  <span>{completedCount}/{totalCount} tareas</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${getProgressColor(completedCount, totalCount)}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {pMems.slice(0, 3).map((m, i) => (
                    <div key={i} className={`flex size-7 items-center justify-center rounded-full border-2 border-card text-[10px] font-medium ${getAvatarColor(m.name)}`}>
                      {getInitials(m.name)}
                    </div>
                  ))}
                  {pMems.length > 3 && (
                    <div className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-secondary text-[10px] font-medium text-muted-foreground">
                      +{pMems.length - 3}
                    </div>
                  )}
                  {pMems.length === 0 && (
                    <div className="flex size-7 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(p.startDate)} - {formatDate(p.endDate)}</span>
              </div>
            </a>
          );
        })}

        {/* New project card */}
        {isManagement && (
          <button
            onClick={() => { setEditingProject(null); setFormOpen(true); }}
            className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </div>
            <div className="text-center">
              <div className="font-semibold">Nuevo Proyecto</div>
              <div className="text-sm">Crea un nuevo espacio de trabajo y asigna equipo.</div>
            </div>
          </button>
        )}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="py-12 text-center text-muted-foreground">
          No hay proyectos disponibles.
        </div>
      )}

      <ProjectFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingProject(null); }}
        onSave={handleSave}
        project={editingProject}
      />
    </div>
  );
}

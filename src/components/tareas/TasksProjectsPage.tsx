import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { projectsService } from "@/lib/projects";
import { usersService } from "@/lib/users";
import type { Project } from "@/components/proyectos/types";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  activo: { label: "Activo", color: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  en_revision: { label: "En revisión", color: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  planificacion: { label: "Planificación", color: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30" },
  archivado: { label: "Archivado", color: "bg-muted text-muted-foreground border-muted/30" },
};

const COLORS = ["bg-blue-500/20 text-blue-500", "bg-purple-500/20 text-purple-500", "bg-amber-500/20 text-amber-500", "bg-emerald-500/20 text-emerald-500", "bg-rose-500/20 text-rose-500"];
function avatarColor(name: string) { let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h); return COLORS[Math.abs(h) % COLORS.length]; }
function initials(name: string) { return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2); }

export function TasksProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await projectsService.getAll();
        setProjects(data);
      } catch (error) {
        console.error("Error loading projects:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [search, projects]);

  if (loading) {
    return <div className="p-6 lg:p-8 text-center text-muted-foreground">Cargando proyectos...</div>;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tareas</h1>
        <p className="text-sm text-muted-foreground">Selecciona un proyecto para ver su tablero Kanban.</p>
      </div>

      <div className="relative w-72">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <Input placeholder="Buscar proyecto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.activo;
          // Note: totalTasks/completedTasks are not in the Project type yet, but we use 0 or mocked if backend doesn't provide them.
          // In a real app, the API should return these metrics.
          return (
            <a key={p.id} href={`/proyectos/${p.id}?tab=tareas`} className="group rounded-xl border p-5 space-y-4 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">{p.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                  {p.startDate} - {p.endDate}
                </span>
                <span className="text-primary font-medium">Ver Tablero →</span>
              </div>
            </a>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron proyectos.</p>
        </div>
      )}
    </div>
  );
}

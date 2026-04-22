import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArchiveProjectDialog } from "./ArchiveProjectDialog";
import { ProjectFormDialog } from "./ProjectFormDialog";
import { AddMemberDialog } from "./AddMemberDialog";
import { KanbanBoard } from "@/components/tareas/KanbanBoard";
import { GitHubTab } from "./GitHubTab";
import { ChatTab } from "./ChatTab";
import type { Project, TeamMember } from "./types";
import { STATUS_CONFIG, getInitials, getAvatarColor } from "./types";
import { projectsService } from "@/lib/projects";
import { usersService } from "@/lib/users";
import { normalizeUserError } from "@/lib/errors";

const ACTIVITY = [
  { task: "Rediseño de navbar", status: "en_proceso", time: "hace 4 horas" },
  { task: "Integración de íconos", status: "completada", time: "hace 8 horas" },
  { task: "Animaciones de transición", status: "pendiente", time: "Ayer" },
  { task: "Corrección estilos mobile", status: "en_proceso", time: "hace 2 días" },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  en_proceso: { label: "EN PROCESO", cls: "bg-amber-500/15 text-amber-500" },
  completada: { label: "COMPLETADA", cls: "bg-emerald-500/15 text-emerald-500" },
  pendiente: { label: "PENDIENTE", cls: "bg-muted text-muted-foreground" },
};

const TABS = ["Resumen", "Tareas", "Equipo", "Métricas", "Chat", "GitHub"];

interface Props {
  projectId?: string;
  initialTab?: string;
}

export function ProjectDetailPage({ projectId, initialTab }: Props) {
  const [project, setProject] = useState<Project | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab) {
      const match = TABS.find((t) => t.toLowerCase() === initialTab.toLowerCase());
      return match || "Resumen";
    }
    return "Resumen";
  });
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  // Resolve the project ID: from props or from the URL on the client
  const resolvedId = projectId ?? (typeof window !== "undefined"
    ? window.location.pathname.split("/").filter(Boolean).pop()
    : undefined);

  useEffect(() => {
    if (!resolvedId) {
      setError("ID de proyecto no encontrado.");
      setLoading(false);
      return;
    }
    
    async function loadData() {
      try {
        const [p, userData, membersData] = await Promise.all([
          projectsService.getById(resolvedId!),
          usersService.getMe(),
          projectsService.getMembers(resolvedId!)
        ]);
        
        setProject(p);
        setUserRole(userData.role);
        
        // Fetch all users to get names/emails for the member list
        const allOrgUsers = await usersService.getAll();
        
        setTeamMembers(
          membersData.map((m: any) => {
            const u = allOrgUsers.find(user => user.id === m.userId);
            return {
              id: m.userId,
              name: u?.name || "Usuario Desconocido",
              email: u?.email || "",
              role: u?.role || "Miembro", // In a real app, role might come from project_team table
            };
          })
        );
      } catch (e: unknown) {
        setError(normalizeUserError(e, { fallback: "No se pudo cargar el proyecto." }));
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [resolvedId]);

  const isManagement = userRole === "Administrador" || userRole === "Gerente";

  async function handleEditSave(data: Pick<Project, "name" | "description" | "startDate" | "endDate">) {
    if (!project) return;
    try {
      const updated = await projectsService.update(project.id, data);
      setProject(updated);
      setEditOpen(false);
    } catch (e) {
      console.error("Error al actualizar proyecto:", e);
      throw e;
    }
  }

  async function handleToggleArchive() {
    if (!project) return;
    try {
      if (project.status === "archivado") {
        await projectsService.unarchive(project.id);
        setProject((p) => p ? { ...p, status: "activo" } : p);
      } else {
        await projectsService.archive(project.id);
        setProject((p) => p ? { ...p, status: "archivado" } : p);
      }
    } catch (e) {
      console.error("Error al cambiar estado de archivo del proyecto:", e);
    }
    setArchiveOpen(false);
  }

  async function handleAddMember(member: TeamMember) {
    if (!project) return;
    try {
      await projectsService.addMember(project.id, member.id);
      setTeamMembers(prev => [...prev, member]);
    } catch (e: any) {
      console.error("Error al añadir miembro:", e);
      throw e; // Rethrow to let the dialog handle the error display
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!project) return;
    try {
      await projectsService.removeMember(project.id, userId);
      setTeamMembers(prev => prev.filter(m => m.id !== userId));
    } catch (e: unknown) {
      console.error("Error al quitar miembro:", e);
      setActionError(
        normalizeUserError(e, {
          fallback: "No se pudo quitar al miembro del equipo.",
          forbiddenMessage: "No tienes permisos para quitar integrantes.",
          notFoundMessage: "No se encontró el integrante seleccionado.",
        }),
      );
      setTimeout(() => setActionError(null), 5000);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Cargando proyecto...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6 lg:p-8">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error ?? "Proyecto no encontrado."}
        </div>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[project.status];
  const pct = project.totalTasks > 0 ? Math.round((project.completedTasks / project.totalTasks) * 100) : 0;
  const daysLeft = Math.max(0, Math.ceil((new Date(project.endDate).getTime() - Date.now()) / 86400000));

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Action Error Banner */}
      {actionError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          {actionError}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        <a href="/proyectos" className="hover:text-foreground">Proyectos</a> &gt; <span className="text-foreground font-medium">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
          </div>
          <p className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            {project.startDate} — {project.endDate}
          </p>
        </div>
        {isManagement && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
              Editar proyecto
            </Button>
            <Button 
              variant={project.status === "archivado" ? "outline" : "destructive"} 
              onClick={() => project.status === "archivado" ? handleToggleArchive() : setArchiveOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {project.status === "archivado" 
                  ? <path d="M3 7v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M12 7v10m0-10l-4 4m4-4l4 4M3 3h18"/> 
                  : <path d="m20 21-8-8-8 8V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/>
                }
              </svg>
              {project.status === "archivado" ? "Desarchivar" : "Archivar"}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b">
        {TABS.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Resumen" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "TOTAL DE TAREAS", value: project.totalTasks, sub: `(${project.completedTasks} completadas)` },
              { label: "EN PROCESO", value: project.totalTasks - project.completedTasks, sub: "pendientes" },
              { label: "MIEMBROS", value: teamMembers.length, sub: "" },
              { label: "DÍAS RESTANTES", value: daysLeft, sub: `Vence ${project.endDate}` },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-2xl font-bold">{s.value} <span className="text-sm font-normal text-muted-foreground">{s.sub}</span></p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[1fr_320px] gap-6">
            {/* Description + progress */}
            <div className="space-y-6">
              <div className="rounded-lg border p-6 space-y-4">
                <h3 className="font-semibold">Descripción del proyecto</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
                <div className="grid grid-cols-4 gap-4 pt-2 text-sm">
                  <div><p className="text-xs uppercase text-muted-foreground">Inicio</p><p className="font-medium">{project.startDate}</p></div>
                  <div><p className="text-xs uppercase text-muted-foreground">Entrega</p><p className="font-medium">{project.endDate}</p></div>
                  <div><p className="text-xs uppercase text-muted-foreground">Creado por</p><p className="font-medium">{project.createdBy}</p></div>
                  <div><p className="text-xs uppercase text-muted-foreground">Estado</p><p className="font-medium text-primary">{cfg.label}</p></div>
                </div>
                <div className="rounded-lg bg-secondary p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="font-medium">Progreso general</span><span className="text-primary font-semibold">{pct}%</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
                  <p className="text-xs text-muted-foreground">{project.completedTasks} de {project.totalTasks} tareas completadas</p>
                </div>
              </div>

              {/* Activity */}
              <div className="rounded-lg border p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Actividad reciente</h3>
                  <button className="text-sm text-primary hover:underline">Ver todo</button>
                </div>
                <div className="space-y-0">
                  <div className="grid grid-cols-3 gap-4 text-xs uppercase tracking-wide text-muted-foreground pb-2 border-b">
                    <span>Tarea</span><span>Estado</span><span>Actualización</span>
                  </div>
                  {ACTIVITY.map((a) => {
                    const sb = STATUS_BADGE[a.status];
                    return (
                      <div key={a.task} className="grid grid-cols-3 gap-4 py-3 border-b last:border-0 items-center text-sm">
                        <span>{a.task}</span>
                        <Badge variant="outline" className={`w-fit text-[10px] ${sb.cls}`}>{sb.label}</Badge>
                        <span className="text-muted-foreground">{a.time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar: Team + GitHub */}
            <div className="space-y-6">
              <div className="rounded-lg border p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Equipo</h3>
                  <span className="text-xs text-muted-foreground">{teamMembers.length} Miembros</span>
                </div>
                {teamMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className={`flex size-9 items-center justify-center rounded-full text-xs font-medium ${getAvatarColor(m.name)}`}>{getInitials(m.name)}</div>
                    <div>
                      <div className="text-sm font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.role}</div>
                    </div>
                  </div>
                ))}
                <button onClick={() => setAddMemberOpen(true)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors pt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  Agregar miembro
                </button>
              </div>

              {/* GitHub card */}
              <div className="rounded-lg border p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    GitHub
                  </h3>
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500">CONECTADO</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-mono">synchrocode-org / {project.name.toLowerCase().replace(/\s+/g, "-")}</p>
                <div className="grid grid-cols-3 gap-2">
                  {[{ n: "—", l: "COMMITS" }, { n: "—", l: "PRS" }, { n: "—", l: "VINCULADAS" }].map((s) => (
                    <div key={s.l} className="rounded-lg border p-2 text-center">
                      <div className="text-lg font-bold">{s.n}</div>
                      <div className="text-[10px] text-muted-foreground">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Equipo" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Miembros del equipo</h3>
            <Button size="sm" onClick={() => setAddMemberOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Agregar miembro
            </Button>
          </div>
          <div className="rounded-lg border overflow-hidden">
            <div className="grid grid-cols-[1fr_1.5fr_1fr_80px] gap-4 border-b bg-muted/50 px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span>Nombre</span><span>Email</span><span>Rol</span><span className="text-right">Acción</span>
            </div>
            {teamMembers.map((m) => (
              <div key={m.id} className="grid grid-cols-[1fr_1.5fr_1fr_80px] gap-4 border-b last:border-0 px-6 py-4 items-center">
                <div className="flex items-center gap-3">
                  <div className={`flex size-8 items-center justify-center rounded-full text-xs font-medium ${getAvatarColor(m.name)}`}>{getInitials(m.name)}</div>
                  <span className="font-medium text-sm">{m.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{m.email || "—"}</span>
                <Badge variant="outline" className="w-fit text-xs">{m.role}</Badge>
                <div className="flex justify-end">
                  {isManagement && (
                    <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveMember(m.id)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {teamMembers.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">Sin miembros asignados.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === "Métricas" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-primary">Resumen de Métricas</h3>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Tiempo Promedio Tarea", value: "—", change: "", changeColor: "text-muted-foreground", sub: "Sin datos aún" },
              { label: "Tareas Completadas", value: String(project.completedTasks), change: "", changeColor: "text-muted-foreground", sub: `de ${project.totalTasks} totales` },
              { label: "Eficiencia Equipo", value: "—", change: "", changeColor: "text-muted-foreground", sub: "Sin datos aún" },
              { label: "Errores Reportados", value: "—", change: "", changeColor: "text-muted-foreground", sub: "Sin datos aún" },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border p-4 space-y-1">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{m.value}</span>
                  <span className={`text-xs font-medium ${m.changeColor}`}>{m.change}</span>
                </div>
                <p className="text-xs text-muted-foreground">{m.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[1fr_340px] gap-6">
            <div className="rounded-lg border p-6 space-y-4">
              <div><h4 className="font-semibold">Velocidad del Equipo</h4><p className="text-sm text-muted-foreground">Tareas completadas por semana</p></div>
              <div className="flex items-end gap-3 h-48">
                {[35, 45, 50, 60, 70, 85].map((h, i) => (
                  <div key={`bar-${i}`} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full rounded-t bg-primary" style={{ height: `${h}%` }} />
                    <span className="text-[10px] text-muted-foreground">{i < 5 ? `Sem ${i + 1}` : "Actual"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border p-6 space-y-4">
              <div><h4 className="font-semibold">Prioridades</h4><p className="text-sm text-muted-foreground">Distribución de tareas activas</p></div>
              <div className="flex justify-center py-4">
                <div className="relative size-36">
                  <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" strokeWidth="5" stroke="currentColor" className="text-rose-500" strokeDasharray="22 88" strokeDashoffset="0" />
                    <circle cx="18" cy="18" r="14" fill="none" strokeWidth="5" stroke="currentColor" className="text-amber-500" strokeDasharray="30.8 88" strokeDashoffset="-22" />
                    <circle cx="18" cy="18" r="14" fill="none" strokeWidth="5" stroke="currentColor" className="text-primary" strokeDasharray="35.2 88" strokeDashoffset="-52.8" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xs text-muted-foreground">TOTAL</span></div>
                </div>
              </div>
              <div className="space-y-2">
                {[{ label: "Alta", pct: "25%", color: "bg-rose-500" }, { label: "Media", pct: "35%", color: "bg-amber-500" }, { label: "Baja", pct: "40%", color: "bg-primary" }].map((p) => (
                  <div key={p.label} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2"><span className={`size-2.5 rounded-full ${p.color}`} />{p.label}</div>
                    <span className="text-muted-foreground">{p.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Tareas" && <KanbanBoard projectId={project.id} />}
      {activeTab === "GitHub" && <GitHubTab />}
      {activeTab === "Chat" && <ChatTab />}

      {/* Dialogs */}
      <ProjectFormDialog open={editOpen} onClose={() => setEditOpen(false)} onSave={handleEditSave} project={project} />
      <ArchiveProjectDialog open={archiveOpen} onClose={() => setArchiveOpen(false)} onConfirm={handleToggleArchive} project={project} />
      <AddMemberDialog open={addMemberOpen} onClose={() => setAddMemberOpen(false)} onAdd={handleAddMember} existingIds={teamMembers.map((m) => m.id)} />
    </div>
  );
}

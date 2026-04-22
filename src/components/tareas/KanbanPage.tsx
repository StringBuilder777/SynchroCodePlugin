import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskFormDialog } from "./TaskFormDialog";
import { TaskDetailDialog } from "./TaskDetailDialog";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { UploadEvidenceDialog } from "./UploadEvidenceDialog";
import type { Task, TaskStatus, TaskPriority } from "./types";
import { PRIORITY_CONFIG, COLUMNS } from "./types";

const initialTasks: Task[] = [
  { id: "t1", title: "Revisar el rendimiento de las consultas pesadas en el dashboard principal.", description: "Implementar los nuevos widgets de visualización en tiempo real para el panel de control principal. Es necesario asegurar que los gráficos de rendimiento sean responsivos y utilicen la nueva paleta de colores de la marca.", status: "pendiente", priority: "alta", assignee: "Alex Rivera", dueDate: "2023-10-12", evidence: [{ name: "dashboard_mockup.png", size: "2.4 MB" }, { name: "requirements_v2.pdf", size: "1.1 MB" }], createdBy: "Admin User", createdAt: "01 Oct" },
  { id: "t2", title: "Completar los endpoints de autenticación en Swagger.", description: "Documentar todos los endpoints de auth en Swagger con ejemplos de request/response.", status: "pendiente", priority: "media", assignee: "Alex Rivera", dueDate: "2023-10-15", evidence: [], createdBy: "Admin User", createdAt: "03 Oct" },
  { id: "t3", title: "Implementar nuevos widgets de visualización de datos en tiempo real.", description: "Crear widgets de datos en tiempo real usando Supabase Realtime.", status: "en_proceso", priority: "alta", assignee: "Sarah Connor", dueDate: "2023-10-08", evidence: [], createdBy: "Admin User", createdAt: "28 Sep" },
  { id: "t4", title: "Automatización de despliegues en el entorno de testing.", description: "Configurar CI/CD pipeline para deploy automático en staging.", status: "terminado", priority: "baja", assignee: "Marcus Chen", dueDate: "2023-10-05", evidence: [], createdBy: "Admin User", createdAt: "20 Sep" },
];

function getAvatarColor(name: string) {
  const colors = ["bg-blue-500/20 text-blue-500", "bg-purple-500/20 text-purple-500", "bg-amber-500/20 text-amber-500", "bg-emerald-500/20 text-emerald-500"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [formOpen, setFormOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const [uploadTaskId, setUploadTaskId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  function handleSave(data: Pick<Task, "title" | "description" | "priority" | "assignee" | "dueDate">) {
    setTasks((prev) => [...prev, { id: crypto.randomUUID(), status: "pendiente", evidence: [], createdBy: "Admin User", createdAt: new Date().toLocaleDateString("es", { day: "2-digit", month: "short" }), ...data }]);
  }

  function handleStatusChange(id: string, status: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    if (detailTask?.id === id) setDetailTask((prev) => prev ? { ...prev, status } : null);
  }

  function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function handleDrop(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault();
    if (draggedId) { handleStatusChange(draggedId, status); setDraggedId(null); }
  }

  function formatDate(d: string) {
    if (!d) return "";
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("es", { day: "2-digit", month: "short" });
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tablero de Tareas</h1>
          <p className="text-sm text-muted-foreground">SynchroCode Development</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Nueva Tarea
        </Button>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-3 gap-5">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              className="space-y-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{col.label}</h2>
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-[11px] font-medium text-primary">{colTasks.length}</span>
                </div>
                <Button variant="ghost" size="icon-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                </Button>
              </div>

              {/* Cards */}
              <div className="space-y-3 min-h-[200px]">
                {colTasks.map((task) => {
                  const pc = PRIORITY_CONFIG[task.priority];
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDraggedId(task.id)}
                      onClick={() => setDetailTask(task)}
                      className="cursor-pointer rounded-lg border p-4 space-y-3 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={`text-[10px] ${pc.color}`}>{pc.label}</Badge>
                        {col.key === "terminado" && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                        )}
                        {col.key !== "terminado" && (
                          <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); setDeleteTask(task); }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                          </Button>
                        )}
                      </div>
                      <p className="text-sm leading-snug">{task.title}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-1">
                          {task.assignee && (
                            <div className={`flex size-7 items-center justify-center rounded-full border-2 border-card text-[10px] font-medium ${getAvatarColor(task.assignee)}`}>
                              {getInitials(task.assignee)}
                            </div>
                          )}
                        </div>
                        {col.key === "terminado" ? (
                          <span className="text-xs text-emerald-500">Finalizado</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialogs */}
      <TaskFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} />
      <TaskDetailDialog open={!!detailTask} onClose={() => setDetailTask(null)} task={detailTask} onStatusChange={handleStatusChange} onUploadEvidence={(id) => { setUploadTaskId(id); }} />
      <DeleteTaskDialog open={!!deleteTask} onClose={() => setDeleteTask(null)} onConfirm={handleDelete} task={deleteTask} />
      <UploadEvidenceDialog
        open={!!uploadTaskId}
        onClose={() => setUploadTaskId(null)}
        onUpload={(files) => {
          if (uploadTaskId) {
            const mappedFiles = files.map((f) => ({
              name: f.name,
              size: f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`,
            }));
            setTasks((prev) => prev.map((t) => t.id === uploadTaskId ? { ...t, evidence: [...t.evidence, ...mappedFiles] } : t));
            if (detailTask?.id === uploadTaskId) setDetailTask((prev) => prev ? { ...prev, evidence: [...prev.evidence, ...mappedFiles] } : null);
          }
        }}
      />
    </div>
  );
}

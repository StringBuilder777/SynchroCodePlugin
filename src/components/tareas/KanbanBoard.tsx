import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskFormDialog } from "./TaskFormDialog";
import { TaskDetailDialog } from "./TaskDetailDialog";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { UploadEvidenceDialog } from "./UploadEvidenceDialog";
import type { Task, TaskStatus } from "./types";
import { PRIORITY_CONFIG, COLUMNS } from "./types";
import { tasksService } from "@/lib/tasks";
import { projectsService } from "@/lib/projects";
import { usersService } from "@/lib/users";

function getAvatarColor(name: string) {
  if (!name) return "bg-gray-500/20 text-gray-500";
  const colors = ["bg-blue-500/20 text-blue-500", "bg-purple-500/20 text-purple-500", "bg-amber-500/20 text-amber-500", "bg-emerald-500/20 text-emerald-500"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

function getInitials(name: string) {
  if (!name) return "??";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export function KanbanBoard({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectMembers, setProjectMembers] = useState<{ id: string; name: string }[]>([]);
  const [allUsers, setAllUsers] = useState<{ id: string; name: string }[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const [uploadTaskId, setUploadTaskId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const userMap = useMemo(() => {
    return allUsers.reduce((acc, u) => ({ ...acc, [u.id]: u.name }), {} as Record<string, string>);
  }, [allUsers]);

  useEffect(() => {
    if (projectId) {
      loadTasks();
      loadMembers();
    }
  }, [projectId]);

  async function loadTasks() {
    setIsLoading(true);
    try {
      const data = await tasksService.getProjectTasks(projectId);
      setTasks(data || []);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMembers() {
    try {
      const [membersData, usersData] = await Promise.all([
        projectsService.getMembers(projectId),
        usersService.getAll()
      ]);
      setAllUsers(usersData.map(u => ({ id: u.id, name: u.name })));
      const mapped = membersData.map((m: any) => {
        const u = usersData.find(user => user.id === m.userId);
        return { id: m.userId, name: u?.name || "Usuario Desconocido" };
      });
      setProjectMembers(mapped);
    } catch (error) {
      console.error("Error loading project members:", error);
    }
  }

  async function handleSave(data: Pick<Task, "title" | "description" | "priority" | "assignee" | "dueDate">) {
    try {
      const newTask = await tasksService.createTask({ ...data, projectId });
      setTasks((prev) => [...prev, newTask]);
    } catch (error) {
      console.error("Error creating task:", error);
    }
  }

  async function handleUpdateTask(id: string, data: Partial<Task>) {
    try {
      const updatedTask = await tasksService.updateTask(id, data);
      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
      if (detailTask?.id === id) setDetailTask(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  }

  async function handleStatusChange(id: string, status: TaskStatus) {
    // 1. Store previous state for possible rollback
    const previousTasks = [...tasks];
    
    // 2. Optimistic Update
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    if (detailTask?.id === id) setDetailTask((prev) => prev ? { ...prev, status } : null);
    
    try {
      const updatedTask = await tasksService.updateStatus(id, status);
      // 3. Sync with actual backend response if it returned an object
      if (updatedTask) {
        setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
        if (detailTask?.id === id) setDetailTask(updatedTask);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      // 4. Rollback on failure
      setTasks(previousTasks);
      // Optional: Refresh list to be absolute sure
      loadTasks();
    }
  }

  async function handleDelete(id: string) {
    try {
      await tasksService.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (detailTask?.id === id) setDetailTask(null);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  }

  function handleDrop(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault();
    if (draggedId) { handleStatusChange(draggedId, status); setDraggedId(null); }
  }

  async function handleUploadEvidence(files: File[]) {
    if (!uploadTaskId) return;
    try {
      const newEvidences = await tasksService.uploadEvidence(uploadTaskId, files);
      await loadTasks();
      
      if (detailTask && detailTask.id === uploadTaskId) {
        setDetailTask(prev => prev ? { ...prev, evidence: [...prev.evidence, ...(newEvidences || [])] } : null);
      }
      
      setUploadTaskId(null);
    } catch (error) {
      console.error("Error uploading evidence:", error);
    }
  }

  function formatDate(d: string) {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleDateString("es", { day: "2-digit", month: "short" });
  }

  if (isLoading && tasks.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Cargando tareas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Nueva Tarea
        </Button>
      </div>

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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{col.label}</h2>
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-[11px] font-medium text-primary">{colTasks.length}</span>
                </div>
              </div>

              <div className="space-y-3 min-h-[200px]">
                {colTasks.map((task) => {
                  const pc = PRIORITY_CONFIG[task.priority] || { label: "BAJA", color: "bg-muted text-muted-foreground border-muted-foreground/30" };
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
                        <div className="flex items-center gap-1">
                          {col.key === "terminado" ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon-xs" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setDetailTask(task); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground hover:text-primary transition-colors"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                              </Button>
                              {col.key === "pendiente" && (
                                <Button variant="ghost" size="icon-xs" className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors" onClick={(e) => { e.stopPropagation(); setDeleteTask(task); }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-sm leading-snug">{task.title}</p>
                      <div className="flex items-center justify-between">
                          {task.assignee ? (
                            <div className={`flex size-7 items-center justify-center rounded-full border-2 border-card text-[10px] font-medium ${getAvatarColor(userMap[task.assignee] || task.assignee)}`} title={userMap[task.assignee] || task.assignee}>
                              {getInitials(userMap[task.assignee] || task.assignee)}
                            </div>
                          ) : (
                            <div className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-medium text-muted-foreground" title="Sin asignar">
                              —
                            </div>
                          )}
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
      <TaskFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} projectMembers={projectMembers} />
      <TaskDetailDialog 
        open={!!detailTask} 
        onClose={() => setDetailTask(null)} 
        task={detailTask} 
        onStatusChange={handleStatusChange} 
        onUploadEvidence={(id) => setUploadTaskId(id)} 
        onUpdateTask={handleUpdateTask}
        onDeleteTask={(t) => setDeleteTask(t)}
        projectMembers={projectMembers}
        userMap={userMap} 
      />
      <DeleteTaskDialog open={!!deleteTask} onClose={() => setDeleteTask(null)} onConfirm={handleDelete} task={deleteTask} />
      <UploadEvidenceDialog open={!!uploadTaskId} onClose={() => setUploadTaskId(null)} onUpload={handleUploadEvidence} />
    </div>
  );
}

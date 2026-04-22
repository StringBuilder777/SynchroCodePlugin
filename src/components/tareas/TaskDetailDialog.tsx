import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import type { Task, TaskStatus, TaskPriority } from "./types";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "./types";
import { tasksService } from "@/lib/tasks";

interface Props {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onUploadEvidence: (id: string) => void;
  onUpdateTask: (id: string, data: Partial<Task>) => Promise<void>;
  onDeleteTask: (task: Task) => void;
  projectMembers?: { id: string; name: string }[];
  userMap?: Record<string, string>;
}

export function TaskDetailDialog({ open, onClose, task, onStatusChange, onUploadEvidence, onUpdateTask, onDeleteTask, projectMembers = [], userMap = {} }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("baja");
  const [assignee, setAssignee] = useState("");
  const [isSaving, setIsEditing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setDueDate(task.dueDate);
      setPriority(task.priority);
      setAssignee(task.assignee || "");
    }
  }, [task, open]);

  if (!task) return null;

  function formatDate(d: string) {
    if (!d) return "";
    try {
      const date = new Date(d);
      return date.toLocaleDateString("es", { 
        day: "2-digit", 
        month: "short", 
        year: "numeric",
        hour: "2-digit", 
        minute: "2-digit" 
      });
    } catch {
      return d;
    }
  }

  function getInitials(name: string) {
    if (!name) return "??";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }

  const creatorName = userMap[task.createdBy] || task.createdBy;
  const assigneeName = userMap[task.assignee] || task.assignee || "Sin asignar";

  async function handleAssigneeChange(newAssignee: string) {
    const val = newAssignee === "none" ? "" : newAssignee;
    setAssignee(val);
    try {
      await onUpdateTask(task.id, { assignee: val });
    } catch (error) {
      console.error("Error updating assignee:", error);
    }
  }

  async function handleDownload(evidenceId: string) {
    if (!evidenceId) return;
    setDownloadingId(evidenceId);
    try {
      const url = await tasksService.getEvidenceDownloadUrl(evidenceId);
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading evidence:", error);
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleSave() {
    setIsEditing(true);
    try {
      await onUpdateTask(task.id, { title, description, dueDate, priority, assignee });
      onClose();
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setIsEditing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[740px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-4 flex-1 mr-4">
            <div className="flex items-center gap-3">
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className={`h-7 w-fit border-0 px-2 py-0 text-[10px] uppercase font-bold ${PRIORITY_CONFIG[priority].color}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
              <Input 
                type="date" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)}
                className="h-7 w-fit text-xs border-0 bg-transparent text-muted-foreground"
              />
            </div>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-bold border-0 p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50"
              placeholder="Título de la tarea"
            />
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">SynchroCode Development</Badge>
          </div>
          <Select value={task.status} onValueChange={(v) => onStatusChange(task.id, v as TaskStatus)}>
            <SelectTrigger className={`w-[150px] ${STATUS_CONFIG[task.status]?.color || 'bg-muted'} border-0`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="en_proceso">En Proceso</SelectItem>
              <SelectItem value="terminado">Terminado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-[1fr_260px] gap-6 mt-4">
          {/* Left: description + evidence */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                Descripción
              </h3>
              <Textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-sm text-muted-foreground leading-relaxed min-h-[120px] resize-none border-0 p-0 focus-visible:ring-0"
                placeholder="Añadir una descripción detallada..."
              />
            </div>

            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                Evidencia adjunta
              </h3>
              {task.evidence.map((e, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className={`flex size-9 items-center justify-center rounded-lg ${e.name.match(/\.(png|jpg|jpeg)$/i) ? "bg-blue-500/15 text-blue-500" : "bg-rose-500/15 text-rose-500"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{e.name}</div>
                    <div className="text-xs text-muted-foreground">{e.size}</div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    onClick={() => handleDownload(e.id)}
                    disabled={!e.id || downloadingId === e.id}
                  >
                    {downloadingId === e.id ? (
                      <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    )}
                  </Button>
                </div>
              ))}
              <button onClick={() => onUploadEvidence(task.id)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                Subir evidencia
              </button>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            <div className="rounded-lg border p-4 space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase text-muted-foreground mb-2">Responsable</p>
                <Select value={assignee || "none"} onValueChange={handleAssigneeChange}>
                  <SelectTrigger className="h-9 w-full bg-transparent border-muted">
                    <SelectValue placeholder="Asignar a..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {projectMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Proyecto</p>
                <p className="mt-1 text-primary">SynchroCode Dev</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Creada por</p>
                <p className="mt-1 text-xs truncate" title={creatorName}>{creatorName}</p>
                <p className="text-[10px] text-muted-foreground">{formatDate(task.createdAt)}</p>
              </div>
            </div>

            {/* History */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Historial
              </h3>
              <div className="space-y-3 border-l-2 border-muted pl-4">
                {(task.history || []).map((h, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-muted-foreground/30 border-2 border-background" />
                    <p className="text-sm">{h.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(h.date)} por {userMap[h.sub] || h.sub || "Sistema"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between border-t pt-4 mt-2">
          {task.status === "pendiente" ? (
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDeleteTask(task)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              Eliminar tarea
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

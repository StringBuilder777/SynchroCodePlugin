import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { Task, TaskPriority } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Pick<Task, "title" | "description" | "priority" | "assignee" | "dueDate">) => void;
  task?: Task | null;
  projectMembers?: { id: string; name: string }[];
}

export function TaskFormDialog({ open, onClose, onSave, task, projectMembers = [] }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title); setDescription(task.description); setPriority(task.priority); setAssignee(task.assignee); setDueDate(task.dueDate);
    } else {
      setTitle(""); setDescription(""); setPriority(""); setAssignee(""); setDueDate("");
    }
    setError("");
  }, [task, open]);

  function handleSave() {
    if (!title.trim()) { setError("El título de la tarea es obligatorio."); return; }
    if (!priority) { setError("Selecciona una prioridad."); return; }
    onSave({ title: title.trim(), description: description.trim(), priority: priority as TaskPriority, assignee, dueDate });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{task ? "Editar Tarea" : "Crear Nueva Tarea"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
          <div className="space-y-2">
            <Label>Título</Label>
            <Input placeholder="Título de la tarea" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea placeholder="Describe la tarea..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar prioridad" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Responsable</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger><SelectValue placeholder="Asignar a..." /></SelectTrigger>
                <SelectContent>
                  {projectMembers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Fecha de entrega</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar Tarea</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

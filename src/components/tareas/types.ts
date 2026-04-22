export type TaskStatus = "pendiente" | "en_proceso" | "terminado";
export type TaskPriority = "alta" | "media" | "baja";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
  evidence: { 
    id: string;
    name: string; 
    size: string; 
    createdAt?: string; 
    userId?: string;
  }[];
  createdBy: string;
  createdAt: string;
  history?: {
    text: string;
    sub: string;
    date: string;
  }[];
}

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  alta: { label: "ALTA", color: "bg-rose-500/15 text-rose-500 border-rose-500/30" },
  media: { label: "MEDIA", color: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  baja: { label: "BAJA", color: "bg-muted text-muted-foreground border-muted-foreground/30" },
};

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  pendiente: { label: "Pendiente", color: "bg-muted text-muted-foreground" },
  en_proceso: { label: "En Proceso", color: "bg-primary text-primary-foreground" },
  terminado: { label: "Terminado", color: "bg-emerald-500 text-white" },
};

export const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "pendiente", label: "Pendiente" },
  { key: "en_proceso", label: "En Proceso" },
  { key: "terminado", label: "Terminado" },
];

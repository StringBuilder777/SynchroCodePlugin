export interface Project {
  id: string;
  name: string;
  description: string;
  status: "activo" | "en_revision" | "planificacion" | "archivado";
  startDate: string;
  endDate: string;
  totalTasks: number;
  completedTasks: number;
  members: { name: string; role: string }[];
  createdBy: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  activo: { label: "Activo", color: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  en_revision: { label: "En revisión", color: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  planificacion: { label: "Planificación", color: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30" },
  archivado: { label: "Archivado", color: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
};

export function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const COLORS = [
  "bg-blue-500/20 text-blue-500",
  "bg-purple-500/20 text-purple-500",
  "bg-amber-500/20 text-amber-500",
  "bg-emerald-500/20 text-emerald-500",
  "bg-rose-500/20 text-rose-500",
];

export function getAvatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

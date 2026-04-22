import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Project } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
  project: Project | null;
}

export function ArchiveProjectDialog({ open, onClose, onConfirm, project }: Props) {
  if (!project) return null;
  const pendingTasks = project.totalTasks - project.completedTasks;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[480px]">
        <div className="space-y-5">
          {/* Icon */}
          <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/15">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="m20 21-8-8-8 8V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/></svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold">¿Archivar este proyecto?</h2>
            <p className="text-sm text-muted-foreground">
              El proyecto dejará de aparecer en la lista de activos. Se generará un archivo ZIP con todos los datos del proyecto (tareas, equipo, evidencias y configuración) disponible para descarga. Podrás restaurarlo desde la pestaña Archivados en cualquier momento.
            </p>
          </div>

          {/* Project card */}
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{project.name}</div>
              <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
            </div>
            <Badge variant="outline" className="shrink-0 border-emerald-500/30 text-emerald-500">Activo</Badge>
          </div>

          {/* Warning */}
          {pendingTasks > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-amber-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <p className="text-sm text-amber-500">
                Las tareas pendientes ({pendingTasks}) quedarán registradas pero no podrán modificarse mientras el proyecto esté archivado.
              </p>
            </div>
          )}

          {/* ZIP info */}
          <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-primary"><path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3"/><path d="M4 12H2"/><path d="M10 12H8"/><path d="M16 12h-2"/><path d="M22 12h-2"/></svg>
            <p className="text-sm text-muted-foreground">
              Se generará: <strong>archivo_[id-proyecto]_[fecha].zip</strong> almacenado en Supabase Storage.
            </p>
          </div>

          <div className="space-y-2">
            <Button variant="destructive" className="w-full" onClick={() => { onConfirm(project.id); onClose(); }}>
              Archivar proyecto
            </Button>
            <Button variant="outline" className="w-full" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

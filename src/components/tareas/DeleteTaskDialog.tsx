import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import type { Task } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
  task: Task | null;
}

export function DeleteTaskDialog({ open, onClose, onConfirm, task }: Props) {
  if (!task) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[440px]">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/15">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold">¿Eliminar tarea?</h2>
            <p className="text-sm text-muted-foreground">
              Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar la tarea <strong>'{task.title}'</strong>?
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={() => { onConfirm(task.id); onClose(); }}>Eliminar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

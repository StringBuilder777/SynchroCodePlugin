import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import type { Role } from "./types";
import { isErrorStatus, normalizeUserError } from "@/lib/errors";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (roleId: string) => Promise<void>;
  role: Role | null;
}

export function DeleteRoleDialog({ open, onClose, onConfirm, role }: Props) {
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setConfirmation("");
    setError("");
    setIsSubmitting(false);
  }, [open]);

  if (!role) return null;

  const isConfirmed = confirmation === role.name;

  async function handleConfirm() {
    setError("");
    setIsSubmitting(true);
    try {
      await onConfirm(role!.id);
      onClose();
    } catch (err: unknown) {
      if (isErrorStatus(err, 409)) {
        setError(`Este rol está asignado a usuario(s) activo(s). Reasígnalos antes de eliminar.`);
      } else {
        setError(normalizeUserError(err, { fallback: "No se pudo eliminar el rol." }));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[460px]">
        <div className="space-y-5 text-center">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-destructive/15">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold">¿Eliminar este rol?</h2>
            <p className="text-sm text-muted-foreground">
              Estás a punto de eliminar el rol <strong>{role.name}</strong> del sistema. Esta acción no se puede deshacer.
            </p>
          </div>

          {/* Role card */}
          <div className="flex items-center justify-between rounded-lg border p-4 text-left">
            <div>
              <div className="font-medium">{role.name}</div>
              <div className="text-sm text-muted-foreground">{role.description}</div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-left">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-destructive"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Confirmation input */}
          <div className="space-y-2 text-left">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Escribe {role.name} para confirmar
            </label>
            <Input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={role.name}
              className={isConfirmed ? "border-emerald-500 focus-visible:ring-emerald-500/50" : ""}
            />
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="destructive"
              className="w-full"
              disabled={!isConfirmed || isSubmitting}
              onClick={handleConfirm}
            >
              {isSubmitting ? "Eliminando..." : "Eliminar rol"}
            </Button>
            <Button variant="outline" className="w-full" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import type { User } from "./types";
import { getInitials, getAvatarColor } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (userId: string) => Promise<void>;
  user: User | null;
}

export function DeactivateUserDialog({ open, onClose, onConfirm, user }: Props) {
  const [deleting, setDeleting] = useState(false);

  if (!user) return null;

  async function handleConfirm() {
    setDeleting(true);
    try {
      await onConfirm(user!.id);
      onClose();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[460px]">
        <div className="space-y-5 text-center">
          {/* Warning icon */}
          <div className="flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-destructive/15">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold">¿Eliminar usuario?</h2>
            <p className="text-sm text-muted-foreground">
              Esta acción eliminará al usuario de la organización. Se revocará su acceso inmediatamente y no podrá iniciar sesión.
            </p>
          </div>

          {/* User card */}
          <div className="flex items-center gap-3 rounded-lg border p-4 text-left">
            <div className={`flex size-10 items-center justify-center rounded-full text-sm font-medium ${getAvatarColor(user.name)}`}>
              {getInitials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground truncate">{user.email}</div>
            </div>
            <Badge variant="outline" className="uppercase text-xs">{user.role}</Badge>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleConfirm}
              disabled={deleting}
            >
              {deleting ? "Eliminando..." : "Eliminar usuario"}
            </Button>
            <Button variant="outline" className="w-full" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

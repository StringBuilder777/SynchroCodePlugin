import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import type { BackendRole } from "@/components/roles/types";
import { normalizeUserError } from "@/lib/errors";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  onInvite: (data: { email: string; name: string; role: string }) => Promise<void>;
  onUpdateUser: (userId: string, data: { name?: string; role?: string }) => Promise<void>;
  user?: User | null;
}

export function UserFormDialog({ open, onClose, onInvite, onUpdateUser, user }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEdit = !!user;

  useEffect(() => {
    async function fetchRoles() {
      try {
        const data = await api.get<BackendRole[]>("/roles");
        setRoles(data.map(r => r.name));
      } catch (err) {
        console.error("Error fetching roles:", err);
      }
    }
    fetchRoles();
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
    } else {
      setName("");
      setEmail("");
      setRole("");
    }
    setError("");
  }, [user, open]);

  async function handleSave() {
    if (!name.trim()) { setError("El nombre es obligatorio."); return; }
    if (!email.trim()) { setError("El correo es obligatorio."); return; }
    if (!role) { setError("Selecciona un rol."); return; }

    setSaving(true);
    try {
      if (isEdit) {
        await onUpdateUser(user.id, { 
          name: name.trim() !== user.name ? name.trim() : undefined,
          role: role !== user.role ? role : undefined 
        });
      } else {
        await onInvite({ email: email.trim(), name: name.trim(), role });
      }
      onClose();
    } catch (err: unknown) {
      setError(
        normalizeUserError(err, {
          fallback: isEdit ? "No se pudo actualizar el usuario." : "No se pudo enviar la invitación.",
          duplicateMessage: "Ya existe un usuario con ese correo electrónico.",
        }),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modificar Usuario" : "Invitar Usuario"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="user-name">Nombre completo</Label>
            <Input
              id="user-name"
              placeholder="María García"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-email">Correo electrónico</Label>
            <Input
              id="user-email"
              type="email"
              placeholder="maria@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isEdit}
              title={isEdit ? "El correo electrónico no se puede cambiar directamente." : ""}
            />
          </div>

          <div className="space-y-2">
            <Label>Rol asignado</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 rounded-lg bg-primary/10 p-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-primary"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            <p className="text-sm text-muted-foreground">
              {isEdit
                ? "Los cambios se aplicarán inmediatamente. El correo electrónico no se puede modificar por seguridad."
                : "El usuario recibirá un correo de invitación con un link para establecer su contraseña."}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Enviar invitación"}
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

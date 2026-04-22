import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MODULES,
  ACTIONS,
  createEmptyPermissions,
  type Role,
  type PermissionMatrix,
  type ModuleKey,
  type ActionKey,
} from "./types";
import { normalizeUserError } from "@/lib/errors";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (role: Omit<Role, "id">) => Promise<void>;
  role?: Role | null;
}

const moduleIcons: Record<string, React.ReactNode> = {
  folder: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>,
  check: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>,
  users: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
  shield: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>,
  chart: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>,
  code: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  message: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>,
  fileText: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>,
};

const actionLabels: Record<ActionKey, string> = {
  read: "Leer",
  create: "Crear",
  update: "Editar",
  delete: "Eliminar",
};

export function RoleFormDialog({ open, onClose, onSave, role }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<PermissionMatrix>(createEmptyPermissions());
  const [error, setError] = useState("");

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description);
      setPermissions(structuredClone(role.permissions));
    } else {
      setName("");
      setDescription("");
      setPermissions(createEmptyPermissions());
    }
    setError("");
  }, [role, open]);

  function togglePermission(mod: ModuleKey, action: ActionKey) {
    setPermissions((prev) => {
      const next = structuredClone(prev);
      next[mod][action] = !next[mod][action];
      return next;
    });
  }

  function toggleAll() {
    const allChecked = Object.values(permissions).every((actions) =>
      Object.values(actions).every(Boolean)
    );
    setPermissions(() => {
      const next = createEmptyPermissions();
      if (!allChecked) {
        for (const mod of MODULES) {
          for (const action of ACTIONS) {
            next[mod.key][action] = true;
          }
        }
      }
      return next;
    });
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("El nombre del rol es obligatorio.");
      return;
    }
    try {
      await onSave({ name: name.trim(), description: description.trim(), permissions });
      onClose();
    } catch (err: unknown) {
      setError(
        normalizeUserError(err, {
          fallback: "No se pudo guardar el rol.",
          duplicateMessage: "Ya existe un rol con ese nombre en su organización o es un rol reservado del sistema.",
        }),
      );
    }
  }

  const allChecked = Object.values(permissions).every((actions) =>
    Object.values(actions).every(Boolean)
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? "Editar Rol" : "Nuevo Rol"}</DialogTitle>
          <DialogDescription>
            {role ? "Modifica los permisos de acceso del rol." : "Crea un nuevo rol y define sus permisos de acceso."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role-name">Nombre del rol</Label>
            <Input
              id="role-name"
              placeholder="Ej: Tester, Líder Técnico"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-desc">Descripción</Label>
            <Textarea
              id="role-desc"
              placeholder="Describe las responsabilidades del rol..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Permissions matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Matriz de Permisos</Label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                Seleccionar todo
                <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
              </label>
            </div>

            <div className="rounded-lg border overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[1fr_repeat(4,70px)] gap-0 border-b bg-muted/50 px-4 py-2.5 text-xs font-medium text-muted-foreground">
                <span>Permiso</span>
                {ACTIONS.map((a) => (
                  <span key={a} className="text-center">{actionLabels[a]}</span>
                ))}
              </div>

              {/* Rows */}
              {MODULES.map((mod) => (
                <div
                  key={mod.key}
                  className="grid grid-cols-[1fr_repeat(4,70px)] gap-0 border-b last:border-b-0 px-4 py-3 items-center"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{moduleIcons[mod.icon]}</span>
                    {mod.label}
                  </div>
                  {ACTIONS.map((action) => (
                    <div key={action} className="flex justify-center">
                      <Checkbox
                        checked={permissions[mod.key][action]}
                        onCheckedChange={() => togglePermission(mod.key, action)}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

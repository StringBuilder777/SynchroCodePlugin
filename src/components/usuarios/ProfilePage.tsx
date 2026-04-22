import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usersService } from "@/lib/users";
import type { User } from "@/components/usuarios/types";
import { getInitials, getAvatarColor } from "@/components/usuarios/types";
import { normalizeUserError } from "@/lib/errors";

export function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifyTasks, setNotifyTasks] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(false);

  useEffect(() => {
    usersService
      .getMe()
      .then((u) => {
        setUser(u);
        setName(u.name);
      })
      .catch((e: unknown) => setError(normalizeUserError(e, { fallback: "No se pudo cargar el perfil." })))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await usersService.updateMe({ name });
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      setError(normalizeUserError(e, { fallback: "No se pudieron guardar los cambios." }));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando perfil...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-destructive">{error || "No se pudo cargar el perfil"}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const initials = getInitials(user.name);
  const avatarColor = getAvatarColor(user.name);

  const roleLabels: Record<string, string> = {
    admin: "Administrador",
    manager: "Project Manager",
    developer: "Desarrollador",
    viewer: "Visor",
  };

  return (
    <div className="flex min-h-screen flex-col items-center p-6 lg:p-8">
      <div className="w-full max-w-2xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">Perfil de Usuario</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona tu información personal y preferencias de la cuenta.
        </p>
      </div>

      {/* Profile card */}
      <div className="rounded-xl border overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-purple-500/20 via-primary/20 to-purple-500/20" />

        {/* Avatar */}
        <div className="flex flex-col items-center -mt-12">
          <div className="relative">
            <div className={`flex size-24 items-center justify-center rounded-full border-4 border-card text-2xl font-bold ${avatarColor}`}>
              {initials}
            </div>
          </div>
          <div className="mt-3 text-center">
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {/* Form */}
        <div className="px-8 py-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nombre visible</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                {user.email}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
                {roleLabels[user.role] || user.role}
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-4 pt-2">
            <h3 className="flex items-center gap-2 font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              Notificaciones
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Tareas asignadas</div>
                <div className="text-xs text-muted-foreground">Notificarme cuando me asignen una tarea nueva.</div>
              </div>
              <Switch checked={notifyTasks} onCheckedChange={setNotifyTasks} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Mensajes</div>
                <div className="text-xs text-muted-foreground">Notificarme por nuevos mensajes directos.</div>
              </div>
              <Switch checked={notifyMessages} onCheckedChange={setNotifyMessages} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t px-8 py-4">
          <Button variant="outline" onClick={() => setName(user.name)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || name === user.name}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg>
            {saving ? "Guardando..." : saved ? "Guardado" : "Guardar cambios"}
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserFormDialog } from "./UserFormDialog";
import { DeactivateUserDialog } from "./DeactivateUserDialog";
import type { User } from "./types";
import { getInitials, getAvatarColor } from "./types";
import { usersService } from "@/lib/users";
import { isErrorStatus, normalizeUserError } from "@/lib/errors";

const ROLES_FILTER = ["Administrador", "Gerente de Proyecto", "Desarrollador Senior", "Desarrollador Junior", "Programador", "Invitado / Cliente"];

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restrictedAccess, setRestrictedAccess] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivatingUser, setDeactivatingUser] = useState<User | null>(null);

  useEffect(() => {
    usersService.getAll()
      .then(setUsers)
      .catch((e: unknown) => {
        setRestrictedAccess(isErrorStatus(e, 403));
        setError(normalizeUserError(e, { fallback: "No se pudieron cargar los usuarios." }));
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  async function handleInvite(data: { email: string; name: string; role: string }) {
    await usersService.invite(data);
    // Refresh list
    const updated = await usersService.getAll();
    setUsers(updated);
  }

  async function handleUpdateUser(userId: string, data: { name?: string; role?: string }) {
    if (data.name) {
      await usersService.updateName(userId, data.name);
    }
    if (data.role) {
      await usersService.updateRole(userId, data.role);
    }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...data } : u)));
  }

  async function handleDelete(userId: string) {
    await usersService.delete(userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  function clearFilters() {
    setSearch("");
    setRoleFilter("all");
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Cargando usuarios...
      </div>
    );
  }

  if (error) {
    if (restrictedAccess) {
      return (
        <div className="flex min-h-[80vh] items-center justify-center p-6">
          <div className="flex max-w-md flex-col items-center text-center space-y-6">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
              <img src="/Logo_white.svg" alt="SynchroCode" className="size-10 hidden dark:block" />
              <img src="/Logo.svg" alt="SynchroCode" className="size-10 dark:hidden" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Acceso restringido</h2>
              <p className="text-sm text-muted-foreground">
                Solo los administradores pueden gestionar usuarios.
              </p>
            </div>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
              Volver al Dashboard
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 lg:p-8">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Error al cargar usuarios: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        Admin &gt; <span className="text-foreground font-medium">Usuarios</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Administra los permisos y accesos de los miembros del equipo.
          </p>
        </div>
        <Button onClick={() => { setEditingUser(null); setFormOpen(true); }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Invitar Usuario
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
        <div className="relative flex-1 min-w-[200px]">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <Input
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Filtrar por rol</SelectItem>
            {ROLES_FILTER.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button onClick={clearFilters} className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2">
          Limpiar filtros
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="grid grid-cols-[50px_1fr_1.5fr_120px_100px] gap-4 border-b bg-muted/50 px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>Avatar</span>
          <span>Nombre completo</span>
          <span>Correo electrónico</span>
          <span>Rol</span>
          <span className="text-right">Acciones</span>
        </div>

        {filtered.map((user) => (
          <div
            key={user.id}
            className="grid grid-cols-[50px_1fr_1.5fr_120px_100px] gap-4 border-b last:border-b-0 px-6 py-4 items-center"
          >
            <div className={`flex size-9 items-center justify-center rounded-full text-xs font-medium ${getAvatarColor(user.name)}`}>
              {getInitials(user.name)}
            </div>
            <span className="font-medium">{user.name}</span>
            <span className="text-sm text-muted-foreground truncate">{user.email}</span>
            <Badge variant="outline" className="text-xs w-fit">{user.role}</Badge>
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => { setEditingUser(user); setFormOpen(true); }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => { setDeactivatingUser(user); setDeactivateOpen(true); }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </Button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="px-6 py-12 text-center text-muted-foreground">
            No hay usuarios para mostrar.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Mostrando <strong className="text-foreground">{filtered.length}</strong> de <strong className="text-foreground">{users.length}</strong> usuarios
        </span>
      </div>

      {/* Dialogs */}
      <UserFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingUser(null); }}
        onInvite={handleInvite}
        onUpdateUser={handleUpdateUser}
        user={editingUser}
      />
      <DeactivateUserDialog
        open={deactivateOpen}
        onClose={() => { setDeactivateOpen(false); setDeactivatingUser(null); }}
        onConfirm={handleDelete}
        user={deactivatingUser}
      />
    </div>
  );
}

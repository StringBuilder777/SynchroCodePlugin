import { api } from "./api";
import { getSupabase } from "./supabase";
import type { User } from "@/components/usuarios/types";

export interface BackendUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  lastSignInAt: string | null;
}

function fromBackend(u: BackendUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    lastSignInAt: u.lastSignInAt,
  };
}

export const usersService = {
  getMe: async (): Promise<User> => {
    const { data } = await getSupabase().auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) throw new Error("No hay sesión activa");
    const backendUser = await api.get<BackendUser>(`/users/${userId}`);
    return fromBackend(backendUser);
  },

  updateMe: async (payload: { name: string }): Promise<User> => {
    const { data } = await getSupabase().auth.getSession();
    const userId = data.session?.user?.id;
    if (!userId) throw new Error("No hay sesión activa");
    await api.put(`/users/${userId}/name`, payload);
    const backendUser = await api.get<BackendUser>(`/users/${userId}`);
    return fromBackend(backendUser);
  },

  getAll: async (): Promise<User[]> => {
    const data = await api.get<BackendUser[]>("/users");
    return data.map(fromBackend);
  },

  getById: async (id: string): Promise<User> => {
    const data = await api.get<BackendUser>(`/users/${id}`);
    return fromBackend(data);
  },

  invite: async (payload: { email: string; name: string; role: string }): Promise<void> => {
    await api.post("/users/invite", {
      ...payload,
      redirectTo: `${window.location.origin}/activar-cuenta`,
    });
  },

  updateRole: async (id: string, role: string): Promise<void> => {
    await api.put(`/users/${id}/role`, { role });
  },

  updateName: async (id: string, name: string): Promise<void> => {
    await api.put(`/users/${id}/name`, { name });
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

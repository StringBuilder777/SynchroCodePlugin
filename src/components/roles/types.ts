export const MODULES = [
  { key: "projects_module", label: "Proyectos", icon: "folder" },
  { key: "tasks", label: "Tareas", icon: "check" },
  { key: "users_module", label: "Usuarios", icon: "users" },
  { key: "roles_module", label: "Roles", icon: "shield" },
  { key: "reports_module", label: "Reportes", icon: "chart" },
  { key: "github_module", label: "GitHub", icon: "code" },
  { key: "chat_module", label: "Chat", icon: "message" },
  { key: "invoices_module", label: "Facturas", icon: "fileText" },
] as const;

export const ACTIONS = ["read", "create", "update", "delete"] as const;

export type ModuleKey = (typeof MODULES)[number]["key"];
export type ActionKey = (typeof ACTIONS)[number];

// UI representation
export type PermissionMatrix = Record<ModuleKey, Record<ActionKey, boolean>>;

// Backend representation
export type BackendPermissions = Record<string, string[]>;

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: PermissionMatrix;
  organizationId?: string | null;
}

export interface BackendRole {
  id: string;
  name: string;
  description: string;
  permissions: BackendPermissions;
  organizationId?: string | null;
}

export function createEmptyPermissions(): PermissionMatrix {
  const matrix = {} as PermissionMatrix;
  for (const mod of MODULES) {
    matrix[mod.key] = { read: false, create: false, update: false, delete: false };
  }
  return matrix;
}

export function transformToBackend(permissions: PermissionMatrix): BackendPermissions {
  const result: BackendPermissions = {};
  for (const [module, actions] of Object.entries(permissions)) {
    const activeActions = (Object.entries(actions) as [ActionKey, boolean][])
      .filter(([_, value]) => value)
      .map(([key, _]) => key);
    
    if (activeActions.length > 0) {
      result[module] = activeActions;
    }
  }
  return result;
}

export function transformFromBackend(permissions: BackendPermissions): PermissionMatrix {
  const matrix = createEmptyPermissions();
  if (!permissions) return matrix;
  
  for (const [module, actions] of Object.entries(permissions)) {
    const modKey = module as ModuleKey;
    if (matrix[modKey]) {
      for (const action of actions) {
        const actKey = action as ActionKey;
        if (matrix[modKey][actKey] !== undefined) {
          matrix[modKey][actKey] = true;
        }
      }
    }
  }
  return matrix;
}

export function getPermissionSummary(permissions: PermissionMatrix): string[] {
  const tags: string[] = [];
  const allTrue = Object.values(permissions).every((actions) =>
    Object.values(actions).every(Boolean)
  );
  if (allTrue) return ["Acceso Total"];

  for (const mod of MODULES) {
    const actions = permissions[mod.key];
    if (actions.read && actions.create && actions.update && actions.delete) {
      tags.push(mod.label);
    } else if (actions.read) {
      tags.push("Leer");
    } else if (actions.create) {
      tags.push("Crear");
    } else if (actions.update) {
      tags.push("Editar");
    }
  }
  return [...new Set(tags)].slice(0, 3);
}

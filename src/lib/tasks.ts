import { api } from "./api";
import { getSupabase } from "./supabase";
import type { Task, TaskStatus, TaskPriority } from "@/components/tareas/types";

const BASE_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:8080";

const STATUS_MAP_TO_ID: Record<string, number> = {
  "pendiente": 1,
  "en_proceso": 2,
  "terminado": 3
};

const STATUS_ID_TO_KEY: Record<string, TaskStatus> = {
  "1": "pendiente",
  "2": "en_proceso",
  "3": "terminado"
};

const PRIORITY_MAP_TO_ID: Record<string, number> = {
  "alta": 1,
  "media": 2,
  "baja": 3
};

const PRIORITY_ID_TO_KEY: Record<string, TaskPriority> = {
  "1": "alta",
  "2": "media",
  "3": "baja"
};

function fromBackend(t: any): Task {
  if (!t) throw new Error("Datos de tarea no válidos (backend retornó vacío)");

  // Normalize status
  let status: TaskStatus = "pendiente";
  const rawStatusId = t.statusId || t.status_id;
  
  if (rawStatusId) {
    status = STATUS_ID_TO_KEY[String(rawStatusId)] || "pendiente";
  } else if (typeof t.status === "string") {
    const s = t.status.toLowerCase().replace(" ", "_");
    if (["pendiente", "en_proceso", "terminado"].includes(s)) {
      status = s as TaskStatus;
    }
  } else if (t.status && typeof t.status === "object") {
    const s = (t.status.name || t.status.key || "").toLowerCase().replace(" ", "_");
    if (["pendiente", "en_proceso", "terminado"].includes(s)) {
      status = s as TaskStatus;
    }
  }

  // Normalize priority
  let priority: TaskPriority = "baja";
  const rawPriorityId = t.priorityId || t.priority_id;
  
  if (rawPriorityId) {
    priority = PRIORITY_ID_TO_KEY[String(rawPriorityId)] || "baja";
  } else if (typeof t.priority === "string") {
    const p = t.priority.toLowerCase();
    if (["alta", "media", "baja"].includes(p)) {
      priority = p as TaskPriority;
    }
  } else if (t.priority && typeof t.priority === "object") {
    const p = (t.priority.name || t.priority.key || "").toLowerCase();
    if (["alta", "media", "baja"].includes(p)) {
      priority = p as TaskPriority;
    }
  }

  // Format evidence
  const evidence = (t.evidence || []).map((e: any) => ({
    id: e.id ? String(e.id) : "",
    name: e.fileName || e.name || "Archivo",
    size: e.fileSize || e.size || (e.fileSizeBytes ? (e.fileSizeBytes > 1048576 ? `${(e.fileSizeBytes / 1048576).toFixed(1)} MB` : `${(e.fileSizeBytes / 1024).toFixed(0)} KB`) : "0 KB"),
    createdAt: e.createdAt || t.createdAt,
    userId: e.userId || e.uploadedBy || t.createdBy
  }));

  // Build history
  const history = (t.history || []).map((h: any) => ({
    text: h.text || h.description || h.action || "Acción realizada",
    sub: h.userId || h.user_id || "Sistema",
    date: h.createdAt || h.date || new Date().toISOString()
  }));

  if (history.length === 0) {
    // Fallback if no history is provided but we have evidence
    evidence.forEach((e: any) => {
      history.push({
        text: `Se adjuntó ${e.name}`,
        sub: e.userId,
        date: e.createdAt
      });
    });
    history.push({
      text: "Tarea creada",
      sub: t.createdBy,
      date: t.createdAt
    });
  }

  history.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    id: t.id,
    title: t.title || "",
    description: t.description || "",
    status,
    priority,
    assignee: t.assignedTo || t.assigned_to || t.userId || t.assigneeId || t.user_id || t.assignee_id || t.userName || t.assigneeName || t.assignee || "",
    dueDate: t.dueDate || t.due_date || "",
    evidence,
    createdBy: t.createdBy || "Sistema",
    createdAt: t.createdAt || "",
    history
  };
}

export interface PluginTask extends Task {
  projectName: string;
}

export const tasksService = {
  getById: async (id: string): Promise<PluginTask> => {
    console.log(`[tasksService] Obteniendo detalle de tarea: ${id}`);
    const t = await api.get<any>(`/tasks/${id}`);
    const task = fromBackend(t);
    
    let projectName = t.projectName || t.project_name;
    if (!projectName && t.project && typeof t.project === "object") {
      projectName = t.project.name;
    }

    const projectId = t.projectId || t.project_id;
    
    if (!projectName && projectId) {
      try {
        const { projectsService } = await import("./projects");
        const project = await projectsService.getById(projectId);
        projectName = project.name;
      } catch (e) {
        console.warn(`No se pudo obtener el nombre del proyecto ${projectId}`, e);
      }
    }

    if (task.assignee && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(task.assignee)) {
      try {
        const { usersService } = await import("./users");
        const user = await usersService.getById(task.assignee);
        task.assignee = user.name || user.email;
      } catch (e) {
        console.warn(`No se pudo obtener el nombre del usuario ${task.assignee}`, e);
      }
    }

    return {
      ...task,
      projectName: projectName || "Sin proyecto"
    };
  },

  getAllForSidebar: async (): Promise<PluginTask[]> => {
    console.log("[tasksService] Obteniendo todas las tareas para el sidebar");
    const data = await api.get<any[]>("/tasks/all");
    
    let projectsMap: Record<string, string> = {};
    try {
      const { projectsService } = await import("./projects");
      const projects = await projectsService.getAll();
      projectsMap = projects.reduce((acc, p) => ({ ...acc, [p.id]: p.name }), {});
    } catch (e) {
      console.warn("No se pudieron cargar los proyectos para mapear nombres de tareas", e);
    }

    let usersMap: Record<string, string> = {};
    try {
      const { usersService } = await import("./users");
      const users = await usersService.getAll();
      usersMap = users.reduce((acc, u) => ({ ...acc, [u.id]: u.name }), {});
    } catch (e) {
      console.warn("No se pudieron cargar los usuarios para mapear nombres", e);
    }

    return (data || []).map(t => {
      const task = fromBackend(t);
      const pId = t.projectId || t.project_id;
      
      if (task.assignee && usersMap[task.assignee]) {
        task.assignee = usersMap[task.assignee];
      }

      return {
        ...task,
        projectName: t.projectName || t.project_name || projectsMap[pId] || (t.project && t.project.name) || "Sin proyecto"
      };
    });
  },

  getProjectTasks: async (projectId: string) => {
    const data = await api.get<any[]>(`/tasks/project/${projectId}`);
    return (data || []).map(fromBackend);
  },
  createTask: async (data: any) => {
    const { assignee, status, priority, projectId, title, description, dueDate } = data;
    
    const payload = {
      project_id: projectId,
      title: title?.trim(),
      description: description?.trim() || "",
      status_id: STATUS_MAP_TO_ID[status || "pendiente"] || 1,
      priority_id: PRIORITY_MAP_TO_ID[priority] || 3,
      assigned_to: assignee || null,
      due_date: dueDate || null
    };
    
    const res = await api.post<any>(`/tasks`, payload);
    return fromBackend(res);
  },
  updateTask: async (id: string, data: any) => {
    const { assignee, status, priority, title, description, dueDate } = data;
    const payload: any = {};
    
    if (title !== undefined) payload.title = title.trim();
    if (description !== undefined) payload.description = description?.trim() || "";
    if (dueDate !== undefined) payload.due_date = dueDate || null;
    if (assignee !== undefined) payload.assigned_to = assignee || null;
    if (status !== undefined) payload.status_id = STATUS_MAP_TO_ID[status];
    if (priority !== undefined) payload.priority_id = PRIORITY_MAP_TO_ID[priority];
    
    const res = await api.put<any>(`/tasks/${id}`, payload);
    return fromBackend(res);
  },
  updateStatus: async (id: string, statusKey: string) => {
    const statusId = STATUS_MAP_TO_ID[statusKey] || 1;
    const res = await api.patch<any>(`/tasks/${id}/status/${statusId}`);
    if (!res) return null;
    return fromBackend(res);
  },
  assignTask: async (id: string, userId: string) => {
    const res = await api.patch<any>(`/tasks/${id}/assign/${userId}`);
    return fromBackend(res);
  },
  uploadEvidence: async (id: string, files: File[]) => {
    const results = [];
    for (const file of files) {
      // 1. Subir a Supabase Storage
      const sanitizedName = file.name.replace(/[^\w.-]/g, "_");
      const filePath = `${id}/${Date.now()}_${sanitizedName}`;
      
      const { data: uploadData, error: uploadError } = await getSupabase().storage
        .from("task-evidence")
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Supabase Storage Error:", uploadError);
        throw new Error(`Error subiendo a Supabase: ${uploadError.message}`);
      }

      // 2. Notificar al backend
      const payload = {
        fileName: sanitizedName,
        fileUrl: uploadData.path,
        fileSizeBytes: file.size
      };
      
      console.log("Notificando evidencia al backend...", payload);
      const res = await api.post<any>(`/tasks/${id}/evidence`, payload);
      results.push({
        id: res.id ? String(res.id) : "",
        name: res.fileName || res.name || "Archivo",
        size: res.fileSize || res.size || (res.fileSizeBytes ? (res.fileSizeBytes > 1048576 ? `${(res.fileSizeBytes / 1048576).toFixed(1)} MB` : `${(res.fileSizeBytes / 1024).toFixed(0)} KB`) : "0 KB"),
        createdAt: res.uploadedAt || res.createdAt || new Date().toISOString(),
        userId: res.uploadedBy || res.userId || ""
      });
    }
    return results;
  },
  getEvidenceDownloadUrl: async (evidenceId: string) => {
    const res = await api.get<{ url: string }>(`/tasks/evidence/${evidenceId}/download`);
    return res.url;
  },
  deleteTask: (id: string) => api.delete<void>(`/tasks/${id}`),
};

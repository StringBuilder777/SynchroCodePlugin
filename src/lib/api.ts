import { getSupabase } from "./supabase";

const BASE_URL = (import.meta.env.PUBLIC_API_URL || "http://localhost:8080").replace(/\/$/, "");
const BRIDGE_TIMEOUT_MS = 20000;

interface BridgeResponse<T> {
  command: "apiResponse";
  requestId: string;
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

function getBridge() {
  if (typeof window === "undefined") return undefined;
  return (window as any).__vscode as { postMessage: (payload: unknown) => void } | undefined;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("No hay sesión activa. Inicia sesión para continuar.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function formatBackendError(method: string, url: string, status: number, error?: string): Error {
  return new Error(error || `${method} ${url} → ${status}`);
}

async function requestViaBridge<T>(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: unknown
): Promise<T> {
  const bridge = getBridge();
  if (!bridge) {
    throw new Error("Bridge de VS Code no disponible");
  }

  const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return new Promise<T>((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("message", onMessage);
    };

    const onMessage = (event: MessageEvent<BridgeResponse<T>>) => {
      const msg = event.data;
      if (!msg || msg.command !== "apiResponse" || msg.requestId !== requestId) return;

      cleanup();

      if (!msg.ok) {
        reject(formatBackendError(method, url, msg.status, msg.error));
        return;
      }

      resolve(msg.data as T);
    };

    window.addEventListener("message", onMessage);
    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout al conectar con el backend (${method} ${url})`));
    }, BRIDGE_TIMEOUT_MS);

    bridge.postMessage({
      command: "apiRequest",
      requestId,
      method,
      url,
      headers,
      body: typeof body === "string" ? body : (body !== undefined ? JSON.stringify(body) : undefined),
    });
  });
}

async function requestDirect<T>(method: string, url: string, headers: Record<string, string>, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers,
    body: typeof body === "string" ? body : (body !== undefined ? JSON.stringify(body) : undefined),
  });

  if (!res.ok) {
    let errorMsg = "";
    try {
      const json = await res.json();
      errorMsg = json.error || json.message || JSON.stringify(json);
    } catch {
      errorMsg = await res.text().catch(() => res.statusText);
    }
    throw formatBackendError(method, url, res.status, errorMsg);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/**
 * Proxy de fetch para ser usado por Supabase u otros clientes.
 * Redirige la petición a través del bridge de VS Code si está disponible.
 */
export async function fetchProxy(url: string | URL | Request, options?: RequestInit): Promise<Response> {
  const bridge = getBridge();
  const targetUrl = url instanceof Request ? url.url : url.toString();
  const method = options?.method || "GET";
  
  // Convertir headers a objeto plano
  const headers: Record<string, string> = {};
  if (options?.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((v, k) => { headers[k] = v; });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([k, v]) => { headers[k] = v; });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  if (bridge) {
    try {
      const data = await requestViaBridge<any>(method, targetUrl, headers, options?.body);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  return fetch(url, options);
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers = await getAuthHeaders();
  
  if (getBridge()) {
    return requestViaBridge<T>(method, url, headers, body);
  }
  return requestDirect<T>(method, url, headers, body);
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

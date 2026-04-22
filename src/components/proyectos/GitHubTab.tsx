import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── Mock data ──────────────────────────────────────────────────────────────────

const REPOS = [
  { id: "r1", name: "synchrocode-org/redesign-website", description: "Frontend principal del proyecto", updatedAt: "hace 2 horas", stars: 12 },
  { id: "r2", name: "synchrocode-org/redesign-api", description: "Backend REST API del proyecto", updatedAt: "hace 1 día", stars: 5 },
  { id: "r3", name: "synchrocode-org/legacy-client", description: "Repositorio legado (archivado)", updatedAt: "hace 2 meses", stars: 2 },
];

const COMMITS = [
  { taskId: "SC-041", hash: "a3f8c21", message: "feat: update navbar component", author: "James Reese", date: "Hoy, 10:42", merged: true },
  { taskId: "SC-038", hash: "b91d4f0", message: "fix: resolve mobile layout issue", author: "Elena Lopez", date: "Ayer, 16:30", merged: true },
  { taskId: "SC-035", hash: "c2e7a83", message: "chore: update dependencies", author: "Marcus Chen", date: "Ayer, 11:05", merged: true },
  { taskId: "SC-033", hash: "d40b12e", message: "feat: add dark mode toggle", author: "James Reese", date: "Hace 3 días", merged: false },
];

const PULL_REQUESTS = [
  { number: 12, title: "feat: redesign homepage hero section", author: "James Reese", status: "merged", date: "Hace 2 días", tasks: ["SC-041", "SC-038"] },
  { number: 11, title: "fix: mobile responsiveness improvements", author: "Elena Lopez", status: "open", date: "Hace 1 día", tasks: ["SC-035"] },
  { number: 10, title: "chore: ci/cd pipeline update", author: "Marcus Chen", status: "closed", date: "Hace 4 días", tasks: [] },
];

const WEBHOOK_EVENTS = [
  { event: "pull_request.merged", repo: "redesign-website", pr: "#12", status: 200, time: "Hoy, 10:45" },
  { event: "pull_request.opened", repo: "redesign-website", pr: "#11", status: 200, time: "Ayer, 14:22" },
  { event: "push", repo: "redesign-website", pr: "—", status: 200, time: "Ayer, 11:07" },
  { event: "pull_request.closed", repo: "redesign-website", pr: "#10", status: 200, time: "Hace 4 días" },
];

// ── PR status config ───────────────────────────────────────────────────────────

const PR_STATUS: Record<string, { label: string; cls: string }> = {
  merged: { label: "Merged", cls: "bg-violet-500/15 text-violet-500 border-violet-500/30" },
  open: { label: "Abierto", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  closed: { label: "Cerrado", cls: "bg-muted text-muted-foreground" },
};

// ── GitHubIcon ─────────────────────────────────────────────────────────────────

function GitHubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

// ── Unlinked state ─────────────────────────────────────────────────────────────

function UnlinkedState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="space-y-6">
      {/* Empty state */}
      <div className="rounded-lg border border-dashed p-10 flex flex-col items-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <GitHubIcon size={32} />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Repositorio no vinculado</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Conecta un repositorio de GitHub para hacer seguimiento de commits, pull requests y automatizar tareas.
          </p>
        </div>
        <Button onClick={onConnect}>
          <GitHubIcon size={16} />
          Conectar con GitHub
        </Button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center gap-2 font-medium text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
            Despliegue automático
          </div>
          <p className="text-xs text-muted-foreground">Los merges en la rama principal pueden activar notificaciones y completar tareas automáticamente.</p>
        </div>
        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex items-center gap-2 font-medium text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Seguridad
          </div>
          <p className="text-xs text-muted-foreground">SynchroCode solo solicita permisos de lectura de repositorios. Nunca almacena tus credenciales de GitHub.</p>
        </div>
      </div>
    </div>
  );
}

// ── Repo selector ──────────────────────────────────────────────────────────────

function RepoSelector({ onSelect, onCancel }: { onSelect: (id: string) => void; onCancel: () => void }) {
  const [search, setSearch] = useState("");
  const filtered = REPOS.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Selecciona un repositorio</h3>
        <p className="text-sm text-muted-foreground">Repositorios disponibles en tu cuenta de GitHub</p>
      </div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input
          type="text"
          placeholder="Buscar repositorio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border bg-background pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((repo) => (
          <button
            key={repo.id}
            onClick={() => onSelect(repo.id)}
            className="w-full flex items-center justify-between rounded-lg border p-4 text-left hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <GitHubIcon size={20} />
              <div>
                <div className="font-medium text-sm">{repo.name}</div>
                <div className="text-xs text-muted-foreground">{repo.description}</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">{repo.updatedAt}</div>
          </button>
        ))}
      </div>

      <Button variant="ghost" onClick={onCancel} className="w-full">Cancelar</Button>
    </div>
  );
}

// ── Linked: Activity ───────────────────────────────────────────────────────────

function LinkedActivity({ repoId, onDisconnect }: { repoId: string; onDisconnect: () => void }) {
  const repo = REPOS.find((r) => r.id === repoId)!;

  return (
    <div className="space-y-6">
      {/* Repo + stats cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Repositorio</span>
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500">CONECTADO</Badge>
          </div>
          <div className="flex items-center gap-2">
            <GitHubIcon size={18} />
            <code className="text-sm font-medium">{repo.name}</code>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M6 9v12"/></svg>
              main
            </span>
            <span>Webhook activo</span>
          </div>
          <button onClick={onDisconnect} className="text-xs text-destructive hover:underline">Desvincular repositorio</button>
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Actividad</span>
          <div className="grid grid-cols-3 gap-3">
            {[{ n: "14", l: "Commits" }, { n: "3", l: "PRs" }, { n: "8", l: "Vinculadas" }].map((s) => (
              <div key={s.l} className="rounded-lg border p-2 text-center">
                <div className="text-xl font-bold">{s.n}</div>
                <div className="text-[10px] text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            Último commit: <code className="rounded bg-secondary px-1.5 py-0.5">a3f8c21</code> feat: update navbar
          </div>
        </div>
      </div>

      {/* Commits table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h4 className="font-semibold">Commits vinculados a tareas</h4>
          <span className="text-xs text-muted-foreground">{COMMITS.length} commits</span>
        </div>
        <div className="grid grid-cols-[100px_1fr_120px_120px_80px] gap-4 px-5 py-3 border-b bg-muted/50 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>Tarea</span><span>Commit</span><span>Autor</span><span>Fecha</span><span className="text-right">Estado</span>
        </div>
        {COMMITS.map((c) => (
          <div key={c.hash} className="grid grid-cols-[100px_1fr_120px_120px_80px] gap-4 px-5 py-3.5 border-b last:border-0 items-center text-sm">
            <code className="text-xs font-medium text-primary bg-primary/10 rounded px-1.5 py-0.5 w-fit">{c.taskId}</code>
            <div>
              <div className="flex items-center gap-2">
                <code className="text-[11px] rounded bg-secondary px-1.5 py-0.5">{c.hash}</code>
                <span className="text-sm truncate">{c.message}</span>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">{c.author}</span>
            <span className="text-xs text-muted-foreground">{c.date}</span>
            <div className="flex justify-end">
              {c.merged ? (
                <Badge variant="outline" className="text-[10px] border-violet-500/30 text-violet-500">Merged</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">Pendiente</Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pull Requests */}
      <div className="rounded-lg border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h4 className="font-semibold">Pull Requests</h4>
          <span className="text-xs text-muted-foreground">{PULL_REQUESTS.length} pull requests</span>
        </div>
        <div className="grid grid-cols-[60px_1fr_120px_100px_80px] gap-4 px-5 py-3 border-b bg-muted/50 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>#</span><span>Título</span><span>Autor</span><span>Fecha</span><span className="text-right">Estado</span>
        </div>
        {PULL_REQUESTS.map((pr) => (
          <div key={pr.number} className="grid grid-cols-[60px_1fr_120px_100px_80px] gap-4 px-5 py-3.5 border-b last:border-0 items-center text-sm">
            <span className="font-mono text-muted-foreground">#{pr.number}</span>
            <div>
              <div className="font-medium text-sm">{pr.title}</div>
              {pr.tasks.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {pr.tasks.map((t) => (
                    <code key={t} className="text-[10px] rounded bg-primary/10 text-primary px-1 py-0.5">{t}</code>
                  ))}
                </div>
              )}
            </div>
            <span className="text-sm text-muted-foreground">{pr.author}</span>
            <span className="text-xs text-muted-foreground">{pr.date}</span>
            <div className="flex justify-end">
              <Badge variant="outline" className={`text-[10px] ${PR_STATUS[pr.status].cls}`}>
                {PR_STATUS[pr.status].label}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Linked: Webhooks ──────────────────────────────────────────────────────────

function WebhookConfig() {
  const [autoClose, setAutoClose] = useState(true);
  const [autoComment, setAutoComment] = useState(true);
  const [notifySlack, setNotifySlack] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "error" | null>(null);

  function handleTest() {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult("ok");
    }, 1500);
  }

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div>
            <div className="font-medium text-sm">Webhook activo</div>
            <div className="text-xs text-muted-foreground">Recibiendo eventos de GitHub en tiempo real</div>
          </div>
        </div>
        <Badge variant="outline" className="border-emerald-500/30 text-emerald-500">CONECTADO</Badge>
      </div>

      {/* Explainer */}
      <div className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
        <p>Cuando un PR se mergea con un mensaje como <code className="rounded bg-background px-1.5 py-0.5 text-xs">closes SC-041</code>, SynchroCode actualiza automáticamente el estado de la tarea vinculada.</p>
      </div>

      {/* Quick settings */}
      <div className="rounded-lg border p-5 space-y-4">
        <h4 className="font-semibold">Automatización rápida</h4>
        {[
          { label: "Cerrar tarea al mergear PR", desc: "Cierra automáticamente tareas referenciadas en el PR", value: autoClose, set: setAutoClose },
          { label: "Comentar en tarea vinculada", desc: "Agrega un comentario cuando se abre o mergea un PR relacionado", value: autoComment, set: setAutoComment },
          { label: "Notificar en Slack", desc: "Envía un mensaje al canal configurado cuando hay actividad de GitHub", value: notifySlack, set: setNotifySlack },
        ].map((s) => (
          <div key={s.label} className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.desc}</div>
            </div>
            <button
              onClick={() => s.set(!s.value)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${s.value ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform ${s.value ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>
        ))}
      </div>

      {/* URL & Secret */}
      <div className="rounded-lg border p-5 space-y-4">
        <h4 className="font-semibold">Configuración del webhook</h4>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payload URL</label>
            <div className="flex gap-2">
              <input
                readOnly
                value="https://synchrocode.app/api/webhooks/github"
                className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm font-mono text-muted-foreground"
              />
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText("https://synchrocode.app/api/webhooks/github")}>
                Copiar
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Webhook Secret</label>
            <div className="flex gap-2">
              <input
                readOnly
                value="••••••••••••••••••••••••••••••••"
                className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm font-mono text-muted-foreground"
              />
              <Button variant="outline" size="sm">Regenerar</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent events */}
      <div className="rounded-lg border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h4 className="font-semibold">Actividad reciente</h4>
          <span className="text-xs text-muted-foreground">{WEBHOOK_EVENTS.length} eventos</span>
        </div>
        <div className="grid grid-cols-[1fr_120px_80px_100px] gap-4 px-5 py-3 border-b bg-muted/50 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>Evento</span><span>PR</span><span>HTTP</span><span className="text-right">Fecha</span>
        </div>
        {WEBHOOK_EVENTS.map((ev, i) => (
          <div key={i} className="grid grid-cols-[1fr_120px_80px_100px] gap-4 px-5 py-3.5 border-b last:border-0 items-center text-sm">
            <code className="text-xs text-muted-foreground">{ev.event}</code>
            <span className="text-xs text-muted-foreground">{ev.pr}</span>
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500 w-fit">{ev.status} OK</Badge>
            <span className="text-xs text-muted-foreground text-right">{ev.time}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleTest} disabled={testing}>
          {testing ? "Probando..." : "Probar conexión"}
        </Button>
        <Button variant="outline">Configurar eventos</Button>
        {testResult === "ok" && <span className="self-center text-sm text-emerald-500">Conexión exitosa</span>}
        {testResult === "error" && <span className="self-center text-sm text-destructive">Error en la conexión</span>}
      </div>
    </div>
  );
}

// ── Main GitHubTab ─────────────────────────────────────────────────────────────

type ViewState = "unlinked" | "selecting" | "linked";
type SubTab = "actividad" | "webhooks";

export function GitHubTab() {
  const [view, setView] = useState<ViewState>("unlinked");
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<SubTab>("actividad");

  function handleConnect() {
    setView("selecting");
  }

  function handleSelectRepo(id: string) {
    setSelectedRepo(id);
    setView("linked");
  }

  function handleDisconnect() {
    setSelectedRepo(null);
    setView("unlinked");
    setSubTab("actividad");
  }

  if (view === "unlinked") {
    return <UnlinkedState onConnect={handleConnect} />;
  }

  if (view === "selecting") {
    return <RepoSelector onSelect={handleSelectRepo} onCancel={() => setView("unlinked")} />;
  }

  // Linked
  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex gap-5 border-b">
        {(["actividad", "webhooks"] as SubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 ${subTab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t === "actividad" ? "Actividad" : "Webhooks"}
          </button>
        ))}
      </div>

      {subTab === "actividad" && <LinkedActivity repoId={selectedRepo!} onDisconnect={handleDisconnect} />}
      {subTab === "webhooks" && <WebhookConfig />}
    </div>
  );
}

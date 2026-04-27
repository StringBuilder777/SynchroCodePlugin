import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Mapeo de pantalla → archivo en dist/plugin/
const SCREENS: Record<string, string> = {
  'login':          'plugin/login',
  'dashboard':      'plugin/dashboard',
  'tareas':         'plugin/tareas',
  'tarea-detalle':  'plugin/tarea-detalle',
  'colaboracion':   'plugin/colaboracion',
  'chat':           'plugin/chat',
  'notificaciones': 'plugin/notificaciones',
  'cambiar-estado': 'plugin/cambiar-estado',
  'perfil':         'plugin/perfil',
};

export function activate(context: vscode.ExtensionContext) {
  const provider = new SynchroCodeProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'synchrocode.sidebar',
      provider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // Comando para abrir una pantalla específica desde el exterior
  context.subscriptions.push(
    vscode.commands.registerCommand('synchrocode.openScreen', (screen: string) => {
      provider.navigateTo(screen);
    })
  );
}

export function deactivate() {}

// ────────────────────────────────────────────────────────────────────────────
class SynchroCodeProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _currentScreen = 'login';
  private _updateTimeout?: NodeJS.Timeout;
  private static readonly API_FETCH_TIMEOUT_MS = 15000;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _resolveContext: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'dist'),
      ],
    };

    webviewView.webview.html = this._loadScreen(webviewView.webview, this._currentScreen);

    // Sincronizar tema cuando VS Code cambia su tema de color
    vscode.window.onDidChangeActiveColorTheme(() => {
      if (this._view) {
        this._view.webview.postMessage({
          command: 'themeChanged',
          theme: this._getVSCodeTheme(),
        });
      }
    }, undefined, this.context.subscriptions);

    // Escuchar mensajes del webview
    webviewView.webview.onDidReceiveMessage(
      (msg) => this._handleMessage(webviewView.webview, msg),
      undefined,
      this.context.subscriptions
    );

    // --- NUEVO: Transmitir cambios del editor al webview ---
    
    // 1. Enviar contenido inicial cuando se abre el archivo o cambia de foco
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && this._view) {
        this._sendEditorUpdate(editor.document);
      }
    }, undefined, this.context.subscriptions);

    // 2. Enviar contenido cada vez que el usuario escribe
    vscode.workspace.onDidChangeTextDocument(event => {
      if (this._view && vscode.window.activeTextEditor?.document === event.document) {
        if (this._updateTimeout) clearTimeout(this._updateTimeout);
        this._updateTimeout = setTimeout(() => {
          this._sendEditorUpdate(event.document);
        }, 300);
      }
    }, undefined, this.context.subscriptions);

    // Enviar contenido actual de inmediato si hay un editor abierto
    if (vscode.window.activeTextEditor) {
      this._sendEditorUpdate(vscode.window.activeTextEditor.document);
    }
  }

  private _sendEditorUpdate(document: vscode.TextDocument) {
    if (!this._view) return;
    
    this._view.webview.postMessage({
      command: 'editorUpdate',
      content: document.getText(),
      fileName: path.basename(document.fileName),
      languageId: document.languageId
    });
  }

  private async _handleApplyEditorUpdate(fileName: string, content: string) {
    if (!fileName || typeof content !== 'string') return;

    // Find document by fileName in workspace.textDocuments
    const doc = vscode.workspace.textDocuments.find(d => path.basename(d.fileName) === fileName);
    if (!doc) return;

    try {
      if (doc.getText() === content) {
        return; // No changes
      }
      
      const fullRange = new vscode.Range(
        doc.positionAt(0),
        doc.positionAt(doc.getText().length)
      );

      // Use WorkspaceEdit so we don't accidentally destroy the active file if it's different
      const edit = new vscode.WorkspaceEdit();
      edit.replace(doc.uri, fullRange, content);
      await vscode.workspace.applyEdit(edit);
    } catch (err) {
      console.error('[SynchroCode] Error aplicando actualización al editor:', err);
    }
  }

  /** Navega a otra pantalla (llamable desde fuera) */
  navigateTo(screen: string) {
    this._currentScreen = screen;
    if (this._view) {
      this._view.webview.html = this._loadScreen(this._view.webview, screen);
    }
  }

  /** Devuelve 'dark' o 'light' según el tema activo de VS Code */
  private _getVSCodeTheme(): 'dark' | 'light' {
    const kind = vscode.window.activeColorTheme.kind;
    return (kind === vscode.ColorThemeKind.Light || kind === vscode.ColorThemeKind.HighContrastLight)
      ? 'light'
      : 'dark';
  }

  // ── Carga el HTML de la pantalla reescribiendo rutas de assets ──────────
  private _loadScreen(webview: vscode.Webview, screen: string): string {
    const screenPath = SCREENS[screen] ?? SCREENS['login'];
    const htmlFile = path.join(
      this.context.extensionPath, 'dist', screenPath, 'index.html'
    );

    if (!fs.existsSync(htmlFile)) {
      return this._errorPage(`Pantalla no encontrada: ${screen}\nRuta: ${htmlFile}`);
    }

    let html = fs.readFileSync(htmlFile, 'utf8');
    html = this._rewritePaths(html, webview);
    html = this._injectCSP(html, webview);
    html = this._injectTheme(html, this._getVSCodeTheme());
    return html;
  }

  /** Inyecta el tema de VS Code en el atributo class del tag <html> */
  private _injectTheme(html: string, theme: string): string {
    return html.replace(/(<html\b[^>]*\bclass=")[^"]*(")/i, `$1${theme}$2`);
  }

  // Inyecta CSP que permite assets locales + Google Fonts (para Material Symbols)
  private _injectCSP(html: string, webview: vscode.Webview): string {
    const csp = [
      `default-src 'none'`,
      `img-src ${webview.cspSource} data: https:`,
      `script-src ${webview.cspSource} 'unsafe-inline'`,
      `style-src ${webview.cspSource} 'unsafe-inline' https://fonts.googleapis.com`,
      `font-src https://fonts.gstatic.com`,
      `connect-src ${webview.cspSource} ws: wss: http: https:`,
    ].join('; ');
    return html.replace('<head>', `<head>\n  <meta http-equiv="Content-Security-Policy" content="${csp}">`);
  }

  // Reescribe /_astro/ → URI del webview para que los assets carguen
  private _rewritePaths(html: string, webview: vscode.Webview): string {
    const distUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist')
    );
    html = html.replace(/\/_astro\//g, `${distUri}/_astro/`);
    html = html.replace(/(src|href)="\//g, `$1="${distUri}/`);
    return html;
  }

  // ── Manejo de mensajes del webview ───────────────────────────────────────
  private _handleMessage(webview: vscode.Webview, msg: any) {
    switch (msg.command) {
      case 'navigate':
        this.navigateTo(msg.screen);
        break;

      case 'login':
        this._handleLogin(webview, msg.email, msg.password);
        break;

      case 'loginGithub':
        this._handleGithubLogin(webview);
        break;

      case 'openExternal':
        this._handleOpenExternal(msg.url);
        break;

      case 'apiRequest':
        this._handleApiRequest(webview, msg);
        break;

      case 'themeToggled':
        // El usuario cambió el tema manualmente desde el webview; no se requiere acción adicional.
        break;

      case 'notifyChat':
        vscode.window.showInformationMessage(msg.text);
        break;

      case 'applyEditorUpdate':
        this._handleApplyEditorUpdate(msg.fileName, msg.content);
        break;

      default:
        console.log('[SynchroCode] Mensaje no manejado:', msg);
    }
  }

  private async _handleLogin(webview: vscode.Webview, email: string, password: string) {
    try {
      // TODO: Llamar al backend de Supabase/Quarkus
      vscode.window.showInformationMessage(`Bienvenido, ${email}`);
      this.navigateTo('dashboard');
    } catch (err: any) {
      webview.postMessage({ command: 'loginError', message: err.message ?? 'Error al iniciar sesión' });
    }
  }

  private _handleGithubLogin(_webview: vscode.Webview) {
    // TODO: OAuth con Supabase via URL externa
    vscode.env.openExternal(vscode.Uri.parse('https://synchrocode.app/auth/github'));
  }

  private _handleOpenExternal(url: string) {
    try {
      const uri = vscode.Uri.parse(url);
      if (uri.scheme !== 'http' && uri.scheme !== 'https') {
        throw new Error('URL inválida');
      }
      vscode.env.openExternal(uri);
    } catch {
      vscode.window.showErrorMessage('No se pudo abrir la URL externa.');
    }
  }

  private async _handleApiRequest(webview: vscode.Webview, msg: any) {
    const requestId = msg?.requestId;
    const method = String(msg?.method || 'GET').toUpperCase();
    const url = msg?.url;
    const headers = msg?.headers && typeof msg.headers === 'object' ? msg.headers : {};
    let body = msg?.body;

    // Si el body es un string (JSON stringified desde el bridge), lo enviamos tal cual o lo parseamos si es necesario.
    // fetch acepta strings para el body.

    const respond = (payload: { ok: boolean; status: number; data?: unknown; error?: string }) => {
      webview.postMessage({
        command: 'apiResponse',
        requestId,
        ...payload,
      });
    };

    if (!requestId || typeof requestId !== 'string') {
      return;
    }

    if (typeof url !== 'string') {
      respond({ ok: false, status: 400, error: 'URL inválida para request.' });
      return;
    }

    try {
      const parsed = vscode.Uri.parse(url);
      if (parsed.scheme !== 'http' && parsed.scheme !== 'https') {
        respond({ ok: false, status: 400, error: 'Solo se permiten URLs http/https.' });
        return;
      }
    } catch {
      respond({ ok: false, status: 400, error: 'No se pudo parsear la URL.' });
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SynchroCodeProvider.API_FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, { method, headers, body, signal: controller.signal });
      const contentType = response.headers.get('content-type') || '';
      let payload: unknown;

      if (contentType.includes('application/json')) {
        payload = await response.json().catch(async () => await response.text());
      } else {
        payload = await response.text();
      }

      if (!response.ok) {
        let error = response.statusText || `HTTP ${response.status}`;
        if (typeof payload === 'string' && payload.trim()) {
          error = payload;
        } else if (payload && typeof payload === 'object') {
          const jsonError = (payload as any).error || (payload as any).message;
          if (jsonError) error = String(jsonError);
        }
        respond({ ok: false, status: response.status, error, data: payload });
        return;
      }

      respond({ ok: true, status: response.status, data: payload });
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        respond({
          ok: false,
          status: 504,
          error: `Timeout al conectar con el backend (${method} ${url})`,
        });
        return;
      }
      respond({
        ok: false,
        status: 500,
        error: error?.message || 'No se pudo completar la petición.',
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private _errorPage(message: string): string {
    return `<!doctype html><html><body style="background:#09090b;color:#ef4444;font-family:monospace;padding:1rem;">
      <p>Error cargando pantalla:</p><pre>${message}</pre>
      <p style="color:#a1a1aa;font-size:12px">¿Ejecutaste <code style="color:#fff">npm run build:webview</code>?</p>
    </body></html>`;
  }
}

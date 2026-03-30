import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Mapeo de pantalla → archivo en dist/plugin/
const SCREENS: Record<string, string> = {
  'login':             'plugin/login',
  'tareas':            'plugin/tareas',
  'tarea-detalle':     'plugin/tarea-detalle',
  'colaboracion':      'plugin/colaboracion',
  'chat':              'plugin/chat',
  'notificaciones':    'plugin/notificaciones',
  'cambiar-estado':    'plugin/cambiar-estado',
  // pantallas light
  'login-light':          'plugin/login-light',
  'tareas-light':         'plugin/tareas-light',
  'tarea-detalle-light':  'plugin/tarea-detalle-light',
  'colaboracion-light':   'plugin/colaboracion-light',
  'cambiar-estado-light': 'plugin/cambiar-estado-light',
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

  constructor(private readonly context: vscode.ExtensionContext) {}

  // Llamado por VS Code cuando el panel se hace visible
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

    // Escuchar mensajes del webview
    webviewView.webview.onDidReceiveMessage(
      (msg) => this._handleMessage(webviewView.webview, msg),
      undefined,
      this.context.subscriptions
    );
  }

  /** Navega a otra pantalla (llamable desde fuera) */
  navigateTo(screen: string) {
    this._currentScreen = screen;
    if (this._view) {
      this._view.webview.html = this._loadScreen(this._view.webview, screen);
    }
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
    return html;
  }

  // Inyecta CSP que permite assets locales + Google Fonts (para Material Symbols)
  private _injectCSP(html: string, webview: vscode.Webview): string {
    const csp = [
      `default-src 'none'`,
      `img-src ${webview.cspSource} data: https:`,
      `script-src ${webview.cspSource} 'unsafe-inline'`,
      `style-src ${webview.cspSource} 'unsafe-inline' https://fonts.googleapis.com`,
      `font-src https://fonts.gstatic.com`,
    ].join('; ');
    return html.replace('<head>', `<head>\n  <meta http-equiv="Content-Security-Policy" content="${csp}">`);
  }

  // Reescribe /_astro/ → URI del webview para que los assets carguen
  private _rewritePaths(html: string, webview: vscode.Webview): string {
    const distUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'dist')
    );
    // Assets bundleados por Astro (CSS/JS)
    html = html.replace(/\/_astro\//g, `${distUri}/_astro/`);
    // Cualquier otro recurso con ruta absoluta
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

      default:
        console.log('[SynchroCode] Mensaje no manejado:', msg);
    }
  }

  private async _handleLogin(webview: vscode.Webview, email: string, password: string) {
    try {
      // TODO: Llamar al backend de Supabase/Quarkus
      // Por ahora simula login exitoso
      vscode.window.showInformationMessage(`Bienvenido, ${email}`);
      this.navigateTo('tareas');
    } catch (err: any) {
      webview.postMessage({ command: 'loginError', message: err.message ?? 'Error al iniciar sesión' });
    }
  }

  private _handleGithubLogin(_webview: vscode.Webview) {
    // TODO: OAuth con Supabase via URL externa
    vscode.env.openExternal(vscode.Uri.parse('https://synchrocode.app/auth/github'));
  }

  private _errorPage(message: string): string {
    return `<!doctype html><html><body style="background:#09090b;color:#ef4444;font-family:monospace;padding:1rem;">
      <p>Error cargando pantalla:</p><pre>${message}</pre>
      <p style="color:#a1a1aa;font-size:12px">¿Ejecutaste <code style="color:#fff">npm run build:webview</code>?</p>
    </body></html>`;
  }
}

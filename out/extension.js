"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
// Mapeo de pantalla → archivo en dist/plugin/
const SCREENS = {
    'login': 'plugin/login',
    'tareas': 'plugin/tareas',
    'tarea-detalle': 'plugin/tarea-detalle',
    'colaboracion': 'plugin/colaboracion',
    'chat': 'plugin/chat',
    'notificaciones': 'plugin/notificaciones',
    'cambiar-estado': 'plugin/cambiar-estado',
    // pantallas light
    'login-light': 'plugin/login-light',
    'tareas-light': 'plugin/tareas-light',
    'tarea-detalle-light': 'plugin/tarea-detalle-light',
    'colaboracion-light': 'plugin/colaboracion-light',
    'cambiar-estado-light': 'plugin/cambiar-estado-light',
};
function activate(context) {
    const provider = new SynchroCodeProvider(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('synchrocode.sidebar', provider, { webviewOptions: { retainContextWhenHidden: true } }));
    // Comando para abrir una pantalla específica desde el exterior
    context.subscriptions.push(vscode.commands.registerCommand('synchrocode.openScreen', (screen) => {
        provider.navigateTo(screen);
    }));
}
function deactivate() { }
// ────────────────────────────────────────────────────────────────────────────
class SynchroCodeProvider {
    constructor(context) {
        this.context = context;
        this._currentScreen = 'login';
    }
    // Llamado por VS Code cuando el panel se hace visible
    resolveWebviewView(webviewView, _resolveContext, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.context.extensionUri, 'dist'),
            ],
        };
        webviewView.webview.html = this._loadScreen(webviewView.webview, this._currentScreen);
        // Escuchar mensajes del webview
        webviewView.webview.onDidReceiveMessage((msg) => this._handleMessage(webviewView.webview, msg), undefined, this.context.subscriptions);
    }
    /** Navega a otra pantalla (llamable desde fuera) */
    navigateTo(screen) {
        this._currentScreen = screen;
        if (this._view) {
            this._view.webview.html = this._loadScreen(this._view.webview, screen);
        }
    }
    // ── Carga el HTML de la pantalla reescribiendo rutas de assets ──────────
    _loadScreen(webview, screen) {
        const screenPath = SCREENS[screen] ?? SCREENS['login'];
        const htmlFile = path.join(this.context.extensionPath, 'dist', screenPath, 'index.html');
        if (!fs.existsSync(htmlFile)) {
            return this._errorPage(`Pantalla no encontrada: ${screen}\nRuta: ${htmlFile}`);
        }
        let html = fs.readFileSync(htmlFile, 'utf8');
        html = this._rewritePaths(html, webview);
        html = this._injectCSP(html, webview);
        return html;
    }
    // Inyecta CSP que permite assets locales + Google Fonts (para Material Symbols)
    _injectCSP(html, webview) {
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
    _rewritePaths(html, webview) {
        const distUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'dist'));
        // Assets bundleados por Astro (CSS/JS)
        html = html.replace(/\/_astro\//g, `${distUri}/_astro/`);
        // Cualquier otro recurso con ruta absoluta
        html = html.replace(/(src|href)="\//g, `$1="${distUri}/`);
        return html;
    }
    // ── Manejo de mensajes del webview ───────────────────────────────────────
    _handleMessage(webview, msg) {
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
    async _handleLogin(webview, email, password) {
        try {
            // TODO: Llamar al backend de Supabase/Quarkus
            // Por ahora simula login exitoso
            vscode.window.showInformationMessage(`Bienvenido, ${email}`);
            this.navigateTo('tareas');
        }
        catch (err) {
            webview.postMessage({ command: 'loginError', message: err.message ?? 'Error al iniciar sesión' });
        }
    }
    _handleGithubLogin(_webview) {
        // TODO: OAuth con Supabase via URL externa
        vscode.env.openExternal(vscode.Uri.parse('https://synchrocode.app/auth/github'));
    }
    _errorPage(message) {
        return `<!doctype html><html><body style="background:#09090b;color:#ef4444;font-family:monospace;padding:1rem;">
      <p>Error cargando pantalla:</p><pre>${message}</pre>
      <p style="color:#a1a1aa;font-size:12px">¿Ejecutaste <code style="color:#fff">npm run build:webview</code>?</p>
    </body></html>`;
    }
}
//# sourceMappingURL=extension.js.map
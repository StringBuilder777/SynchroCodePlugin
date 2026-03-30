# SynchroCode — VS Code Extension

Plugin de VS Code para sincronizar tareas y colaboración de equipo en tiempo real.

## Stack

- **Extension host**: TypeScript + VS Code Extension API (`WebviewViewProvider`)
- **Webview UI**: Astro 5 + React 19 + Tailwind CSS v4
- **Componentes**: shadcn/ui + Radix UI + Lucide React
- **Build**: Astro build → `dist/`, TypeScript compiler → `out/`

## Estructura del proyecto

```
SynchroCodePlugin/
├── extension/
│   ├── src/
│   │   └── extension.ts        # Entry point del plugin, WebviewViewProvider, navegación
│   └── tsconfig.json
├── src/
│   ├── layouts/
│   │   ├── PluginLayout.astro  # Layout para producción (webview real)
│   │   └── WebviewLayout.astro # Layout para preview en browser (con frame VS Code)
│   ├── pages/
│   │   ├── plugin/             # Pantallas de producción (cargadas por el plugin)
│   │   │   ├── login.astro
│   │   │   ├── tareas.astro
│   │   │   ├── tarea-detalle.astro
│   │   │   ├── colaboracion.astro
│   │   │   ├── chat.astro
│   │   │   ├── notificaciones.astro
│   │   │   └── cambiar-estado.astro
│   │   └── *.astro             # Preview con frame VS Code (solo desarrollo)
│   ├── components/             # Componentes React/Astro reutilizables
│   └── styles/
│       └── global.css          # Tailwind CSS v4
├── public/
│   ├── Logo.svg                # Logo <S> negro (tema claro)
│   ├── Logo_white.svg          # Logo <S> blanco (tema oscuro)
│   ├── LogoFull.svg            # Logo completo con texto
│   └── Logo_white.png / Logo.png
├── media/
│   └── icon.svg                # Icono del plugin en la Activity Bar de VS Code
├── dist/                       # Build de Astro (webview HTML/CSS/JS)
├── out/                        # Build de TypeScript (extension.js)
├── astro.config.mjs
├── package.json
└── .vscode/
    ├── launch.json             # F5 → extensionHost
    └── tasks.json              # build-extension (tsc)
```

## Comandos

| Comando | Acción |
|---|---|
| `npm install` | Instala dependencias |
| `npm run dev` | Preview en browser en `localhost:4321` |
| `npm run build:webview` | Compila Astro → `dist/` |
| `npm run build:extension` | Compila TypeScript → `out/` |
| `npm run build` | Build completo (webview + extension) |
| `npm run package` | Genera el `.vsix` para distribución |

## Desarrollo

### Probar el plugin en VS Code

1. Instala dependencias: `npm install`
2. Compila: `npm run build`
3. Abre el proyecto en VS Code
4. Presiona **F5** — abre un Extension Development Host con el plugin activo
5. En el nuevo VS Code, busca el icono de SynchroCode en la Activity Bar (barra lateral izquierda)

> El comando F5 ejecuta automáticamente `npm run build:extension` antes de lanzar.
> Si cambias pantallas (Astro), necesitas ejecutar `npm run build:webview` manualmente y recargar el Extension Development Host.

### Preview en browser (solo UI)

```sh
npm run dev
```

Abre `http://localhost:4321` — muestra todas las pantallas con un frame de VS Code simulado para diseño/iteración rápida.

## Pantallas implementadas

| Pantalla | Ruta plugin | Descripción |
|---|---|---|
| Login | `/plugin/login` | Inicio de sesión con email/contraseña y GitHub OAuth |
| Tareas | `/plugin/tareas` | Lista de tareas del equipo |
| Detalle de tarea | `/plugin/tarea-detalle` | Vista completa de una tarea |
| Colaboración | `/plugin/colaboracion` | Presencia en tiempo real del equipo |
| Chat | `/plugin/chat` | Chat del equipo |
| Notificaciones | `/plugin/notificaciones` | Centro de notificaciones |
| Cambiar estado | `/plugin/cambiar-estado` | Modal para cambiar estado de una tarea |

## Arquitectura de navegación

El webview no puede navegar con `window.location` entre pantallas del plugin (rutas locales del sistema de archivos). La navegación funciona así:

```
UI → window.__navigate('tareas')
   → vscode.postMessage({ command: 'navigate', screen: 'tareas' })
   → extension.ts lee dist/plugin/tareas/index.html
   → webview.html = HTML reescrito con URIs del webview
```

## Notas técnicas

- **Sin `"type": "module"`** en `package.json` — el output de TypeScript es CommonJS, requerido por VS Code.
- **Path rewriting** — `extension.ts` reemplaza `/_astro/` y `src="/"` con las URIs del webview después de leer el HTML del `dist/`.
- **CSP** — `extension.ts` inyecta el header `Content-Security-Policy` permitiendo assets locales y Google Fonts (para iconos Material Symbols).
- **Icono Activity Bar** — `media/icon.svg` usa el path del logo SynchroCode en blanco; VS Code lo usa como máscara y aplica el color del tema automáticamente.

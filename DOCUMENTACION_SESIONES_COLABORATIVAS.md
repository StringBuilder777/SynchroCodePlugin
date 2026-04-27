# 🛰️ Documentación de Sesiones Colaborativas — SynchroCode

Este documento resume el estado actual, las mejoras implementadas y la hoja de ruta técnica para el sistema de colaboración en tiempo real entre el Plugin de VS Code y el Backend (Quarkus).

---

## 🛠️ Estado Actual (Mejoras Implementadas)

Hemos transformado un prototipo básico en un sistema robusto capaz de manejar archivos reales sin destruir datos.

### 1. Sincronización Multi-Archivo (Path-Aware)
- **Antes**: Solo se sincronizaba "un bloque de texto" que sobrescribía cualquier pestaña activa.
- **Ahora**: El backend utiliza un `Map<String, StringBuilder> files`. Cada cambio viaja con su `fileName`.
- **Plugin**: La extensión usa `vscode.workspace.textDocuments.find` y `WorkspaceEdit` para aplicar cambios específicamente al archivo correcto en segundo plano, sin importar qué pestaña tenga abierta el usuario.

### 2. Estabilidad de Red y WebSockets
- **Límites de Tamaño**: Se aumentó el límite de mensajes de 65KB a **10MB** tanto en `application.properties` como en la anotación `@OnMessage` de Java.
- **Debounce de Escritura**: El plugin ahora espera **300ms** de inactividad antes de enviar el archivo completo, evitando saturar el servidor con miles de mensajes por minuto.
- **Comparación de Contenido**: React solo envía actualizaciones si el contenido del editor es realmente diferente al que ya tiene el servidor.

### 3. Arquitectura de Hilos (Threading)
- **ManagedExecutor**: Se movió toda la lógica de los WebSockets de los hilos de I/O a hilos **Worker**. Esto permite ejecutar transacciones de Hibernate y envíos síncronos (`getBasicRemote`) sin bloquear el servidor ni causar excepciones de JTA.
- **Registro de Usuarios**: Se implementó un mapa estático `SOCKET_TO_USER` para evitar la pérdida de IDs de usuario por "amnesia" de las propiedades del socket.

### 4. Resiliencia de Sesiones (Immortality Mode)
- **Auto-Join**: Si un usuario envía un mensaje pero su registro de "participante" expiró, el servidor lo re-registra automáticamente.
- **Auto-Resurrección**: Si se intenta acceder a una sesión existente que fue marcada como inactiva (`statusActive = false`), el servidor la reactiva al instante.
- **Persistencia**: Se desactivó el cierre automático por inactividad para facilitar las pruebas de desarrollo.

---

## 📡 Protocolo WebSocket Actual (JSON)

### Enviar Actualización (Plugin → Server)
```json
{
  "type": "UPDATE",
  "fileName": "main.java",
  "content": "public class Hello { ... }"
}
```

### Recibir Estado (Server → Todos)
```json
{
  "type": "STATE",
  "lockOwner": "uuid-del-usuario",
  "files": {
    "main.java": "contenido...",
    "styles.css": "contenido..."
  }
}
```

---

## 🚀 Hoja de Ruta: El "Editor en el Sidebar" (Próximos Pasos)

El objetivo es convertir el recuadro de previsualización actual en una **Estación de Trabajo Editable**.

### 1. Integración de Monaco Editor / CodeMirror
- Sustituir el elemento `<pre><code>` en `CollaborativeChat.tsx` por una instancia de un editor web.
- El editor será `readOnly: true` por defecto.

### 2. Flujo de Edición "Invitado → Host"
- Cuando el Invitado pulse **"TOMAR CONTROL"**, el editor de su sidebar pasará a `readOnly: false`.
- Cada cambio en el editor del sidebar disparará un `updateContent`.
- El VS Code del Host recibirá el cambio y **escribirá físicamente en el disco del Host**, permitiendo que el Invitado programe sin tener los archivos descargados.

### 3. Optimización por Deltas (Diffs)
- En lugar de enviar el archivo de 10MB entero cada vez, enviar solo el "Delta":
  *Ejemplo: "En la línea 10, insertar 'X'"*.
- Esto eliminará el lag por completo y permitirá ediciones masivas de archivos gigantes.

### 4. Indicadores de Presencia
- Mostrar cursores de colores en el editor de VS Code para ver dónde está posicionado el otro usuario en tiempo real (estilo Google Docs).

---

## ⚠️ Notas Técnicas para el Futuro
- **Database**: Las tablas involucradas son `collaborative_session` y `session_participant`.
- **Clave del éxito**: Mantener la sincronización de hilos (`synchronized(socket)`) en el backend para evitar colisiones de mensajes.
- **UI**: El componente `ErrorBoundary` es vital para detectar fallos de React antes de que dejen la pantalla en negro.

interface NormalizeErrorOptions {
  fallback: string;
  duplicateMessage?: string;
  conflictMessage?: string;
  forbiddenMessage?: string;
  unauthorizedMessage?: string;
  notFoundMessage?: string;
  networkMessage?: string;
  invalidDataMessage?: string;
}

function getRawErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.trim();
  if (typeof error === "string") return error.trim();
  return "";
}

function includesStatus(message: string, status: number): boolean {
  const pattern = new RegExp(`(?:^|\\D)${status}(?:\\D|$)`);
  return pattern.test(message);
}

export function isErrorStatus(error: unknown, status: number): boolean {
  const message = getRawErrorMessage(error).toLowerCase();
  return includesStatus(message, status);
}

export function normalizeUserError(error: unknown, options: NormalizeErrorOptions): string {
  const raw = getRawErrorMessage(error);
  const message = raw.toLowerCase();

  if (!raw) return options.fallback;

  const defaultUnauthorized = "Tu sesión expiró. Inicia sesión nuevamente.";
  const defaultForbidden = "No tienes permisos para realizar esta acción.";
  const defaultNotFound = "No se encontró la información solicitada.";
  const defaultNetwork = "No se pudo conectar con el servidor.";

  if (message.includes("unauthorized") || includesStatus(message, 401)) {
    return options.unauthorizedMessage ?? defaultUnauthorized;
  }

  if (message.includes("forbidden") || includesStatus(message, 403)) {
    return options.forbiddenMessage ?? defaultForbidden;
  }

  if (message.includes("not found") || includesStatus(message, 404)) {
    return options.notFoundMessage ?? defaultNotFound;
  }

  if (
    message.includes("duplicate")
    || message.includes("already exists")
    || message.includes("ya existe")
    || message.includes("unique")
  ) {
    return options.duplicateMessage ?? options.conflictMessage ?? options.fallback;
  }

  if (message.includes("conflict") || includesStatus(message, 409)) {
    return options.conflictMessage ?? options.fallback;
  }

  if (
    message.includes("failed to fetch")
    || message.includes("network")
    || message.includes("networkerror")
    || message.includes("connection")
  ) {
    return options.networkMessage ?? defaultNetwork;
  }

  if (
    message.includes("arcundeclaredthrowableexception")
    || message.includes("globalexceptionmapper")
    || message.includes("bad request")
    || includesStatus(message, 400)
    || includesStatus(message, 422)
  ) {
    return options.invalidDataMessage ?? options.fallback;
  }

  const trimmed = raw.trim();
  const looksJson = (trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"));
  const looksTechnical = message.includes("exception") || message.includes("java.") || message.includes("org.") || message.includes("stacktrace");

  if (looksJson || looksTechnical) {
    return options.fallback;
  }

  return raw;
}

export function normalizeAuthError(error: unknown, fallback: string): string {
  const raw = getRawErrorMessage(error);
  const message = raw.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }

  if (message.includes("email not confirmed")) {
    return "Tu correo aún no ha sido confirmado.";
  }

  if (message.includes("user already registered")) {
    return "Ya existe una cuenta con este correo electrónico.";
  }

  if (message.includes("unable to validate email") || message.includes("invalid email")) {
    return "Ingresa un correo electrónico válido.";
  }

  if (message.includes("token has expired") || message.includes("expired")) {
    return "El enlace expiró. Solicita uno nuevo.";
  }

  if (message.includes("invalid token") || message.includes("token is invalid")) {
    return "El enlace no es válido.";
  }

  if (message.includes("password")) {
    return "La contraseña no cumple los requisitos de seguridad.";
  }

  return normalizeUserError(error, { fallback });
}

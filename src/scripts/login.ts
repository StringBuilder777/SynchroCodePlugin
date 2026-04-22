import { getSupabase } from "../lib/supabase";

interface InitLoginOptions {
  formId: string;
  emailId: string;
  passwordId: string;
  togglePasswordButtonId: string;
  eyeIconId: string;
  errorId: string;
  submitButtonId: string;
  githubButtonId: string;
  onLoginSuccess: () => void;
  openExternal: (url: string) => void;
}

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Elemento no encontrado: #${id}`);
  }
  return element as T;
}

function normalizeAuthError(error: unknown): string {
  const raw = error instanceof Error ? error.message : "Error al iniciar sesión";

  if (raw.includes("Invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }

  if (raw.includes("Email not confirmed")) {
    return "Tu correo aún no ha sido confirmado.";
  }

  return raw;
}

function setSpanishValidationMessage(input: HTMLInputElement, field: "email" | "password") {
  if (input.validity.valueMissing) {
    input.setCustomValidity(field === "password" ? "Ingresa tu contraseña." : "Ingresa tu correo electrónico.");
    return;
  }

  if (field === "email" && input.validity.typeMismatch) {
    input.setCustomValidity("Ingresa un correo electrónico válido.");
    return;
  }

  input.setCustomValidity("");
}

function getGithubRedirectUrl() {
  const appUrl = (import.meta.env.PUBLIC_APP_URL || "https://synchrocode.app").replace(/\/$/, "");
  return `${appUrl}/auth/github`;
}

export function initLogin(options: InitLoginOptions) {
  const form = byId<HTMLFormElement>(options.formId);
  const emailInput = byId<HTMLInputElement>(options.emailId);
  const passwordInput = byId<HTMLInputElement>(options.passwordId);
  const togglePasswordButton = byId<HTMLButtonElement>(options.togglePasswordButtonId);
  const eyeIcon = byId<HTMLElement>(options.eyeIconId);
  const errorBox = byId<HTMLElement>(options.errorId);
  const submitButton = byId<HTMLButtonElement>(options.submitButtonId);
  const githubButton = byId<HTMLButtonElement>(options.githubButtonId);

  const defaultSubmitText = submitButton.textContent?.trim() || "Ingresar";
  const defaultGithubHtml = githubButton.innerHTML;

  emailInput.addEventListener("invalid", () => setSpanishValidationMessage(emailInput, "email"));
  passwordInput.addEventListener("invalid", () => setSpanishValidationMessage(passwordInput, "password"));
  emailInput.addEventListener("input", () => emailInput.setCustomValidity(""));
  passwordInput.addEventListener("input", () => passwordInput.setCustomValidity(""));

  const setError = (message: string) => {
    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
  };

  const clearError = () => {
    errorBox.textContent = "";
    errorBox.classList.add("hidden");
  };

  const setLoading = (loading: boolean, source: "login" | "github") => {
    submitButton.disabled = loading;
    githubButton.disabled = loading;
    submitButton.classList.toggle("opacity-70", loading);
    submitButton.classList.toggle("cursor-not-allowed", loading);
    githubButton.classList.toggle("opacity-70", loading);
    githubButton.classList.toggle("cursor-not-allowed", loading);
    githubButton.innerHTML = defaultGithubHtml;

    submitButton.textContent = source === "login" && loading ? "Ingresando..." : defaultSubmitText;
  };

  togglePasswordButton.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    eyeIcon.innerHTML = isPassword
      ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
      : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    setLoading(true, "login");

    try {
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }
      options.onLoginSuccess();
    } catch (error) {
      setError(normalizeAuthError(error));
    } finally {
      setLoading(false, "login");
    }
  });

  githubButton.addEventListener("click", async () => {
    clearError();
    setLoading(true, "github");

    try {
      const { data, error } = await getSupabase().auth.signInWithOAuth({
        provider: "github",
        options: {
          skipBrowserRedirect: true,
          redirectTo: getGithubRedirectUrl(),
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.url) {
        throw new Error("No se pudo iniciar el flujo de GitHub.");
      }

      options.openExternal(data.url);
    } catch (error) {
      setError(normalizeAuthError(error));
    } finally {
      setLoading(false, "github");
    }
  });
}

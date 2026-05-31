import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GithubIcon } from "./GithubIcon";
import { getSupabase } from "@/lib/supabase";
import { normalizeAuthError } from "@/lib/errors";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const setSpanishValidationMessage = (input: HTMLInputElement) => {
    if (input.validity.valueMissing) {
      input.setCustomValidity(
        input.type === "password" ? "Ingresa tu contraseña." : "Ingresa tu correo electrónico.",
      );
      return;
    }

    if (input.validity.typeMismatch) {
      input.setCustomValidity("Ingresa un correo electrónico válido.");
      return;
    }

    input.setCustomValidity("");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const { error } = await getSupabase().auth.signInWithPassword({ email, password });
        clearTimeout(timeoutId);

        if (error) {
          const errorMessage = normalizeAuthError(error, "No se pudo iniciar sesión.");
          setError(errorMessage);
          setLoading(false);
        } else {
          window.location.href = "/proyectos";
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        const errorMessage = normalizeAuthError(fetchError, "Error de red. Intenta de nuevo.");
        setError(errorMessage);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = normalizeAuthError(err, "No se pudo iniciar sesión.");
      setError(errorMessage);
      setLoading(false);
    }
  }

  async function handleGitHubLogin() {
    await getSupabase().auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/github` },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-[420px] space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Iniciar sesión</CardTitle>
            <CardDescription>Inicia tu sesión colaborativa</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onInvalid={(e) => setSpanishValidationMessage(e.currentTarget)}
                  onInput={(e) => e.currentTarget.setCustomValidity("")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onInvalid={(e) => setSpanishValidationMessage(e.currentTarget)}
                  onInput={(e) => e.currentTarget.setCustomValidity("")}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Ingresando..." : "Login"}
              </Button>

              <div className="text-center">
                <a
                  href="/recuperar-contrasena"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

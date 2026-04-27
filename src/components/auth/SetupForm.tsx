import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PasswordStrengthBar } from "./PasswordStrengthBar";
import { ThemeToggle } from "./ThemeToggle";
import { ArrowLeft } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { normalizeAuthError, normalizeUserError } from "@/lib/errors";

export function SetupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (!orgName.trim()) {
      setError("Ingresa el nombre de la organización.");
      return;
    }

    setLoading(true);

    try {
      // 1. Sign up
      const { error: signUpError } = await getSupabase().auth.signUp({
        email,
        password,
        options: {
          data: { name, role: "Administrador" },
        },
      });

      if (signUpError) {
        setError(normalizeAuthError(signUpError, "No se pudo crear la cuenta."));
        setLoading(false);
        return;
      }

      // 2. Login to get JWT
      const { error: loginError } = await getSupabase().auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(normalizeAuthError(loginError, "No se pudo iniciar sesión con la cuenta creada."));
        setLoading(false);
        return;
      }

      // 3. Create org in backend
      const org = await api.post<{ id: string }>("/organizations", { name: orgName.trim() });

      // 4. Save organizationId in user_metadata
      const { error: updateError } = await getSupabase().auth.updateUser({
        data: { organizationId: org.id },
      });

      if (updateError) {
        setError(normalizeAuthError(updateError, "No se pudo actualizar el perfil del usuario."));
        setLoading(false);
        return;
      }

      // 5. Refresh session to get JWT with organizationId
      const { error: refreshError } = await getSupabase().auth.refreshSession();

      if (refreshError) {
        setError(normalizeAuthError(refreshError, "No se pudo actualizar la sesión."));
        setLoading(false);
        return;
      }

      window.location.href = "/proyectos";
    } catch (err: unknown) {
      setError(normalizeUserError(err, { fallback: "No se pudo completar la configuración inicial." }));
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <ThemeToggle />
      <Card className="w-full max-w-[460px]">
        <CardHeader className="text-center">
          <div className="flex justify-center">
            <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-500">
              Configuración inicial
            </span>
          </div>
          <CardTitle className="text-2xl font-bold">
            Crear cuenta
          </CardTitle>
          <CardDescription>
            Registra tu cuenta para acceder al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Ej: Carlos Mendoza"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="Ej: admin@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" x2="23" y1="1" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <PasswordStrengthBar password={password} />

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar contraseña</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgName">Nombre de la organización</Label>
              <Input
                id="orgName"
                type="text"
                placeholder="Ej: Mi Empresa S.A."
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta y continuar"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => window.location.href = "/login"}
            >
              <ArrowLeft size={16} className="mr-2" />
              Regresar al inicio de sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

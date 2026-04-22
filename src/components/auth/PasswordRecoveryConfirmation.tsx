import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export function PasswordRecoveryConfirmation() {
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("recovery_email") ?? "";
    setEmail(stored);
  }, []);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/recuperar-contrasena/nueva`,
    });
    setResending(false);
    setResent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-[460px]">
        <CardContent className="space-y-6 text-center">
          {/* Logo */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <img src="/Logo_white.svg" alt="SynchroCode" className="size-8 hidden dark:block" />
              <img src="/Logo.svg" alt="SynchroCode" className="size-8 dark:hidden" />
            </div>
            <span className="text-lg font-semibold">SynchroCode</span>
          </div>

          {/* Email icon */}
          <div className="flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path d="m16 19 2 2 4-4"/></svg>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-xl font-bold">Revisa tu correo</h1>
            <p className="text-sm text-muted-foreground">
              Si el correo está registrado en SynchroCode, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
            </p>
          </div>

          {/* Email chip */}
          {email && (
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              <span className="text-sm font-medium">{email}</span>
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-3 rounded-lg bg-secondary p-4 text-left">
            <div className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">1</span>
              <span className="text-sm">Abre tu aplicación de correo</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">2</span>
              <div className="text-sm">
                Busca un mensaje de<br />
                <span className="font-medium">noreply@synchrocode.com</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">3</span>
              <span className="text-sm">Haz clic en el enlace dentro del correo</span>
            </div>
          </div>

          {/* Spam note */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            ¿No lo ves? Revisa tu carpeta de spam.
          </div>

          <hr className="border-border" />

          {/* Resend */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">¿No recibiste el correo?</p>
            {email ? (
              <Button
                variant="outline"
                onClick={handleResend}
                disabled={resending || resent}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                {resent ? "Enlace reenviado" : resending ? "Reenviando..." : "Reenviar enlace"}
              </Button>
            ) : (
              <a
                href="/recuperar-contrasena"
                className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Volver a intentarlo
              </a>
            )}
          </div>

          {/* Back */}
          <a
            href="/login"
            className="inline-block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Volver al inicio de sesión
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

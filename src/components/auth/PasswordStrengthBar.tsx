interface PasswordStrengthBarProps {
  password: string;
}

function getStrength(password: string): { level: number; label: string; color: string } {
  if (!password) return { level: 0, label: "", color: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: "Débil", color: "bg-red-500" };
  if (score === 2) return { level: 2, label: "Media", color: "bg-yellow-500" };
  if (score === 3) return { level: 3, label: "Buena", color: "bg-blue-500" };
  return { level: 4, label: "Fuerte", color: "bg-emerald-500" };
}

export function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const { level, label, color } = getStrength(password);

  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Fortaleza de contraseña</span>
        <span className={level <= 1 ? "text-red-500" : level === 2 ? "text-yellow-500" : level === 3 ? "text-blue-500" : "text-emerald-500"}>
          {label}
        </span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= level ? color : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

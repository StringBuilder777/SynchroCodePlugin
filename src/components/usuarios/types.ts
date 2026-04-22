export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastSignInAt: string | null;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-blue-500/20 text-blue-500",
  "bg-purple-500/20 text-purple-500",
  "bg-amber-500/20 text-amber-500",
  "bg-emerald-500/20 text-emerald-500",
  "bg-rose-500/20 text-rose-500",
  "bg-cyan-500/20 text-cyan-500",
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

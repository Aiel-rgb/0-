import { useState, useEffect } from "react";
import { User } from "lucide-react";

interface LevelAvatarProps {
  level: number;
  userName?: string;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * Avatar component with level-based border color
 * Level 1-10: Ferro (Gray)
 * Level 11-25: Prata (Silver)
 * Level 26-50: Ouro (Gold)
 * Level 51-75: Platina (Platinum)
 * Level 76-99: Diamante (Diamond)
 * Level 100+: Thorium (Purple)
 */
export function LevelAvatar({ level, userName = "User", avatarUrl, size = "md" }: LevelAvatarProps) {
  const [borderClass, setBorderClass] = useState(() => {
    const id = localStorage.getItem("equipped_avatar_frame");
    if (id === "border-gold") return "avatar-style-gold";
    if (id === "border-neon") return "avatar-style-neon";
    if (id === "border-fire") return "avatar-style-fire";
    return "";
  });

  useEffect(() => {
    const handler = () => {
      const id = localStorage.getItem("equipped_avatar_frame");
      if (id === "border-gold") setBorderClass("avatar-style-gold");
      else if (id === "border-neon") setBorderClass("avatar-style-neon");
      else if (id === "border-fire") setBorderClass("avatar-style-fire");
      else setBorderClass("");
    };
    window.addEventListener("avatar_frame_updated", handler);
    return () => window.removeEventListener("avatar_frame_updated", handler);
  }, []);

  const getRankInfo = (lvl: number) => {
    if (lvl <= 10) return { name: "Ferro", color: "from-gray-500 to-gray-700", borderColor: "border-gray-500" };
    if (lvl <= 25) return { name: "Prata", color: "from-slate-400 to-slate-600", borderColor: "border-slate-400" };
    if (lvl <= 50) return { name: "Ouro", color: "from-yellow-500 to-yellow-700", borderColor: "border-yellow-500" };
    if (lvl <= 75) return { name: "Platina", color: "from-cyan-400 to-cyan-600", borderColor: "border-cyan-400" };
    if (lvl <= 99) return { name: "Diamante", color: "from-blue-400 to-blue-600", borderColor: "border-blue-400" };
    return { name: "Thorium", color: "from-purple-500 to-purple-700", borderColor: "border-purple-500" };
  };

  const sizeClasses = {
    sm: "w-12 h-12 text-xs",
    md: "w-20 h-20 text-sm",
    lg: "w-32 h-32 text-lg",
    xl: "w-48 h-48 text-2xl",
  };

  const borderSizes = {
    sm: "border-2",
    md: "border-4",
    lg: "border-8",
    xl: "border-8",
  };

  const rankInfo = getRankInfo(level);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Outer glow effect */}
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${rankInfo.color} opacity-20 blur-lg`}
        />

        {/* Avatar container with border */}
        <div
          className={`relative w-full h-full rounded-full ${borderSizes[size]} ${rankInfo.borderColor} bg-gradient-to-br ${rankInfo.color} p-1 flex items-center justify-center overflow-hidden ${borderClass}`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <User className="w-1/2 h-1/2 text-primary" />
            </div>
          )}
        </div>

        {/* Level badge */}
        <div className={`absolute bottom-0 right-0 rounded-full bg-gradient-to-br ${rankInfo.color} text-white font-bold flex items-center justify-center ${size === "sm" ? "w-6 h-6 text-xs" :
          size === "md" ? "w-8 h-8 text-sm" :
            size === "lg" ? "w-12 h-12 text-lg" :
              "w-16 h-16 text-2xl"
          } border-2 border-background`}>
          {level}
        </div>
      </div>

      {/* Rank name */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">{rankInfo.name}</p>
      </div>
    </div>
  );
}

/**
 * Get rank color based on level for use in other components
 */
export function getRankColor(level: number): string {
  if (level <= 10) return "text-gray-500";
  if (level <= 25) return "text-slate-400";
  if (level <= 50) return "text-yellow-500";
  if (level <= 75) return "text-cyan-400";
  if (level <= 99) return "text-blue-400";
  return "text-purple-500";
}

/**
 * Get rank name based on level
 */
export function getRankName(level: number): string {
  if (level <= 10) return "Ferro";
  if (level <= 25) return "Prata";
  if (level <= 50) return "Ouro";
  if (level <= 75) return "Platina";
  if (level <= 99) return "Diamante";
  return "Thorium";
}

/**
 * Get rank gradient based on level
 */
export function getRankGradient(level: number): string {
  if (level <= 10) return "from-gray-500 to-gray-700";
  if (level <= 25) return "from-slate-400 to-slate-600";
  if (level <= 50) return "from-yellow-500 to-yellow-700";
  if (level <= 75) return "from-cyan-400 to-cyan-600";
  if (level <= 99) return "from-blue-400 to-blue-600";
  return "from-purple-500 to-purple-700";
}

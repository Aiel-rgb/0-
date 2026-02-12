import { motion } from "framer-motion";
import { Flame, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { LevelAvatar, getRankName, getRankColor } from "@/components/LevelAvatar";
import { cn } from "@/lib/utils";
import type { User, UserProfile } from "@/lib/types";

import { useLocation } from "wouter";

interface DailyStatsProps {
    user?: User | null;
    profile: UserProfile;
    streak?: number;
}

export function DailyStats({ user, profile, streak = 0 }: DailyStatsProps) {
    const [, setLocation] = useLocation();
    const xpPercentage = Math.min(100, Math.max(0, (profile.currentXp / profile.xpNeeded) * 100));

    return (
        <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-card/50 backdrop-blur-sm border border-border rounded-xl shadow-lg">
            <div
                className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setLocation("/profile")}
                title="Ver Perfil"
            >
                <LevelAvatar
                    level={profile.level}
                    avatarUrl={user?.avatarUrl || undefined}
                    size="lg"
                />
            </div>

            <div className="flex-1 w-full space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div
                        className="cursor-pointer group"
                        onClick={() => setLocation("/profile")}
                        title="Ver Perfil"
                    >
                        <h2 className="text-2xl font-display font-bold tracking-tight group-hover:text-primary transition-colors">
                            {user?.name || "Hero"}
                        </h2>
                        <p className={cn("text-sm font-medium", getRankColor(profile.level))}>
                            {getRankName(profile.level)} • Lvl {profile.level}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-background/50 px-4 py-2 rounded-full border border-border/50">
                        <div className="flex items-center gap-1.5 text-orange-500" title="Daily Streak">
                            <Flame className="w-5 h-5 fill-orange-500 animate-pulse" />
                            <span className="font-display font-bold text-lg">{streak}</span>
                        </div>
                        <div className="w-px h-6 bg-border" />
                        <div className="flex items-center gap-1.5 text-yellow-500" title="Total XP">
                            <Star className="w-5 h-5 fill-yellow-500" />
                            <span className="font-display font-bold text-lg">{profile.totalXp}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <span>XP Progress</span>
                        <span>{Math.floor(profile.currentXp)} / {profile.xpNeeded} XP</span>
                    </div>
                    <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary/50">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-primary/60 shadow-[0_0_10px_rgba(0,217,255,0.4)] transition-all duration-1000 ease-out"
                            style={{ width: `${xpPercentage}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

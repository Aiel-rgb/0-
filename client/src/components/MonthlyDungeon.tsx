import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Swords, ShieldCheck, Flame, CheckCircle2, Lock,
    Zap, Coins, Loader2, Trophy, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const diffConfig = {
    easy: {
        icon: ShieldCheck,
        color: "text-green-400",
        border: "border-green-500/50",
        bg: "bg-green-500/10",
        glow: "shadow-[0_0_20px_rgba(34,197,94,0.3)]",
        label: "Fácil",
    },
    medium: {
        icon: Swords,
        color: "text-blue-400",
        border: "border-blue-500/50",
        bg: "bg-blue-500/10",
        glow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
        label: "Médio",
    },
    hard: {
        icon: Flame,
        color: "text-red-400",
        border: "border-red-500/50",
        bg: "bg-red-500/10",
        glow: "shadow-[0_0_25px_rgba(239,68,68,0.4)]",
        label: "Difícil",
    },
};

const THEME_STYLES: Record<string, { bg: string; accent: string; glow: string; banner: string }> = {
    astral: {
        bg: "from-indigo-950/80 via-purple-950/60 to-background",
        accent: "text-purple-300",
        glow: "shadow-[0_0_40px_rgba(139,92,246,0.3)]",
        banner: "bg-gradient-to-r from-indigo-900/80 via-purple-900/80 to-indigo-900/80 border-purple-500/30",
    },
    default: {
        bg: "from-slate-900/80 via-background to-background",
        accent: "text-primary",
        glow: "",
        banner: "bg-card border-border",
    },
};

export function MonthlyDungeon() {
    const queryClient = useQueryClient();
    const [selectedMission, setSelectedMission] = useState<any | null>(null);

    const { data, isLoading } = trpc.dungeon.active.useQuery(undefined, {
        refetchOnWindowFocus: false,
    });

    const completeMutation = trpc.dungeon.completeMission.useMutation({
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: [["dungeon", "active"]] });
            queryClient.invalidateQueries({ queryKey: [["profile", "getProfile"]] });

            const currentGold = Number(localStorage.getItem("shop_gold") || "0");
            localStorage.setItem("shop_gold", String(currentGold + result.goldReward));
            window.dispatchEvent(new Event("gold-changed"));

            if (result.themeUnlocked) {
                toast.success("🌌 Tema ASTRAL desbloqueado! Parabéns, Viajante!", {
                    duration: 6000,
                });
            } else {
                toast.success("Missão concluída! ⚔️", {
                    description: `+${result.xpReward} XP  •  +${result.goldReward} 🪙 Ouro`,
                });
            }
            setSelectedMission(null);
        },
        onError: (e) => {
            toast.error(e.message);
            setSelectedMission(null);
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhuma dungeon ativa este mês</p>
                <p className="text-sm mt-1">Volte no próximo mês para novos desafios!</p>
            </div>
        );
    }

    const { dungeon, missions, completedIds, totalXp, totalGold } = data;
    const theme = THEME_STYLES[dungeon.theme] ?? THEME_STYLES.default;
    const completedCount = completedIds.length;
    const totalCount = missions.length;
    const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const allDone = completedCount === totalCount;

    // Days remaining
    const now = new Date();
    const endsAt = new Date(dungeon.endsAt);
    const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return (
        <div className={cn("space-y-6 bg-gradient-to-b rounded-xl p-6", theme.bg)}>
            {/* Banner */}
            <div className={cn("rounded-xl border p-5 text-center", theme.banner, theme.glow)}>
                <div className="text-5xl mb-2">{dungeon.bannerEmoji}</div>
                <h2 className={cn("text-2xl font-display font-black", theme.accent)}>{dungeon.name}</h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{dungeon.description}</p>
                <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>⏳ {daysLeft} dias restantes</span>
                    <span>•</span>
                    <span className="text-yellow-400">🏆 Recompensa: Tema {dungeon.theme.toUpperCase()}</span>
                </div>
            </div>

            {/* Progress */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progresso da Dungeon</span>
                    <span className="text-sm font-bold text-primary">{completedCount}/{totalCount}</span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                        className={cn(
                            "h-full rounded-full",
                            dungeon.theme === "astral"
                                ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                                : "bg-gradient-to-r from-primary to-cyan-400"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                </div>
                {allDone && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-sm font-bold text-purple-400 mt-2"
                    >
                        🌌 Dungeon Completa! Tema desbloqueado!
                    </motion.p>
                )}
            </div>

            {/* Missions */}
            <div className="space-y-3">
                {missions.map((mission: any, index: number) => {
                    const isCompleted = completedIds.includes(mission.id);
                    const prevCompleted = index === 0 || completedIds.includes(missions[index - 1]?.id);
                    const isLocked = !isCompleted && !prevCompleted;
                    const diff = diffConfig[mission.difficulty as keyof typeof diffConfig] ?? diffConfig.medium;
                    const Icon = isCompleted ? CheckCircle2 : isLocked ? Lock : diff.icon;
                    const isBoss = mission.orderIndex === missions.length - 1;

                    return (
                        <motion.div
                            key={mission.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-xl border transition-all duration-300",
                                isCompleted
                                    ? "bg-primary/5 border-primary/20 opacity-70"
                                    : isLocked
                                        ? "bg-muted/10 border-border opacity-40"
                                        : cn("bg-card cursor-pointer hover:scale-[1.01]", diff.border, diff.glow)
                            )}
                            onClick={() => !isCompleted && !isLocked && setSelectedMission(mission)}
                        >
                            {/* Icon */}
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center border-2 flex-shrink-0",
                                isCompleted ? "bg-primary/10 border-primary/30" : isLocked ? "bg-muted/20 border-muted" : cn(diff.bg, diff.border)
                            )}>
                                <Icon className={cn("w-6 h-6", isCompleted ? "text-primary" : isLocked ? "text-muted-foreground" : diff.color)} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {isBoss && !isCompleted && (
                                        <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full font-bold uppercase">
                                            ⚠ BOSS
                                        </span>
                                    )}
                                    <p className={cn(
                                        "font-semibold text-sm",
                                        isCompleted && "line-through text-muted-foreground"
                                    )}>
                                        {mission.title}
                                    </p>
                                </div>
                                {mission.description && (
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">{mission.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1 text-xs">
                                    <span className={cn("px-1.5 py-0.5 rounded border text-[10px] font-medium", diff.border, diff.color, diff.bg)}>
                                        {diff.label}
                                    </span>
                                    <span className="text-yellow-400 flex items-center gap-0.5">
                                        <Zap className="w-3 h-3" />{mission.xpReward}
                                    </span>
                                    <span className="text-amber-400 flex items-center gap-0.5">
                                        <Coins className="w-3 h-3" />{mission.goldReward}
                                    </span>
                                </div>
                            </div>

                            {/* Status */}
                            {isCompleted && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />}
                            {!isCompleted && !isLocked && <Star className="w-4 h-4 text-yellow-400 flex-shrink-0 animate-pulse" />}
                        </motion.div>
                    );
                })}
            </div>

            {/* Mission Detail Modal */}
            <AnimatePresence>
                {selectedMission && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedMission(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.85, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.85, y: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                                "bg-card border-2 rounded-2xl p-6 w-full max-w-sm shadow-2xl",
                                diffConfig[selectedMission.difficulty as keyof typeof diffConfig]?.border ?? "border-primary"
                            )}
                        >
                            <div className="text-center mb-4">
                                <div className="text-4xl mb-2">{dungeon.bannerEmoji}</div>
                                <h3 className="text-lg font-display font-bold">{selectedMission.title}</h3>
                                {selectedMission.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{selectedMission.description}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-center gap-4 mb-5 text-sm">
                                <span className="text-yellow-400 flex items-center gap-1 font-bold">
                                    <Zap className="w-4 h-4" />+{selectedMission.xpReward} XP
                                </span>
                                <span className="text-amber-400 flex items-center gap-1 font-bold">
                                    <Coins className="w-4 h-4" />+{selectedMission.goldReward} Ouro
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold"
                                    onClick={() => completeMutation.mutate({ dungeonId: dungeon.id, missionId: selectedMission.id })}
                                    disabled={completeMutation.isPending}
                                >
                                    {completeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "⚔️ Completar Missão"}
                                </Button>
                                <Button variant="outline" onClick={() => setSelectedMission(null)}>
                                    Cancelar
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

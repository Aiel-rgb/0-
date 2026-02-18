import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Zap, Coins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
    health: "text-green-400 bg-green-400/10 border-green-400/20",
    fitness: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    mind: "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

const CATEGORY_LABELS: Record<string, string> = {
    health: "Saúde",
    fitness: "Fitness",
    mind: "Mente",
};

export function DailyTasks() {
    const queryClient = useQueryClient();
    const [completingId, setCompletingId] = useState<number | null>(null);

    const { data: tasks = [], isLoading } = trpc.dailyTasks.list.useQuery(undefined, {
        refetchOnWindowFocus: false,
    });

    const completeMutation = trpc.dailyTasks.complete.useMutation({
        onSuccess: (result, variables) => {
            queryClient.invalidateQueries({ queryKey: [["dailyTasks", "list"]] });
            queryClient.invalidateQueries({ queryKey: [["profile", "getProfile"]] });

            // Grant gold client-side
            const currentGold = Number(localStorage.getItem("shop_gold") || "0");
            localStorage.setItem("shop_gold", String(currentGold + result.goldReward));
            window.dispatchEvent(new Event("gold-changed"));

            toast.success("Tarefa diária concluída! 🎉", {
                description: `+${result.xpReward} XP  •  +${result.goldReward} 🪙 Ouro`,
            });
            setCompletingId(null);
        },
        onError: (err) => {
            toast.error(err.message);
            setCompletingId(null);
        },
    });

    const handleComplete = (taskId: number) => {
        setCompletingId(taskId);
        completeMutation.mutate({ dailyTaskId: taskId });
    };

    const completedCount = tasks.filter(t => t.completedToday).length;
    const totalCount = tasks.length;
    const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Progress Header */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="font-display font-bold text-lg">Desafios de Hoje</h3>
                    <p className="text-xs text-muted-foreground">Resetam à meia-noite</p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-display font-bold text-primary">
                        {completedCount}
                    </span>
                    <span className="text-muted-foreground text-sm">/{totalCount}</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-secondary rounded-full overflow-hidden mb-4">
                <motion.div
                    className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                />
            </div>

            {/* Task List */}
            <AnimatePresence>
                {tasks.map((task) => (
                    <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "flex items-center gap-3 p-4 rounded-xl border transition-all duration-300",
                            task.completedToday
                                ? "bg-primary/5 border-primary/20 opacity-70"
                                : "bg-card border-border hover:border-primary/40"
                        )}
                    >
                        {/* Complete Button */}
                        <button
                            onClick={() => !task.completedToday && handleComplete(task.id)}
                            disabled={task.completedToday || completingId === task.id}
                            className="flex-shrink-0 transition-transform hover:scale-110 disabled:cursor-default"
                        >
                            {completingId === task.id ? (
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            ) : task.completedToday ? (
                                <CheckCircle2 className="w-6 h-6 text-primary" />
                            ) : (
                                <Circle className="w-6 h-6 text-muted-foreground hover:text-primary" />
                            )}
                        </button>

                        {/* Emoji */}
                        <span className="text-2xl flex-shrink-0">{task.emoji}</span>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className={cn(
                                "font-medium text-sm",
                                task.completedToday && "line-through text-muted-foreground"
                            )}>
                                {task.title}
                            </p>
                            {task.description && (
                                <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                            )}
                        </div>

                        {/* Rewards + Category */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-yellow-400 flex items-center gap-0.5">
                                    <Zap className="w-3 h-3" />{task.xpReward}
                                </span>
                                <span className="text-amber-400 flex items-center gap-0.5">
                                    <Coins className="w-3 h-3" />{task.goldReward}
                                </span>
                            </div>
                            <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full border font-medium",
                                CATEGORY_COLORS[task.category] ?? "text-muted-foreground bg-muted/20 border-border"
                            )}>
                                {CATEGORY_LABELS[task.category] ?? task.category}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {completedCount === totalCount && totalCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4 text-primary font-display font-bold"
                >
                    🏆 Todos os desafios concluídos hoje!
                </motion.div>
            )}
        </div>
    );
}

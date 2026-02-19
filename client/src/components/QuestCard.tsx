import { motion } from "framer-motion";
import { Check, Trash2, Zap, ShieldCheck, Swords, Flame, Clock, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";

interface QuestCardProps {
    task: Task;
    onComplete: (taskId: number) => void;
    onDelete: (taskId: number) => void;
    completing: boolean;
    deadline?: number; // timestamp
}

const difficultyConfig = {
    easy: {
        color: "text-green-500",
        bg: "bg-green-500/10",
        border: "border-green-500/20",
        icon: ShieldCheck,
        label: "Fácil",
    },
    medium: {
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        icon: Swords,
        label: "Médio",
    },
    hard: {
        color: "text-red-500",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
        icon: Flame,
        label: "Difícil",
    },
};

export function QuestCard({ task, onComplete, onDelete, completing, deadline }: QuestCardProps) {
    const config = difficultyConfig[task.difficulty];
    const Icon = config.icon;

    // Format deadline
    const deadlineStr = deadline ? new Date(deadline).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : null;
    const isUrgent = deadline ? (deadline - Date.now()) < 30 * 60 * 1000 && (deadline - Date.now()) > 0 : false;
    const isExpired = deadline ? deadline < Date.now() : false;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            <Card
                className={cn(
                    "relative overflow-hidden transition-all duration-300 border-2",
                    task.completed
                        ? "bg-black/40 border-yellow-500/50 glow-gold"
                        : isExpired
                            ? "bg-red-950/30 border-red-500/50"
                            : isUrgent
                                ? "bg-card border-orange-500/50"
                                : `bg-card hover:bg-card/80 ${config.border}`
                )}
            >
                {/* Completed Overlay/Strikethrough effect */}
                {task.completed && (
                    <div className="absolute inset-0 bg-yellow-500/5 flex items-center justify-center pointer-events-none z-10">
                        <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: -15 }}
                            className="border-4 border-yellow-500/30 text-yellow-500/30 font-display text-4xl uppercase px-4 py-2 rounded-xl transform -rotate-12"
                        >
                            Quest Complete
                        </motion.div>
                    </div>
                )}

                <div className="p-4 flex items-center gap-4 relative z-0">
                    <div
                        className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2",
                            task.completed
                                ? "bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]"
                                : `${config.bg} ${config.border} ${config.color}`
                        )}
                    >
                        {task.completed ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3
                            className={cn(
                                "font-display text-lg truncate transition-colors",
                                task.completed ? "text-yellow-500/80" : "text-foreground"
                            )}
                        >
                            {task.title}
                        </h3>
                        {task.description && (
                            <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span
                                className={cn(
                                    "text-xs px-2 py-0.5 rounded-full font-medium border",
                                    config.bg,
                                    config.color,
                                    config.border
                                )}
                            >
                                {config.label}
                            </span>
                            <span className="text-xs font-bold text-yellow-500 flex items-center gap-1">
                                <Zap className="w-3 h-3 fill-yellow-500" />
                                {task.xpReward} XP
                            </span>
                            <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                                <span className="text-[10px]">🪙</span>
                                {task.difficulty === "easy" ? 50 : task.difficulty === "medium" ? 100 : 200} Ouro
                            </span>
                            {deadlineStr && !task.completed && (
                                <span
                                    className={cn(
                                        "text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border whitespace-nowrap shrink-0",
                                        isExpired
                                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                                            : isUrgent
                                                ? "bg-orange-500/20 text-orange-400 border-orange-500/30 animate-pulse"
                                                : "bg-muted text-muted-foreground border-border"
                                    )}
                                >
                                    <Clock className="w-3 h-3" />
                                    {isExpired ? "Expirado!" : `até ${deadlineStr}`}
                                </span>
                            )}
                            {task.repeatType && task.repeatType !== 'none' && (
                                <span className={cn(
                                    "text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border whitespace-nowrap shrink-0",
                                    "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                )}>
                                    <Repeat className="w-3 h-3" />
                                    {task.repeatType === 'daily' ? 'Diário' : 'Semanal'}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        {!task.completed && (
                            <Button
                                variant="default"
                                size="sm"
                                className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold shadow-[0_0_10px_rgba(0,217,255,0.3)]"
                                onClick={() => onComplete(task.id)}
                                disabled={completing}
                            >
                                Completar
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive transition-colors h-8 w-8"
                            onClick={() => onDelete(task.id)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div >
    );
}

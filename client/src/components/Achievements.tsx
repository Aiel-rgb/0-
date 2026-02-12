import { motion } from "framer-motion";
import { Trophy, Lock, Star, Zap, Swords, Calendar, Crown, Target, Flame, ShieldCheck, Medal, Skull } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    progress: number;
    maxProgress: number;
    completed: boolean;
    category: "level" | "streak" | "quest" | "difficulty";
    xpReward?: number;
}

export function Achievements() {
    const { data: profile, isLoading: loadingProfile } = trpc.profile.getProfile.useQuery();
    const { data: stats, isLoading: loadingStats } = trpc.profile.getStats.useQuery();

    if (loadingProfile || loadingStats || !profile || !stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
            </div>
        );
    }

    const achievements: Achievement[] = [
        // Level Achievements
        {
            id: "level-5",
            title: "Novato Promissor",
            description: "Alcance o Nível 5.",
            icon: <Star className="w-6 h-6 text-blue-400" />,
            progress: profile.currentLevel,
            maxProgress: 5,
            completed: profile.currentLevel >= 5,
            category: "level"
        },
        {
            id: "level-10",
            title: "Veterano de Guerra",
            description: "Alcance o Nível 10.",
            icon: <Trophy className="w-6 h-6 text-purple-500" />,
            progress: profile.currentLevel,
            maxProgress: 10,
            completed: profile.currentLevel >= 10,
            category: "level"
        },
        {
            id: "level-25",
            title: "Mestre da Guilda",
            description: "Alcance o Nível 25.",
            icon: <Crown className="w-6 h-6 text-yellow-500" />,
            progress: profile.currentLevel,
            maxProgress: 25,
            completed: profile.currentLevel >= 25,
            category: "level"
        },
        {
            id: "level-50",
            title: "Lenda Viva",
            description: "Alcance o Nível 50.",
            icon: <Medal className="w-6 h-6 text-red-500" />,
            progress: profile.currentLevel,
            maxProgress: 50,
            completed: profile.currentLevel >= 50,
            category: "level"
        },

        // Quest Achievements
        {
            id: "quest-10",
            title: "Caçador de Goblins",
            description: "Complete 10 missões.",
            icon: <Swords className="w-6 h-6 text-green-500" />,
            progress: stats.totalCompletions,
            maxProgress: 10,
            completed: stats.totalCompletions >= 10,
            category: "quest"
        },
        {
            id: "quest-50",
            title: "Matador de Dragões",
            description: "Complete 50 missões.",
            icon: <Target className="w-6 h-6 text-orange-500" />,
            progress: stats.totalCompletions,
            maxProgress: 50,
            completed: stats.totalCompletions >= 50,
            category: "quest"
        },
        {
            id: "quest-100",
            title: "Açougueiro de Monstros",
            description: "Complete 100 missões.",
            icon: <Skull className="w-6 h-6 text-red-600" />,
            progress: stats.totalCompletions,
            maxProgress: 100,
            completed: stats.totalCompletions >= 100,
            category: "quest"
        },

        // Streak Achievements
        {
            id: "streak-3",
            title: "Disciplina de Ferro",
            description: "Mantenha um combo de 3 dias.",
            icon: <Calendar className="w-6 h-6 text-blue-500" />,
            progress: stats.streak,
            maxProgress: 3,
            completed: stats.streak >= 3,
            category: "streak"
        },
        {
            id: "streak-7",
            title: "Foco Absoluto",
            description: "Mantenha um combo de 7 dias.",
            icon: <Zap className="w-6 h-6 text-yellow-400" />,
            progress: stats.streak,
            maxProgress: 7,
            completed: stats.streak >= 7,
            category: "streak"
        },
        {
            id: "streak-30",
            title: "Hábito de Aço",
            description: "Mantenha um combo de 30 dias.",
            icon: <Flame className="w-6 h-6 text-orange-600" />,
            progress: stats.streak,
            maxProgress: 30,
            completed: stats.streak >= 30,
            category: "streak"
        },

        // Difficulty Achievements
        {
            id: "hard-1",
            title: "Desafio Aceito",
            description: "Complete uma missão Difícil.",
            icon: <ShieldCheck className="w-6 h-6 text-gray-400" />,
            progress: stats.hardTasks,
            maxProgress: 1,
            completed: stats.hardTasks >= 1,
            category: "difficulty"
        },
        {
            id: "hard-10",
            title: "Hardcore",
            description: "Complete 10 missões Difíceis.",
            icon: <Skull className="w-6 h-6 text-red-400" />,
            progress: stats.hardTasks,
            maxProgress: 10,
            completed: stats.hardTasks >= 10,
            category: "difficulty"
        },
        // Social Achievements
        {
            id: "admin-friend",
            title: "Seja amigo do adm",
            description: "Adicione o administrador como amigo.",
            icon: <Crown className="w-6 h-6 text-purple-600" />,
            progress: stats.hasAdminFriend ? 1 : 0,
            maxProgress: 1,
            completed: stats.hasAdminFriend,
            category: "level" // Using level category for simplicity or add 'social'
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement, index) => (
                    <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                            "relative overflow-hidden rounded-xl border p-4 transition-all duration-300 group hover:scale-[1.02]",
                            achievement.completed
                                ? "bg-card/80 border-primary/30 holographic-container shadow-[0_0_15px_rgba(0,217,255,0.1)] hover:shadow-[0_0_25px_rgba(0,217,255,0.2)]"
                                : "bg-muted/30 border-muted grayscale opacity-70 hover:opacity-100 hover:grayscale-0"
                        )}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div
                                className={cn(
                                    "p-3 rounded-lg border backdrop-blur-md",
                                    achievement.completed
                                        ? "bg-primary/10 border-primary/20 text-primary"
                                        : "bg-muted border-muted-foreground/20 text-muted-foreground"
                                )}
                            >
                                {achievement.completed ? achievement.icon : <Lock className="w-6 h-6" />}
                            </div>
                            {achievement.completed && (
                                <Trophy className="w-6 h-6 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)] animate-pulse" />
                            )}
                        </div>

                        <h4 className={cn("font-display font-bold text-lg mb-1 flex items-center gap-2", achievement.completed ? "text-foreground" : "text-muted-foreground")}>
                            {achievement.title}
                        </h4>

                        <p className="text-sm text-muted-foreground mb-4 h-10 line-clamp-2">
                            {achievement.description}
                        </p>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground font-medium">
                                <span>Progresso</span>
                                <span className={cn(achievement.completed && "text-primary")}>
                                    {Math.min(achievement.progress, achievement.maxProgress)} / {achievement.maxProgress}
                                </span>
                            </div>
                            <Progress
                                value={(Math.min(achievement.progress, achievement.maxProgress) / achievement.maxProgress) * 100}
                                className={cn("h-2", achievement.completed ? "bg-primary/20" : "bg-muted")}
                            />
                        </div>

                        {/* Shine Effect on hover if completed */}
                        {achievement.completed && (
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

function SwordsIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
            <path d="m13 19 6-6" />
            <path d="M16 16l4 4" />
            <path d="M19 21l2-2" />
        </svg>
    );
}

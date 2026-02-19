import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { DoorOpen, BarChart3, ScrollText, Compass, Gem, Trophy, List, Activity, Shield, Users, CalendarCheck, Swords, PawPrint, MoreVertical, LogOut, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

import { Button } from "@/components/ui/button";
import { DailyStats } from "@/components/DailyStats";
import { QuestCard } from "@/components/QuestCard";
import { AddQuestDialog } from "@/components/AddQuestDialog";
import { HPBar } from "@/components/HPBar";
import { DungeonMap } from "@/components/DungeonMap";
import { Shop } from "@/components/Shop";
import { Achievements } from "@/components/Achievements";
import { StatsCharts } from "@/components/StatsCharts";
import { DailyTasks } from "@/components/DailyTasks";
import { MonthlyDungeon } from "@/components/MonthlyDungeon";
import { ReleaseNotes } from "@/components/ReleaseNotes";
import { PetDashboard } from "@/components/PetDashboard";
import { GuildVault } from "@/components/GuildVault";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { trpc } from "@/lib/trpc";
import { getRankName } from "@/components/LevelAvatar";
import { useSound } from "@/hooks/use-sound";
import type { Task, User, UserProfile } from "@/lib/types";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showStats, setShowStats] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "dungeon" | "shop" | "achievements" | "daily" | "monthly" | "pets" | "vault">("list");
  const [completingId, setCompletingId] = useState<number | null>(null);
  const { play } = useSound();

  // Track completed missions that were deleted (still count for the day)
  const todayKey = new Date().toISOString().split("T")[0];
  const [dailyCompletedCount, setDailyCompletedCount] = useState(() => {
    const saved = localStorage.getItem("daily_deleted_completed");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.date === todayKey ? parsed.count : 0;
    }
    return 0;
  });

  // Gold State for reactivity
  const [gold, setGold] = useState(() => Number(localStorage.getItem("shop_gold") || "0"));

  useEffect(() => {
    const handleGoldChange = () => {
      setGold(Number(localStorage.getItem("shop_gold") || "0"));
    };
    window.addEventListener("gold-changed", handleGoldChange);
    // Also listen to storage events for cross-tab sync
    window.addEventListener("storage", handleGoldChange);

    return () => {
      window.removeEventListener("gold-changed", handleGoldChange);
      window.removeEventListener("storage", handleGoldChange);
    };
  }, []);

  // Fetch data
  const { data: user, isLoading: loadingUser } = trpc.auth.me.useQuery();
  const { data: profile, isLoading: loadingProfile } = trpc.profile.getProfile.useQuery();
  const { data: stats } = trpc.profile.getStats.useQuery();
  const { data: tasks = [], isLoading: loadingTasks } = trpc.tasks.list.useQuery();
  const { data: myGuild } = trpc.guild.get.useQuery();

  // Mutations
  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["tasks", "list"]] });
      play("click");
      toast.success("Nova missão aceita!", {
        description: "Complete-a para ganhar recompensas.",
        icon: "⚔️"
      });
    },
  });

  const completeTaskMutation = trpc.tasks.complete.useMutation({
    onSuccess: (updatedProfile, variables) => {
      queryClient.invalidateQueries({ queryKey: [["tasks", "list"]] });
      queryClient.invalidateQueries({ queryKey: [["profile", "getProfile"]] });

      // Calculate Gold Reward
      const task = tasks.find(t => t.id === variables.taskId);
      let goldReward = 0;
      if (task) {
        if (task.difficulty === "easy") goldReward = 50;
        else if (task.difficulty === "medium") goldReward = 100;
        else if (task.difficulty === "hard") goldReward = 200;

        // Add to wallet
        const currentGold = Number(localStorage.getItem("shop_gold") || "0");
        const newGold = currentGold + goldReward;
        localStorage.setItem("shop_gold", String(newGold));
        window.dispatchEvent(new Event("gold-changed"));
      }

      if (updatedProfile && profile && updatedProfile.currentLevel > profile.currentLevel) {
        play("levelUp");
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#00D9FF']
        });
        toast.success(`LEVEL UP! Nível ${updatedProfile.currentLevel}`, {
          description: `Você alcançou o rank ${getRankName(updatedProfile.currentLevel)}! (+${goldReward} Ouro)`,
          icon: "🎉",
          duration: 5000,
        });
      } else {
        play("success");
        toast.success("Missão Cumprida!", {
          description: `XP obtido com sucesso. +${goldReward} Ouro!`,
          icon: "✨"
        });
      }
      setCompletingId(null);
    },
    onError: (err) => {
      play("error");
      toast.error("Erro ao completar missão", { description: err.message });
      setCompletingId(null);
    }
  });

  const deletingCompletedRef = useRef(false);

  const deleteTaskMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["tasks", "list"]] });

      if (deletingCompletedRef.current) {
        // Completed mission — no penalty, but track for daily progress
        play("click");
        toast.info("Missão removida do quadro.", { icon: "🗑️" });
        setDailyCompletedCount((prev: number) => {
          const newCount = prev + 1;
          localStorage.setItem("daily_deleted_completed", JSON.stringify({ date: new Date().toISOString().split("T")[0], count: newCount }));
          return newCount;
        });
      } else {
        // Active mission abandoned — HP damage
        play("error");
        const currentHP = Number(localStorage.getItem("player_hp") || "50");
        const newHP = Math.max(0, currentHP - 20);
        localStorage.setItem("player_hp", String(newHP));
        window.dispatchEvent(new Event("hp-changed"));

        if (newHP <= 0) {
          toast.error("💀 NOCAUTE! Seu HP chegou a zero!", {
            description: "Use uma Poção de Cura na Loja para se recuperar.",
            duration: 5000,
          });
        } else {
          toast.error("Missão abandonada! -20 HP", {
            description: `HP restante: ${newHP}/100`,
            icon: "🗡️",
          });
        }
      }
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      setLocation("/login");
    }
  });

  // Check authentication
  useEffect(() => {
    if (!loadingUser && !user) {
      setLocation("/login");
    }
  }, [user, loadingUser, setLocation]);

  // Deadline expiry checker (must be before early returns)
  useEffect(() => {
    const checkDeadlines = () => {
      const deadlines = JSON.parse(localStorage.getItem("task_deadlines") || "{}");
      const now = Date.now();
      let hpLost = 0;
      const expiredTitles: string[] = [];

      for (const [title, timestamp] of Object.entries(deadlines)) {
        if ((timestamp as number) < now) {
          const task = tasks.find(t => t.title === title && !t.completed);
          if (task) {
            hpLost += 15;
            expiredTitles.push(title);
          }
          delete deadlines[title];
        }
      }

      if (expiredTitles.length > 0) {
        localStorage.setItem("task_deadlines", JSON.stringify(deadlines));
        const currentHP = Number(localStorage.getItem("player_hp") || "50");
        const newHP = Math.max(0, currentHP - hpLost);
        localStorage.setItem("player_hp", String(newHP));
        window.dispatchEvent(new Event("hp-changed"));
        play("error");
        toast.error(`⏰ ${expiredTitles.length} missão(ões) expirada(s)! -${hpLost} HP`, {
          description: expiredTitles.join(", "),
          duration: 5000,
        });
      }
    };

    checkDeadlines();
    const interval = setInterval(checkDeadlines, 30000);
    return () => clearInterval(interval);
  }, [tasks, play]);

  // Get deadline for a task from localStorage
  const getTaskDeadline = useCallback((title: string): number | undefined => {
    const deadlines = JSON.parse(localStorage.getItem("task_deadlines") || "{}");
    return deadlines[title] || undefined;
  }, []);

  if (loadingUser || loadingProfile || loadingTasks) {
    return (
      <div className="min-h-screen bg-background p-8 flex flex-col gap-6 max-w-5xl mx-auto">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const mappedProfile: UserProfile = {
    level: profile.currentLevel,
    totalXp: profile.totalXp,
    currentXp: profile.xpInCurrentLevel,
    xpNeeded: profile.xpNeededForNextLevel,
  };

  const mappedUser: User | undefined = user ? {
    ...user,
    createdAt: new Date(user.createdAt)
  } : undefined;

  const handleAddTask = (data: {
    title: string;
    description?: string;
    difficulty: "easy" | "medium" | "hard";
    deadline?: string;
    repeatType?: "daily" | "weekly" | "none";
    repeatDays?: number[];
    repeatEndsAt?: string;
  }) => {
    if (data.deadline) {
      const today = new Date();
      const [hours, minutes] = data.deadline.split(":").map(Number);
      const deadlineDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
      const deadlines = JSON.parse(localStorage.getItem("task_deadlines") || "{}");
      deadlines[data.title] = deadlineDate.getTime();
      localStorage.setItem("task_deadlines", JSON.stringify(deadlines));
    }
    createTaskMutation.mutate(data);
  };

  const handleCompleteTask = (taskId: number) => {
    setCompletingId(taskId);
    completeTaskMutation.mutate({ taskId });
  };

  const handleDeleteTask = (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    deletingCompletedRef.current = task?.completed ?? false;
    deleteTaskMutation.mutate({ taskId });
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  const activeQuests = tasks.filter(t => !t.completed);
  const completedToday = tasks.filter(t => t.completed);

  // Helper title for header
  const getHeaderTitle = () => {
    switch (viewMode) {
      case "list": return "Quadro de Missões";
      case "dungeon": return "Mapa da Masmorra";
      case "shop": return "Loja de Recompensas";
      case "achievements": return "Sala de Troféus";
      case "daily": return "Desafios Diários";
      case "monthly": return "Dungeon do Mês";
      case "pets": return "Meus Mascotinhos";
      case "vault": return "Cofre da Guilda";
    }
  };

  const getHeaderIcon = () => {
    switch (viewMode) {
      case "list": return <ScrollText className="w-5 h-5 text-primary" />;
      case "dungeon": return <Compass className="w-5 h-5 text-primary" />;
      case "shop": return <Gem className="w-5 h-5 text-primary" />;
      case "achievements": return <Trophy className="w-5 h-5 text-primary" />;
      case "daily": return <CalendarCheck className="w-5 h-5 text-primary" />;
      case "monthly": return <Swords className="w-5 h-5 text-primary" />;
      case "pets": return <PawPrint className="w-5 h-5 text-primary" />;
      case "vault": return <Shield className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <div className="container py-8 max-w-6xl space-y-8">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 flex items-center gap-3">
              <img src="/assets/icons/icone.svg" alt="RP8 Logo" className="w-28 h-28 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
              {myGuild?.name || "RP8"}
            </h1>
            <p className="text-muted-foreground">Sua jornada diária começa aqui.</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("open-release-notes"));
                }}
                className="border-blue-500/20 hover:bg-blue-500/10"
              >
                <ScrollText className="mr-2 h-4 w-4" />
                Patch Notes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStats(!showStats)}
                className="border-primary/20 hover:bg-primary/10"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                {showStats ? "Ver Missões" : "Estatísticas"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/guild")}
                className="border-purple-500/20 hover:bg-purple-500/10"
              >
                <Shield className="mr-2 h-4 w-4" />
                Guilda
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/friends")}
                className="border-green-500/20 hover:bg-green-500/10"
              >
                <Users className="mr-2 h-4 w-4" />
                Amigos
              </Button>
              {user?.role === 'admin' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/admin")}
                  className="border-amber-500/20 hover:bg-amber-500/10"
                >
                  <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                  Admin
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <DoorOpen className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>

            {/* Mobile Actions Menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-primary/20">
                    <MoreVertical className="h-4 w-4 mr-1" />
                    Menu
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card/95 border-border">
                  <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent("open-release-notes"))}>
                    <ScrollText className="mr-2 h-4 w-4" /> Patch Notes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowStats(!showStats)}>
                    <BarChart3 className="mr-2 h-4 w-4" /> {showStats ? "Ver Missões" : "Estatísticas"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/guild")}>
                    <Shield className="mr-2 h-4 w-4" /> Guilda
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation("/friends")}>
                    <Users className="mr-2 h-4 w-4" /> Amigos
                  </DropdownMenuItem>
                  {user?.role === 'admin' && (
                    <DropdownMenuItem onClick={() => setLocation("/admin")}>
                      <Sparkles className="mr-2 h-4 w-4 text-amber-500" /> Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => logoutMutation.mutate()} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Stats Section */}
        <section className="animate-in fade-in slide-in-from-top-8 duration-700 delay-100 holographic-container rounded-xl">
          <DailyStats
            user={mappedUser}
            profile={mappedProfile}
            streak={stats?.streak || 0}
          />
        </section>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Quest Board / Map / Shop (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-display font-bold flex items-center gap-2">
                {getHeaderIcon()}
                {getHeaderTitle()}
              </h2>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                {!showStats && (
                  <>
                    {viewMode === "achievements" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <List className="mr-2 h-4 w-4" />
                        Voltar
                      </Button>
                    ) : (
                      <div className="bg-muted/50 backdrop-blur-sm p-1 rounded-xl flex gap-1 border border-border/50 shrink-0">
                        <Button
                          variant={viewMode === "list" ? "secondary" : "ghost"}
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => setViewMode("list")}
                          title="Quadro de Missões"
                        >
                          <ScrollText className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewMode === "dungeon" ? "secondary" : "ghost"}
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => setViewMode("dungeon")}
                          title="Mapa da Masmorra"
                        >
                          <Compass className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewMode === "shop" ? "secondary" : "ghost"}
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => setViewMode("shop")}
                          title="Loja de Itens"
                        >
                          <Gem className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={(viewMode as string) === "achievements" ? "secondary" : "ghost"}
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => setViewMode("achievements")}
                          title="Conquistas"
                        >
                          <Trophy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewMode === "daily" ? "secondary" : "ghost"}
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => setViewMode("daily")}
                          title="Desafios Diários"
                        >
                          <CalendarCheck className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewMode === "monthly" ? "secondary" : "ghost"}
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => setViewMode("monthly")}
                          title="Dungeon do Mês"
                        >
                          <Swords className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewMode === "pets" ? "secondary" : "ghost"}
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => setViewMode("pets")}
                          title="Mascotinhos"
                        >
                          <PawPrint className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={viewMode === "vault" ? "secondary" : "ghost"}
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => setViewMode("vault")}
                          title="Cofre da Guilda"
                        >
                          <Shield className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {viewMode === "list" && <AddQuestDialog onAdd={handleAddTask} />}
                  </>
                )}
              </div>
            </div>

            {showStats ? (
              <div className="bg-card border border-border rounded-xl p-6 shadow-lg animate-in fade-in zoom-in-95 holographic-container">
                <StatsCharts tasks={tasks} totalXp={profile.totalXp} currentLevel={profile.currentLevel} />
              </div>
            ) : viewMode === "dungeon" ? (
              <div className="min-h-[400px] holographic-container rounded-xl p-6 bg-black/20">
                <DungeonMap />
              </div>
            ) : viewMode === "shop" ? (
              <div className="min-h-[400px]">
                <Shop isAdmin={user?.role === "admin"} />
              </div>
            ) : viewMode === "achievements" ? (
              <div className="min-h-[400px]">
                <Achievements />
              </div>
            ) : viewMode === "daily" ? (
              <div className="min-h-[400px] bg-card border border-border rounded-xl p-6 shadow-lg">
                <DailyTasks />
              </div>
            ) : viewMode === "monthly" ? (
              <div className="min-h-[400px]">
                <MonthlyDungeon />
              </div>
            ) : viewMode === "pets" ? (
              <div className="min-h-[400px]">
                <PetDashboard />
              </div>
            ) : viewMode === "vault" ? (
              <div className="min-h-[400px]">
                <GuildVault />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {sortedTasks.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl"
                    >
                      <p>Nenhuma missão ativa.</p>
                      <p className="text-sm">Visite a guilda para aceitar novos desafios!</p>
                    </motion.div>
                  ) : (
                    sortedTasks.map((task) => (
                      <QuestCard
                        key={task.id}
                        task={task}
                        onComplete={handleCompleteTask}
                        onDelete={handleDeleteTask}
                        completing={completingId === task.id}
                        deadline={getTaskDeadline(task.title)}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Sidebar (1/3 width) */}
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700 delay-200">

            {/* HP Bar */}
            <div className="bg-card/50 border border-border rounded-xl p-6 shadow-md backdrop-blur-sm holographic-container">
              <HPBar />
            </div>

            {/* Enhanced Daily Progress */}
            <div className="bg-card/50 border border-border rounded-xl p-6 shadow-md backdrop-blur-sm holographic-container">
              <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Progresso Diário
              </h3>
              <div className="space-y-4">
                {/* Missions progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Missões</span>
                    <span className="text-primary font-bold">
                      {completedToday.length + dailyCompletedCount} / {tasks.length + dailyCompletedCount}
                    </span>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500 rounded-full"
                      style={{ width: `${(tasks.length + dailyCompletedCount) ? ((completedToday.length + dailyCompletedCount) / (tasks.length + dailyCompletedCount)) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* XP Earned Today */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">XP Hoje</span>
                  <span className="font-bold text-yellow-400">
                    ⚡ {completedToday.reduce((sum, t) => sum + (t.xpReward || 0), 0)} XP
                  </span>
                </div>

                {/* Difficulty breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-green-500/10 rounded-lg p-2 border border-green-500/20">
                    <div className="text-lg font-bold text-green-400">
                      {completedToday.filter(t => t.difficulty === "easy").length}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Fácil</div>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-2 border border-blue-500/20">
                    <div className="text-lg font-bold text-blue-400">
                      {completedToday.filter(t => t.difficulty === "medium").length}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Médio</div>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                    <div className="text-lg font-bold text-red-400">
                      {completedToday.filter(t => t.difficulty === "hard").length}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Difícil</div>
                  </div>
                </div>

                {/* HP Status */}
                <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                  <span className="text-muted-foreground">Ouro</span>
                  <span className="font-bold text-yellow-500">
                    🪙 {gold}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Release Notes Modal */}
      {profile && (
        <ReleaseNotes
          lastSeenVersion={profile.lastSeenVersion as string}
          onClose={() => queryClient.invalidateQueries({ queryKey: [["profile", "getProfile"]] })}
        />
      )}
    </div>
  );
}

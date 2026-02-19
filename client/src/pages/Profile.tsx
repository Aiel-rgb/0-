import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mountain, ArrowLeft, Zap, Trophy, TrendingUp, Pencil, Shield, Users, Swords, Flame, Target, Coins } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { LevelAvatar, getRankName, getRankColor } from "@/components/LevelAvatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Radar, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, Legend
} from "recharts";
import { UserPlus, UserCheck, UserX, Palette, Sparkles, CheckCircle2, Upload } from "lucide-react";
import { AvatarUploadDialog } from "@/components/AvatarUploadDialog";

const DIFF_COLORS = { easy: "#22c55e", medium: "#3b82f6", hard: "#ef4444" };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 border border-primary/50 p-3 rounded-lg shadow-[0_0_15px_rgba(0,217,255,0.3)] backdrop-blur-md">
        <p className="text-primary font-bold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-mono">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Profile() {
  const [, setLocation] = useLocation();
  const [customAvatar, setCustomAvatar] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const utils = trpc.useContext();
  const { data: user, isLoading: loadingUser } = trpc.auth.me.useQuery();
  const { data: profile, isLoading: loadingProfile } = trpc.profile.getProfile.useQuery();
  const { data: tasks = [], isLoading: loadingTasks } = trpc.tasks.list.useQuery();
  const { data: stats } = trpc.profile.getStats.useQuery();

  const { data: myGuild } = trpc.guild.get.useQuery();

  // Friends Data
  const { data: friends = [], refetch: refetchFriends } = trpc.friends.list.useQuery();
  const { data: friendRequests = [], refetch: refetchRequests } = trpc.friends.requests.useQuery();

  const sendFriendRequestMutation = trpc.friends.send.useMutation({
    onSuccess: () => { toast.success("Pedido de amizade enviado!"); },
    onError: (e) => { toast.error(e.message); }
  });

  const acceptFriendRequestMutation = trpc.friends.accept.useMutation({
    onSuccess: () => {
      toast.success("Agora vocês são amigos!");
      refetchFriends();
      refetchRequests();
    }
  });

  const rejectFriendRequestMutation = trpc.friends.reject.useMutation({
    onSuccess: () => {
      toast.success("Pedido rejeitado.");
      refetchRequests();
    }
  });

  const removeFriendMutation = trpc.friends.remove.useMutation({
    onSuccess: () => {
      toast.success("Amigo removido.");
      refetchFriends();
    }
  });

  const { data: unlockedThemes = [] } = trpc.profile.getUnlockedThemes.useQuery();
  const equipThemeMutation = trpc.profile.equipTheme.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Tema aplicado com sucesso!");
        utils.profile.getProfile.invalidate();
      }
    }
  });

  const [friendIdInput, setFriendIdInput] = useState("");
  const handleSendFriendRequest = () => {
    const id = parseInt(friendIdInput);
    if (isNaN(id)) return;
    sendFriendRequestMutation.mutate({ friendId: id });
    setFriendIdInput("");
  };

  // Only fetch guild data if user has a guild
  const guildId = myGuild?.id;
  const { data: guildRaids = [] } = trpc.guild.raids.useQuery(
    { guildId: guildId! },
    { enabled: !!guildId }
  );
  const { data: guildMembers = [] } = trpc.guild.members.useQuery(
    { guildId: guildId! },
    { enabled: !!guildId }
  );

  const updateAvatarMutation = trpc.profile.updateAvatar.useMutation({
    onSuccess: (data) => {
      if (data.success) { toast.success("Avatar atualizado!"); utils.auth.me.invalidate(); }
      else toast.error("Falha ao salvar avatar.");
    },
    onError: () => toast.error("Erro de conexão ao atualizar avatar."),
  });

  const uploadAvatarMutation = trpc.profile.uploadAvatar.useMutation({
    onSuccess: (data) => {
      if (data.success) { toast.success("Foto enviada com sucesso!"); utils.auth.me.invalidate(); }
      else toast.error("Falha ao salvar foto.");
    },
    onError: (error) => toast.error(`Erro ao enviar foto: ${error.message}`),
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("A imagem deve ter no máximo 5MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        uploadAvatarMutation.mutate({ imageData: reader.result, fileName: file.name });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateAvatar = (url: string) => {
    updateAvatarMutation.mutate({ avatarUrl: url });
  };

  useEffect(() => {
    if (!loadingUser && !user) setLocation("/login");
  }, [user, loadingUser, setLocation]);

  if (loadingUser || loadingProfile || loadingTasks) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!profile) return null;

  // ── Calculations ──
  const completedTasks = tasks.filter((t: any) => t.completed);
  const completedCount = completedTasks.length;
  const totalCount = tasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const easyCompleted = completedTasks.filter((t: any) => t.difficulty === "easy").length;
  const mediumCompleted = completedTasks.filter((t: any) => t.difficulty === "medium").length;
  const hardCompleted = completedTasks.filter((t: any) => t.difficulty === "hard").length;
  const easyTotal = tasks.filter((t: any) => t.difficulty === "easy").length;
  const mediumTotal = tasks.filter((t: any) => t.difficulty === "medium").length;
  const hardTotal = tasks.filter((t: any) => t.difficulty === "hard").length;

  const goldEarned = (easyCompleted * 50) + (mediumCompleted * 100) + (hardCompleted * 200);
  const goldBalance = Number(localStorage.getItem("shop_gold") || "0");

  const xpFromEasy = completedTasks.filter((t: any) => t.difficulty === "easy").reduce((s: number, t: any) => s + t.xpReward, 0);
  const xpFromMedium = completedTasks.filter((t: any) => t.difficulty === "medium").reduce((s: number, t: any) => s + t.xpReward, 0);
  const xpFromHard = completedTasks.filter((t: any) => t.difficulty === "hard").reduce((s: number, t: any) => s + t.xpReward, 0);

  const xpPercentage = (profile.xpInCurrentLevel / profile.xpNeededForNextLevel) * 100;

  // ── Chart Data ──
  const difficultyData = [
    { name: "Fácil", Completas: easyCompleted, Pendentes: easyTotal - easyCompleted },
    { name: "Médio", Completas: mediumCompleted, Pendentes: mediumTotal - mediumCompleted },
    { name: "Difícil", Completas: hardCompleted, Pendentes: hardTotal - hardCompleted },
  ];

  const completionData = [
    { name: "Concluídas", value: completedCount, color: "#22c55e" },
    { name: "Pendentes", value: Math.max(totalCount - completedCount, 0), color: "#374151" },
  ];

  const maxDiffCount = Math.max(easyCompleted, mediumCompleted, hardCompleted, 1);
  const attributesData = [
    { subject: "Agilidade", A: Math.min((easyCompleted / maxDiffCount) * 100, 100) },
    { subject: "Força", A: Math.min((mediumCompleted / maxDiffCount) * 100, 100) },
    { subject: "Sabedoria", A: Math.min((hardCompleted / maxDiffCount) * 100, 100) },
    { subject: "Disciplina", A: Math.min(completionRate, 100) },
    { subject: "Resistência", A: Math.min(profile.currentLevel * 8, 100) },
  ];

  const xpDistribution = [
    { name: "Fácil", value: xpFromEasy, color: DIFF_COLORS.easy },
    { name: "Médio", value: xpFromMedium, color: DIFF_COLORS.medium },
    { name: "Difícil", value: xpFromHard, color: DIFF_COLORS.hard },
  ].filter(d => d.value > 0);

  // Guild chart data
  const guildCompletedRaids = guildRaids.filter((r: any) => r.status === "completed").length;
  const guildActiveRaids = guildRaids.filter((r: any) => r.status === "active").length;
  const guildRaidData = [
    { name: "Completadas", value: guildCompletedRaids, color: "#22c55e" },
    { name: "Ativas", value: guildActiveRaids, color: "#f59e0b" },
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <img src="/assets/icons/icone.svg" alt="RP8 Logo" className="w-28 h-28 object-contain" />
            <span className="font-display text-xl text-primary">RP8</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </div>
      </header>

      {/* Main Content — Dashboard Layout */}
      <main className="container py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">

          {/* ═══ LEFT SIDEBAR — Profile ═══ */}
          <motion.aside
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Profile Card */}
            <Card className="bg-card/50 border-border p-6 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />

              <div className="flex flex-col items-center text-center relative">
                {/* Avatar */}
                <div className="relative mb-4">
                  <LevelAvatar level={profile.currentLevel} avatarUrl={user?.avatarUrl || undefined} size="lg" />
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full shadow-lg border border-primary/20 hover:border-primary w-8 h-8">
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-primary/20">
                      <DialogHeader>
                        <DialogTitle>Alterar Avatar</DialogTitle>
                      </DialogHeader>
                      <Tabs defaultValue="presets" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="presets">Heróis</TabsTrigger>
                          <TabsTrigger value="upload">PC</TabsTrigger>
                          <TabsTrigger value="url">Link</TabsTrigger>
                        </TabsList>
                        <TabsContent value="presets" className="py-4">
                          <div className="grid grid-cols-4 gap-4">
                            {["Felix", "Aneka", "Zoe", "Bandit", "Shadow", "Gizmo", "Trouble", "Misty"].map((seed) => (
                              <button key={seed} onClick={() => handleUpdateAvatar(`https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`)}
                                className="relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-primary hover:scale-105 transition-all">
                                <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`} alt={seed} className="w-full h-full object-cover bg-secondary/50" />
                              </button>
                            ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="upload" className="py-4 space-y-4">
                          <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/30 rounded-xl p-8 hover:border-primary/60 transition-colors bg-primary/5 cursor-pointer" onClick={() => setIsUploadDialogOpen(true)}>
                            <Upload className="w-10 h-10 text-primary mb-2" />
                            <p className="text-sm text-muted-foreground mb-4 text-center">Clique para abrir o editor<br />(max 5MB)</p>
                            <Button variant="secondary">
                              Escolher Arquivo
                            </Button>
                          </div>
                          <AvatarUploadDialog
                            isOpen={isUploadDialogOpen}
                            onClose={() => setIsUploadDialogOpen(false)}
                            onUpload={(blob) => {
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === 'string') {
                                  uploadAvatarMutation.mutate({ imageData: reader.result, fileName: "avatar.jpg" });
                                }
                              };
                              reader.readAsDataURL(blob);
                            }}
                            isUploading={uploadAvatarMutation.isPending}
                          />
                        </TabsContent>
                        <TabsContent value="url" className="py-4 space-y-4">
                          <Input placeholder="https://exemplo.com/avatar.png" value={customAvatar} onChange={(e) => setCustomAvatar(e.target.value)} />
                          <Button onClick={() => handleUpdateAvatar(customAvatar)} disabled={!customAvatar} className="w-full">Salvar URL</Button>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Name & Rank */}
                <h2 className="text-2xl font-display font-bold">{user?.name || "Aventureiro"}</h2>
                <p className={`text-lg font-medium ${getRankColor(profile.currentLevel)}`}>
                  {getRankName(profile.currentLevel)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Nível {profile.currentLevel}</p>

                {unlockedThemes.some(t => t.themeId === "astral") && (
                  <Badge variant="outline" className="mt-2 text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Viajante Astral
                  </Badge>
                )}

                {/* XP Bar */}
                <div className="w-full mt-4 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>XP Progresso</span>
                    <span>{profile.xpInCurrentLevel}/{profile.xpNeededForNextLevel}</span>
                  </div>
                  <div className="w-full bg-secondary/50 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary to-primary/60 h-full transition-all duration-500 shadow-[0_0_10px_rgba(0,217,255,0.4)]" style={{ width: `${xpPercentage}%` }} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-card/50 border-border p-5 backdrop-blur-sm">
              <h3 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4">Estatísticas</h3>
              <div className="space-y-3">
                {[
                  { icon: Zap, label: "XP Total", value: profile.totalXp, color: "text-yellow-400" },
                  { icon: Target, label: "Missões Total", value: totalCount, color: "text-blue-400" },
                  { icon: Trophy, label: "Concluídas", value: completedCount, color: "text-green-400" },
                  { icon: TrendingUp, label: "Taxa Sucesso", value: `${completionRate}%`, color: "text-cyan-400" },
                  { icon: Flame, label: "Streak", value: stats?.streak || 0, color: "text-orange-400" },
                  { icon: Coins, label: "Ouro", value: goldBalance, color: "text-amber-400" },
                ].map(({ icon: Icon, label, value, color }, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon className={`w-4 h-4 ${color}`} /> {label}
                    </span>
                    <span className={`font-display font-bold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Themes Selection */}
            <Card className="bg-card/50 border-border p-5 backdrop-blur-sm">
              <h3 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" /> Visual do Perfil
              </h3>
              <div className="space-y-3">
                <div
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer",
                    profile.equippedThemeId === "default" ? "border-primary bg-primary/5" : "border-transparent bg-secondary/20 hover:bg-secondary/30"
                  )}
                  onClick={() => equipThemeMutation.mutate({ themeId: "default" })}
                >
                  <span className="text-sm font-medium">Padrão RP8</span>
                  {profile.equippedThemeId === "default" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>

                {unlockedThemes.map(theme => (
                  <div
                    key={theme.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer",
                      profile.equippedThemeId === theme.themeId ? "border-primary bg-primary/5 shadow-[0_0_10px_rgba(139,92,246,0.3)]" : "border-transparent bg-secondary/20 hover:bg-secondary/30"
                    )}
                    onClick={() => equipThemeMutation.mutate({ themeId: theme.themeId })}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-bold capitalize">{theme.themeId}</span>
                      <span className="text-[10px] text-muted-foreground">Exclusivo de Dungeon</span>
                    </div>
                    {profile.equippedThemeId === theme.themeId && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </div>
                ))}

                {unlockedThemes.length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic">Complete dungeons mensais para desbloquear novos temas visuais.</p>
                )}
              </div>
            </Card>

            {/* Difficulty Breakdown */}
            <Card className="bg-card/50 border-border p-5 backdrop-blur-sm">
              <h3 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4">Dificuldade</h3>
              <div className="space-y-3">
                {[
                  { label: "Fácil", done: easyCompleted, total: easyTotal, color: "bg-green-500", text: "text-green-400" },
                  { label: "Médio", done: mediumCompleted, total: mediumTotal, color: "bg-blue-500", text: "text-blue-400" },
                  { label: "Difícil", done: hardCompleted, total: hardTotal, color: "bg-red-500", text: "text-red-400" },
                ].map((d, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={d.text}>{d.label}</span>
                      <span className="text-foreground font-bold">{d.done}/{d.total}</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full ${d.color} rounded-full transition-all duration-500`} style={{ width: `${d.total > 0 ? (d.done / d.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Guild Info */}
            {myGuild && (
              <Card className="bg-gradient-to-br from-primary/5 to-purple-600/5 border-primary/20 p-5 backdrop-blur-sm cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => setLocation("/guild")}>
                <h3 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> Guilda
                </h3>
                <p className="font-display font-bold text-lg text-primary">{myGuild.name}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Zap className="w-3 h-3" /> {myGuild.totalXp} XP
                  </span>
                  <span className="flex items-center gap-1 text-red-400">
                    <Swords className="w-3 h-3" /> {myGuild.totalRaidsCompleted} Raids
                  </span>
                  <span className="flex items-center gap-1 text-blue-400">
                    <Users className="w-3 h-3" /> {guildMembers.length}
                  </span>
                </div>
              </Card>
            )}

            {/* Friends Card */}
            <Card className="bg-card/50 border-border p-5 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" /> Amigos ({friends.length})
                </h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-6 w-6"><UserPlus className="w-4 h-4" /></Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Amigo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="ID do Usuário"
                          value={friendIdInput}
                          onChange={(e) => setFriendIdInput(e.target.value)}
                          type="number"
                        />
                        <Button onClick={handleSendFriendRequest} disabled={!friendIdInput}>Enviar</Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Seu ID é: <span className="font-bold text-primary">{user?.id}</span>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Friend Requests */}
              {friendRequests.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-xs font-bold text-yellow-400 uppercase">Solicitações Pendentes</p>
                  {friendRequests.map(req => (
                    <div key={req.requestId} className="flex items-center justify-between bg-black/20 p-2 rounded-lg">
                      <span className="text-sm font-bold truncate">{req.name}</span>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-green-400 hover:bg-green-500/10" onClick={() => acceptFriendRequestMutation.mutate({ requestId: req.requestId })}>
                          <UserCheck className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:bg-red-500/10" onClick={() => rejectFriendRequestMutation.mutate({ requestId: req.requestId })}>
                          <UserX className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Friends List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {friends.length === 0 && friendRequests.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum amigo ainda.</p>
                )}
                {friends.map(friend => (
                  <div key={friend.friendshipId} className="flex items-center gap-3 bg-secondary/20 p-2 rounded-lg group">
                    <LevelAvatar level={friend.level} avatarUrl={friend.avatarUrl || undefined} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate">{friend.name}</p>
                        {(friend as any).role === 'admin' && (
                          <Badge variant="default" className="text-[10px] h-4 bg-primary/20 text-primary hover:bg-primary/30 border-primary/50">
                            ADMIN
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">Lvl {friend.level}</p>
                    </div>
                    <Button
                      size="icon" variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm("Remover amigo?")) removeFriendMutation.mutate({ friendshipId: friend.friendshipId });
                      }}
                    >
                      <UserX className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {!myGuild && (
              <Card className="bg-card/50 border-border p-5 backdrop-blur-sm">
                <h3 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Guilda
                </h3>
                <p className="text-sm text-muted-foreground mb-3">Você ainda não faz parte de uma guilda.</p>
                <Button size="sm" variant="outline" onClick={() => setLocation("/guild")} className="w-full border-primary/30 hover:bg-primary/10">
                  Explorar Guildas
                </Button>
              </Card>
            )}
          </motion.aside>

          {/* ═══ RIGHT SIDE — Charts Grid ═══ */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
              Painel de Estatísticas
            </h2>

            {/* Summary Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Missões", val: totalCount, icon: Target, color: "text-blue-400", border: "border-blue-500/20" },
                { label: "Concluídas", val: completedCount, icon: Trophy, color: "text-green-400", border: "border-green-500/20" },
                { label: "XP Total", val: profile.totalXp, icon: Zap, color: "text-yellow-400", border: "border-yellow-500/20" },
                { label: "Ouro Ganho", val: goldEarned, icon: Coins, color: "text-amber-400", border: "border-amber-500/20" },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className={`bg-card/40 border ${s.border} p-4 rounded-xl backdrop-blur-sm flex flex-col items-center justify-center text-center gap-1`}
                >
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{s.label}</span>
                  <span className={`text-2xl font-display font-bold ${s.color}`}>{s.val}</span>
                </motion.div>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

              {/* 1. Bar: Tarefas por Dificuldade */}
              <Card className="bg-black/40 border-primary/30 p-4 holographic-container min-h-[300px] flex flex-col">
                <h3 className="font-display text-primary text-center mb-2 text-xs font-bold uppercase tracking-widest">Tarefas Completas</h3>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={difficultyData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Completas" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Pendentes" stackId="a" fill="#374151" radius={[4, 4, 0, 0]} />
                      <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* 2. Area: XP Ganho simulação */}
              <Card className="bg-black/40 border-primary/30 p-4 holographic-container min-h-[300px] flex flex-col">
                <h3 className="font-display text-primary text-center mb-2 text-xs font-bold uppercase tracking-widest">XP por Dificuldade</h3>
                <div className="flex-1 w-full relative">
                  {xpDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={xpDistribution} cx="50%" cy="45%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none" animationDuration={800}>
                          {xpDistribution.map((entry, index) => (<Cell key={`xp-${index}`} fill={entry.color} />))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Nenhum dado</div>
                  )}
                  {xpDistribution.length > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: "30px" }}>
                      <div className="text-center">
                        <span className="text-2xl font-bold text-yellow-400 block">{profile.totalXp}</span>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest">XP Total</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* 3. Donut: Taxa de Sucesso */}
              <Card className="bg-black/40 border-primary/30 p-4 holographic-container min-h-[300px] flex flex-col">
                <h3 className="font-display text-primary text-center mb-2 text-xs font-bold uppercase tracking-widest">Taxa de Sucesso</h3>
                <div className="flex-1 w-full relative">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={completionData} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none" animationDuration={800}>
                        {completionData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: "30px" }}>
                    <div className="text-center">
                      <span className="text-3xl font-bold text-white block">{completionRate}%</span>
                      <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Conclusão</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 4. Radar: Atributos */}
              <Card className="bg-black/40 border-primary/30 p-4 holographic-container min-h-[300px] flex flex-col">
                <h3 className="font-display text-primary text-center mb-2 text-xs font-bold uppercase tracking-widest">Atributos do Herói</h3>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={attributesData}>
                      <PolarGrid stroke="rgba(0, 217, 255, 0.15)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Atributos" dataKey="A" stroke="#00d9ff" strokeWidth={2} fill="#00d9ff" fillOpacity={0.25} dot={{ r: 3, fill: "#00d9ff" }} />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* 5. Guild XP Chart */}
              {myGuild && (
                <Card className="bg-black/40 border-purple-500/30 p-4 holographic-container min-h-[300px] flex flex-col">
                  <h3 className="font-display text-purple-400 text-center mb-2 text-xs font-bold uppercase tracking-widest">
                    <Shield className="w-3.5 h-3.5 inline mr-1" />Guild XP
                  </h3>
                  <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="text-center">
                      <span className="text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">{myGuild.totalXp}</span>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">XP da Guilda</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full max-w-[200px]">
                      <div className="text-center bg-card/30 rounded-lg p-3 border border-border/30">
                        <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                        <span className="text-xl font-bold text-foreground">{guildMembers.length}</span>
                        <p className="text-[9px] text-muted-foreground uppercase">Membros</p>
                      </div>
                      <div className="text-center bg-card/30 rounded-lg p-3 border border-border/30">
                        <Swords className="w-4 h-4 text-red-400 mx-auto mb-1" />
                        <span className="text-xl font-bold text-foreground">{myGuild.totalRaidsCompleted}</span>
                        <p className="text-[9px] text-muted-foreground uppercase">Raids</p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* 6. Guild Raids Chart */}
              {myGuild && guildRaidData.length > 0 && (
                <Card className="bg-black/40 border-red-500/30 p-4 holographic-container min-h-[300px] flex flex-col">
                  <h3 className="font-display text-red-400 text-center mb-2 text-xs font-bold uppercase tracking-widest">
                    <Swords className="w-3.5 h-3.5 inline mr-1" />Raids
                  </h3>
                  <div className="flex-1 w-full relative">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={guildRaidData} cx="50%" cy="45%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none" animationDuration={800}>
                          {guildRaidData.map((entry, index) => (<Cell key={`raid-${index}`} fill={entry.color} />))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: "30px" }}>
                      <div className="text-center">
                        <span className="text-2xl font-bold text-red-400 block">{guildRaids.length}</span>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Total Raids</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Economy Summary — spans remainder */}
              <Card className="bg-black/40 border-amber-500/30 p-5 holographic-container min-h-[300px] flex flex-col justify-center md:col-span-2 xl:col-span-1">
                <h3 className="font-display text-amber-400 text-center mb-4 text-xs font-bold uppercase tracking-widest">💰 Economia</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Ganho</p>
                    <p className="text-xl font-display font-bold text-amber-400">{goldEarned}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Atual</p>
                    <p className="text-xl font-display font-bold text-yellow-500">🪙 {goldBalance}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Gasto</p>
                    <p className="text-xl font-display font-bold text-red-400">{Math.max(goldEarned - goldBalance, 0)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-500/10 grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">XP/Missão</p>
                    <p className="text-lg font-display font-bold text-cyan-400">{completedCount > 0 ? Math.round(profile.totalXp / completedCount) : 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Ouro/Missão</p>
                    <p className="text-lg font-display font-bold text-amber-400">{completedCount > 0 ? Math.round(goldEarned / completedCount) : 0} 🪙</p>
                  </div>
                </div>
              </Card>

            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

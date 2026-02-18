import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Users, Swords, Crown, ArrowLeft, Mountain, Zap, Plus, CheckCircle2, Clock, XCircle, LogOut, Hand } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateGuildDialog } from "@/components/CreateGuildDialog";
import { GuildCard } from "@/components/GuildCard";
import { LevelAvatar, getRankName } from "@/components/LevelAvatar";
import { BattleFeed } from "@/components/BattleFeed";

import { trpc } from "@/lib/trpc";

export default function GuildPage({ inviteCode }: { inviteCode?: string }) {
    const [, setLocation] = useLocation();
    const [inviteCodeInput, setInviteCodeInput] = useState(inviteCode || "");
    const { data: user, isLoading: loadingUser } = trpc.auth.me.useQuery();
    const { data: myGuild, isLoading: loadingGuild, refetch: refetchGuild } = trpc.guild.get.useQuery();
    const { data: allGuilds = [], refetch: refetchList } = trpc.guild.list.useQuery();

    const joinByCodeMutation = trpc.guild.joinByCode.useMutation({
        onSuccess: () => {
            toast.success("Você entrou na guilda!", { icon: "🛡️" });
            refetchGuild();
            refetchList();
            if (inviteCode) window.history.replaceState({}, "", "/guild");
        },
        onError: (err) => toast.error(err.message),
    });

    const handleJoinByCode = () => {
        if (!inviteCodeInput) return;
        joinByCodeMutation.mutate({ code: inviteCodeInput });
    };

    // Auto-join if invite code is present in props and user is not in a guild (and we are not loading)
    useEffect(() => {
        if (inviteCode && !loadingGuild && !myGuild) {
            setInviteCodeInput(inviteCode);
        }
    }, [inviteCode, loadingGuild, myGuild]);

    // Only fetch members/raids if user has a guild
    const guildId = myGuild?.id;
    const { data: members = [] } = trpc.guild.members.useQuery(
        { guildId: guildId! },
        { enabled: !!guildId }
    );
    const { data: raids = [], refetch: refetchRaids } = trpc.guild.raids.useQuery(
        { guildId: guildId! },
        { enabled: !!guildId }
    );

    const isLeader = myGuild?.memberRole === "leader";

    // Mutations
    const createGuildMutation = trpc.guild.create.useMutation({
        onSuccess: () => {
            toast.success("Guilda criada com sucesso!", { icon: "⚔️" });
            refetchGuild();
            refetchList();
        },
        onError: (err) => toast.error(err.message),
    });

    const joinGuildMutation = trpc.guild.join.useMutation({
        onSuccess: () => {
            toast.success("Você entrou na guilda!", { icon: "🛡️" });
            refetchGuild();
            refetchList();
        },
        onError: (err) => toast.error(err.message),
    });

    const leaveGuildMutation = trpc.guild.leave.useMutation({
        onSuccess: () => {
            toast.success("Você saiu da guilda.", { icon: "🚪" });
            refetchGuild();
            refetchList();
        },
        onError: (err) => toast.error(err.message),
    });

    const createRaidMutation = trpc.guild.createRaid.useMutation({
        onSuccess: () => {
            toast.success("Raid criada!", { icon: "⚔️" });
            refetchRaids();
        },
        onError: (err) => toast.error(err.message),
    });

    const participateRaidMutation = trpc.guild.participateRaid.useMutation({
        onSuccess: () => {
            toast.success("Você participou da raid! Aguarde os outros membros.", { icon: "🙌" });
            refetchRaids();
            refetchGuild(); // To update XP if completed
        },
        onError: (err) => toast.error(err.message),
    });

    // Auth check
    useEffect(() => {
        if (!loadingUser && !user) setLocation("/login");
    }, [user, loadingUser, setLocation]);

    if (loadingUser || loadingGuild) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    <Skeleton className="h-12 w-48 rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // USER HAS A GUILD — SHOW GUILD DASHBOARD
    // ═══════════════════════════════════════════
    if (myGuild) {
        const activeRaids = raids.filter((r: any) => r.status === "active");
        const completedRaids = raids.filter((r: any) => r.status === "completed");

        return (
            <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
                    <div className="container flex items-center justify-between py-4">
                        <div className="flex items-center gap-2">
                            <Mountain className="h-8 w-8 text-primary" />
                            <span className="font-display text-xl text-primary">PEAK</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")} className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" /> Voltar
                        </Button>
                    </div>
                </header>

                <main className="container py-8 max-w-6xl space-y-8">
                    {/* Guild Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative bg-gradient-to-br from-primary/10 via-card/50 to-purple-600/10 border border-primary/20 rounded-2xl p-8 overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-purple-600/30 border-2 border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
                                    <Shield className="w-10 h-10 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                                        {myGuild.name}
                                    </h1>
                                    {myGuild.description && (
                                        <p className="text-muted-foreground mt-1">{myGuild.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-sm">
                                        <span className="flex items-center gap-1 text-yellow-400">
                                            <Zap className="w-4 h-4" /> {myGuild.totalXp} XP
                                        </span>
                                        <span className="flex items-center gap-1 text-red-400">
                                            <Swords className="w-4 h-4" /> {myGuild.totalRaidsCompleted} Raids
                                        </span>
                                        <span className="flex items-center gap-1 text-blue-400">
                                            <Users className="w-4 h-4" /> {members.length} Membros
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => leaveGuildMutation.mutate({ guildId: myGuild.id })}
                                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                {isLeader ? "Dissolver Guilda" : "Sair da Guilda"}
                            </Button>
                        </div>
                        {myGuild.inviteCode && (
                            <div className="mt-4 flex items-center gap-2 bg-black/20 p-2 rounded-lg w-fit border border-primary/10">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Código de Convite:</span>
                                <code className="text-primary font-mono font-bold">{myGuild.inviteCode}</code>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/guild/invite/${myGuild.inviteCode}`);
                                    toast.success("Link copiado!");
                                }}>
                                    <Zap className="w-3 h-3" />
                                </Button>
                            </div>
                        )}
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Members */}
                        <div className="lg:col-span-1 space-y-4">
                            <h2 className="text-xl font-display font-bold flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" /> Membros
                            </h2>
                            <div className="space-y-2">
                                {members.map((member: any) => (
                                    <motion.div
                                        key={member.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="bg-card/50 border border-border rounded-xl p-3 flex items-center gap-3 backdrop-blur-sm"
                                    >
                                        <LevelAvatar level={member.level || 1} avatarUrl={member.avatarUrl || undefined} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate">{member.name || "Aventureiro"}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {member.role === "leader" ? (
                                                    <span className="text-yellow-400 flex items-center gap-1"><Crown className="w-3 h-3" /> Líder</span>
                                                ) : member.role === "officer" ? (
                                                    <span className="text-blue-400">Oficial</span>
                                                ) : (
                                                    <span>Membro</span>
                                                )}
                                                {" · Lvl "}{member.level || 1}
                                            </p>
                                        </div>
                                        <span className="text-xs text-yellow-400 font-bold">{member.totalXp || 0} XP</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Raids */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-display font-bold flex items-center gap-2">
                                    <Swords className="w-5 h-5 text-red-400" /> Raids da Guilda
                                </h2>
                                {isLeader && <CreateRaidDialog guildId={myGuild.id} onCreateRaid={(data) => createRaidMutation.mutate(data)} isPending={createRaidMutation.isPending} />}
                            </div>

                            {/* Active Raids */}
                            {activeRaids.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-orange-400 uppercase tracking-widest">⚔️ Raids Ativas</h3>
                                    {activeRaids.map((raid: any) => (
                                        <RaidCard key={raid.id} raid={raid} onParticipate={() => participateRaidMutation.mutate({ raidId: raid.id, guildId: myGuild.id })} />
                                    ))}
                                </div>
                            )}

                            {/* Completed Raids */}
                            {completedRaids.length > 0 && (
                                <div className="space-y-3 mt-6">
                                    <h3 className="text-sm font-bold text-green-400 uppercase tracking-widest">✅ Raids Completadas</h3>
                                    {completedRaids.map((raid: any) => (
                                        <RaidCard key={raid.id} raid={raid} />
                                    ))}
                                </div>
                            )}

                            {raids.length === 0 && (
                                <div className="text-center py-12 border-2 border-dashed border-border rounded-xl text-muted-foreground">
                                    <Swords className="w-10 h-10 mx-auto mb-3 opacity-50" />
                                    <p>Nenhuma raid criada ainda.</p>
                                    {isLeader && <p className="text-sm mt-1">Como líder, crie a primeira raid mensal!</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
                <BattleFeed />
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // USER HAS NO GUILD — SHOW BROWSE + CREATE
    // ═══════════════════════════════════════════
    return (
        <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
            <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
                <div className="container flex items-center justify-between py-4">
                    <div className="flex items-center gap-2">
                        <Mountain className="h-8 w-8 text-primary" />
                        <span className="font-display text-xl text-primary">PEAK</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")} className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" /> Voltar
                    </Button>
                </div>
            </header>

            <main className="container py-8 max-w-5xl space-y-8">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                                Guildas
                            </h1>
                            <p className="text-muted-foreground">Junte-se a uma guilda ou crie a sua própria!</p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Código de Convite"
                                    value={inviteCodeInput}
                                    onChange={(e) => setInviteCodeInput(e.target.value)}
                                    className="bg-secondary/50 border-primary/20 w-40"
                                />
                                <Button
                                    variant="outline"
                                    disabled={!inviteCodeInput || joinByCodeMutation.isPending}
                                    onClick={handleJoinByCode}
                                >
                                    Entrar
                                </Button>
                            </div>
                            <CreateGuildDialog
                                onCreateGuild={(data) => createGuildMutation.mutate(data)}
                                isPending={createGuildMutation.isPending}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Guild List */}
                {allGuilds.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allGuilds.map((guild: any) => (
                            <GuildCard
                                key={guild.id}
                                guild={guild}
                                onJoin={(id) => joinGuildMutation.mutate({ guildId: id })}
                                isJoining={joinGuildMutation.isPending}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border-2 border-dashed border-border rounded-xl text-muted-foreground">
                        <Shield className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <h3 className="text-xl font-display font-bold text-foreground/70 mb-2">Nenhuma guilda encontrada</h3>
                        <p>Seja o primeiro a criar uma guilda e recrutar aventureiros!</p>
                    </div>
                )}
            </main>
        </div>
    );
}

// ─── Raid Card Sub-component ───
function RaidCard({ raid, onParticipate }: { raid: any; onParticipate?: () => void }) {
    const diffColors = { easy: "text-green-400 border-green-500/20 bg-green-500/5", medium: "text-blue-400 border-blue-500/20 bg-blue-500/5", hard: "text-red-400 border-red-500/20 bg-red-500/5" };
    const diffLabels = { easy: "Fácil", medium: "Médio", hard: "Difícil" };
    const statusIcons = {
        active: <Clock className="w-4 h-4 text-orange-400" />,
        completed: <CheckCircle2 className="w-4 h-4 text-green-400" />,
        failed: <XCircle className="w-4 h-4 text-red-400" />,
    };

    const isParticipated = raid.userParticipated;
    const progress = Math.round((raid.participantsCount / raid.totalMembers) * 100) || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-card/50 border rounded-xl p-4 backdrop-blur-sm ${raid.status === "completed" ? "border-green-500/20 opacity-80" : raid.status === "failed" ? "border-red-500/20 opacity-80" : "border-border"}`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {statusIcons[raid.status as keyof typeof statusIcons]}
                        <h4 className="font-bold text-foreground">{raid.title}</h4>
                    </div>
                    {raid.description && <p className="text-sm text-muted-foreground mb-2">{raid.description}</p>}
                    <div className="flex items-center gap-3 text-xs mb-3">
                        <span className={`px-2 py-0.5 rounded-full border ${diffColors[raid.difficulty as keyof typeof diffColors]}`}>
                            {diffLabels[raid.difficulty as keyof typeof diffLabels]}
                        </span>
                        <span className="text-yellow-400 font-bold">⚡ {raid.xpReward} XP</span>
                        <span className="text-muted-foreground">{raid.month}/{raid.year}</span>
                    </div>

                    {raid.status === 'active' && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>Progresso da Equipe</span>
                                <span>{raid.participantsCount}/{raid.totalMembers} Membros</span>
                            </div>
                            <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {raid.status === "active" && onParticipate && (
                    <div className="flex flex-col items-end justify-center">
                        {!isParticipated ? (
                            <Button size="sm" onClick={onParticipate} className="bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600/30">
                                <Hand className="w-4 h-4 mr-1" /> Participar
                            </Button>
                        ) : (
                            <div className="text-center px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-md">
                                <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
                                <span className="text-[10px] text-green-400 block font-bold">Inscrito!</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ─── Create Raid Dialog ───
function CreateRaidDialog({ guildId, onCreateRaid, isPending }: { guildId: number; onCreateRaid: (data: any) => void; isPending: boolean }) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        onCreateRaid({ guildId, title: title.trim(), description: description.trim() || undefined, difficulty });
        setTitle("");
        setDescription("");
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 font-bold gap-1">
                    <Plus className="w-4 h-4" /> Nova Raid
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-primary/20">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-display">
                        <Swords className="w-5 h-5 text-red-400" /> Criar Raid Mensal
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Título da Raid</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Conquistar 50 tarefas em grupo" className="bg-background/50 border-primary/20" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Descrição (Opcional)</Label>
                        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes da raid..." className="bg-background/50 border-primary/20" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Dificuldade</Label>
                        <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
                            <SelectTrigger className="bg-background/50 border-primary/20"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="easy">🟢 Fácil (300 XP)</SelectItem>
                                <SelectItem value="medium">🔵 Médio (500 XP)</SelectItem>
                                <SelectItem value="hard">🔴 Difícil (1000 XP)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" className="w-full bg-gradient-to-r from-red-600 to-orange-600 font-bold" disabled={!title.trim() || isPending}>
                        {isPending ? "Criando..." : "⚔️ Criar Raid"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

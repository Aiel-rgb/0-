import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useUser } from "@/lib/useUser";
import {
    ListTodo, Map, Package, Sparkles, Loader2, CheckCircle2,
    Trash2, Gavel, Plus, RefreshCw, Trophy, Coins, Zap, Check
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
    const { user } = useUser();
    const utils = trpc.useUtils();
    const [generating, setGenerating] = useState<string | null>(null);
    const [theme, setTheme] = useState("");

    const { data: drafts, isLoading } = trpc.admin.listDrafts.useQuery(undefined, {
        enabled: !!user && user.role === "admin",
    });

    const generateMutation = trpc.admin.generate.useMutation({
        onMutate: (vars) => setGenerating(vars.type),
        onSuccess: () => {
            toast.success("Conteúdo gerado com sucesso", {
                description: "Novos rascunhos foram adicionados à lista.",
            });
            utils.admin.listDrafts.invalidate();
        },
        onError: (err) => {
            toast.error("Falha ao gerar conteúdo", {
                description: err.message,
            });
        },
        onSettled: () => setGenerating(null),
    });

    const approveMutation = trpc.admin.approve.useMutation({
        onSuccess: () => {
            toast.success("Conteúdo aprovado e ativado");
            utils.admin.listDrafts.invalidate();
        },
    });

    const deleteMutation = trpc.admin.delete.useMutation({
        onSuccess: () => {
            toast.success("Conteúdo excluído");
            utils.admin.listDrafts.invalidate();
        },
    });

    const approveAllMutation = trpc.admin.approveAll.useMutation({
        onSuccess: () => {
            toast.success("Todos os itens aprovados!");
            utils.admin.listDrafts.invalidate();
        },
        onError: (err) => {
            toast.error("Erro ao aprovar todos", {
                description: err.message
            });
        }
    });

    const giveMoneyMutation = trpc.admin.giveMoney.useMutation({
        onSuccess: () => {
            toast.success("Ouro Infinito Adicionado!");
            utils.profile.getProfile.invalidate();
            // Re-fetch gold in local storage listener by triggering event (optional, but good)
            window.dispatchEvent(new Event("gold-changed"));
        }
    });

    const setLevel99Mutation = trpc.admin.setLevel99.useMutation({
        onSuccess: () => {
            toast.success("Level 99 Alcançado!");
            utils.profile.getProfile.invalidate();
        }
    });

    if (user?.role !== "admin") {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <p className="text-muted-foreground">Acesso negado. Apenas administradores.</p>
            </div>
        );
    }

    const handleGenerate = (type: "tasks" | "dungeon" | "items", theme?: string) => {
        generateMutation.mutate({ type, theme });
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold tracking-tight">Painel de Curadoria</h1>
                    <p className="text-muted-foreground text-lg">Revise e aprove conteúdos gerados por IA.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-end bg-card/50 p-4 rounded-xl border border-border/50">
                    <div className="flex-1 w-full">
                        <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                            Tema / Contexto Supremo para o Groq
                        </label>
                        <Input
                            placeholder="Ex: Mitologia Grega, Cyberpunk, Hábitos de Guerreiro Espartano..."
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            className="bg-background/50 border-primary/20 focus:border-primary/50"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button
                            onClick={() => generateMutation.mutate({ type: "tasks", theme })}
                            disabled={!!generating}
                            className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                            {generating === "tasks" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Gerar 5 Tarefas
                        </Button>
                        <Button
                            onClick={() => generateMutation.mutate({ type: "dungeon", theme })}
                            disabled={!!generating || !theme}
                            className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                        >
                            {generating === "dungeon" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Map className="mr-2 h-4 w-4" />}
                            Gerar Dungeon
                        </Button>
                        <Button
                            onClick={() => generateMutation.mutate({ type: "items", theme })}
                            disabled={!!generating}
                            className="flex-1 md:flex-none bg-amber-600 hover:bg-amber-700 text-white font-bold"
                        >
                            {generating === "items" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
                            Gerar 3 Itens
                        </Button>
                    </div>
                </div>
            </header>

            <Tabs defaultValue="tasks" className="w-full">
                <TabsList className="grid w-full grid-cols-4 md:w-auto mb-6 bg-secondary/50 p-1">
                    <TabsTrigger value="tasks" className="flex gap-2">
                        <ListTodo className="h-4 w-4" />
                        Tarefas Diárias ({drafts?.tasks.length ?? 0})
                    </TabsTrigger>
                    <TabsTrigger value="dungeons" className="flex gap-2">
                        <Map className="h-4 w-4" />
                        Dungeons ({drafts?.dungeons.length ?? 0})
                    </TabsTrigger>
                    <TabsTrigger value="shop" className="flex gap-2">
                        <Package className="h-4 w-4" />
                        Loja ({drafts?.items.length ?? 0})
                    </TabsTrigger>
                    <TabsTrigger value="dev" className="flex gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        Painel DEV
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="tasks" className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <ListTodo className="h-5 w-5 text-emerald-500" />
                            Tarefas em Rascunho
                        </h3>
                        {(drafts?.tasks.length ?? 0) > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => approveAllMutation.mutate({ type: "task" })}
                                disabled={approveAllMutation.isPending}
                                className="border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10"
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Aprovar Todas
                            </Button>
                        )}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {drafts?.tasks.map((task: any) => (
                            <Card key={task.id} className="relative overflow-hidden group border-border/50 bg-secondary/20 hover:bg-secondary/30 transition-all">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-lg font-display flex items-center gap-2">
                                            <span>{task.emoji || "📝"}</span>
                                            {task.title}
                                        </CardTitle>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary uppercase font-bold tracking-wide">
                                            {task.category}
                                        </span>
                                    </div>
                                    <CardDescription className="line-clamp-2 mt-2">{task.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex justify-between items-center bg-secondary/30 py-3">
                                    <div className="flex gap-4 text-xs font-mono text-muted-foreground">
                                        <span className="text-emerald-400">XP: {task.xpReward}</span>
                                        <span className="text-amber-400">GOLD: {task.goldReward}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                            onClick={() => deleteMutation.mutate({ type: "task", id: task.id })}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10"
                                            onClick={() => approveMutation.mutate({ type: "task", id: task.id })}
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="dungeons" className="space-y-6">
                    <div className="flex justify-end">
                        <Button
                            variant="secondary"
                            onClick={() => handleGenerate("dungeon", theme || "Pântano Sombrio")}
                            disabled={generating === "dungeon"}
                        >
                            {generating === "dungeon" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Gerar com Tema: {theme || "Pântano Sombrio"}
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {drafts?.dungeons.map((dungeon: any) => (
                            <Card key={dungeon.id} className="border-border/50 overflow-hidden bg-secondary/20">
                                <div className="p-6 flex flex-col md:flex-row gap-6">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-4xl">{dungeon.bannerEmoji}</span>
                                            <div>
                                                <CardTitle className="text-xl">{dungeon.name}</CardTitle>
                                                <CardDescription>{dungeon.description}</CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <Button size="sm" variant="outline" onClick={() => approveMutation.mutate({ type: "dungeon", id: dungeon.id })}>
                                                Aprovar Dungeon
                                            </Button>
                                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate({ type: "dungeon", id: dungeon.id })}>
                                                Descartar
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="md:w-64 space-y-2">
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Missões</h4>
                                        <div className="space-y-1">
                                            {drafts.missions.filter((m: any) => m.dungeonId === dungeon.id).map((m: any) => (
                                                <div key={m.id} className="text-xs p-2 bg-secondary/50 rounded flex justify-between">
                                                    <span>{m.title}</span>
                                                    <span className="text-muted-foreground">{m.difficulty}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="shop" className="space-y-6">
                    <div className="flex justify-end">
                        <Button
                            variant="secondary"
                            onClick={() => handleGenerate("items")}
                            disabled={generating === "items"}
                        >
                            {generating === "items" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Gerar Itens (com Tema)
                        </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {drafts?.items.map((item: any) => (
                            <Card key={item.id} className="border-border/50 bg-secondary/20 flex flex-col">
                                <CardHeader className="grow">
                                    <div className="flex justify-between items-start mb-2 text-primary font-mono text-sm">
                                        <span>#{item.id}</span>
                                        <span className="capitalize text-xs p-1 bg-secondary rounded">{item.category}</span>
                                    </div>
                                    <CardTitle className="text-lg">{item.name}</CardTitle>
                                    <CardDescription className="text-xs mt-1">{item.description}</CardDescription>
                                </CardHeader>
                                <div className="p-4 pt-0 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-amber-400 font-bold">{item.price} Gold</span>
                                        <span className="text-muted-foreground text-xs italic">{item.iconName}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button className="flex-1" size="sm" variant="outline" onClick={() => approveMutation.mutate({ type: "item", id: item.id })}>
                                            Ativar
                                        </Button>
                                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate({ type: "item", id: item.id })}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="dev" className="space-y-6">
                    <Card className="border-border/50 bg-secondary/20 p-6">
                        <CardHeader className="px-0 pt-0">
                            <CardTitle className="text-2xl text-amber-500 flex items-center gap-2">
                                <Sparkles className="h-6 w-6" />
                                God Mode Options
                            </CardTitle>
                            <CardDescription>
                                Comandos de administrador para facilitar o teste das mecânicas do jogo.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-0 flex flex-col sm:flex-row gap-4">
                            <Button
                                onClick={() => giveMoneyMutation.mutate()}
                                disabled={giveMoneyMutation.isPending}
                                className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
                            >
                                Ganhar Dinheiro Infinito
                            </Button>
                            <Button
                                onClick={() => setLevel99Mutation.mutate()}
                                disabled={setLevel99Mutation.isPending}
                                className="bg-purple-500 hover:bg-purple-600 text-white font-bold"
                            >
                                Level 99 Instantâneo
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}


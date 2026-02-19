import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useUser } from "@/lib/useUser";
import { Loader2, Plus, Check, Trash2, Sparkles, Package, Map, ListTodo } from "lucide-react";
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
            toast.success("Conteúdo removido");
            utils.admin.listDrafts.invalidate();
        },
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
                <div className="flex flex-col md:flex-row gap-3 items-end">
                    <div className="space-y-1.5 flex-1">
                        <label className="text-sm font-medium text-muted-foreground ml-1">Tema / Contexto para o Groq</label>
                        <Input
                            placeholder="Ex: Fantasia Medieval, Hábitos de Guerreiro, Itens Lendários..."
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            className="bg-secondary/30 border-primary/10 focus:border-primary/30 w-full md:w-80"
                        />
                    </div>
                    <Button
                        variant="default"
                        onClick={() => handleGenerate("tasks", theme)}
                        disabled={generating === "tasks"}
                        className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-bold"
                    >
                        {generating === "tasks" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Gerar 5 Tarefas
                    </Button>
                </div>
            </header>

            <Tabs defaultValue="tasks" className="w-full">
                <TabsList className="grid w-full grid-cols-3 md:w-auto mb-6 bg-secondary/50 p-1">
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
                </TabsList>

                <TabsContent value="tasks" className="space-y-4">
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
            </Tabs>
        </div>
    );
}


import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { PawPrint, Star, Zap, Info, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// This would ideally come from a shared constants file
const PET_DEFS: Record<string, {
    name: string;
    description: string;
    bonus: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}> = {
    "slime-blue": {
        name: "Slime Azul",
        description: "Um pequeno companheiro gelatinoso e amigável.",
        bonus: "+5% XP em tarefas",
        icon: "💧",
        rarity: 'common'
    },
    "fox-fire": {
        name: "Raposa de Fogo",
        description: "Uma raposa mística que emana calor e determinação.",
        bonus: "+10% XP em tarefas de Foco",
        icon: "🦊",
        rarity: 'rare'
    },
    "dragon-void": {
        name: "Dragão do Vácuo",
        description: "Um dragão ancestral que distorce a realidade.",
        bonus: "+15% XP em todas as missões",
        icon: "🐲",
        rarity: 'epic'
    },
    "phoenix-gold": {
        name: "Fênix Dourada",
        description: "Uma ave lendária que renasce das cinzas do fracasso.",
        bonus: "Proteção de Streak + Reset de HP 1x/semana",
        icon: "🐦",
        rarity: 'legendary'
    }
};

const rarityColors = {
    common: "bg-slate-500",
    rare: "bg-blue-500",
    epic: "bg-purple-500",
    legendary: "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
};

export function PetDashboard() {
    const queryClient = useQueryClient();
    const { data: pets = [], isLoading } = trpc.pets.list.useQuery();

    const activateMutation = trpc.pets.activate.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [["pets", "list"]] });
            toast.success("Mascotinho atualizado!", { icon: "🐾" });
        }
    });

    const grantMutation = trpc.pets.grant.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [["pets", "list"]] });
            toast.success("Novo pet obtido! (Modo Demo)", { icon: "🎁" });
        }
    });

    if (isLoading) {
        return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />)}
        </div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-muted-foreground">
                    Seus companheiros de jornada oferecem bônus passivos e evoluem com você.
                </p>
                {pets.length === 0 && (
                    <Button variant="outline" size="sm" onClick={() => grantMutation.mutate({ petId: "slime-blue" })}>
                        Obter Slime (Demo)
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                    {pets.map((userPet) => {
                        const def = PET_DEFS[userPet.petId];
                        if (!def) return null;

                        const expNeeded = userPet.level * 100;
                        const progress = (userPet.experience / expNeeded) * 100;

                        return (
                            <motion.div
                                key={userPet.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                <Card className={`overflow-hidden border-2 transition-all duration-300 ${userPet.isActive ? 'border-primary shadow-[0_0_20px_rgba(var(--primary),0.2)] bg-primary/5' : 'border-border hover:border-border/80'}`}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="text-4xl filter drop-shadow-md">{def.icon}</div>
                                                <div>
                                                    <CardTitle className="flex items-center gap-2">
                                                        {def.name}
                                                        <Badge variant="secondary" className={rarityColors[def.rarity]}>
                                                            Nível {userPet.level}
                                                        </Badge>
                                                    </CardTitle>
                                                    <CardDescription className="flex items-center gap-1 mt-1">
                                                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                        {def.rarity.toUpperCase()}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            {userPet.isActive && (
                                                <Badge className="bg-primary text-primary-foreground animate-pulse">ATIVO</Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                            <p className="text-sm italic text-muted-foreground mb-2">"{def.description}"</p>
                                            <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                                <Zap className="w-4 h-4" />
                                                {def.bonus}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                                <span>Experiência</span>
                                                <span>{userPet.experience} / {expNeeded}</span>
                                            </div>
                                            <Progress value={progress} className="h-1.5" />
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            className="w-full"
                                            variant={userPet.isActive ? "outline" : "default"}
                                            onClick={() => activateMutation.mutate({ petId: userPet.isActive ? null : userPet.petId })}
                                            disabled={activateMutation.isPending}
                                        >
                                            {userPet.isActive ? "Descansar" : "Ativar Companheiro"}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {pets.length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-xl bg-muted/20">
                        <PawPrint className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">Nenhum Mascote Encontrado</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                            Complete Dungeons ou missões especiais para encontrar ovos de mascotes!
                        </p>
                    </div>
                )}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-4">
                <Info className="w-6 h-6 text-blue-400 shrink-0" />
                <div className="text-sm">
                    <p className="font-bold text-blue-300">Dica Pro</p>
                    <p className="text-muted-foreground">
                        Apenas um mascote pode estar ativo por vez. Escolha o que melhor se adapta à sua rotina atual!
                    </p>
                </div>
            </div>
        </div>
    );
}

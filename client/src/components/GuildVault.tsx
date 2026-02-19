import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Coins, TrendingUp, ShieldCheck, Clock, Plus, Trophy, Crown } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const GUILD_UPGRADE_DEFS = {
    "banner-xp": {
        name: "Estandarte de Batalha",
        description: "Um estandarte imponente que inspira todos os membros.",
        bonus: "+20% XP global",
        price: 1000,
        durationHours: 24,
        icon: "🚩"
    },
    "chalice-gold": {
        name: "Cálice da Prosperidade",
        description: "Um cálice sagrado que atrai riquezas para a guilda.",
        bonus: "+15% Ouro global",
        price: 1500,
        durationHours: 48,
        icon: "🏆"
    },
    "shield-protection": {
        name: "Escudo do Guardião",
        description: "Protege os membros de danos críticos.",
        bonus: "-50% Dano de Missões Expiradas",
        price: 2000,
        durationHours: 72,
        icon: "🛡️"
    }
};

export function GuildVault() {
    const queryClient = useQueryClient();
    const [donateAmount, setDonateAmount] = useState<number>(100);

    const { data: profile } = trpc.profile.getProfile.useQuery();
    const { data: guildData, isLoading } = trpc.guild.get.useQuery();
    const { data: vaultInfo } = trpc.vault.getInfo.useQuery();

    const donateMutation = trpc.vault.donate.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [["vault", "getInfo"]] });
            queryClient.invalidateQueries({ queryKey: [["profile", "getProfile"]] });
            toast.success("Obrigado pela doação! A guilda prospera.", { icon: "💰" });
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    const buyMutation = trpc.vault.buyUpgrade.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [["vault", "getInfo"]] });
            toast.success("Melhoria ativada para toda a guilda!", { icon: "✨" });
        },
        onError: (err) => {
            toast.error(err.message);
        }
    });

    if (isLoading) return <div className="animate-pulse h-64 bg-muted rounded-xl" />;
    if (!guildData) return (
        <div className="text-center py-12 bg-muted/20 border-2 border-dashed border-border rounded-xl">
            <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold">Sem Guilda</h3>
            <p className="text-muted-foreground">Junte-se a uma guilda para acessar o Cofre Coletivo.</p>
        </div>
    );

    const isLeader = guildData.memberRole === "leader";

    return (
        <div className="space-y-6">
            {/* Vault Status */}
            <Card className="bg-gradient-to-br from-yellow-600/10 to-transparent border-yellow-500/20">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <Coins className="w-6 h-6 text-yellow-500" />
                                Cofre da {guildData.name}
                            </CardTitle>
                            <CardDescription>Ouro arrecadado para melhorias coletivas</CardDescription>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-display font-bold text-yellow-500">
                                {vaultInfo?.vaultGold || 0} 🪙
                            </div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total em Reserva</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs text-muted-foreground font-bold uppercase">Sua Contribuição</label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    value={donateAmount}
                                    onChange={(e) => setDonateAmount(Number(e.target.value))}
                                    className="bg-black/20 border-white/10"
                                    min={1}
                                />
                                <Button
                                    onClick={() => donateMutation.mutate({ amount: donateAmount })}
                                    disabled={donateMutation.isPending || (profile?.gold ?? 0) < donateAmount}
                                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                >
                                    Doar
                                </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Você possui: {profile?.gold ?? 0} 🪙</p>
                        </div>
                        <div className="hidden md:block bg-white/5 p-3 rounded-lg border border-white/5 max-w-xs">
                            <p className="text-xs italic text-muted-foreground">
                                "Um por todos, todos por um! Cada moeda aproxima a guilda da glória eterna."
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Upgrades */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(GUILD_UPGRADE_DEFS).map(([id, def]) => {
                    const active = vaultInfo?.upgrades?.find(u => u.upgradeId === id);
                    const remainingHours = active && active.expiresAt ? Math.max(0, Math.ceil((new Date(active.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))) : 0;

                    return (
                        <Card key={id} className={`flex flex-col ${active ? 'border-primary/50 bg-primary/5' : 'opacity-80'}`}>
                            <CardHeader className="pb-2">
                                <div className="text-3xl mb-2">{def.icon}</div>
                                <CardTitle className="text-lg">{def.name}</CardTitle>
                                <Badge variant={active ? "default" : "outline"} className={active ? "bg-green-500" : ""}>
                                    {active ? "ATIVO" : "DISPONÍVEL"}
                                </Badge>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-3">
                                <p className="text-xs text-muted-foreground">{def.description}</p>
                                <div className="flex items-center gap-2 text-primary font-bold">
                                    <TrendingUp className="w-4 h-4" />
                                    {def.bonus}
                                </div>
                                {active && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-black/20 p-2 rounded">
                                        <Clock className="w-3 h-3" />
                                        Expira em {remainingHours}h
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button
                                    variant={active ? "outline" : "default"}
                                    className="w-full"
                                    disabled={buyMutation.isPending || !isLeader || (vaultInfo?.vaultGold || 0) < def.price}
                                    onClick={() => buyMutation.mutate({ upgradeId: id })}
                                >
                                    {active ? "Prorrogar" : `Ativar (${def.price} 🪙)`}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {!isLeader && (
                <div className="flex gap-2 p-4 bg-muted/20 border border-border rounded-xl text-sm text-muted-foreground items-center">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    Apenas o líder da guilda pode ativar as melhorias coletivas.
                </div>
            )}
        </div>
    );
}

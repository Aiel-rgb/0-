import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Shield, Heart, Gem, Clock, Flame, Package, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSound } from "@/hooks/use-sound";
import { trpc } from "@/lib/trpc";

// ── Types ──────────────────────────────────────────────
export interface InventoryItem {
    id: string;
    name: string;
    description: string;
    effectDescription: string;
    icon: React.ReactNode;
    quantity: number;
    duration?: number; // ms, 0 = instant
}

export interface ActiveEffect {
    id: string;
    name: string;
    activatedAt: number; // timestamp
    duration: number;    // ms
}

// ── All consumable definitions ─────────────────────────
export const CONSUMABLE_DEFS: Record<string, {
    name: string;
    description: string;
    effectDescription: string;
    icon: React.ReactNode;
    duration: number; // ms, 0 = instant
    price: number;
}> = {
    "potion-focus": {
        name: "Poção de Foco",
        description: "Bônus de +20% XP por 1 hora.",
        effectDescription: "+20% XP",
        icon: <Zap className="w-6 h-6 text-yellow-400" />,
        duration: 60 * 60 * 1000, // 1h
        price: 150,
    },
    "streak-freeze": {
        name: "Congelar Combo",
        description: "Protege seu combo se você falhar um dia.",
        effectDescription: "Combo Protegido",
        icon: <Shield className="w-6 h-6 text-blue-400" />,
        duration: 24 * 60 * 60 * 1000, // 24h
        price: 300,
    },
    "potion-heal": {
        name: "Poção de Cura",
        description: "Restaura 30 pontos de HP instantaneamente.",
        effectDescription: "+30 HP",
        icon: <Heart className="w-6 h-6 text-red-400" />,
        duration: 0, // instant
        price: 100,
    },
    "scroll-gold": {
        name: "Pergaminho Dourado",
        description: "Ganha 200 Ouro de bônus instantaneamente.",
        effectDescription: "+200 Ouro",
        icon: <Gem className="w-6 h-6 text-yellow-500" />,
        duration: 0, // instant
        price: 250,
    },
    "elixir-double": {
        name: "Elixir de Poder",
        description: "Próxima missão concede XP dobrado (30 min).",
        effectDescription: "XP x2",
        icon: <Flame className="w-6 h-6 text-orange-400" />,
        duration: 30 * 60 * 1000, // 30min
        price: 400,
    },
    "scroll-time": {
        name: "Pergaminho do Tempo",
        description: "Estende seu combo em +1 dia de proteção.",
        effectDescription: "Combo +1 dia",
        icon: <Clock className="w-6 h-6 text-purple-400" />,
        duration: 24 * 60 * 60 * 1000, // 24h
        price: 350,
    },
};

// ── Helpers ────────────────────────────────────────────
function loadActiveEffects(): ActiveEffect[] {
    try {
        return JSON.parse(localStorage.getItem("active_effects") || "[]");
    } catch { return []; }
}

function saveActiveEffects(effects: ActiveEffect[]) {
    localStorage.setItem("active_effects", JSON.stringify(effects));
}

// ── Inventory Component ────────────────────────────────
export function Inventory() {
    const utils = trpc.useUtils();
    const { data: serverInventory } = trpc.shop.getInventory.useQuery();

    // Convert server array to Record
    const inventory = (serverInventory || []).reduce((acc, item) => {
        acc[item.itemId] = item.quantity;
        return acc;
    }, {} as Record<string, number>);

    const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>(() => {
        const now = Date.now();
        return loadActiveEffects().filter(e => e.duration === 0 || (e.activatedAt + e.duration) > now);
    });

    const [, setTick] = useState(0);
    const { play } = useSound();

    // Timer for active effects countdown
    useEffect(() => {
        if (activeEffects.length === 0) return;
        const interval = setInterval(() => {
            const now = Date.now();
            setActiveEffects(prev => {
                const filtered = prev.filter(e => e.duration === 0 || (e.activatedAt + e.duration) > now);
                if (filtered.length !== prev.length) {
                    saveActiveEffects(filtered);
                }
                return filtered;
            });
            setTick(t => t + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [activeEffects.length]);

    // Persist effects
    useEffect(() => {
        saveActiveEffects(activeEffects);
    }, [activeEffects]);

    const isEffectActive = useCallback((id: string) => {
        const now = Date.now();
        return activeEffects.some(e => e.id === id && (e.duration === 0 || (e.activatedAt + e.duration) > now));
    }, [activeEffects]);

    const useItemMutation = trpc.shop.useItem.useMutation({
        onSuccess: (_, variables) => {
            const def = CONSUMABLE_DEFS[variables.itemId];
            if (def && def.duration > 0) {
                setActiveEffects(prev => [...prev, {
                    id: variables.itemId,
                    name: def.name,
                    activatedAt: Date.now(),
                    duration: def.duration,
                }]);
            }
            utils.shop.getInventory.invalidate();
            utils.profile.getProfile.invalidate();
            play("coin");
            toast.success("Item usado!", { icon: "✨" });
        },
        onError: (err) => {
            play("error");
            toast.error(err.message);
        }
    });

    const useItem = (id: string) => {
        const qty = inventory[id] || 0;
        if (qty <= 0) return;

        const def = CONSUMABLE_DEFS[id];
        if (!def) return;

        if (def.duration > 0 && isEffectActive(id)) {
            toast.error("Esse efeito já está ativo!", { icon: "⏳" });
            play("error");
            return;
        }

        useItemMutation.mutate({ itemId: id });
    };

    const formatTime = (ms: number): string => {
        const totalSec = Math.floor(ms / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    const ownedItems = Object.entries(inventory)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => {
            const def = CONSUMABLE_DEFS[id];
            if (!def) return null;
            return { id, qty, ...def };
        })
        .filter(Boolean) as (typeof CONSUMABLE_DEFS[string] & { id: string; qty: number })[];

    const now = Date.now();

    return (
        <div className="space-y-4">
            {/* Active Effects Banner */}
            {activeEffects.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-yellow-400" /> Efeitos Ativos
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {activeEffects.map((effect, i) => {
                            const remaining = (effect.activatedAt + effect.duration) - now;
                            const progress = Math.max(0, Math.min(100, (remaining / effect.duration) * 100));
                            const def = CONSUMABLE_DEFS[effect.id];
                            return (
                                <motion.div
                                    key={`${effect.id}-${i}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="relative flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-3 py-2 text-sm overflow-hidden"
                                >
                                    {/* Progress bar background */}
                                    <div
                                        className="absolute inset-0 bg-primary/20 transition-all duration-1000"
                                        style={{ width: `${progress}%` }}
                                    />
                                    <span className="relative z-10">{def?.icon}</span>
                                    <div className="relative z-10">
                                        <span className="font-bold text-xs">{def?.effectDescription}</span>
                                        <span className="text-xs text-muted-foreground ml-2">
                                            {remaining > 0 ? formatTime(remaining) : "Expirando..."}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Inventory Grid */}
            {ownedItems.length > 0 ? (
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1 mb-3">
                        <Package className="w-3 h-3" /> Inventário ({ownedItems.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <AnimatePresence>
                            {ownedItems.map(item => {
                                const active = isEffectActive(item.id);
                                return (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className={cn(
                                            "flex items-center gap-3 bg-card border rounded-lg p-3 transition-all",
                                            active
                                                ? "border-primary/40 shadow-[0_0_10px_rgba(0,217,255,0.15)]"
                                                : "border-border hover:border-primary/20"
                                        )}
                                    >
                                        <div className="p-2 bg-background/50 rounded-md border border-border shrink-0">
                                            {item.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm truncate">{item.name}</span>
                                                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full font-mono">
                                                    x{item.qty}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">{item.effectDescription}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={active ? "secondary" : "default"}
                                            disabled={active || useItemMutation.isPending}
                                            onClick={() => useItem(item.id)}
                                            className="shrink-0 text-xs"
                                        >
                                            {active ? "Ativo" : useItemMutation.isPending && useItemMutation.variables?.itemId === item.id ? "..." : "Usar"}
                                        </Button>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            ) : (
                <div className="text-center py-6 text-muted-foreground border border-dashed border-border rounded-lg">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Inventário vazio</p>
                    <p className="text-xs">Compre itens na loja abaixo!</p>
                </div>
            )}
        </div>
    );
}

// ── Legacy helper (placeholder to avoid breakages) ──────
export function addToInventory(itemId: string, quantity: number = 1) {
    // This is now legacy, shop handles it directly via TRPC
    console.warn("Legacy addToInventory called for", itemId);
}

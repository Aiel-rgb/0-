import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Shield, Palette, Coins, Check, Lock, Sparkles, Cpu, Ghost, Snowflake, Sun, Circle, Flame, Heart, Gem, Clock, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSound } from "@/hooks/use-sound";
import { useTheme } from "@/contexts/ThemeContext";
import { Inventory, addToInventory } from "./Inventory";

// ── Types ──────────────────────────────────────────────
interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: React.ReactNode;
    category: "consumable" | "cosmetic";
    owned: boolean; // only used for cosmetics (one-time purchase)
}

// ── Shop Items ─────────────────────────────────────────
const cosmeticItems: ShopItem[] = [
    {
        id: "border-gold",
        name: "Borda: Dourada",
        description: "Brilho de um verdadeiro campeão.",
        price: 500,
        icon: <Circle className="w-8 h-8 text-yellow-400" />,
        category: "cosmetic",
        owned: false,
    },
    {
        id: "border-neon",
        name: "Borda: Neon",
        description: "Estilo futurista pulsante.",
        price: 800,
        icon: <Circle className="w-8 h-8 text-cyan-400" />,
        category: "cosmetic",
        owned: false,
    },
    {
        id: "border-fire",
        name: "Borda: Chama",
        description: "Queime com determinação.",
        price: 1000,
        icon: <Flame className="w-8 h-8 text-orange-500" />,
        category: "cosmetic",
        owned: false,
    },
    {
        id: "theme-cyberpunk",
        name: "Tema: Cyberpunk",
        description: "Neon, glitch e alta tecnologia.",
        price: 2000,
        icon: <Cpu className="w-8 h-8 text-pink-500" />,
        category: "cosmetic",
        owned: false,
    },
    {
        id: "theme-dracula",
        name: "Tema: Drácula",
        description: "Elegância gótica e cores vibrantes.",
        price: 1500,
        icon: <Ghost className="w-8 h-8 text-red-500" />,
        category: "cosmetic",
        owned: false,
    },
    {
        id: "theme-nordic",
        name: "Tema: Nórdico",
        description: "Frio, minimalista e sereno.",
        price: 1200,
        icon: <Snowflake className="w-8 h-8 text-cyan-400" />,
        category: "cosmetic",
        owned: false,
    },
    {
        id: "theme-sunset",
        name: "Tema: Sunset",
        description: "Degradê relaxante de fim de tarde.",
        price: 1200,
        icon: <Sun className="w-8 h-8 text-orange-400" />,
        category: "cosmetic",
        owned: false,
    },
    {
        id: "theme-void",
        name: "Tema: Void",
        description: "Visual ultra-escuro para o dashboard.",
        price: 1000,
        icon: <Palette className="w-8 h-8 text-purple-400" />,
        category: "cosmetic",
        owned: false,
    },
    {
        id: "theme-forest",
        name: "Tema: Floresta",
        description: "Cores da natureza e sons relaxantes.",
        price: 1000,
        icon: <Palette className="w-8 h-8 text-green-400" />,
        category: "cosmetic",
        owned: false,
    },
    {
        id: "theme-default",
        name: "Tema: Padrão",
        description: "O visual clássico da Guilda.",
        price: 0,
        icon: <Palette className="w-8 h-8 text-blue-400" />,
        category: "cosmetic",
        owned: true,
    },
];

// Consumables are bought as many times as desired and go into inventory
interface ConsumableShopEntry {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: React.ReactNode;
}

const consumableShopItems: ConsumableShopEntry[] = [
    {
        id: "potion-heal",
        name: "Poção de Cura",
        description: "Restaura 30 pontos de HP instantaneamente.",
        price: 300,
        icon: <Heart className="w-8 h-8 text-red-400" />,
    },
    {
        id: "potion-focus",
        name: "Poção de Foco",
        description: "Bônus de +20% XP por 1 hora.",
        price: 500,
        icon: <Zap className="w-8 h-8 text-yellow-400" />,
    },
    {
        id: "scroll-gold",
        name: "Pergaminho Dourado",
        description: "Ganha 200 Ouro de bônus instantaneamente.",
        price: 750,
        icon: <Gem className="w-8 h-8 text-yellow-500" />,
    },
    {
        id: "streak-freeze",
        name: "Congelar Combo",
        description: "Protege seu combo se você falhar um dia.",
        price: 800,
        icon: <Shield className="w-8 h-8 text-blue-400" />,
    },
    {
        id: "scroll-time",
        name: "Pergaminho do Tempo",
        description: "Estende seu combo em +1 dia de proteção.",
        price: 1000,
        icon: <Clock className="w-8 h-8 text-purple-400" />,
    },
    {
        id: "elixir-double",
        name: "Elixir de Poder",
        description: "Próxima missão concede XP dobrado (30 min).",
        price: 1200,
        icon: <Flame className="w-8 h-8 text-orange-400" />,
    },
];

// ── Shop Component ─────────────────────────────────────
export function Shop() {
    // Cosmetic items state (one-time purchases)
    const [items, setItems] = useState<ShopItem[]>(() => {
        const saved = localStorage.getItem("shop_inventory");
        if (saved) {
            const parsed = JSON.parse(saved);
            return cosmeticItems.map(item => {
                const savedItem = parsed.find((p: ShopItem) => p.id === item.id);
                return savedItem ? { ...item, owned: savedItem.owned } : item;
            });
        }
        return cosmeticItems;
    });

    // Gold
    const [gold, setGold] = useState(() => {
        return Number(localStorage.getItem("shop_gold")) || 1250;
    });

    const [equippedBorder, setEquippedBorder] = useState(() => localStorage.getItem("equipped_avatar_frame"));
    const [shopTab, setShopTab] = useState<"consumables" | "cosmetics">("consumables");

    const { play } = useSound();
    const { theme, setTheme } = useTheme();

    // Persist cosmetic state
    useEffect(() => {
        localStorage.setItem("shop_inventory", JSON.stringify(items));
    }, [items]);

    // Persist gold
    useEffect(() => {
        localStorage.setItem("shop_gold", String(gold));
    }, [gold]);

    // Persist border
    useEffect(() => {
        if (equippedBorder) localStorage.setItem("equipped_avatar_frame", equippedBorder);
    }, [equippedBorder]);

    // Listen for gold changes from Inventory (e.g. scroll-gold use)
    useEffect(() => {
        const handler = () => {
            setGold(Number(localStorage.getItem("shop_gold")) || 0);
        };
        window.addEventListener("gold-changed", handler);
        return () => window.removeEventListener("gold-changed", handler);
    }, []);

    // ── Consumable purchase: deduct gold, add to inventory ──
    const handleBuyConsumable = (item: ConsumableShopEntry) => {
        if (gold >= item.price) {
            const newGold = gold - item.price;
            setGold(newGold);
            localStorage.setItem("shop_gold", String(newGold));
            addToInventory(item.id);
            play("coin");
            toast.success(`Comprou: ${item.name}!`, { icon: "🛍️" });
        } else {
            play("error");
            toast.error("Ouro insuficiente!", { icon: "🚫" });
        }
    };

    // ── Cosmetic purchase: mark as owned ──
    const handleBuyCosmetic = (item: ShopItem) => {
        if (item.owned) return;
        if (gold >= item.price) {
            setGold(prev => prev - item.price);
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, owned: true } : i));
            play("coin");
            toast.success(`Comprou: ${item.name}!`, { icon: "🛍️" });
        } else {
            play("error");
            toast.error("Ouro insuficiente!", { icon: "🚫" });
        }
    };

    const getShopItemBorder = (itemId: string) => {
        if (itemId === "border-gold") return "border-yellow-500/50 hover:border-yellow-400";
        if (itemId === "border-neon") return "border-cyan-400/50 hover:border-cyan-300";
        if (itemId === "border-fire") return "border-orange-500/50 hover:border-orange-400";
        if (itemId === "theme-cyberpunk") return "border-pink-500/50 hover:border-pink-400";
        if (itemId === "theme-dracula") return "border-purple-600/50 hover:border-purple-500";
        if (itemId === "theme-nordic") return "border-blue-300/50 hover:border-blue-200";
        if (itemId === "theme-sunset") return "border-orange-400/50 hover:border-orange-300";
        if (itemId === "theme-void") return "border-slate-800/50 hover:border-slate-600";
        if (itemId === "theme-forest") return "border-green-600/50 hover:border-green-500";
        return "border-border hover:border-primary/50";
    };

    const handleEquip = (item: ShopItem) => {
        if (!item.owned) return;
        if (item.id.startsWith("theme-")) {
            const themeName = item.id.replace("theme-", "");
            const target = themeName === "default" ? "dark" : themeName;
            setTheme(target as any);
            play("click");
            toast.success(`Tema aplicado: ${item.name}`, { icon: "🎨" });
        } else if (item.id.startsWith("border-")) {
            setEquippedBorder(item.id);
            localStorage.setItem("equipped_avatar_frame", item.id);
            window.dispatchEvent(new Event("avatar_frame_updated"));
            play("click");
            toast.success(`Borda equipada: ${item.name}`, { icon: "✨" });
        }
    };

    const isEquipped = (item: ShopItem) => {
        if (item.category !== "cosmetic") return false;
        if (item.id.startsWith("theme-")) {
            const themeName = item.id.replace("theme-", "");
            if (themeName === "default") return theme === "dark" || theme === "light";
            return theme === themeName;
        }
        if (item.id.startsWith("border-")) {
            return equippedBorder === item.id;
        }
        return false;
    };

    return (
        <div className="space-y-6">
            {/* Gold Wallet Header */}
            <div className="flex items-center justify-between bg-card border border-yellow-500/20 rounded-xl p-4 holographic-container relative overflow-hidden group">
                <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors" />
                <div className="flex items-center gap-3 relative z-10">
                    <div className="bg-yellow-500/20 p-2 rounded-full">
                        <Coins className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Tesouro</h3>
                        <span className="text-2xl font-display font-bold text-yellow-400">{gold} Ouro</span>
                    </div>
                </div>
                <Button variant="ghost" size="sm" className="relative z-10 text-xs" onClick={() => {
                    setGold(g => g + 500);
                    localStorage.setItem("shop_gold", String(gold + 500));
                    play("coin");
                    toast.success("Trapaça! +500 Ouro");
                }}>
                    Ganhar mais
                </Button>
            </div>

            {/* Inventory Section */}
            <Inventory />

            {/* Shop Tabs */}
            <div className="flex gap-2 border-b border-border pb-2">
                <Button
                    variant={shopTab === "consumables" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setShopTab("consumables")}
                    className="text-xs"
                >
                    <FlaskConical className="w-3.5 h-3.5 mr-1" /> Consumíveis
                </Button>
                <Button
                    variant={shopTab === "cosmetics" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setShopTab("cosmetics")}
                    className="text-xs"
                >
                    <Sparkles className="w-3.5 h-3.5 mr-1" /> Cosméticos
                </Button>
            </div>

            {/* Consumables Tab */}
            {shopTab === "consumables" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                        {consumableShopItems.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="group relative bg-card border border-border rounded-xl p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-lg holographic-container"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-background/50 rounded-lg border border-border group-hover:border-primary/30 transition-colors">
                                        {item.icon}
                                    </div>
                                    <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full">
                                        {item.price} 🪙
                                    </span>
                                </div>

                                <h4 className="font-bold text-lg mb-1">{item.name}</h4>
                                <p className="text-sm text-muted-foreground mb-4 h-10">{item.description}</p>

                                <Button
                                    className="w-full"
                                    variant="default"
                                    disabled={gold < item.price}
                                    onClick={() => handleBuyConsumable(item)}
                                >
                                    <span className="flex items-center gap-1">
                                        {gold < item.price && <Lock className="w-3 h-3 mr-1" />}
                                        Comprar por {item.price}
                                    </span>
                                </Button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Cosmetics Tab */}
            {shopTab === "cosmetics" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                        {items.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={cn(
                                    "group relative bg-card border-2 rounded-xl p-4 transition-all duration-300",
                                    item.owned
                                        ? `${getShopItemBorder(item.id)} bg-primary/5`
                                        : `${getShopItemBorder(item.id)} hover:shadow-lg holographic-container`
                                )}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-background/50 rounded-lg border border-border group-hover:border-primary/30 transition-colors">
                                        {item.icon}
                                    </div>
                                    {item.owned && (
                                        <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                            <Check className="w-3 h-3" /> Adquirido
                                        </span>
                                    )}
                                </div>

                                <h4 className="font-bold text-lg mb-1">{item.name}</h4>
                                <p className="text-sm text-muted-foreground mb-4 h-10">{item.description}</p>

                                <div className="space-y-2">
                                    {/* Buy Button */}
                                    {!item.owned && (
                                        <Button
                                            className="w-full"
                                            variant="default"
                                            disabled={gold < item.price}
                                            onClick={() => handleBuyCosmetic(item)}
                                        >
                                            <span className="flex items-center gap-1">
                                                {gold < item.price && <Lock className="w-3 h-3 mr-1" />}
                                                Comprar por {item.price}
                                            </span>
                                        </Button>
                                    )}

                                    {/* Equip Button */}
                                    {item.owned && (
                                        <Button
                                            className="w-full"
                                            variant={isEquipped(item) ? "secondary" : "outline"}
                                            disabled={isEquipped(item)}
                                            onClick={() => handleEquip(item)}
                                        >
                                            {isEquipped(item) ? (
                                                <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-yellow-400" /> Equipado</span>
                                            ) : (
                                                "Equipar"
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

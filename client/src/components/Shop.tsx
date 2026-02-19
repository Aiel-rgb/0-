import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Shield, Palette, Coins, Check, Lock, Sparkles, Cpu, Ghost, Snowflake, Sun, Circle, Flame, Heart, Gem, Clock, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSound } from "@/hooks/use-sound";
import { useTheme } from "@/contexts/ThemeContext";
import { Inventory, addToInventory } from "./Inventory";
import { trpc } from "@/lib/trpc";

interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: React.ReactNode;
    category: "consumable" | "cosmetic";
    owned: boolean;
}

interface ConsumableShopEntry {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: React.ReactNode;
}

// ── Components & Icons ────────────────────────────────
const IconMap: Record<string, React.ReactNode> = {
    "Heart": <Heart className="w-8 h-8 text-red-400" />,
    "Zap": <Zap className="w-8 h-8 text-yellow-400" />,
    "Gem": <Gem className="w-8 h-8 text-yellow-500" />,
    "Shield": <Shield className="w-8 h-8 text-blue-400" />,
    "Clock": <Clock className="w-8 h-8 text-purple-400" />,
    "Flame": <Flame className="w-8 h-8 text-orange-400" />,
    "Circle": <Circle className="w-8 h-8 text-gray-400" />,
    "Cpu": <Cpu className="w-8 h-8 text-pink-500" />,
    "Ghost": <Ghost className="w-8 h-8 text-red-500" />,
    "Snowflake": <Snowflake className="w-8 h-8 text-cyan-400" />,
    "Sun": <Sun className="w-8 h-8 text-orange-400" />,
    "Palette": <Palette className="w-8 h-8 text-purple-400" />,
};

const getIcon = (name: string, itemId: string) => {
    if (IconMap[name]) return IconMap[name];

    // Fallback based on item ID/Category if icon name fails
    if (itemId.includes("border")) return <Circle className="w-8 h-8 opacity-50" />;
    return <FlaskConical className="w-8 h-8 text-muted-foreground" />;
};

// ── Shop Component ─────────────────────────────────────
export function Shop({ isAdmin = false }: { isAdmin?: boolean }) {
    const utils = trpc.useUtils();
    const { data: profile } = trpc.profile.getProfile.useQuery();
    const { data: userCosmetics } = trpc.shop.getCosmetics.useQuery();
    const { data: dbItems, isLoading: loadingItems } = trpc.shop.listItems.useQuery();

    const items = (dbItems || []).filter(i => i.category === "cosmetic").map(item => ({
        ...item,
        icon: getIcon(item.iconName, item.id),
        owned: userCosmetics?.some(c => c.cosmeticId === item.id) || item.id === "theme-default"
    })) as ShopItem[];

    const consumableShopItems = (dbItems || []).filter(i => i.category === "consumable").map(item => ({
        ...item,
        icon: getIcon(item.iconName, item.id),
    })) as ConsumableShopEntry[];

    const gold = profile?.gold || 0;
    const equippedBorder = userCosmetics?.find(c => c.equipped === 1)?.cosmeticId || null;
    const [shopTab, setShopTab] = useState<"consumables" | "cosmetics">("consumables");

    const { play } = useSound();
    const { theme, setTheme } = useTheme();

    // Mutations
    const buyConsumableMutation = trpc.shop.buyConsumable.useMutation({
        onSuccess: () => {
            utils.profile.getProfile.invalidate();
            utils.shop.getInventory.invalidate();
            play("coin");
            toast.success("Compra realizada!", { icon: "🛍️" });
        },
        onError: (err) => {
            play("error");
            toast.error(err.message);
        }
    });

    const buyCosmeticMutation = trpc.shop.buyCosmetic.useMutation({
        onSuccess: () => {
            utils.profile.getProfile.invalidate();
            utils.shop.getCosmetics.invalidate();
            play("coin");
            toast.success("Cosmético adquirido!", { icon: "✨" });
        },
        onError: (err) => {
            play("error");
            toast.error(err.message);
        }
    });

    const equipCosmeticMutation = trpc.shop.equipCosmetic.useMutation({
        onSuccess: () => {
            utils.shop.getCosmetics.invalidate();
            utils.profile.getProfile.invalidate();
            play("click");
            toast.success("Equipado com sucesso!");
        },
        onError: (err) => toast.error(err.message)
    });

    const handleBuyConsumable = (item: ConsumableShopEntry) => {
        if (gold >= item.price) {
            buyConsumableMutation.mutate({ itemId: item.id, price: item.price });
        } else {
            play("error");
            toast.error("Ouro insuficiente!", { icon: "🚫" });
        }
    };

    const handleBuyCosmetic = (item: ShopItem) => {
        if (item.owned) return;
        if (gold >= item.price) {
            buyCosmeticMutation.mutate({ cosmeticId: item.id, price: item.price });
        } else {
            play("error");
            toast.error("Ouro insuficiente!", { icon: "🚫" });
        }
    };

    const handleEquip = (item: ShopItem) => {
        if (!item.owned) return;
        if (item.id.startsWith("theme-")) {
            const themeName = item.id.replace("theme-", "");
            const target = themeName === "default" ? "dark" : themeName;

            equipCosmeticMutation.mutate({ cosmeticId: item.id, category: 'theme' });
            setTheme(target as any);
        } else if (item.id.startsWith("border-")) {
            equipCosmeticMutation.mutate({ cosmeticId: item.id, category: 'border' });
        }
    };

    const isEquipped = (item: ShopItem) => {
        if (item.category !== "cosmetic") return false;
        if (item.id.startsWith("theme-")) {
            return profile?.equippedThemeId === item.id.replace("theme-", "");
        }
        if (item.id.startsWith("border-")) {
            return equippedBorder === item.id;
        }
        return false;
    };

    const getShopItemBorder = (itemId: string) => {
        if (itemId === "border-gold") return "border-yellow-500/50 hover:border-yellow-400 text-yellow-500";
        if (itemId === "border-neon") return "border-cyan-400/50 hover:border-cyan-300 text-cyan-400";
        if (itemId === "border-fire") return "border-orange-500/50 hover:border-orange-400 text-orange-500";
        if (itemId === "theme-cyberpunk") return "border-pink-500/50 hover:border-pink-400 text-pink-500";
        if (itemId === "theme-dracula") return "border-purple-600/50 hover:border-purple-500 text-purple-500";
        if (itemId === "theme-nordic") return "border-blue-300/50 hover:border-blue-200 text-blue-300";
        if (itemId === "theme-sunset") return "border-orange-400/50 hover:border-orange-300 text-orange-400";
        if (itemId === "theme-void") return "border-slate-800/50 hover:border-slate-600 text-slate-800";
        if (itemId === "theme-forest") return "border-green-600/50 hover:border-green-500 text-green-600";
        return "border-border hover:border-primary/50";
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

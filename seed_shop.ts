import "dotenv/config";
import { getDb } from "./server/db";
import { shopItems } from "./drizzle/schema";

const initialItems = [
    { id: "potion-heal", name: "Poção de Cura", description: "Restaura 30 pontos de HP instantaneamente.", price: 300, category: "consumable", iconName: "Heart" },
    { id: "potion-focus", name: "Poção de Foco", description: "Bônus de +20% XP por 1 hora.", price: 500, category: "consumable", iconName: "Zap" },
    { id: "scroll-gold", name: "Pergaminho Dourado", description: "Ganha 200 Ouro de bônus instantaneamente.", price: 750, category: "consumable", iconName: "Gem" },
    { id: "streak-freeze", name: "Congelar Combo", description: "Protege seu combo se você falhar um dia.", price: 800, category: "consumable", iconName: "Shield" },
    { id: "scroll-time", name: "Pergaminho do Tempo", description: "Estende seu combo em +1 dia de proteção.", price: 1000, category: "consumable", iconName: "Clock" },
    { id: "elixir-double", name: "Elixir de Poder", description: "Próxima missão concede XP dobrado (30 min).", price: 1200, category: "consumable", iconName: "Flame" },
    { id: "border-gold", name: "Borda: Dourada", description: "Brilho de um verdadeiro campeão.", price: 500, category: "cosmetic", iconName: "Circle" },
    { id: "border-neon", name: "Borda: Neon", description: "Estilo futurista pulsante.", price: 800, category: "cosmetic", iconName: "Circle" },
    { id: "border-fire", name: "Borda: Chama", description: "Queime com determinação.", price: 1000, category: "cosmetic", iconName: "Flame" },
    { id: "theme-cyberpunk", name: "Tema: Cyberpunk", description: "Neon, glitch e alta tecnologia.", price: 2000, category: "cosmetic", iconName: "Cpu" },
    { id: "theme-dracula", name: "Tema: Drácula", description: "Elegância gótica e cores vibrantes.", price: 1500, category: "cosmetic", iconName: "Ghost" },
    { id: "theme-nordic", name: "Tema: Nórdico", description: "Frio, minimalista e sereno.", price: 1200, category: "cosmetic", iconName: "Snowflake" },
    { id: "theme-sunset", name: "Tema: Sunset", description: "Degradê relaxante de fim de tarde.", price: 1200, category: "cosmetic", iconName: "Sun" },
    { id: "theme-void", name: "Tema: Void", description: "Visual ultra-escuro para o dashboard.", price: 1000, category: "cosmetic", iconName: "Palette" },
    { id: "theme-forest", name: "Tema: Floresta", description: "Cores da natureza e sons relaxantes.", price: 1000, category: "cosmetic", iconName: "Palette" },
    { id: "theme-default", name: "Tema: Padrão", description: "O visual clássico da Guilda.", price: 0, category: "cosmetic", iconName: "Palette" },
];

async function seedShop() {
    const db = await getDb();
    if (!db) return;

    console.log("Seeding shop items...");
    for (const item of initialItems) {
        await db.insert(shopItems).values({
            ...item,
            status: "active" as any
        }).onDuplicateKeyUpdate({
            set: {
                name: item.name,
                description: item.description,
                price: item.price,
                category: item.category as any,
                iconName: item.iconName,
                status: "active" as any
            }
        });
    }
    console.log("Seeding complete!");
    process.exit(0);
}

seedShop().catch(console.error);

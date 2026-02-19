import "dotenv/config";
import { generateDailyTasks } from "./server/lib/ai";
import { getDb } from "./server/db";
import { dailyTasks } from "./drizzle/schema";

async function batchGen() {
    console.log("Starting batch generation of 1000 tasks...");
    const db = await getDb();
    if (!db) return;

    const totalTarget = 1000;
    const batchSize = 25; // Groq limit/response size
    let currentCount = 0;

    const themes = [
        "Paladino da Saúde (exercícios físicos, força, postura)",
        "Mago da Mente (foco, leitura, aprendizado, meditação)",
        "Clérigo do Bem-Estar (hidratação, sono, higiene, gratidão)",
        "Ranger da Natureza (caminhadas, ar livre, alimentação orgânica)",
        "Ladino da Agilidade (alongamento, reflexos, organização rápida)",
        "Bardo da Conexão (socialização, elogios, música, gentileza)"
    ];

    while (currentCount < totalTarget) {
        const theme = themes[currentCount % themes.length];
        console.log(`Generating batch ${Math.floor(currentCount / batchSize) + 1}... Theme: ${theme}`);

        try {
            const rawTasks = await generateDailyTasks(batchSize, theme);
            const tasksToInsert = rawTasks.map(t => ({
                title: t.title,
                description: t.description,
                emoji: t.emoji || "✨",
                xpReward: t.xpReward || 50,
                goldReward: t.goldReward || 25,
                category: t.category || "health",
                active: 0, // In pool, not directly active
                status: 'active' as const,
                isPool: 1
            }));

            await db.insert(dailyTasks).values(tasksToInsert);
            currentCount += tasksToInsert.length;
            console.log(`Progress: ${currentCount}/${totalTarget}`);

            // Sleep a bit to avoid rate limits
            await new Promise(r => setTimeout(r, 2000));
        } catch (e) {
            console.error("Batch failed, retrying in 10s...", e);
            await new Promise(r => setTimeout(r, 10000));
        }
    }

    console.log("Finished generating 1000 tasks!");
    process.exit(0);
}

batchGen().catch(console.error);

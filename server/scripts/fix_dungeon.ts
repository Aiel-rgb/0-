import "dotenv/config";
import { getDb, seedAstralDungeonIfEmpty } from "../db";
import { dungeons } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

async function main() {
    const db = await getDb();
    if (!db) return;

    console.log("Seeding dungeon if empty...");
    await seedAstralDungeonIfEmpty();

    console.log("Extending dungeon duration...");
    const allDungeons = await db.select().from(dungeons).where(eq(dungeons.name, "Dungeon Astral"));

    if (allDungeons.length > 0) {
        for (const d of allDungeons) {
            const newEndsAt = new Date();
            newEndsAt.setDate(newEndsAt.getDate() + 30); // 30 days from now

            await db.update(dungeons)
                .set({ endsAt: newEndsAt, active: 1 })
                .where(eq(dungeons.id, d.id));

            console.log(`Updated dungeon ID ${d.id} ('${d.name}') to end at ${newEndsAt.toISOString()}`);
        }
    } else {
        console.log("No dungeon found to extend.");
    }

    process.exit(0);
}

main().catch(console.error);

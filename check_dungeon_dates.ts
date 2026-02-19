import "dotenv/config";
import { getDb } from "./server/db";
import { dungeons } from "./drizzle/schema";

async function checkDungeonDates() {
    const db = await getDb();
    if (!db) return;

    const allDungeons = await db.select().from(dungeons);
    console.log("Current Time:", new Date().toISOString());
    console.log("Dungeons in DB:");
    console.log(JSON.stringify(allDungeons, null, 2));

    process.exit(0);
}

checkDungeonDates().catch(console.error);

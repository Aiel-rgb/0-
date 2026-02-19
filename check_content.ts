import "dotenv/config";
import { getDb } from "./server/db";
import { dailyTasks, dungeons, shopItems } from "./drizzle/schema";
import { eq, sql } from "drizzle-orm";

async function checkContent() {
    const db = await getDb();
    if (!db) return;

    const tasks = await db.select({
        status: dailyTasks.status,
        count: sql<number>`count(*)`
    }).from(dailyTasks).groupBy(dailyTasks.status);

    const dungs = await db.select({
        status: dungeons.status,
        count: sql<number>`count(*)`
    }).from(dungeons).groupBy(dungeons.status);

    const items = await db.select({
        status: shopItems.status,
        count: sql<number>`count(*)`
    }).from(shopItems).groupBy(shopItems.status);

    console.log("--- Daily Tasks ---");
    console.log(JSON.stringify(tasks, null, 2));

    console.log("--- Dungeons ---");
    console.log(JSON.stringify(dungs, null, 2));

    console.log("--- Shop Items ---");
    console.log(JSON.stringify(items, null, 2));

    process.exit(0);
}

checkContent().catch(console.error);

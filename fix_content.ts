import "dotenv/config";
import { getDb, seedDailyTasksIfEmpty } from "./server/db";
import { dailyTasks, dungeons, shopItems } from "./drizzle/schema";
import { eq, ne } from "drizzle-orm";

async function fix() {
    console.log("Fixing content categorization and status...");
    await seedDailyTasksIfEmpty();

    const db = await getDb();
    if (!db) return;

    // 1. Reset all tasks to 'active' status
    await db.update(dailyTasks).set({ active: 1, status: 'active' });

    // 2. Put most tasks into the random pool (isPool = 1)
    await db.update(dailyTasks).set({ isPool: 1 }).where(ne(dailyTasks.title, 'Beba 3 litros de água'));

    // 3. Ensure the mandatory Water task is NOT in the pool (isPool = 0)
    await db.update(dailyTasks).set({ isPool: 0 }).where(eq(dailyTasks.title, 'Beba 3 litros de água'));

    // 4. Ensure dungeons are active
    await db.update(dungeons).set({ active: 1, status: 'active' });

    // 5. Ensure shop items are active
    await db.update(shopItems).set({ status: 'active' });

    console.log("Content successfully fixed and categorized.");
    process.exit(0);
}

fix().catch(console.error);

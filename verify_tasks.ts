import "dotenv/config";
import { getActiveDailyTasks } from "./server/db";

async function verify() {
    console.log("Fetching active daily tasks...");
    const tasks = await getActiveDailyTasks();
    console.log(`Found ${tasks.length} tasks.`);
    console.log(JSON.stringify(tasks.map(t => ({ title: t.title, isPool: t.isPool })), null, 2));

    const hasWater = tasks.some(t => t.title.includes("água"));
    console.log("Has Mandatory Water Task?", hasWater);

    process.exit(0);
}

verify().catch(console.error);

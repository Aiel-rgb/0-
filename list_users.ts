import "dotenv/config";
import { getDb } from "./server/db";
import { users } from "./drizzle/schema";

async function listUsers() {
    const db = await getDb();
    if (!db) {
        console.error("Database connection failed.");
        process.exit(1);
    }
    const allUsers = await db.select().from(users);
    console.log("--- USERS ---");
    console.log(JSON.stringify(allUsers, null, 2));
    process.exit(0);
}

listUsers().catch(err => {
    console.error(err);
    process.exit(1);
});

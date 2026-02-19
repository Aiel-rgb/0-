import "dotenv/config";
import { getDb } from "./server/db";
import { users } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function promoteAdmin() {
    const db = await getDb();
    if (!db) {
        console.error("Database connection failed.");
        process.exit(1);
    }

    console.log("Promoting user admin@peakhabit.com to admin role...");
    await db.update(users)
        .set({ role: "admin" })
        .where(eq(users.email, "admin@peakhabit.com"));

    const updated = await db.select().from(users).where(eq(users.email, "admin@peakhabit.com"));
    console.log("Updated user:", JSON.stringify(updated, null, 2));
    process.exit(0);
}

promoteAdmin().catch(err => {
    console.error(err);
    process.exit(1);
});

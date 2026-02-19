import "dotenv/config";
import { resetAllStreaks } from "../db";

async function main() {
    console.log("Resetting all streaks...");
    await resetAllStreaks();
    console.log("Done.");
    process.exit(0);
}

main().catch(console.error);

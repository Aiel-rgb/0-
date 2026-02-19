import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "gsk_...", // Fallback or empty if not set
});

export async function generateEpicQuestName(taskTitle: string): Promise<string> {
    if (!process.env.GROQ_API_KEY) {
        console.warn("GROQ_API_KEY not set. Returning original title.");
        return taskTitle;
    }

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a medieval RPG narrator. Rename the given task to an epic quest name. Keep it short (max 6 words). specific and cool. Do not use quotes.",
                },
                {
                    role: "user",
                    content: `Task: ${taskTitle}`,
                },
            ],
            model: "llama3-8b-8192",
        });

        return completion.choices[0]?.message?.content || taskTitle;
    } catch (error) {
        console.error("Error generating epic name:", error);
        return taskTitle;
    }
}
export async function generateDailyTasks(count: number = 5): Promise<any[]> {
    if (!process.env.GROQ_API_KEY) return [];
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a RPG content designer. Generate ${count} daily healthy habit tasks in JSON format. 
                    Each task must have: title, description, category (e.g. "health", "mindset", "productivity", "exercise"), emoji, goldReward (10-100), xpReward (20-150).
                    Respond ONLY with a JSON array.`
                },
                { role: "user", content: "Generate now." }
            ],
            model: "llama3-8b-8192",
            response_format: { type: "json_object" }
        });
        const content = completion.choices[0]?.message?.content || "{\"tasks\": []}";
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : (parsed.tasks || []);
    } catch (error) {
        console.error("AI: Failed to generate tasks:", error);
        return [];
    }
}

export async function generateMonthlyDungeon(theme: string): Promise<any> {
    if (!process.env.GROQ_API_KEY) return null;
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a RPG content designer. Generate a monthly dungeon themed "${theme}" in JSON format.
                    Include: name, description, bannerEmoji, themeRewardId (lowercase string).
                    Also include a "missions" array of 10 missions, each with: title, description, difficulty ("easy", "medium", "hard"), xpReward, goldReward, orderIndex.
                    Respond ONLY with a JSON object.`
                },
                { role: "user", content: "Generate now." }
            ],
            model: "llama3-8b-8192",
            response_format: { type: "json_object" }
        });
        return JSON.parse(completion.choices[0]?.message?.content || "null");
    } catch (error) {
        console.error("AI: Failed to generate dungeon:", error);
        return null;
    }
}

export async function generateShopItems(count: number = 3): Promise<any[]> {
    if (!process.env.GROQ_API_KEY) return [];
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a RPG shopkeeper. Generate ${count} new shop items in JSON format.
                    Items can be "consumable" or "cosmetic".
                    Each item needs: id (unique kebab-case), name, description, price (200-5000), category, iconName (Lucide icon name).
                    Respond ONLY with a JSON array.`
                },
                { role: "user", content: "Generate now." }
            ],
            model: "llama3-8b-8192",
            response_format: { type: "json_object" }
        });
        const content = completion.choices[0]?.message?.content || "{\"items\": []}";
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : (parsed.items || []);
    } catch (error) {
        console.error("AI: Failed to generate shop items:", error);
        return [];
    }
}

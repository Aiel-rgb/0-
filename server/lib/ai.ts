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

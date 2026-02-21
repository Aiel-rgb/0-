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
            model: "llama-3.3-70b-versatile",
        });

        return completion.choices[0]?.message?.content || taskTitle;
    } catch (error) {
        console.error("Error generating epic name:", error);
        return taskTitle;
    }
}
export async function generateDailyTasks(count: number = 5, theme?: string): Promise<any[]> {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY não está configurada nas Variáveis de Ambiente.");
    }
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Você é um Content Designer sênior de RPG. Gere ${count} tarefas de hábitos saudáveis diários em formato JSON. 
                    ${theme ? `Foque no tema: ${theme}.` : ""}
                    IMPORTANTE: O título deve seguir o padrão "Nome Épico de Quest: Descrição da Tarefa Real" (Ex: "Maratona de Hermes: Correr 10km").
                    Tudo deve ser em PORTUGUÊS.
                    Cada tarefa deve ter: title, description, category (ex: "saúde", "mentalidade", "produtividade", "exercício"), emoji, goldReward (10-100), xpReward (20-150).
                    Responda APENAS com um objeto JSON contendo um array "tasks".`
                },
                { role: "user", content: "Gerar agora." }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });
        const content = completion.choices[0]?.message?.content || "{\"tasks\": []}";
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : (parsed.tasks || []);
    } catch (error: any) {
        console.error("AI: Failed to generate tasks:", error);
        throw new Error(`Erro na API da IA: ${error.message || "Falha desconhecida"}`);
    }
}

export async function generateMonthlyDungeon(theme: string): Promise<any> {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY não está configurada nas Variáveis de Ambiente.");
    }
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Você é um Content Designer sênior de RPG. Gere uma dungeon mensal temática "${theme}" em formato JSON.
                    Explore temas variados como Cyberpunk, Mitologia Grega, Dark Fantasy, Steampunk ou exploração espacial, dependendo do que foi pedido.
                    IMPORTANTE: Os nomes das missões devem seguir o padrão "Desafio de RPG: Tarefa do Mundo Real".
                    Os nomes e descrições devem ser imersivos e condizentes com o tema escolhido.
                    Tudo deve ser em PORTUGUÊS.
                    Inclua: name, description, bannerEmoji, themeRewardId (string em minúsculas baseada no tema, ex: "cyberpunk-frame", "neon-skin").
                    Também inclua um array "missions" de 10 missões, cada uma com: title, description, difficulty ("easy", "medium", "hard"), xpReward, goldReward, orderIndex.
                    Responda APENAS com um objeto JSON.`
                },
                { role: "user", content: "Gerar agora." }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });
        return JSON.parse(completion.choices[0]?.message?.content || "null");
    } catch (error: any) {
        console.error("AI: Failed to generate dungeon:", error);
        throw new Error(`Erro na API da IA: ${error.message || "Falha desconhecida"}`);
    }
}

export async function generateShopItems(count: number = 3): Promise<any[]> {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY não está configurada nas Variáveis de Ambiente.");
    }
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Você é um mercador lendário de RPG. Gere ${count} novos itens de loja em formato JSON.
                    Os itens podem ser "consumable" ou "cosmetic".
                    IMPORTANTE: Use nomes criativos de RPG. Tudo em PORTUGUÊS.
                    Cada item precisa de: 
                    - id (kebab-case único)
                    - name (Nome Épico)
                    - description (Descrição lore/temática)
                    - price (200-5000)
                    - category ("consumable" ou "cosmetic")
                    - iconName (nome de ícone do Lucide, como "heart", "zap", "star", "shield")
                    - hpEffect (0-100, apenas para consumables)
                    - xpEffect (0-500, apenas para consumables)
                    - goldEffect (0-1000, apenas para consumables)
                    - effectDescription (Ex: "Restaura 30 de Vida", "Ganha 100 de XP")
                    Responda APENAS com um objeto JSON contendo um array "items".`
                },
                { role: "user", content: "Gerar agora." }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });
        const content = completion.choices[0]?.message?.content || "{\"items\": []}";
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : (parsed.items || []);
    } catch (error: any) {
        console.error("AI: Failed to generate shop items:", error);
        throw new Error(`Erro na API da IA: ${error.message || "Falha desconhecida"}`);
    }
}

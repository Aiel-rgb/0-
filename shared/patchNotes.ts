export const CURRENT_VERSION = "2.0.2";

export interface VersionNote {
    version: string;
    title: string;
    description: string;
    highlights: string[];
    date: string;
}

export const PATCH_NOTES: VersionNote[] = [
    {
        version: "2.0.2",
        title: "RP8: Personalização de Guildas",
        description: "Agora as guildas podem ter sua própria identidade visual!",
        highlights: [
            "🛡️ Avatar da Guilda: Líderes agora podem trocar a imagem da guilda.",
            "📜 Botão de Patch Notes: Adicionado botão manual no header para rever as novidades.",
            "🖼️ Logos Padronizados: Tamanho consistente em todas as páginas do app.",
            "🔥 Streaks Resetados: Mais uma limpeza para garantir que todos comecem do zero corretamente.",
            "🛠️ Persistência de Imagem: Melhoria na forma como o servidor serve uploads.",
            "✨ Polimento Visual: Pequenos ajustes de design e consistência."
        ],
        date: "2025-02-19"
    },
    {
        version: "2.0.1",
        title: "RP8: O Renascimento",
        description: "Bem-vindo ao RP8! Uma nova identidade com correções críticas e melhorias de qualidade de vida.",
        highlights: [
            "✨ Rebranding Completo: Peak Habit agora é RP8. Nova identidade, mesmo propósito.",
            "🔥 Reset de Streaks: Um novo começo para todos os guerreiros (correção na contagem de dias).",
            "📸 Avatar Persistente: Upload de fotos corrigido e bug de desaparecerimento resolvido.",
            "⚔️ Dungeon Mensal Ajustada: 10 Andares desafiadores com duração correta de 1 mês.",
            "🔄 Tarefas Recorrentes: Crie hábitos diários ou semanais com flexibilidade.",
            "📊 Ranking da Guilda: Movido para a página da Guilda para melhor organização.",
            " Correções Diversas: Estabilidade do servidor e melhorias visuais."
        ],
        date: "2025-02-18"
    },
    // ... etc
];

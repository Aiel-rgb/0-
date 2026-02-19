export const CURRENT_VERSION = "2.0.0";

export interface VersionNote {
    version: string;
    title: string;
    description: string;
    highlights: string[];
    date: string;
}

export const PATCH_NOTES: VersionNote[] = [
    {
        version: "2.0.1",
        title: "RP8: O Renascimento",
        description: "Bem-vindo ao RP8! Uma nova identidade com correções críticas e melhorias de qualidade de vida.",
        highlights: [
            "✨ Rebranding Completo: Peak Habit agora é RP8. Nova identidade, mesmo propósito.",
            "🔥 Reset de Streaks: Um novo começo para todos os guerreiros (correção na contagem de dias).",
            "📸 Avatar Persistente: Upload de fotos corrigido e bug de desaparecimento resolvido.",
            "⚔️ Dungeon Mensal Ajustada: 10 Andares desafiadores com duração correta de 1 mês.",
            "🔄 Tarefas Recorrentes: Crie hábitos diários ou semanais com flexibilidade.",
            "📊 Ranking da Guilda: Movido para a página da Guilda para melhor organização.",
            "🐛 Correções Diversas: Estabilidade do servidor e melhorias visuais."
        ],
        date: "2025-02-19"
    },
    {
        version: "2.0.0",
        title: "A Ascensão do RP8",
        description: "Uma reformulação completa com novos sistemas de guildas, dungeons e desafios.",
        highlights: [
            "Sistema de Dungeons Mensais: Enfrente desafios exclusivos todo mês!",
            "Dungeon ASTRAL: Desbloqueie o novo tema visual cósmico.",
            "Desafios Diários: Complete tarefas rápidas para ganhar XP e Ouro.",
            "Nova Aba de Amigos: Busque outros guerreiros e acompanhe o progresso deles.",
            "Temas Customizáveis: Mude o visual do seu dashboard e perfil.",
            "Conta Admin Oculta: Novos recursos para gerentes de sistema.",
            "Renomeação Global: Bem-vindo ao RP8!"
        ],
        date: "2025-02-18"
    }
];

export const CURRENT_VERSION = "2.0.4";

export interface VersionNote {
    version: string;
    title: string;
    description?: string; // Made optional to accommodate new structure
    highlights?: string[]; // Made optional to accommodate new structure
    date: string;
    sections?: { // Added new optional property for structured notes
        title: string;
        items: string[];
    }[];
}

export const PATCH_NOTES: VersionNote[] = [
    {
        version: "2.0.4",
        title: "RP8: Mascotes & Cofre da Guilda",
        description: "Fase 2 do roadmap! Chegaram os Mascotinhos e o sistema de tesouraria da Guilda.",
        highlights: [
            "🐾 Mascotinhos: Obtenha companheiros que dão bônus passivos de XP.",
            "📈 Evolução de Pets: Seus mascotes ganham nível conforme você completa tarefas.",
            "💰 Cofre da Guilda: Doe ouro para sua guilda para desbloquear melhorias coletivas.",
            "🚩 Banners de Guilda: Líderes podem ativar buffs de XP e Ouro para todos os membros.",
            "🏠 Dashboard Atualizado: Novas abas para gerenciar seus pets e o cofre da guilda."
        ],
        date: "2025-02-19"
    },
    {
        version: "2.0.3",
        title: "RP8: Estabilidade & Persistência",
        description: "Fase 1 do roadmap concluída! Dados agora são totalmente sincronizados no servidor.",
        highlights: [
            "💰 Gold Sincronizado: Seu ouro agora está protegido no servidor.",
            "🎒 Inventário Global: Itens consumíveis persistentes em qualquer dispositivo.",
            "🎨 Cosméticos Fixos: Sua bordas e temas agora são salvos na sua conta.",
            "🧹 Rebranding: Remoção completa de referências legadas.",
            "🚀 Home Otimizada: Navegação fluida e remoção de placeholders."
        ],
        date: "2025-02-18"
    },
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

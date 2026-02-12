import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, Users, Zap, Swords, Crown } from "lucide-react";

interface GuildCardProps {
    guild: {
        id: number;
        name: string;
        description: string | null;
        totalXp: number;
        totalRaidsCompleted: number;
        memberCount?: number;
        leaderName?: string;
        leaderAvatar?: string | null;
    };
    onJoin?: (guildId: number) => void;
    isJoining?: boolean;
}

export function GuildCard({ guild, onJoin, isJoining }: GuildCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-card/50 border border-border hover:border-primary/40 rounded-xl p-5 backdrop-blur-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)]"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-purple-600/30 border border-primary/20 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                            {guild.name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Crown className="w-3 h-3 text-yellow-500" />
                            {guild.leaderName || "Unknown"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Description */}
            {guild.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{guild.description}</p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-background/50 rounded-lg p-2 text-center border border-border/50">
                    <Users className="w-3.5 h-3.5 text-blue-400 mx-auto mb-0.5" />
                    <span className="text-sm font-bold text-foreground">{guild.memberCount || 0}</span>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Membros</p>
                </div>
                <div className="bg-background/50 rounded-lg p-2 text-center border border-border/50">
                    <Zap className="w-3.5 h-3.5 text-yellow-400 mx-auto mb-0.5" />
                    <span className="text-sm font-bold text-foreground">{guild.totalXp}</span>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">XP</p>
                </div>
                <div className="bg-background/50 rounded-lg p-2 text-center border border-border/50">
                    <Swords className="w-3.5 h-3.5 text-red-400 mx-auto mb-0.5" />
                    <span className="text-sm font-bold text-foreground">{guild.totalRaidsCompleted}</span>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Raids</p>
                </div>
            </div>

            {/* Join Button */}
            {onJoin && (
                <Button
                    onClick={() => onJoin(guild.id)}
                    disabled={isJoining}
                    variant="outline"
                    className="w-full border-primary/30 hover:bg-primary/10 hover:border-primary font-bold"
                >
                    {isJoining ? "Entrando..." : "⚔️ Entrar na Guilda"}
                </Button>
            )}
        </motion.div>
    );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, UserPlus, Search, Check, X, ArrowLeft,
    Loader2, Zap, Coins, CalendarCheck, UserMinus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

function getRankName(level: number) {
    if (level > 100) return "Thorium";
    if (level > 75) return "Diamante";
    if (level > 50) return "Platina";
    if (level > 25) return "Ouro";
    if (level > 10) return "Prata";
    return "Ferro";
}

function getRankColor(level: number) {
    if (level > 100) return "text-cyan-300";
    if (level > 75) return "text-blue-400";
    if (level > 50) return "text-purple-400";
    if (level > 25) return "text-yellow-400";
    if (level > 10) return "text-slate-300";
    return "text-orange-700";
}

export default function FriendsPage() {
    const [, setLocation] = useLocation();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"friends" | "requests" | "search">("friends");

    // Queries
    const { data: friends = [], isLoading: loadingFriends } = trpc.friends.list.useQuery();
    const { data: requests = [], isLoading: loadingRequests } = trpc.friends.requests.useQuery();
    const { data: searchResults = [], isFetching: searching } = trpc.friends.search.useQuery(
        { query: searchQuery },
        { enabled: searchQuery.length >= 2 }
    );

    // Mutations
    const sendMutation = trpc.friends.send.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [["friends", "list"]] });
            toast.success("Pedido de amizade enviado! 🤝");
        },
        onError: (e) => toast.error(e.message),
    });

    const acceptMutation = trpc.friends.accept.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [["friends", "list"]] });
            queryClient.invalidateQueries({ queryKey: [["friends", "requests"]] });
            toast.success("Amizade aceita! 🎉");
        },
        onError: (e) => toast.error(e.message),
    });

    const rejectMutation = trpc.friends.reject.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [["friends", "requests"]] });
            toast.info("Pedido recusado.");
        },
    });

    const removeMutation = trpc.friends.remove.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [["friends", "list"]] });
            toast.info("Amigo removido.");
        },
    });

    const friendIds = new Set(friends.map((f: any) => f.friendId ?? f.id));

    return (
        <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
            <div className="container py-8 max-w-3xl space-y-6">

                {/* Header */}
                <header className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                            Aliados
                        </h1>
                        <p className="text-muted-foreground text-sm">Sua rede de guerreiros</p>
                    </div>
                </header>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-border pb-2">
                    <Button
                        variant={activeTab === "friends" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setActiveTab("friends")}
                        className="gap-2"
                    >
                        <Users className="w-4 h-4" />
                        Amigos
                        {friends.length > 0 && (
                            <span className="bg-primary/20 text-primary text-xs px-1.5 rounded-full">
                                {friends.length}
                            </span>
                        )}
                    </Button>
                    <Button
                        variant={activeTab === "requests" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setActiveTab("requests")}
                        className="gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        Pedidos
                        {requests.length > 0 && (
                            <span className="bg-yellow-500/20 text-yellow-400 text-xs px-1.5 rounded-full">
                                {requests.length}
                            </span>
                        )}
                    </Button>
                    <Button
                        variant={activeTab === "search" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setActiveTab("search")}
                        className="gap-2"
                    >
                        <Search className="w-4 h-4" />
                        Buscar
                    </Button>
                </div>

                {/* Friends Tab */}
                {activeTab === "friends" && (
                    <div className="space-y-3">
                        {loadingFriends ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : friends.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">Nenhum aliado ainda</p>
                                <p className="text-sm mt-1">Use a aba Buscar para encontrar guerreiros</p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {friends.map((friend: any) => (
                                    <motion.div
                                        key={friend.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
                                    >
                                        {/* Avatar */}
                                        <div className="relative flex-shrink-0">
                                            <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center overflow-hidden">
                                                {friend.avatarUrl ? (
                                                    <img src={friend.avatarUrl} alt={friend.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xl font-bold text-primary">
                                                        {(friend.name || "?")[0].toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 bg-background border border-border rounded-full px-1 text-[10px] font-bold text-primary">
                                                {friend.level ?? 1}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold truncate">{friend.name ?? "Guerreiro"}</p>
                                            <p className={cn("text-xs font-medium", getRankColor(friend.level ?? 1))}>
                                                {getRankName(friend.level ?? 1)}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Zap className="w-3 h-3 text-yellow-400" />
                                                    {friend.totalXp ?? 0} XP
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <CalendarCheck className="w-3 h-3 text-primary" />
                                                    Nível {friend.level ?? 1}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Remove */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                                            onClick={() => removeMutation.mutate({ friendshipId: friend.id })}
                                            disabled={removeMutation.isPending}
                                        >
                                            <UserMinus className="w-4 h-4" />
                                        </Button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                )}

                {/* Requests Tab */}
                {activeTab === "requests" && (
                    <div className="space-y-3">
                        {loadingRequests ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                                <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">Nenhum pedido pendente</p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {requests.map((req: any) => (
                                    <motion.div
                                        key={req.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="flex items-center gap-4 p-4 bg-card border border-yellow-500/20 rounded-xl"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center flex-shrink-0">
                                            <span className="text-lg font-bold text-yellow-400">
                                                {(req.name || "?")[0].toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold truncate">{req.name ?? "Guerreiro"}</p>
                                            <p className="text-xs text-muted-foreground">Quer ser seu aliado</p>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <Button
                                                size="icon"
                                                variant="default"
                                                className="bg-primary/20 hover:bg-primary/40 text-primary"
                                                onClick={() => acceptMutation.mutate({ requestId: req.id })}
                                                disabled={acceptMutation.isPending}
                                            >
                                                <Check className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => rejectMutation.mutate({ requestId: req.id })}
                                                disabled={rejectMutation.isPending}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                )}

                {/* Search Tab */}
                {activeTab === "search" && (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nome..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-secondary/50"
                            />
                            {searching && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                            )}
                        </div>

                        {searchQuery.length < 2 ? (
                            <p className="text-center text-muted-foreground text-sm py-8">
                                Digite pelo menos 2 caracteres para buscar
                            </p>
                        ) : searchResults.length === 0 && !searching ? (
                            <p className="text-center text-muted-foreground text-sm py-8">
                                Nenhum guerreiro encontrado com esse nome
                            </p>
                        ) : (
                            <AnimatePresence>
                                {searchResults.map((user: any) => {
                                    const isAlreadyFriend = friendIds.has(user.id);
                                    return (
                                        <motion.div
                                            key={user.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
                                                {user.avatarUrl ? (
                                                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                    <span className="text-lg font-bold text-primary">
                                                        {(user.name || "?")[0].toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold truncate">{user.name ?? "Guerreiro"}</p>
                                                <p className={cn("text-xs font-medium", getRankColor(user.level ?? 1))}>
                                                    {getRankName(user.level ?? 1)} · Nível {user.level ?? 1}
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant={isAlreadyFriend ? "secondary" : "default"}
                                                disabled={isAlreadyFriend || sendMutation.isPending}
                                                onClick={() => !isAlreadyFriend && sendMutation.mutate({ friendId: user.id })}
                                                className="flex-shrink-0"
                                            >
                                                {isAlreadyFriend ? (
                                                    <><Check className="w-3 h-3 mr-1" /> Aliado</>
                                                ) : (
                                                    <><UserPlus className="w-3 h-3 mr-1" /> Adicionar</>
                                                )}
                                            </Button>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

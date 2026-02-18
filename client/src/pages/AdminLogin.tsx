import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, KeyRound } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

/**
 * Hidden admin login page — accessible only via /admin-access
 * Not linked anywhere in the app.
 */
export default function AdminLogin() {
    const [, setLocation] = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const loginMutation = trpc.auth.login.useMutation({
        onSuccess: () => {
            toast.success("Acesso administrativo concedido", {
                description: "Painel do administrador ativo.",
            });
            window.location.href = "/dashboard";
        },
        onError: () => {
            // Return 404-like behavior to avoid leaking info
            setLocation("/not-found");
        },
    });

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        loginMutation.mutate({ email, password });
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="flex items-center justify-center gap-2 mb-8">
                    <Shield className="h-8 w-8 text-muted-foreground" />
                </div>

                <Card className="bg-card border-border p-8 shadow-lg">
                    <div className="mb-6">
                        <h1 className="text-xl font-display mb-1">Acesso Restrito</h1>
                        <p className="text-sm text-muted-foreground">
                            Área reservada para administração do sistema.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="admin-email">Identificação</Label>
                            <Input
                                id="admin-email"
                                type="email"
                                placeholder="admin@rp8.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loginMutation.isPending}
                                className="bg-secondary/50 border-border"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="admin-password">Chave</Label>
                            <Input
                                id="admin-password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loginMutation.isPending}
                                className="bg-secondary/50 border-border"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loginMutation.isPending || !email || !password}
                            className="w-full"
                        >
                            <KeyRound className="h-4 w-4 mr-2" />
                            {loginMutation.isPending ? "Verificando..." : "Autenticar"}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}

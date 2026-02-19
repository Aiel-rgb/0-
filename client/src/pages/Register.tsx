import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mountain } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function Register() {
    const [, setLocation] = useLocation();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const registerMutation = trpc.auth.register.useMutation({
        onSuccess: () => {
            toast.success("Conta criada com sucesso!", {
                description: "Bem-vindo ao RP8!",
            });
            window.location.href = "/dashboard";
        },
        onError: (error) => {
            toast.error("Erro ao criar conta", {
                description: error.message || "Tente novamente mais tarde.",
            });
        }
    });

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Senhas não conferem");
            return;
        }
        if (password.length < 6) {
            toast.error("A senha deve ter no mínimo 6 caracteres");
            return;
        }
        registerMutation.mutate({ name, email, password });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <img src="/assets/icons/icone.svg" alt="RP8 Logo" className="h-10 w-10 object-contain" />
                    <span className="font-display text-2xl text-primary">RP8</span>
                </div>

                {/* Register Card */}
                <Card className="bg-card border-border p-8 shadow-lg">
                    <div className="mb-8">
                        <h1 className="text-3xl font-display mb-2">Crie sua conta</h1>
                        <p className="text-muted-foreground">
                            Comece sua jornada épica hoje mesmo
                        </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Seu nome de herói"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={registerMutation.isPending}
                                className="bg-secondary/50 border-border"
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={registerMutation.isPending}
                                className="bg-secondary/50 border-border"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={registerMutation.isPending}
                                className="bg-secondary/50 border-border"
                                required
                            />
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={registerMutation.isPending}
                                className="bg-secondary/50 border-border"
                                required
                            />
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={registerMutation.isPending || !email || !password || !name}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan"
                        >
                            {registerMutation.isPending ? "Criando conta..." : "Registrar"}
                        </Button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center text-sm">
                        <p className="text-muted-foreground">
                            Já tem uma conta?{" "}
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Faça login
                            </Link>
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}

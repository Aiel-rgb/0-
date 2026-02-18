import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mountain, Zap } from "lucide-react";
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

/**
 * Login page with predefined admin credentials
 * Admin: admin@peakhabit.com / password: admin123
 */
export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      console.log("Login mutation success!");
      toast.success("Login realizado com sucesso!", {
        description: "Bem-vindo ao RP8!",
      });
      // Force navigation to ensure auth state is refreshed
      window.location.href = "/dashboard";
    },
    onError: (error) => {
      toast.error(error.message === "Invalid credentials" ? "Credenciais inválidas" : "Erro ao realizar login", {
        description: "Verifique email e senha e tente novamente.",
      });
    }
  });

  const ADMIN_EMAIL = "admin@peakhabit.com";
  const ADMIN_PASSWORD = "admin123";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  const handleDemoLogin = () => {
    setEmail(ADMIN_EMAIL);
    setPassword(ADMIN_PASSWORD);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Mountain className="h-10 w-10 text-primary" />
          <span className="font-display text-2xl text-primary">PEAK</span>
        </div>

        {/* Login Card */}
        <Card className="bg-card border-border p-8 shadow-lg">
          <div className="mb-8">
            <h1 className="text-3xl font-display mb-2">Bem-vindo</h1>
            <p className="text-muted-foreground">
              Faça login para começar seu desafio de 75 dias
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loginMutation.isPending}
                className="bg-secondary/50 border-border"
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
                disabled={loginMutation.isPending}
                className="bg-secondary/50 border-border"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loginMutation.isPending || !email || !password}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan"
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">
              Credenciais de demonstração:
            </p>
            <div className="space-y-3 mb-4">
              <div className="bg-secondary/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-mono">{ADMIN_EMAIL}</p>
              </div>
              <div className="bg-secondary/50 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">Senha</p>
                <p className="text-sm font-mono">{ADMIN_PASSWORD}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full border-border hover:bg-secondary"
              onClick={handleDemoLogin}
              disabled={loginMutation.isPending}
            >
              <Zap className="h-4 w-4 mr-2" />
              Usar Credenciais Demo
            </Button>
          </div>
          {/* Register Link */}
          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Não tem uma conta?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Crie sua conta
              </Link>
            </p>
          </div>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Este é um ambiente de demonstração. Os dados não são persistidos entre sessões.
          </p>
        </div>
      </div>
    </div>
  );
}

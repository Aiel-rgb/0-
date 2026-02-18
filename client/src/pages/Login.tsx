import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mountain } from "lucide-react";
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

/**
 * Public login page for regular users
 */
export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Login realizado com sucesso!", {
        description: "Bem-vindo ao RP8!",
      });
      window.location.href = "/dashboard";
    },
    onError: (error) => {
      toast.error(error.message === "Invalid credentials" ? "Credenciais inválidas" : "Erro ao realizar login", {
        description: "Verifique email e senha e tente novamente.",
      });
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Mountain className="h-10 w-10 text-primary" />
          <span className="font-display text-2xl text-primary">RP8</span>
        </div>

        {/* Login Card */}
        <Card className="bg-card border-border p-8 shadow-lg">
          <div className="mb-8">
            <h1 className="text-3xl font-display mb-2">Bem-vindo</h1>
            <p className="text-muted-foreground">
              Faça login para continuar sua jornada
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
      </div>
    </div>
  );
}

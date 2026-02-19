import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Zap, Target, Flame, BookOpen, Brain, Mountain, Trophy } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

/**
 * RP8 Landing Page
 * Design Philosophy: Dark Tech Minimalism with Gamification Visual
 * - Dark background (#0a0a0a) with neon accents (cyan, green, purple)
 * - Space Grotesk for headlines, Inter for body text
 * - Asymmetric layout with alternating sections
 * - Neon glow effects and smooth animations
 */

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  // Refs para scroll suave
  const recursosRef = useRef<HTMLDivElement | null>(null);
  const stackRef = useRef<HTMLDivElement | null>(null);

  // Funções de scroll suave
  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Funções de CTA
  const handleDownloadApp = () => {
    window.location.href = "/login";
  };

  const handleStartChallenge = () => {
    window.location.href = "/login";
  };

  const handleViewDemo = () => {
    toast.info("Demo em breve", {
      description: "Confira em breve um vídeo demonstrativo do app.",
    });
  };

  const handleLearnMore = () => {
    toast.info("Saiba mais", {
      description: "Acesse nosso blog para conteúdo exclusivo sobre hábitos.",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <img src="/assets/icons/icone.svg" alt="RP8 Logo" className="w-28 h-28 object-contain" />
            <span className="font-display text-xl text-primary">RP8</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scrollToSection(recursosRef)}
              className="hover:text-primary transition"
            >
              Recursos
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scrollToSection(stackRef)}
              className="hover:text-primary transition"
            >
              Stack Técnico
            </Button>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan"
              onClick={handleDownloadApp}
            >
              Baixar App
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="container relative grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-display leading-tight">
                Transforme sua vida em <span className="text-primary text-glow-cyan">75 dias</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                Gamifique sua rotina, ganhe XP, suba de nível e torne-se a melhor versão de si mesmo. RP8 é o app que transforma disciplina em diversão.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan"
                onClick={handleStartChallenge}
              >
                Comece Agora <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border hover:bg-secondary"
                onClick={handleViewDemo}
              >
                Ver Demo
              </Button>
            </div>
            <div className="flex gap-8 pt-4">
              <div>
                <p className="text-primary font-display text-2xl">75</p>
                <p className="text-sm text-muted-foreground">Dias de Transformação</p>
              </div>
              <div>
                <p className="text-primary font-display text-2xl">10</p>
                <p className="text-sm text-muted-foreground">Níveis para Desbloquear</p>
              </div>
              <div>
                <p className="text-primary font-display text-2xl">15+</p>
                <p className="text-sm text-muted-foreground">Hábitos Científicos</p>
              </div>
            </div>
          </div>
          <div className="relative h-96 md:h-full">
            <img
              src="https://private-us-east-1.manuscdn.com/sessionFile/RP75638VsA3MZVf8CFy7bG/sandbox/rncAgsJQsvX04yJDm8jIxE-img-1_1770676679000_na1fn_aGVyby1tb3VudGFpbg.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUlA3NTYzOFZzQTNNWlZmOENGeTdiRy9zYW5kYm94L3JuY0Fnc0pRc3ZYMDR5SkRtOGpJeEUtaW1nLTFfMTc3MDY3NjY3OTAwMF9uYTFmbl9hR1Z5YnkxdGIzVnVkR0ZwYmcucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=olfCPbBA496S0TT6DJ3Ae1ROHrGRXOwCsUh84Xi~-d3OHcX531mgWPM28C7Y4JgJrOn~dl~9ySHf65K4CYl1U7HGHwwBL822gaav1eoJdCUX6zIHBQfp6nZrqc3MUQigx9QgHA5psktG0KnF9oC-7~FXkZoK2Xs8Z9HvHnc4JTqqr3VJ0eTyfYjE9H7Dqyluuu4DuR3BvF0ZpKYami5VjFyRALH23FwKPN6G79GZGAp2GQtgpFWs62nltzP3N~EJQKYe6a4CVuMeXwsKz7p0PnMtSzh9-tKcBXaT0xBWMbtQAifk628DqYZmlNoftAEe-99cn~7MHsR6bnUQpmvP3Q__"
              alt="Mountain Peak"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={recursosRef} className="py-20 md:py-32 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display mb-4">Recursos Principais</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para transformar hábitos em poder
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Feature 1 */}
            <Card className="bg-card border-border p-8 hover:border-primary/50 transition-all hover:glow-cyan">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-display mb-2">Sistema de XP</h3>
                  <p className="text-muted-foreground">
                    Ganhe experiência ao completar hábitos diários. Suba de nível e desbloqueie conquistas exclusivas.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-card border-border p-8 hover:border-primary/50 transition-all hover:glow-cyan">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-display mb-2">Rastreamento de Hábitos</h3>
                  <p className="text-muted-foreground">
                    15+ hábitos científicos pré-configurados. Customize sua jornada de 75 dias com metas pessoais.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-card border-border p-8 hover:border-primary/50 transition-all hover:glow-cyan">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <Flame className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-display mb-2">Timer de Foco</h3>
                  <p className="text-muted-foreground">
                    Pomodoro integrado com exercícios de respiração (Wim Hof, 4-7-8, Box Breathing).
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature 4 */}
            <Card className="bg-card border-border p-8 hover:border-primary/50 transition-all hover:glow-cyan">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-display mb-2">Diário de Fotos</h3>
                  <p className="text-muted-foreground">
                    Capture seu progresso diariamente. Veja a transformação em um timelapse ao final dos 75 dias.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Gamification Section */}
      <section className="py-20 md:py-32">
        <div className="container grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <img
              src="https://private-us-east-1.manuscdn.com/sessionFile/RP75638VsA3MZVf8CFy7bG/sandbox/rncAgsJQsvX04yJDm8jIxE-img-2_1770676675000_na1fn_Z2FtaWZpY2F0aW9uLXhw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUlA3NTYzOFZzQTNNWlZmOENGeTdiRy9zYW5kYm94L3JuY0Fnc0pRc3ZYMDR5SkRtOGpJeEUtaW1nLTJfMTc3MDY3NjY3NTAwMF9uYTFmbl9aMkZ0YVdacFkyRjBhVzl1TFhod1BuTT0ucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=dYXaPDOvIiWt6zs82iFSnm62Aaehed5d8hjUaZ0lBOFpJmWMflPVX1w4eR0KaZvg0-UynxJmdbOIMU5Yp2PqAdyA7fooX5Eyv4mXfjIxwkilhTE9nT~bBKu4lbZEnDPz5vlbdAc0WOJmSzESYZE557PZzW0cu2j4B3bdz1t6Q7DEGwW5jq6IX-NtUKzqiLkTHRNTFyNggumRZuaNey3ep3Lk0FqmNZW4Xn5U12r8rv5gHm5BrEaL7n0HSHqi4k8iWMBFJyH8q-E4ACypmNBs8EX5K2Fo7fkHD-05tTfam8P76warXwknvtaZJnckMuPXLqCBU55vtquZwfCBEH~~JA__"
              alt="Gamification XP"
              className="w-full rounded-lg"
            />
          </div>
          <div className="order-1 md:order-2 space-y-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-display mb-4">Gamificação RPG</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Sua vida é um jogo. Ganhe XP, suba de nível e desenvolva atributos reais: Força, Foco, Disciplina e Confiança.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <p className="text-foreground">10 Níveis de Progressão (Iniciante até Mestre de Si)</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <p className="text-foreground">Badges e Conquistas Desbloqueáveis</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <p className="text-foreground">Visualização da Montanha (5 Fases)</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <p className="text-foreground">Ranking em Tempo Real</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Focus & Meditation Section */}
      <section className="py-20 md:py-32 bg-secondary/30">
        <div className="container grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-display mb-4">Foco Profundo</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Timer Pomodoro integrado com guias de respiração para manter o foco e a calma durante sessões de trabalho intenso.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-primary" />
                <p className="text-foreground">Meditação Guiada</p>
              </div>
              <div className="flex items-center gap-3">
                <Flame className="h-5 w-5 text-primary" />
                <p className="text-foreground">Técnicas de Respiração Avançadas</p>
              </div>
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-primary" />
                <p className="text-foreground">Sessões de Foco Rastreadas</p>
              </div>
            </div>
          </div>
          <div className="relative h-96">
            <img
              src="https://private-us-east-1.manuscdn.com/sessionFile/RP75638VsA3MZVf8CFy7bG/sandbox/rncAgsJQsvX04yJDm8jIxE-img-3_1770676673000_na1fn_Zm9jdXMtdGltZXI.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUlA3NTYzOFZzQTNNWlZmOENGeTdiRy9zYW5kYm94L3JuY0Fnc0pRc3ZYMDR5SkRtOGpJeEUtaW1nLTNfMTc3MDY3NjY3MzAwMF9uYTFmbl9abTlqZFhNdGRHbHRaWEkucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=UWMvJfMyxYaf0vHuHHgq25P5m4HVZkhRFhRXUsgVZFEoG7u02N9UAC23HXFYxznwN0oPSy8qfeCXWFvTkZidVSoGak9QjHHHCUQ~efRC9IzUY962ldV2UypcFAU56lY-yXq5NgSj-P9yB5eKlHXSvV5nFL43mlEg7Kb8RGl0TPlWgyxcGl1b5wHkHwXW93rRBznAxGHnhemC1NkhSnzyKNZ~Mqaq6vKIPOHkTfi77oXjuJbWibYu-NK2SmKhTNahYlWIAZ9IuTcraQUWuJNCpdaM57yrlc5IpCfZz6NKFJybgQLtkEQ9CtFQyOBunzT0BwkUC~~V-x5NkD2pM9F6Eg__"
              alt="Focus Timer"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* Photo Journal Section */}
      <section className="py-20 md:py-32">
        <div className="container grid md:grid-cols-2 gap-12 items-center">
          <div className="relative h-96 md:h-full">
            <img
              src="https://private-us-east-1.manuscdn.com/sessionFile/RP75638VsA3MZVf8CFy7bG/sandbox/rncAgsJQsvX04yJDm8jIxE-img-4_1770676679000_na1fn_cGhvdG8tam91cm5hbA.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvUlA3NTYzOFZzQTNNWlZmOENGeTdiRy9zYW5kYm94L3JuY0Fnc0pRc3ZYMDR5SkRtOGpJeEUtaW1nLTRfMTc3MDY3NjY3OTAwMF9uYTFmbl9jR2h2ZEc4dGFtOTFjbTVoYkEucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=NdNEMXVF0Qm5ydVkB66F9TUI99-x-M8491ck8Ewn8aeStYPERh2Bsg9cC08qmS~aJ83XAqhayCS1lX-toc38B0CYtq~uX07~EycM7ruO2nXRvJ6q9MllUievtjcuyqYcipf3oWGLKFRchYNdkGIyML1h~ptVW2XwsncIAl82IwxgpB~mIVZbhBuysAU~9WGEVgY4Ysa7MeDnThuLjWBY2xMnlYe2an6Nt1rn00MEpIykHIHVzENnviDy~QOt4eSD4IHTXEihw6by0ZygMdBF9-IcNU0iuBcN~8uMW42zK8r0JDU4k8NE6sF~lbUodVKM~8NlopxjZI46MRsQ8CuAgQ__"
              alt="Photo Journal"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div className="space-y-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-display mb-4">Diário de Progresso</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Capture uma foto diária de seu progresso. Ao final dos 75 dias, veja a transformação em um timelapse impressionante.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <p className="text-foreground">Galeria Visual de Progresso</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <p className="text-foreground">Timeline Interativa</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <p className="text-foreground">Comparação Antes e Depois</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <p className="text-foreground">Compartilhamento em Redes Sociais</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section ref={stackRef} className="py-20 md:py-32 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display mb-4">Stack Tecnológico</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Construído com as melhores tecnologias para performance e escalabilidade
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card border-border p-8">
              <h3 className="text-xl font-display mb-4 text-primary">Frontend</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Flutter (Multiplataforma)</li>
                <li>• Bloc/Riverpod (State Management)</li>
                <li>• Rive (Animações)</li>
                <li>• Material Design 3</li>
              </ul>
            </Card>

            <Card className="bg-card border-border p-8">
              <h3 className="text-xl font-display mb-4 text-primary">Backend</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Supabase (PostgreSQL)</li>
                <li>• Autenticação Social</li>
                <li>• S3 Storage (Fotos)</li>
                <li>• Real-time Sync</li>
              </ul>
            </Card>

            <Card className="bg-card border-border p-8">
              <h3 className="text-xl font-display mb-4 text-primary">Bibliotecas</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• fl_chart (Gráficos)</li>
                <li>• camera (Fotos)</li>
                <li>• local_notifications</li>
                <li>• drift (Local DB)</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 pointer-events-none" />
        <div className="container relative text-center space-y-8">
          <div>
            <h2 className="text-4xl md:text-5xl font-display mb-4">Pronto para Transformar sua Vida?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Comece seu desafio de 75 dias hoje e torne-se a melhor versão de si mesmo
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan"
              onClick={handleDownloadApp}
            >
              Baixar Agora <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-border hover:bg-secondary"
              onClick={handleLearnMore}
            >
              Saber Mais
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/50 py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-display text-primary mb-4">RP8</h4>
              <p className="text-sm text-muted-foreground">
                Transforme sua vida em 75 dias com gamificação e disciplina.
              </p>
            </div>
            <div>
              <h4 className="font-display text-sm mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button
                    onClick={() => scrollToSection(recursosRef)}
                    className="hover:text-primary transition"
                  >
                    Recursos
                  </button>
                </li>
                <li>
                  <button onClick={handleLearnMore} className="hover:text-primary transition">
                    Preços
                  </button>
                </li>
                <li>
                  <button onClick={handleDownloadApp} className="hover:text-primary transition">
                    Download
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-display text-sm mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button onClick={handleLearnMore} className="hover:text-primary transition">
                    Sobre
                  </button>
                </li>
                <li>
                  <button onClick={handleLearnMore} className="hover:text-primary transition">
                    Blog
                  </button>
                </li>
                <li>
                  <button onClick={handleLearnMore} className="hover:text-primary transition">
                    Contato
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-display text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button onClick={handleLearnMore} className="hover:text-primary transition">
                    Privacidade
                  </button>
                </li>
                <li>
                  <button onClick={handleLearnMore} className="hover:text-primary transition">
                    Termos
                  </button>
                </li>
                <li>
                  <button onClick={handleLearnMore} className="hover:text-primary transition">
                    Cookies
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2026 RP8. Todos os direitos reservados.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <button onClick={handleLearnMore} className="text-muted-foreground hover:text-primary transition">
                Twitter
              </button>
              <button onClick={handleLearnMore} className="text-muted-foreground hover:text-primary transition">
                Instagram
              </button>
              <button onClick={handleLearnMore} className="text-muted-foreground hover:text-primary transition">
                LinkedIn
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useDemo } from "@/contexts/DemoContext";
import {
  ArrowRight,
  BarChart3,
  Users,
  TrendingUp,
  Target,
  Zap,
  Shield,
  Check,
  Star,
  ChevronRight,
  Activity,
  PieChart,
  DollarSign,
  MessageSquare,
  Globe,
  Smartphone,
  Mail,
} from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

/* ─── DS3.0 tokens — Acid #CCFF00 ─── */
const GREEN = "#CCFF00";
const GREEN_TEXT = "#1a1a1a"; // text on acid background

/* ─── Scroll Reveal Wrapper ─── */
const RevealSection = ({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => {
  const { ref, isVisible } = useScrollReveal(0.12);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

/* ─── Navbar ─── */
const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-md border-b border-border/50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
          <Zap className="w-4 h-4" style={{ color: GREEN }} />
        </div>
        <span className="text-lg font-bold text-foreground tracking-tight">Leads Intel</span>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Produto
        </a>
        <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Soluções
        </a>
        <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Recursos
        </a>
        <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Preços
        </a>
      </div>

      <div className="flex items-center gap-3">
        <Link to="/auth">
          <Button variant="ghost" size="sm">
            Entrar
          </Button>
        </Link>
        <Link to="/auth">
          <Button size="sm">
            Começar Grátis
          </Button>
        </Link>
      </div>
    </div>
  </nav>
);

/* ─── Mini chart SVG for floating cards ─── */
const MiniLineChart = () => (
  <svg width="80" height="32" viewBox="0 0 80 32" fill="none">
    <polyline
      points="0,28 12,22 24,24 36,16 48,18 60,8 72,12 80,4"
      stroke={GREEN}
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MiniDonut = () => (
  <svg width="48" height="48" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="18" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
    <circle
      cx="24"
      cy="24"
      r="18"
      fill="none"
      stroke={GREEN}
      strokeWidth="6"
      strokeDasharray="84 113"
      strokeLinecap="round"
      transform="rotate(-90 24 24)"
    />
  </svg>
);

const MiniBarChart = () => (
  <svg width="64" height="32" viewBox="0 0 64 32">
    <rect x="2" y="18" width="8" height="14" rx="1" fill="hsl(var(--border))" />
    <rect x="14" y="12" width="8" height="20" rx="1" fill="hsl(var(--border))" />
    <rect x="26" y="8" width="8" height="24" rx="1" fill={GREEN} opacity="0.5" />
    <rect x="38" y="4" width="8" height="28" rx="1" fill={GREEN} opacity="0.75" />
    <rect x="50" y="0" width="8" height="32" rx="1" fill={GREEN} />
  </svg>
);

/* ─── Hero Section ─── */
const HeroSection = () => {
  const { startDemo } = useDemo();
  const navigate = useNavigate();

  const handleDemo = () => {
    startDemo();
    navigate("/dashboard");
  };

  return (
    <section className="pt-28 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-2xl bg-card overflow-hidden px-6 py-16 md:py-24 md:px-12">
          {/* DS3.0 grid background */}
          <div
            className="absolute inset-0 opacity-100 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]"
          />

          {/* Decorative accent corners */}
          <div className="absolute top-0 right-0 w-48 h-48 opacity-10" style={{
            background: `radial-gradient(circle at top right, ${GREEN}, transparent 70%)`
          }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 opacity-10" style={{
            background: `radial-gradient(circle at bottom left, ${GREEN}, transparent 70%)`
          }} />

          {/* Content */}
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-[rgba(204,255,0,0.12)] border border-[rgba(204,255,0,0.25)] mb-6">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GREEN }} />
              <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: GREEN }}>
                Plataforma Nº1 de Inteligência de Leads
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5 text-foreground leading-tight tracking-tight">
              Potencialize suas vendas com{" "}
              <span style={{ color: GREEN }}>Inteligência de Leads</span>
            </h1>

            <p className="text-base sm:text-lg mb-8 max-w-2xl mx-auto leading-relaxed text-muted-foreground">
              Unifique leads de múltiplos canais, rastreie campanhas com precisão e transforme dados em decisões
              inteligentes com dashboards avançados.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/auth">
                <Button size="lg" className="gap-2 shadow-none rounded-md px-8 hover:opacity-90" style={{ background: GREEN, color: GREEN_TEXT }}>
                  Começar Agora
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="rounded-md px-8 border-white/20 text-foreground bg-transparent hover:bg-white/10" onClick={handleDemo}>
                Ver Demonstração
              </Button>
            </div>
          </div>

          {/* Floating cards — hidden on mobile */}
          {/* Left card */}
          <div className="hidden lg:flex absolute left-6 top-1/4 flex-col gap-2 bg-background/50 dark:bg-background/10 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-lg max-w-[180px]">
            <span className="text-xs text-muted-foreground">Receita Gerada</span>
            <span className="text-lg font-bold text-foreground font-mono tracking-tight">R$ 47.500</span>
            <MiniLineChart />
          </div>

          {/* Right card */}
          <div className="hidden lg:flex absolute right-6 top-1/4 flex-col items-center gap-1 bg-background/50 dark:bg-background/10 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-lg">
            <MiniDonut />
            <span className="text-xl font-bold text-foreground font-mono mt-1">92%</span>
            <span className="text-xs text-muted-foreground">Taxa de Conversão</span>
          </div>

          {/* Bottom left */}
          <div className="hidden lg:flex absolute left-16 bottom-8 items-center gap-3 bg-background/50 dark:bg-background/10 backdrop-blur-md border border-border/50 rounded-xl p-3 shadow-lg">
            <MiniBarChart />
            <div>
              <span className="text-xs block text-muted-foreground">Vendas Mensais</span>
              <span className="text-sm font-bold font-mono tracking-tight" style={{ color: GREEN }}>+24%</span>
            </div>
          </div>

          {/* Bottom right */}
          <div className="hidden lg:flex absolute right-16 bottom-8 flex-col bg-background/50 dark:bg-background/10 backdrop-blur-md border border-border/50 rounded-xl p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: GREEN }} />
              <span className="text-xs text-muted-foreground">Leads Ativos</span>
            </div>
            <span className="text-lg font-bold text-foreground font-mono">1.284</span>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── Logos Section ─── */
const LogosSection = () => {
  const logos = [
    { name: "Hotmart", icon: Globe },
    { name: "ManyChat", icon: MessageSquare },
    { name: "Facebook", icon: Globe },
    { name: "WhatsApp", icon: Smartphone },
    { name: "N8N", icon: Zap },
    { name: "Pixel", icon: Target },
    { name: "Email", icon: Mail },
  ];

  return (
    <RevealSection>
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground mb-8 font-mono uppercase tracking-widest text-xs">Integrado com as plataformas que você já usa</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
            {logos.map((l) => (
              <div
                key={l.name}
                className="flex items-center gap-2 text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                <l.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{l.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </RevealSection>
  );
};

/* ─── Features Section ─── */
const FeaturesSection = () => (
  <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      <RevealSection>
        <div className="text-center mb-14">
          <span className="text-xs font-semibold tracking-widest uppercase font-mono" style={{ color: GREEN }}>Funcionalidades</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4 tracking-tight">Gestão Inteligente de Pipeline</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ferramentas poderosas para capturar, unificar e converter leads de forma eficiente
          </p>
        </div>
      </RevealSection>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <RevealSection delay={100}>
          <div className="rounded-xl border border-border/50 bg-card p-8 flex flex-col gap-4 h-full">
            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
              <Users className="w-6 h-6" style={{ color: GREEN }} />
            </div>
            <h3 className="text-xl font-semibold text-foreground tracking-tight">Unificação Inteligente</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Identifique e unifique leads automaticamente de múltiplas fontes — Hotmart, ManyChat, WhatsApp e mais.
              Elimine duplicatas e tenha uma visão 360° de cada contato.
            </p>
            <div className="mt-4 rounded-md bg-muted/50 border border-border/30 p-4 flex items-center gap-4">
              <div className="flex -space-x-2">
                {[
                  { bg: "bg-muted", color: "text-foreground" },
                  { bg: "", color: "text-black", style: { background: GREEN } },
                  { bg: "bg-[hsl(38,92%,50%)]", color: "text-white" },
                ].map((c, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full ${c.bg} ${c.color} flex items-center justify-center text-xs font-bold border-2 border-card font-mono`}
                    style={c.style}
                  >
                    {["H", "M", "W"][i]}
                  </div>
                ))}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                <Users className="w-5 h-5 text-foreground" />
              </div>
              <span className="text-xs text-muted-foreground">Lead Unificado</span>
            </div>
          </div>
        </RevealSection>

        <RevealSection delay={200}>
          <div className="rounded-xl border border-border/50 bg-card p-8 flex flex-col gap-4 h-full">
            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
              <TrendingUp className="w-6 h-6" style={{ color: GREEN }} />
            </div>
            <h3 className="text-xl font-semibold text-foreground tracking-tight">Rastreamento Total</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Monitore cada interação com Pixel de Rastreamento, UTMs e atribuição inteligente. Saiba exatamente de onde
              vêm suas conversões e otimize seu investimento.
            </p>
            <div className="mt-4 rounded-md bg-muted/50 border border-border/30 p-4">
              <div className="flex items-end gap-1">
                {[40, 55, 35, 65, 50, 80, 70, 90, 85, 95].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t"
                    style={{ height: `${h}%`, minHeight: `${h * 0.6}px`, background: `rgba(204,255,0,0.12)` }}
                  >
                    <div className="w-full rounded-t" style={{ height: "60%", background: GREEN }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </RevealSection>
      </div>

      <RevealSection delay={300}>
        <div className="rounded-xl border border-border/50 bg-card p-6 md:p-8">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {[
              { label: "Leads Capturados", value: "12.847", icon: Users, change: "+18%" },
              { label: "Taxa de Conversão", value: "8.4%", icon: TrendingUp, change: "+2.1%" },
              { label: "Receita Atribuída", value: "R$ 284K", icon: DollarSign, change: "+32%" },
            ].map((m) => (
              <div key={m.label} className="rounded-md bg-muted/50 border border-border/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                  <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                    <m.icon className="w-3.5 h-3.5" style={{ color: GREEN }} />
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-foreground tracking-tight font-mono">{m.value}</span>
                  <span className="text-xs font-medium mb-1 font-mono" style={{ color: GREEN }}>{m.change}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-md bg-muted/50 border border-border/30 p-4 h-32 flex items-end gap-1">
            {Array.from({ length: 24 }).map((_, i) => {
              const h = 20 + Math.sin(i * 0.5) * 40 + Math.random() * 20;
              return (
                <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: "rgba(204,255,0,0.12)" }}>
                  <div className="w-full rounded-t" style={{ height: `${40 + i * 2}%`, background: GREEN, opacity: 0.7 + i * 0.01 }} />
                </div>
              );
            })}
          </div>
        </div>
      </RevealSection>
    </div>
  </section>
);

/* ─── Stats Section ─── */
const StatsSection = () => (
  <RevealSection>
    <section id="stats" className="py-16 px-4 sm:px-6 lg:px-8 bg-card">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {[
          { value: "+20%", label: "Mais Leads Capturados" },
          { value: "98%", label: "Precisão na Unificação" },
          { value: "4B+", label: "Dados Processados" },
          { value: "46B", label: "Interações Rastreadas" },
        ].map((s) => (
          <div key={s.label}>
            <div className="text-3xl md:text-4xl font-bold font-mono tracking-tight" style={{ color: GREEN }}>{s.value}</div>
            <div className="text-sm mt-1 text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  </RevealSection>
);

/* ─── Pricing Section ─── */
const PricingSection = () => {
  const plans = [
    {
      name: "Individual",
      price: "Grátis",
      period: "",
      desc: "Para quem está começando",
      features: ["Até 500 leads", "1 campanha", "Dashboard básico", "Suporte por email"],
      cta: "Começar Grátis",
      highlight: false,
    },
    {
      name: "Teams",
      price: "R$ 49",
      period: "/mês",
      desc: "Para equipes em crescimento",
      features: [
        "Até 10.000 leads",
        "Campanhas ilimitadas",
        "Unificação inteligente",
        "Relatórios avançados",
        "Integrações premium",
        "Suporte prioritário",
      ],
      cta: "Assinar Agora",
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "R$ 199",
      period: "/mês",
      desc: "Para operações em escala",
      features: [
        "Leads ilimitados",
        "Tudo do Teams",
        "API completa",
        "SSO / SAML",
        "Gerente de conta dedicado",
        "SLA garantido",
      ],
      cta: "Falar com Vendas",
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <RevealSection>
          <div className="text-center mb-14">
            <span className="text-xs font-semibold tracking-widest uppercase font-mono" style={{ color: GREEN }}>Preços</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4 tracking-tight">Planos para Todos os Tamanhos</h2>
            <p className="text-muted-foreground">Comece grátis e escale conforme cresce</p>
          </div>
        </RevealSection>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p, idx) => (
            <RevealSection key={p.name} delay={idx * 120}>
              <div
                className={`rounded-xl border p-8 flex flex-col h-full relative ${p.highlight ? "border-foreground bg-card shadow-md" : "border-border/50 bg-card"
                  }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-md text-xs font-semibold font-mono tracking-wide" style={{ background: GREEN, color: GREEN_TEXT }}>
                    Mais Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold text-foreground tracking-tight">{p.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">{p.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground tracking-tight font-mono">{p.price}</span>
                  <span className="text-muted-foreground">{p.period}</span>
                </div>
                <ul className="flex-1 space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 shrink-0" style={{ color: GREEN }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button className="w-full" variant={p.highlight ? "default" : "outline"}>
                    {p.cta}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── Testimonials Section ─── */
const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Mariana Silva",
      role: "Head de Marketing, TechBR",
      text: "O Leads Intel transformou nossa operação. Unificamos mais de 30 mil leads e aumentamos a conversão em 40%.",
      initials: "MS",
    },
    {
      name: "Carlos Mendes",
      role: "CEO, DigitalPro",
      text: "Finalmente consigo ver o ROI real de cada campanha. A atribuição inteligente mudou completamente nossas decisões.",
      initials: "CM",
    },
    {
      name: "Ana Costa",
      role: "Gerente Comercial, EduTech",
      text: "A integração com Hotmart e ManyChat é perfeita. Economizamos 20 horas por semana em processos manuais.",
      initials: "AC",
    },
  ];

  return (
    <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <RevealSection>
          <div className="text-center mb-14">
            <span className="text-xs font-semibold tracking-widest uppercase font-mono" style={{ color: GREEN }}>Depoimentos</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4 tracking-tight">
              Mais de 10K+ Clientes Satisfeitos
            </h2>
          </div>
        </RevealSection>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <RevealSection key={t.name} delay={idx * 120}>
              <div className="rounded-xl border border-border/50 bg-card p-6 flex flex-col gap-4 h-full">
                <div className="flex gap-1" style={{ color: "hsl(38,92%,50%)" }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-border/30">
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-foreground font-mono">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── CTA Final ─── */
const CTASection = () => (
  <RevealSection>
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center rounded-2xl bg-card p-12 md:p-16 relative overflow-hidden">
        {/* DS3.0 grid overlay */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"
        />
        {/* Green accent */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-15 pointer-events-none" style={{
          background: `radial-gradient(circle at top right, ${GREEN}, transparent 60%)`
        }} />
        <div className="relative z-10">
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Pronto para Transformar Seus Leads?
          </h2>
          <p className="mb-8 max-w-xl mx-auto text-muted-foreground">
            Junte-se a milhares de empresas que já usam o Leads Intel para crescer de forma inteligente.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/auth">
              <Button
                size="lg"
                className="rounded-md px-8 gap-2"
                style={{ background: GREEN, color: GREEN_TEXT }}
              >
                Começar Grátis
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="rounded-md px-8 border-white/20 text-foreground bg-transparent hover:bg-white/10"
            >
              Agendar Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  </RevealSection>
);

/* ─── Footer ─── */
const Footer = () => (
  <footer className="border-t border-border/50 py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
          <Zap className="w-3.5 h-3.5" style={{ color: GREEN }} />
        </div>
        <span className="font-bold text-foreground tracking-tight">Leads Intel</span>
      </div>
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <a href="#" className="hover:text-foreground transition-colors">
          Termos
        </a>
        <a href="#" className="hover:text-foreground transition-colors">
          Privacidade
        </a>
        <a href="#" className="hover:text-foreground transition-colors">
          Contato
        </a>
      </div>
      <p className="text-xs text-muted-foreground font-mono">© 2025 Leads Intel. Todos os direitos reservados.</p>
    </div>
  </footer>
);

/* ─── Main Component ─── */
const LandingHero = () => {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <LogosSection />
      <FeaturesSection />
      <StatsSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default LandingHero;

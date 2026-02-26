import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Github, Server, Globe, Shield, Code, Terminal, Database, MessageSquare, Cpu, ExternalLink, GitFork, Star, CheckCircle2 } from "lucide-react";
import { Footer } from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";

const GITHUB_URL = "https://github.com/autopenguin-ai/autopenguin";

export default function OpenSource() {
  const navigate = useNavigate();

  const features = [
    {
      icon: MessageSquare,
      title: "AI Assistant",
      description: "Chat-first interface with a personal AI that learns your preferences. Configurable name, personality, and LLM provider.",
      color: "#2563EB"
    },
    {
      icon: Database,
      title: "Full CRM & Project Management",
      description: "Clients, projects, tasks, talent, bookings, invoices, and expenses — all built in.",
      color: "#22C55E"
    },
    {
      icon: Globe,
      title: "Multi-Industry",
      description: "Adapts UI, terminology, and KPIs based on your industry. Real estate, talent agency, general business, and more.",
      color: "#8B5CF6"
    },
    {
      icon: Cpu,
      title: "BYOLLM",
      description: "Bring your own LLM. Supports OpenRouter, OpenAI, Anthropic, Google, and Ollama for fully offline operation.",
      color: "#FF4D4D"
    },
    {
      icon: Terminal,
      title: "n8n Integration",
      description: "Connect your n8n instance to automate repetitive work. Sync workflows, track executions, trigger actions from chat.",
      color: "#FACC15"
    },
    {
      icon: Shield,
      title: "Self-Hosted & Private",
      description: "Run the full stack on your own hardware. Your data never leaves your network.",
      color: "#0F172A"
    }
  ];

  const techStack = [
    { name: "React 18", detail: "TypeScript + Vite" },
    { name: "Tailwind CSS", detail: "shadcn/ui" },
    { name: "Supabase", detail: "PostgreSQL + Auth" },
    { name: "Deno", detail: "Edge Functions" },
    { name: "Docker", detail: "Self-Hosting" },
    { name: "Ollama", detail: "Local AI" },
    { name: "Recharts", detail: "Analytics" },
    { name: "n8n", detail: "Workflow Automation" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero - Dark section */}
      <section className="relative overflow-hidden py-20 md:py-32" style={{ backgroundColor: '#0F172A' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10" />
        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm text-white/90">
              <Code className="h-4 w-4" />
              MIT Licensed — Free Forever
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
              100% Open Source
              <span className="block text-blue-400 mt-2">Zero Compromises</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
              The full platform — every feature, every edge function, every migration.
              Self-host it, fork it, extend it. No paywalled modules, no "enterprise" tier.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="min-h-[48px] gap-2 bg-white text-slate-900 hover:bg-white/90" asChild>
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                  <Github className="h-5 w-5" />
                  View on GitHub
                </a>
              </Button>
              <Button size="lg" variant="outline" className="min-h-[48px] gap-2 border-white/30 text-white hover:bg-white/10" asChild>
                <a href={`${GITHUB_URL}#self-hosting`} target="_blank" rel="noopener noreferrer">
                  <Server className="h-5 w-5" />
                  Self-Hosting Guide
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Cloud vs Self-Hosted comparison */}
      <section className="py-12 border-b bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 text-center">
              Cloud or Self-Hosted — Same Platform
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-primary/5 rounded-lg p-5">
                <h4 className="font-semibold mb-3 text-primary text-center">
                  Cloud (autopenguin.app)
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Sign up and start immediately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Managed infrastructure & updates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>No server maintenance</span>
                  </li>
                </ul>
              </div>
              <div className="bg-primary/5 rounded-lg p-5">
                <h4 className="font-semibold mb-3 text-primary text-center">
                  Self-Hosted
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Full control over your data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Bundled Ollama for offline AI</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Customize and extend freely</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Bold coloured sections */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Everything Included</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every feature ships in the open source release. What you see on cloud is what you get self-hosted.
            </p>
          </div>
        </div>
      </section>

      {features.map((feature, index) => {
        const isLight = feature.color === '#FACC15';
        const textColor = isLight ? '#0F172A' : '#FFFFFF';
        const isEven = index % 2 === 0;

        return (
          <section
            key={index}
            className="py-16 md:py-24 px-8 md:px-16"
            style={{ backgroundColor: feature.color }}
          >
            <div className={`max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12 ${isEven ? '' : 'md:flex-row-reverse'}`}>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `rgba(255,255,255,0.2)` }}>
                <feature.icon className="h-10 w-10" style={{ color: textColor }} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: textColor }}>
                  {feature.title}
                </h3>
                <p className="text-lg leading-relaxed" style={{ color: textColor, opacity: 0.9 }}>
                  {feature.description}
                </p>
              </div>
            </div>
          </section>
        );
      })}

      {/* Quick Start - Terminal style */}
      <section className="py-16 md:py-24" style={{ backgroundColor: '#0F172A' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-white">Up and Running in 3 Commands</h2>
              <p className="text-white/60">
                Docker Compose handles everything — PostgreSQL, auth, API, realtime, storage, and bundled Ollama.
              </p>
            </div>
            <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-white/40 text-xs ml-2 font-mono">terminal</span>
              </div>
              <div className="p-6 space-y-4 font-mono text-sm">
                <div>
                  <span className="text-green-400">$</span>
                  <span className="text-white ml-2">git clone https://github.com/autopenguin-ai/autopenguin.git</span>
                </div>
                <div>
                  <span className="text-green-400">$</span>
                  <span className="text-white ml-2">cd autopenguin</span>
                </div>
                <div>
                  <span className="text-green-400">$</span>
                  <span className="text-white ml-2">./docker/setup.sh</span>
                </div>
                <div className="pt-2 border-t border-white/10 text-white/40">
                  <div>Checking prerequisites... done</div>
                  <div>Generating secrets... done</div>
                  <div>Starting services... done</div>
                  <div className="text-green-400 mt-2">App running at http://localhost:3000</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Built With</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {techStack.map((tech, i) => (
                <Card key={i} className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{tech.name}</CardTitle>
                    <CardDescription>{tech.detail}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contribute CTA */}
      <section className="py-16 md:py-24" style={{ backgroundColor: '#2563EB' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Get Involved</h2>
            <p className="text-lg text-white/80">
              Found a bug? Got a feature idea? Want to add a new industry config?
              Contributions of all sizes are welcome.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="min-h-[48px] gap-2 bg-white text-blue-600 hover:bg-white/90" asChild>
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                  <Star className="h-5 w-5" />
                  Star on GitHub
                </a>
              </Button>
              <Button size="lg" className="min-h-[48px] gap-2 bg-white/10 text-white border border-white/30 hover:bg-white/20" asChild>
                <a href={`${GITHUB_URL}/fork`} target="_blank" rel="noopener noreferrer">
                  <GitFork className="h-5 w-5" />
                  Fork the Repo
                </a>
              </Button>
              <Button size="lg" className="min-h-[48px] gap-2 bg-white/10 text-white border border-white/30 hover:bg-white/20" asChild>
                <a href={`${GITHUB_URL}/issues`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-5 w-5" />
                  Open an Issue
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto border-primary/50 bg-primary/5">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">Don't Want to Self-Host?</CardTitle>
              <CardDescription className="text-base">
                Use the cloud version — same platform, zero setup.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="min-h-[44px] w-full sm:w-auto" onClick={() => navigate("/auth?mode=signup")}>
                Get Beta Access
              </Button>
              <Button size="lg" variant="outline" className="min-h-[44px] w-full sm:w-auto" onClick={() => navigate("/contact")}>
                Contact Us
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}

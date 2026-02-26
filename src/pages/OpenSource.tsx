import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Github, Server, Globe, Shield, Code, Terminal, Database, MessageSquare, Cpu, ExternalLink } from "lucide-react";
import { Footer } from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";

const GITHUB_URL = "https://github.com/autopenguin-ai/autopenguin";

export default function OpenSource() {
  const features = [
    {
      icon: MessageSquare,
      title: "AI Assistant",
      description: "Chat-first interface with a personal AI that learns your preferences. Configurable name, personality, and LLM provider."
    },
    {
      icon: Database,
      title: "Full CRM & Project Management",
      description: "Clients, projects, tasks, talent, bookings, invoices, and expenses — all built in."
    },
    {
      icon: Globe,
      title: "Multi-Industry",
      description: "Adapts UI, terminology, and KPIs based on your industry. Real estate, talent agency, general business, and more."
    },
    {
      icon: Cpu,
      title: "BYOLLM",
      description: "Bring your own LLM. Supports OpenRouter, OpenAI, Anthropic, Google, and Ollama for fully offline operation."
    },
    {
      icon: Terminal,
      title: "n8n Integration",
      description: "Connect your n8n instance to automate repetitive work. Sync workflows, track executions, trigger actions from chat."
    },
    {
      icon: Shield,
      title: "Self-Hosted & Private",
      description: "Run the full stack on your own hardware. Your data never leaves your network."
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Clone the repo",
      code: "git clone https://github.com/autopenguin-ai/autopenguin.git"
    },
    {
      number: "2",
      title: "Run the setup script",
      code: "cd autopenguin && ./docker/setup.sh"
    },
    {
      number: "3",
      title: "Open the app",
      code: "http://localhost:3000"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in">
            <Badge variant="secondary" className="text-sm px-4 py-1">
              MIT Licensed
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold">
              Open Source & Free Forever
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              AutoPenguin is fully open source. Self-host it on your own infrastructure,
              contribute to the project, or use the cloud version — your choice.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" className="min-h-[44px] gap-2" asChild>
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                  <Github className="h-5 w-5" />
                  View on GitHub
                </a>
              </Button>
              <Button size="lg" variant="outline" className="min-h-[44px] gap-2" asChild>
                <a href={`${GITHUB_URL}#self-hosting`} target="_blank" rel="noopener noreferrer">
                  <Server className="h-5 w-5" />
                  Self-Hosting Guide
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Everything Included</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                The open source version has every feature. No paywalled modules, no "enterprise" upsells.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Up and Running in Minutes</h2>
              <p className="text-muted-foreground">
                Docker Compose handles everything — PostgreSQL, auth, API, realtime, file storage, and a bundled Ollama instance for offline AI.
              </p>
            </div>
            <div className="space-y-6">
              {steps.map((step) => (
                <div key={step.number} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {step.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium mb-2">{step.title}</p>
                    <div className="bg-muted rounded-lg px-4 py-3 font-mono text-sm overflow-x-auto">
                      {step.code}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Built With</h2>
            </div>
            <Card className="border-2">
              <CardContent className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  {[
                    { name: "React 18", detail: "TypeScript + Vite" },
                    { name: "Tailwind CSS", detail: "shadcn/ui" },
                    { name: "Supabase", detail: "PostgreSQL + Auth" },
                    { name: "Deno", detail: "Edge Functions" },
                    { name: "Docker", detail: "Self-Hosting" },
                    { name: "Ollama", detail: "Local AI" },
                    { name: "Recharts", detail: "Analytics" },
                    { name: "n8n", detail: "Workflow Automation" }
                  ].map((tech, i) => (
                    <div key={i} className="space-y-1">
                      <p className="font-semibold">{tech.name}</p>
                      <p className="text-sm text-muted-foreground">{tech.detail}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contribute */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Code className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Contribute</h2>
            <p className="text-lg text-muted-foreground">
              Found a bug? Got a feature idea? Want to add a new industry config?
              We welcome contributions of all sizes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="min-h-[44px] gap-2" asChild>
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                  <Github className="h-5 w-5" />
                  Star on GitHub
                </a>
              </Button>
              <Button size="lg" variant="outline" className="min-h-[44px] gap-2" asChild>
                <a href={`${GITHUB_URL}/issues`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-5 w-5" />
                  Open an Issue
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

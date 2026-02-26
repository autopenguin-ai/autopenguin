import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowRight, Zap, Lock, DollarSign, Clock } from "lucide-react";
import { Helmet } from "react-helmet-async";

const OpenAIComparison = () => {
  const navigate = useNavigate();

  const comparisonFeatures = [
    {
      feature: "Interface",
      openai: "Drag-and-drop nodes",
      autopenguin: "Natural language",
      autoPenguinBetter: true
    },
    {
      feature: "Learning Curve",
      openai: "Need to understand flow logic",
      autopenguin: "Zero - just describe what you want",
      autoPenguinBetter: true
    },
    {
      feature: "Build Time",
      openai: "15-30 minutes",
      autopenguin: "30 seconds",
      autoPenguinBetter: true
    },
    {
      feature: "LLM Flexibility",
      openai: "OpenAI models only",
      autopenguin: "Any model (GPT, Claude, Gemini, etc.)",
      autoPenguinBetter: true
    },
    {
      feature: "Pricing Model",
      openai: "Per-token + OpenAI platform costs",
      autopenguin: "Flat subscription",
      autoPenguinBetter: true
    },
    {
      feature: "Deployment",
      openai: "OpenAI platform",
      autopenguin: "Your n8n/Make instance",
      autoPenguinBetter: true
    },
    {
      feature: "Data Control",
      openai: "OpenAI servers",
      autopenguin: "Your infrastructure",
      autoPenguinBetter: true
    }
  ];

  return (
    <>
      <Helmet>
        <title>OpenAI Agent Builder Alternative - No Drag-and-Drop | AutoPenguin</title>
        <meta name="description" content="Tired of drag-and-drop agent builders? AutoPenguin uses natural language to build automations instantly. Multi-LLM support. No lock-in. Get beta access." />
        <meta property="og:title" content="OpenAI Agent Builder Alternative | AutoPenguin" />
        <meta property="og:description" content="Build automations with natural language. No drag-and-drop. No OpenAI lock-in." />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <PublicHeader />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="px-4 py-20 bg-gradient-to-b from-background to-muted/20">
            <div className="container mx-auto max-w-5xl text-center space-y-6">
              <Badge className="mb-4">OpenAI Agent Builder Alternative</Badge>
              <h1 className="text-4xl md:text-6xl font-bold">
                The Natural Language Alternative
                <span className="block text-primary mt-2">to OpenAI Agent Builder</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                No drag-and-drop. No visual builders. Just describe what you want in plain English, and AutoPenguin builds the entire workflow for you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" onClick={() => navigate("/auth?mode=signup")}>
                  Join Early Access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/how-it-works")}>
                  See How It Works
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Currently in private beta • Join 500+ users
              </p>
            </div>
          </section>

          {/* What OpenAI Released */}
          <section className="px-4 py-16 bg-muted/30">
            <div className="container mx-auto max-w-5xl">
              <div className="bg-background rounded-lg p-8 border">
                <h2 className="text-3xl font-bold mb-6">What OpenAI Just Released</h2>
                <p className="text-lg text-muted-foreground mb-4">
                  OpenAI recently launched Agent Builder - a drag-and-drop interface for creating AI agents. While it's powerful, it still requires:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <span>Learning a visual node-based interface</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <span>Manually connecting nodes and configuring flows</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <span>Lock-in to OpenAI's models and platform</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <span>15-30 minutes to build a single workflow</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Comparison Table */}
          <section className="px-4 py-16">
            <div className="container mx-auto max-w-5xl">
              <h2 className="text-3xl font-bold text-center mb-12">
                Why AutoPenguin vs. OpenAI Agent Builder?
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Feature</th>
                      <th className="text-left p-4 font-semibold">OpenAI Agent Builder</th>
                      <th className="text-left p-4 font-semibold bg-primary/5">AutoPenguin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-muted/20">
                        <td className="p-4 font-medium">{item.feature}</td>
                        <td className="p-4 text-muted-foreground">{item.openai}</td>
                        <td className="p-4 bg-primary/5 font-medium">
                          <div className="flex items-center gap-2">
                            {item.autoPenguinBetter && <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />}
                            {item.autopenguin}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Key Differentiators */}
          <section className="px-4 py-16 bg-muted/20">
            <div className="container mx-auto max-w-5xl">
              <h2 className="text-3xl font-bold text-center mb-12">
                Why Teams Choose AutoPenguin
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-background rounded-lg p-6 border">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">10x Faster</h3>
                  <p className="text-muted-foreground">
                    What takes 30 minutes in OpenAI Agent Builder takes 30 seconds with AutoPenguin. Just describe what you need in plain English.
                  </p>
                </div>

                <div className="bg-background rounded-lg p-6 border">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Vendor Lock-in</h3>
                  <p className="text-muted-foreground">
                    Use any LLM you want - GPT-4, Claude, Gemini, or open-source models. Switch anytime without rebuilding workflows.
                  </p>
                </div>

                <div className="bg-background rounded-lg p-6 border">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Predictable Pricing</h3>
                  <p className="text-muted-foreground">
                    Flat subscription pricing. No per-token costs. No surprises. Budget with confidence.
                  </p>
                </div>

                <div className="bg-background rounded-lg p-6 border">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Zero Learning Curve</h3>
                  <p className="text-muted-foreground">
                    No training required. If you can describe what you want, you can build it. Perfect for non-technical teams.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Use Case Examples */}
          <section className="px-4 py-16">
            <div className="container mx-auto max-w-5xl">
              <h2 className="text-3xl font-bold text-center mb-12">
                From Idea to Automation in Seconds
              </h2>
              
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-lg p-6">
                  <p className="font-mono text-sm mb-2 text-muted-foreground">You type:</p>
                  <p className="text-lg mb-4">"When a new form submission comes in, add the lead to CRM, send a welcome email, and notify the sales team on Slack"</p>
                  <p className="text-sm text-muted-foreground">
                    <strong>With OpenAI Agent Builder:</strong> 20-30 minutes to drag nodes, configure connections, test integrations
                  </p>
                  <p className="text-sm text-primary font-medium mt-2">
                    <strong>With AutoPenguin:</strong> 30 seconds - workflow generated and ready to deploy
                  </p>
                </div>

                <div className="bg-muted/30 rounded-lg p-6">
                  <p className="font-mono text-sm mb-2 text-muted-foreground">You type:</p>
                  <p className="text-lg mb-4">"Analyze customer support tickets, categorize by urgency, assign to appropriate team member, and create summary report"</p>
                  <p className="text-sm text-muted-foreground">
                    <strong>With OpenAI Agent Builder:</strong> 25+ minutes to set up AI nodes, configure routing logic, connect endpoints
                  </p>
                  <p className="text-sm text-primary font-medium mt-2">
                    <strong>With AutoPenguin:</strong> 30 seconds - complete workflow with AI categorization and routing
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="px-4 py-20 bg-gradient-to-b from-muted/20 to-background">
            <div className="container mx-auto max-w-3xl text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Skip the Drag-and-Drop?
              </h2>
              <p className="text-xl text-muted-foreground">
                Join 500+ professionals getting early access to AutoPenguin
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" onClick={() => navigate("/auth?mode=signup")}>
                  Get Beta Access - 30% Off
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Early bird pricing • Priority onboarding • Influence the roadmap
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default OpenAIComparison;

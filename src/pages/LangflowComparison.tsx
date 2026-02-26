import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";

const LangflowComparison = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>LangFlow Alternative - Natural Language Automation | AutoPenguin</title>
        <meta name="description" content="Love LangFlow but tired of visual building? AutoPenguin uses natural language to build workflows instantly. No drag-and-drop. No node configuration." />
        <meta property="og:title" content="LangFlow Alternative | AutoPenguin" />
        <meta property="og:description" content="Build AI workflows with natural language instead of visual nodes" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <PublicHeader />

        <main className="flex-1">
          <section className="px-4 py-20 bg-gradient-to-b from-background to-muted/20">
            <div className="container mx-auto max-w-5xl text-center space-y-6">
              <Badge className="mb-4">LangFlow Alternative</Badge>
              <h1 className="text-4xl md:text-6xl font-bold">
                Love LangFlow's Power?
                <span className="block text-primary mt-2">Skip the Visual Building</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                LangFlow is great for visual thinkers. AutoPenguin is for people who just want results. Describe your workflow in plain English, and we'll build it for you.
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
            </div>
          </section>

          <section className="px-4 py-16">
            <div className="container mx-auto max-w-5xl">
              <h2 className="text-3xl font-bold text-center mb-12">
                When to Choose AutoPenguin Over LangFlow
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-muted/30 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">Choose LangFlow if you:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">Love visual programming</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">Want to see every node connection</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">Have time to learn the interface</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">Enjoy fine-tuning every detail</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-primary/5 rounded-lg p-6 border-2 border-primary">
                  <h3 className="text-xl font-semibold mb-4">Choose AutoPenguin if you:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Just want it done</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Prefer typing over clicking</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Need results in seconds, not minutes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Don't have time to learn another tool</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="px-4 py-16 bg-muted/20">
            <div className="container mx-auto max-w-5xl">
              <h2 className="text-3xl font-bold text-center mb-12">
                Same Power, Zero Learning Curve
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Capability</th>
                      <th className="text-left p-4 font-semibold">LangFlow</th>
                      <th className="text-left p-4 font-semibold bg-primary/5">AutoPenguin</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/20">
                      <td className="p-4 font-medium">Time to First Workflow</td>
                      <td className="p-4 text-muted-foreground">30-60 minutes (learning + building)</td>
                      <td className="p-4 bg-primary/5 font-medium">30 seconds (just type)</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/20">
                      <td className="p-4 font-medium">Learning Required</td>
                      <td className="p-4 text-muted-foreground">Yes - nodes, connections, LangChain concepts</td>
                      <td className="p-4 bg-primary/5 font-medium">No - if you can describe it, you can build it</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/20">
                      <td className="p-4 font-medium">AI Agent Creation</td>
                      <td className="p-4 text-muted-foreground">Drag nodes, configure chains</td>
                      <td className="p-4 bg-primary/5 font-medium">Type what the agent should do</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/20">
                      <td className="p-4 font-medium">Workflow Complexity</td>
                      <td className="p-4 text-muted-foreground">Unlimited (but more complex = more clicking)</td>
                      <td className="p-4 bg-primary/5 font-medium">Unlimited (complexity doesn't affect build time)</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/20">
                      <td className="p-4 font-medium">Ideal For</td>
                      <td className="p-4 text-muted-foreground">Developers who love visual tools</td>
                      <td className="p-4 bg-primary/5 font-medium">Anyone who can describe their needs</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="px-4 py-20 bg-gradient-to-b from-background to-muted/20">
            <div className="container mx-auto max-w-3xl text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Type Instead of Click?
              </h2>
              <p className="text-xl text-muted-foreground">
                Get early access to AutoPenguin
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" onClick={() => navigate("/auth?mode=signup")}>
                  Get Beta Access - 30% Off
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default LangflowComparison;

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { ArrowRight, MessageSquare, MousePointer } from "lucide-react";
import { Helmet } from "react-helmet-async";

const NoCodeComparison = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Text-to-Workflow: Beyond Drag-and-Drop Automation | AutoPenguin</title>
        <meta name="description" content="The future of no-code automation isn't drag-and-drop - it's natural language. Build workflows by typing what you want, not by dragging nodes." />
        <meta property="og:title" content="Text-to-Workflow Automation | AutoPenguin" />
        <meta property="og:description" content="Build automations with natural language instead of drag-and-drop" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <PublicHeader />

        <main className="flex-1">
          <section className="px-4 py-20 bg-gradient-to-b from-background to-muted/20">
            <div className="container mx-auto max-w-5xl text-center space-y-6">
              <Badge className="mb-4">The Future of No-Code</Badge>
              <h1 className="text-4xl md:text-6xl font-bold">
                Why Natural Language Beats
                <span className="block text-primary mt-2">Drag-and-Drop for Automation</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Drag-and-drop was revolutionary in 2010. But in 2025, there's a better way: just describe what you want.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" onClick={() => navigate("/auth?mode=signup")}>
                  Join Early Access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </section>

          <section className="px-4 py-16">
            <div className="container mx-auto max-w-5xl">
              <h2 className="text-3xl font-bold text-center mb-12">
                The Problem with Drag-and-Drop
              </h2>
              
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="space-y-6">
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-destructive/20 flex items-center justify-center flex-shrink-0">
                          <MousePointer className="h-6 w-6 text-destructive" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Drag-and-Drop Automation</h3>
                          <p className="text-sm text-muted-foreground">Traditional visual builders</p>
                        </div>
                      </div>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-destructive mt-0.5">❌</span>
                          <span>10-30 minute learning curve per tool</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-destructive mt-0.5">❌</span>
                          <span>Repetitive clicking and dragging</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-destructive mt-0.5">❌</span>
                          <span>Hard to explain workflows to team</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-destructive mt-0.5">❌</span>
                          <span>Visual clutter for complex flows</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-destructive mt-0.5">❌</span>
                          <span>Different interface for each tool</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="space-y-6">
                    <div className="bg-primary/10 border-2 border-primary rounded-lg p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Natural Language Automation</h3>
                          <p className="text-sm text-muted-foreground">AutoPenguin's approach</p>
                        </div>
                      </div>
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">✅</span>
                          <span>Zero learning curve - just type</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">✅</span>
                          <span>Workflows built in seconds</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">✅</span>
                          <span>Easy to document and share</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">✅</span>
                          <span>Complexity doesn't slow you down</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">✅</span>
                          <span>Same interface for everything</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="px-4 py-16 bg-muted/20">
            <div className="container mx-auto max-w-5xl">
              <h2 className="text-3xl font-bold text-center mb-12">
                Real-World Time Comparison
              </h2>
              
              <div className="space-y-8">
                <div className="bg-background rounded-lg p-8 border">
                  <h3 className="text-xl font-semibold mb-4">Scenario: Lead Qualification Workflow</h3>
                  <p className="text-muted-foreground mb-6">
                    "When a form is submitted, check if the email domain is corporate, score the lead based on responses, add to CRM if score is high, send to sales team on Slack, otherwise add to nurture campaign"
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3 text-muted-foreground">With Drag-and-Drop Tools:</h4>
                      <ul className="space-y-2 text-sm">
                        <li>5 min: Open tool, create new workflow</li>
                        <li>3 min: Drag form trigger node</li>
                        <li>4 min: Add email validation logic</li>
                        <li>5 min: Configure scoring conditions</li>
                        <li>3 min: Connect CRM node</li>
                        <li>4 min: Set up Slack integration</li>
                        <li>3 min: Add email campaign node</li>
                        <li>3 min: Test and debug connections</li>
                      </ul>
                      <p className="font-bold mt-4 text-lg">Total: ~30 minutes</p>
                    </div>

                    <div className="bg-primary/5 rounded-lg p-6">
                      <h4 className="font-semibold mb-3 text-primary">With AutoPenguin:</h4>
                      <ul className="space-y-2 text-sm">
                        <li>10 sec: Type the workflow description</li>
                        <li>20 sec: AI generates complete workflow</li>
                        <li>5 sec: Review and deploy</li>
                      </ul>
                      <p className="font-bold mt-4 text-lg text-primary">Total: ~35 seconds</p>
                      <p className="text-sm text-muted-foreground mt-2">50x faster</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="px-4 py-16">
            <div className="container mx-auto max-w-5xl">
              <h2 className="text-3xl font-bold text-center mb-12">
                Why This Matters for Your Team
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">10x</div>
                  <p className="text-lg font-semibold mb-2">Faster Development</p>
                  <p className="text-sm text-muted-foreground">
                    Build in seconds what used to take minutes
                  </p>
                </div>

                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">0</div>
                  <p className="text-lg font-semibold mb-2">Training Required</p>
                  <p className="text-sm text-muted-foreground">
                    Anyone who can type can build workflows
                  </p>
                </div>

                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">100%</div>
                  <p className="text-lg font-semibold mb-2">Team Alignment</p>
                  <p className="text-sm text-muted-foreground">
                    Workflows described in plain English
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="px-4 py-20 bg-gradient-to-b from-muted/20 to-background">
            <div className="container mx-auto max-w-3xl text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready for the Future of Automation?
              </h2>
              <p className="text-xl text-muted-foreground">
                Get early access to natural language automation
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

export default NoCodeComparison;

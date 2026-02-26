import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Target, Zap, Users, TrendingUp, Heart, Lightbulb, Rocket, Plug, Settings, Shield, Code, MessageSquare, Sparkles, Bot, HelpCircle } from "lucide-react";
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
export default function HowItWorks() {
  const [activeDemo, setActiveDemo] = useState(0);
  const demoExamples = [{
    input: "Steve, which lead sources convert best?",
    output: "Based on 230 leads this month:\n• LinkedIn: 67% meeting rate\n• Cold email: 23% meeting rate\n\nI've updated lead scoring to prioritize LinkedIn sources. Recommend focusing budget there.",
    time: "Instant"
  }, {
    input: "Steve, summarize this week's activities",
    output: "This week: 45 new contacts via automations, 12 meetings booked (+35%), 8 projects updated.\n\nCreated 3 high-priority tasks for dormant leads. Moved 2 projects to 'at-risk' status due to missed milestones.",
    time: "Instant"
  }, {
    input: "Steve, my email workflow stopped working",
    output: "Issue detected: Gmail API quota exceeded at 4:23 PM.\n\nWorkflow paused automatically. I've logged the incident and created a task.\n\nConsider upgrading Gmail API limits or spacing out sends.",
    time: "Instant"
  }];
  const useCases = [{
    title: "E-commerce Flow",
    diagram: `graph TD
    A[New Order] --> B[Payment Check]
    B -->|Success| C[Update Inventory]
    B -->|Failed| D[Retry Payment]
    C --> E[Generate Invoice]
    E --> F[Email Customer]
    E --> G[Update CRM]
    F --> H[Track Delivery]
    style A fill:#3b82f6,stroke:#2563eb,color:#fff
    style B fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style C fill:#10b981,stroke:#059669,color:#fff
    style E fill:#10b981,stroke:#059669,color:#fff
    style F fill:#f59e0b,stroke:#d97706,color:#fff
    style G fill:#f59e0b,stroke:#d97706,color:#fff
    style H fill:#f59e0b,stroke:#d97706,color:#fff
    style D fill:#ef4444,stroke:#dc2626,color:#fff`
  }, {
    title: "Customer Support Flow",
    diagram: `graph TD
    A[Support Ticket] --> B[AI Categorize]
    B --> C{Priority?}
    C -->|High| D[Urgent Alert]
    C -->|Medium| E[Assign to Agent]
    C -->|Low| F[Auto-Response]
    D --> G[Escalate]
    E --> H[Track Resolution]
    F --> H
    style A fill:#3b82f6,stroke:#2563eb,color:#fff
    style B fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style C fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style D fill:#ef4444,stroke:#dc2626,color:#fff
    style E fill:#f59e0b,stroke:#d97706,color:#fff
    style F fill:#10b981,stroke:#059669,color:#fff
    style H fill:#10b981,stroke:#059669,color:#fff`
  }, {
    title: "Marketing Automation",
    diagram: `graph TD
    A[New Lead] --> B[Add to CRM]
    B --> C[Send Welcome Email]
    C --> D[Wait 3 Days]
    D --> E{Opened Email?}
    E -->|Yes| F[Send Product Info]
    E -->|No| G[Send Reminder]
    F --> H[Track Engagement]
    G --> H
    H --> I[Score Lead]
    style A fill:#3b82f6,stroke:#2563eb,color:#fff
    style B fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style C fill:#10b981,stroke:#059669,color:#fff
    style E fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style F fill:#10b981,stroke:#059669,color:#fff
    style G fill:#f59e0b,stroke:#d97706,color:#fff
    style I fill:#10b981,stroke:#059669,color:#fff`
  }];
  return <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5 animate-gradient-shift bg-[length:200%_200%]" />
        
        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight animate-fade-in-up">
              How AutoPenguin Manages Your Agents
              <span className="block text-primary mt-2">Connect → Deploy → Steve Manages</span>
            </h1>

            {/* Visual 3-Step Process */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
              {[{
              icon: Plug,
              title: "Connect",
              color: "bg-blue-500"
            }, {
              icon: Rocket,
              title: "Deploy",
              color: "bg-purple-500"
            }, {
              icon: Bot,
              title: "Steve Manages",
              color: "bg-green-500"
            }].map((step, index) => <div key={index} className="animate-fade-in" style={{
              animationDelay: `${index * 0.2}s`
            }}>
                  <div className={`${step.color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float`} style={{
                animationDelay: `${index * 0.3}s`
              }}>
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-2xl font-bold">{step.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">Step {index + 1}</div>
                </div>)}
            </div>
          </div>
        </div>
      </section>


      {/* Interactive Demo */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-4">
              
              <h2 className="text-3xl md:text-4xl font-bold">See Steve AI In Action</h2>
            </div>

            <Card className="p-6">
              <div className="space-y-6">
                {/* Demo Selector */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {demoExamples.map((demo, index) => <Button key={index} variant={activeDemo === index ? "default" : "outline"} size="sm" onClick={() => setActiveDemo(index)}>
                      Example {index + 1}
                    </Button>)}
                </div>

                {/* Demo Chat Interface */}
                <div className="space-y-4 min-h-[300px]">
                  <div className="flex items-start gap-3 animate-fade-in">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-4">
                        {demoExamples[activeDemo].input}
                      </div>
                    </div>
                  </div>

                  {/* Processing Animation */}
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
                    <Sparkles className="h-4 w-4" />
                    <span>AI processing...</span>
                  </div>

                  {/* Response */}
                  <div className="flex items-start gap-3 animate-fade-in" style={{
                  animationDelay: "0.5s"
                }}>
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 ml-auto">
                      <Sparkles className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div className="flex-1 text-right">
                      <div className="bg-primary text-primary-foreground rounded-lg p-4 inline-block text-left max-w-md">
                        <div className="font-semibold mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          Workflow Created Successfully
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="bg-primary-foreground/10 rounded p-2">
                            {demoExamples[activeDemo].output}
                          </div>
                          <div className="flex items-center justify-between text-xs opacity-90">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Generated in {demoExamples[activeDemo].time}
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              Ready to deploy
                            </span>
                          </div>
                        </div>
                        <Button size="sm" variant="secondary" className="w-full mt-3">
                          <Rocket className="h-4 w-4 mr-2" />
                          Deploy to n8n
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compact Time Saved */}
                <div className="mt-6 pt-6 border-t animate-fade-in" style={{ animationDelay: "1s" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Time Saved</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-24 shrink-0">Traditional:</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-muted-foreground rounded-full" style={{ width: '100%' }}></div>
                      </div>
                      <span className="text-xs font-medium w-16 text-right">
                        {activeDemo === 0 ? '2 hours' : activeDemo === 1 ? '1 day' : '4 hours'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-primary w-24 shrink-0">AutoPenguin:</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full animate-scale-in" style={{ width: '5%', animationDelay: "1.2s" }}></div>
                      </div>
                      <span className="text-xs font-medium text-primary w-16 text-right">{demoExamples[activeDemo].time}</span>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        {activeDemo === 0 ? '96%' : activeDemo === 1 ? '99%'  : '95%'} faster
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">Everything you need to know about AutoPenguin</p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-background rounded-lg border px-6">
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left font-semibold">What can Steve AI do for me?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Steve monitors all agents across n8n/Make/Zapier, learns from automation outcomes, manages your CRM (contacts, projects, tasks), answers questions, and detects issues proactively.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-background rounded-lg border px-6">
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left font-semibold">How does multi-platform monitoring work?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Connect your n8n, Make, or Zapier accounts. Steve tracks all agents from one dashboard with real-time alerts and analytics.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-background rounded-lg border px-6">
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left font-semibold">What's the Marketplace?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Buy ready-to-use agents from specialists or sell your own. Deploy instantly and Steve manages them automatically.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-background rounded-lg border px-6">
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left font-semibold">Is my data secure?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes. All data is encrypted in transit and at rest. Your workflows run on your own n8n, Make, or Zapier instance. We never store sensitive information.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-background rounded-lg border px-6">
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left font-semibold">What if I need help or support?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  We offer comprehensive support through multiple channels including email, live chat, and detailed documentation. Our team is here to help you succeed with automation.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      <Footer />
    </div>;
}
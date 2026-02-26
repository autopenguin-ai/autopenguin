import { useNavigate } from "react-router-dom";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Zap, Plug, Rocket, MessageSquare, Sparkles, Bot, HelpCircle } from "lucide-react";
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function HowItWorks() {
  const navigate = useNavigate();
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

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero Section - Dark bold background */}
      <section className="relative overflow-hidden py-20 md:py-32" style={{ backgroundColor: '#0F172A' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10" />

        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white animate-fade-in-up">
              How AutoPenguin Manages Your Agents
              <span className="block text-blue-400 mt-2">Connect &rarr; Deploy &rarr; Steve Manages</span>
            </h1>

            {/* Visual 3-Step Process */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
              {[{
                icon: Plug,
                title: "Connect",
                color: "#2563EB",
                desc: "Link your n8n, Make, or Zapier instance"
              }, {
                icon: Rocket,
                title: "Deploy",
                color: "#8B5CF6",
                desc: "Push agents and workflows in one click"
              }, {
                icon: Bot,
                title: "Steve Manages",
                color: "#22C55E",
                desc: "AI monitors, learns, and optimizes 24/7"
              }].map((step, index) => (
                <div
                  key={index}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float"
                    style={{ backgroundColor: step.color, animationDelay: `${index * 0.3}s` }}
                  >
                    <step.icon className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-white">{step.title}</div>
                  <div className="text-sm text-white/60 mt-2">{step.desc}</div>
                </div>
              ))}
            </div>

            {/* Connecting arrows between steps (desktop only) */}
            <div className="hidden md:flex justify-center items-center gap-4 pt-2">
              <div className="w-32 h-0.5 bg-gradient-to-r from-[#2563EB] to-[#8B5CF6]" />
              <div className="w-32 h-0.5 bg-gradient-to-r from-[#8B5CF6] to-[#22C55E]" />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo - Blue background */}
      <section className="py-16 md:py-24" style={{ backgroundColor: '#2563EB' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">See Steve AI In Action</h2>
              <p className="text-white/80 max-w-2xl mx-auto">
                Ask Steve anything about your automations and business data
              </p>
            </div>

            <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
              <div className="space-y-6">
                {/* Demo Selector */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {demoExamples.map((demo, index) => (
                    <Button
                      key={index}
                      size="sm"
                      onClick={() => setActiveDemo(index)}
                      className={
                        activeDemo === index
                          ? "bg-white text-blue-600 hover:bg-white/90"
                          : "bg-white/20 text-white border-white/30 hover:bg-white/30"
                      }
                      variant={activeDemo === index ? "default" : "outline"}
                    >
                      Example {index + 1}
                    </Button>
                  ))}
                </div>

                {/* Demo Chat Interface */}
                <div className="space-y-4 min-h-[300px]">
                  <div className="flex items-start gap-3 animate-fade-in">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-white/15 rounded-lg p-4 text-white">
                        {demoExamples[activeDemo].input}
                      </div>
                    </div>
                  </div>

                  {/* Processing Animation */}
                  <div className="flex items-center justify-center gap-2 text-sm text-white/70 animate-pulse">
                    <Sparkles className="h-4 w-4" />
                    <span>AI processing...</span>
                  </div>

                  {/* Response */}
                  <div className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: "0.5s" }}>
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 ml-auto">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 text-right">
                      <div className="bg-white text-slate-900 rounded-lg p-4 inline-block text-left max-w-md">
                        <div className="font-semibold mb-3 flex items-center gap-2 text-slate-900">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          Workflow Created Successfully
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="bg-slate-100 rounded p-2 text-slate-700 whitespace-pre-line">
                            {demoExamples[activeDemo].output}
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
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
                        <Button size="sm" className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white">
                          <Rocket className="h-4 w-4 mr-2" />
                          Deploy to n8n
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compact Time Saved */}
                <div className="mt-6 pt-6 border-t border-white/20 animate-fade-in" style={{ animationDelay: "1s" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-white/70" />
                    <span className="text-sm font-medium text-white/70">Time Saved</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/60 w-24 shrink-0">Traditional:</span>
                      <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white/50 rounded-full" style={{ width: '100%' }} />
                      </div>
                      <span className="text-xs font-medium text-white w-16 text-right">
                        {activeDemo === 0 ? '2 hours' : activeDemo === 1 ? '1 day' : '4 hours'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white w-24 shrink-0">AutoPenguin:</span>
                      <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full animate-scale-in" style={{ width: '5%', animationDelay: "1.2s" }} />
                      </div>
                      <span className="text-xs font-medium text-white w-16 text-right">{demoExamples[activeDemo].time}</span>
                    </div>
                    <div className="text-right">
                      <Badge className="text-xs bg-white/20 text-white border-white/30 hover:bg-white/30">
                        <Zap className="h-3 w-3 mr-1" />
                        {activeDemo === 0 ? '96%' : activeDemo === 1 ? '99%' : '95%'} faster
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section - Clean white/light */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12 space-y-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#22C55E' }}>
                <HelpCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
              <p className="text-slate-500 dark:text-slate-400">Everything you need to know about AutoPenguin</p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 px-6">
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left font-semibold text-slate-900 dark:text-white">What can Steve AI do for me?</span>
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-400">
                  Steve monitors all agents across n8n/Make/Zapier, learns from automation outcomes, manages your CRM (contacts, projects, tasks), answers questions, and detects issues proactively.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 px-6">
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left font-semibold text-slate-900 dark:text-white">How does multi-platform monitoring work?</span>
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-400">
                  Connect your n8n, Make, or Zapier accounts. Steve tracks all agents from one dashboard with real-time alerts and analytics.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 px-6">
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left font-semibold text-slate-900 dark:text-white">What's the Marketplace?</span>
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-400">
                  Buy ready-to-use agents from specialists or sell your own. Deploy instantly and Steve manages them automatically.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 px-6">
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left font-semibold text-slate-900 dark:text-white">Is my data secure?</span>
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-400">
                  Yes. All data is encrypted in transit and at rest. Your workflows run on your own n8n, Make, or Zapier instance. We never store sensitive information.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 px-6">
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-left font-semibold text-slate-900 dark:text-white">What if I need help or support?</span>
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 dark:text-slate-400">
                  We offer comprehensive support through multiple channels including email, live chat, and detailed documentation. Our team is here to help you succeed with automation.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section - Purple bold */}
      <section className="py-16 md:py-24" style={{ backgroundColor: '#8B5CF6' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto">
              <Rocket className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white">
              Ready to Let Steve Handle It?
            </h2>
            <p className="text-lg text-white/80 max-w-xl mx-auto">
              Join the beta and see how AI-managed automations can transform your workflow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                className="min-h-[48px] gap-2 bg-white text-purple-700 hover:bg-white/90 font-semibold"
                onClick={() => navigate("/auth?mode=signup")}
              >
                Get Beta Access
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-h-[48px] gap-2 border-white/30 text-white hover:bg-white/10"
                onClick={() => navigate("/contact")}
              >
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

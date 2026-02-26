import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Users, LayoutDashboard, Activity, Bot, TrendingUp, Sparkles, Zap, Shield, BarChart3, Plug, Lightbulb, CheckCircle2 } from "lucide-react";
import { Footer } from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";
import { useCountUp } from "@/hooks/useCountUp";
import { useState, useMemo } from "react";
import communicationImage from "@/assets/Modern_Digital_Communication.png";
import aiWorkflowFeature from "@/assets/ai-workflow-feature.png";
import n8nIntegrationFeature from "@/assets/n8n-integration-feature.png";
import businessDashboardFeature from "@/assets/business-dashboard-feature.png";
import realtimeMonitoringFeature from "@/assets/realtime-monitoring-feature.png";
import teamCollaborationFeature from "@/assets/team-collaboration-feature.png";
import smartAnalyticsFeature from "@/assets/smart-analytics-feature.png";

export default function WhyAP() {
  const navigate = useNavigate();
  const [flippedCard, setFlippedCard] = useState<number | null>(null);
  const {
    count: automationsCount,
    ref: automationsRef
  } = useCountUp({
    end: 500
  });
  const {
    count: buildTimeCount,
    ref: buildTimeRef
  } = useCountUp({
    end: 10,
    start: 60,
    countDown: true
  });
  const {
    count: hoursCount,
    ref: hoursRef
  } = useCountUp({
    end: 1000
  });

  // Generate consistent random offsets for natural zigzag layout
  const cardOffsets = useMemo(() => [0, 1, 2, 3, 4, 5].map(() => ({
    x: Math.random() * 30 - 15,
    // -15px to 15px
    y: Math.random() * 40 - 20 // -20px to 20px
  })), []);

  // Section background colors
  const sectionColors = ['#FF4D4D', '#2563EB', '#FACC15', '#22C55E', '#8B5CF6', '#0F172A'];
  
  // Helper to determine if text should be light or dark
  const getTextColor = (bgColor: string) => {
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155 ? '#0F172A' : '#FFFFFF';
  };
  
  const features = [{
    icon: Bot,
    title: "Steve AI Assistant",
    description: "Your intelligent operations assistant",
    detailText: "Steve monitors all agents across n8n, Make, Zapier. Learns from outcomes, manages your CRM, answers questions, and handles issues proactively.",
    image: aiWorkflowFeature
  }, {
    icon: Activity,
    title: "Multi-Platform Monitoring",
    description: "Track agents from n8n, Make, Zapier",
    detailText: "Connect any platform. Monitor all agents from one dashboard. Real-time execution tracking and alerts when issues arise.",
    image: n8nIntegrationFeature
  }, {
    icon: LayoutDashboard,
    title: "Intelligent CRM",
    description: "Steve manages your operations",
    detailText: "Complete CRM where Steve creates contacts, updates projects, manages tasks. Automation outcomes flow directly into business data.",
    image: businessDashboardFeature
  }, {
    icon: Brain,
    title: "Outcome Learning",
    description: "Steve learns from every automation",
    detailText: "Steve analyzes automation results and learns patterns. Improves suggestions, detects issues, and optimizes performance based on real data.",
    image: realtimeMonitoringFeature
  }, {
    icon: Plug,
    title: "Agent Marketplace",
    description: "Buy and sell AI agents",
    detailText: "Browse ready-to-use agents from specialists. Deploy instantly to n8n/Make/Zapier. Steve manages purchased agents automatically.",
    image: teamCollaborationFeature
  }, {
    icon: TrendingUp,
    title: "Smart Analytics",
    description: "Understand your agent ecosystem",
    detailText: "Agent performance, execution patterns, success rates, ROI. Steve provides insights and recommendations to optimize everything.",
    image: smartAnalyticsFeature
  }];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5 animate-gradient-shift bg-[length:200%_200%]" />
        
        <div className="container relative mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-center md:text-left space-y-6">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight animate-fade-in-up">
                  Stop Managing Agents Manually
                  <span className="block text-primary mt-2">Let Steve Monitor, Learn, and Optimize Everything</span>
                </h1>
              </div>

              <div className="animate-fade-in rounded-lg overflow-hidden" style={{ background: 'linear-gradient(to bottom, #60A5FA, #2563EB)' }}>
                <img 
                  src={communicationImage} 
                  alt="Modern Digital Communication" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-12 border-y bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 text-center">
              AutoPenguin VS Manual Agent Management
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-muted-foreground text-center">
                  Manual Management
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">❌</span>
                    <span>Check multiple dashboards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">❌</span>
                    <span>Manually track failures</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">❌</span>
                    <span>No learning from outcomes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive mt-0.5">❌</span>
                    <span>Scattered business data</span>
                  </li>
                </ul>
              </div>
              <div className="bg-primary/5 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-primary text-center">
                  AutoPenguin
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>One unified dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Steve detects issues 24/7</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Learns from your data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Integrated CRM tools</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="text-center mt-6">
              <Button variant="outline" onClick={() => navigate("/alternatives/openai-agent-builder")}>
                See Full Comparison
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Header */}
      <section id="features" className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Everything You Need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful automation tools plus a complete business dashboard
            </p>
          </div>
        </div>
      </section>

      {/* Stacking Card Sections - Wrapped Container */}
      <div className="relative" style={{
      height: `${(features.length + 1) * 97}vh`
    }}>
      {features.map((feature, index) => {
        const bgColor = sectionColors[index % sectionColors.length];
        const textColor = getTextColor(bgColor);
        
        return (
          <section 
            key={index} 
            className="sticky min-h-screen flex items-center justify-center px-8 md:px-16" 
            style={{
              backgroundColor: bgColor,
              top: 0,
              zIndex: index
            }}
          >
            <div className={`flex items-center gap-16 max-w-5xl w-full ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
              {/* Card */}
              <div className="animate-fade-in shrink-0" style={{
            animationDelay: `${index * 0.1}s`,
            transform: `translate(${cardOffsets[index].x}px, ${cardOffsets[index].y}px)`
          }}>
                <div className="w-[400px] perspective-1000 cursor-pointer" onMouseEnter={() => setFlippedCard(index)} onMouseLeave={() => setFlippedCard(null)}>
                  <div className="relative h-[480px] transition-transform duration-700 preserve-3d" style={{
                transformStyle: 'preserve-3d',
                transform: flippedCard === index ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}>
                  {/* Front of card */}
                  <div className="absolute inset-0 backface-hidden" style={{
                  backfaceVisibility: 'hidden'
                }}>
                    <Card className="h-full border-2 hover:border-primary/50 transition-colors">
                      <CardHeader className="h-full flex flex-col justify-center">
                        <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                          <feature.icon className="h-7 w-7 text-primary" />
                        </div>
                        <CardTitle className="text-2xl mb-2">{feature.title}</CardTitle>
                        <CardDescription className="text-base">{feature.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>

                  {/* Back of card */}
                  <div className="absolute inset-0 backface-hidden" style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}>
                    <Card className="h-full border-2 hover:border-primary/50 transition-colors">
                      <CardContent className="h-full flex items-center justify-center p-6">
                        <img 
                          src={feature.image} 
                          alt={`${feature.title} visualization`} 
                          className="w-full h-auto rounded-lg object-cover"
                        />
                      </CardContent>
                    </Card>
                  </div>
                  </div>
                </div>
              </div>
              
              {/* Description Text */}
              <div className="flex-1 max-w-md animate-fade-in" style={{
            animationDelay: `${index * 0.1 + 0.2}s`
          }}>
                <p className="text-lg leading-relaxed" style={{ color: textColor }}>
                  {feature.detailText}
                </p>
              </div>
            </div>
          </section>
        );
      })}

      {/* 7th Section - See It In Action */}
      <section 
        className="sticky min-h-screen flex items-center justify-center px-8 md:px-16 bg-background" 
        style={{
          top: 0,
          zIndex: 6
        }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">See Steve AI In Action</h2>
              <p className="max-w-2xl mx-auto opacity-90">
                Watch Steve monitor, learn, and manage your agents
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <Card className="p-6 bg-white/95 dark:bg-gray-900/95">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-3 text-sm">
                        Steve, my contact form automation is failing
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 ml-auto">
                      <Sparkles className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div className="flex-1 text-right">
                      <div className="bg-primary text-primary-foreground rounded-lg p-3 text-sm inline-block text-left">
                        <div className="font-semibold mb-2">✓ Issue Detected: CRM API Authentication</div>
                        <div className="space-y-1 text-xs opacity-90">
                          <div>Workflow ran 47 times today with 12 failures in last hour</div>
                          <div>API key expired at 2:15 PM</div>
                          <div><br/>Actions taken:</div>
                          <div>• Paused contact-form-webhook</div>
                          <div>• Created task: "Update CRM API key"</div>
                          <div>• Logged incident in analytics</div>
                        </div>
                        <div className="mt-3">
                          <Button size="sm" variant="secondary" className="w-full">
                            View Dashboard
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">24/7 Monitoring</h3>
                    <p className="text-sm opacity-80">Steve watches all agents across platforms</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Learns from Data</h3>
                    <p className="text-sm opacity-80">Improves based on your automation outcomes</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                    <LayoutDashboard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Manages Your CRM</h3>
                    <p className="text-sm opacity-80">Updates contacts, projects, tasks automatically</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* Benefits Section */}
      <section className="relative z-10 py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Built For Everyone</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Whether you're running a business, building automations professionally, or automating daily tasks
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    For Every Use Case
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>E-commerce automation workflows</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>SaaS operations and integrations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>Marketing automation campaigns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>Customer support workflows</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                    Built-In Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>Contact and data management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>Task tracking and assignments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>Analytics and reporting tools</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>Team collaboration features</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8 border-primary/50 bg-primary/5">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl">Ready to Automate Your Business?</CardTitle>
                <CardDescription className="text-base">
                  Join professionals who've automated their workflows
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="min-h-[44px] w-full sm:w-auto" onClick={() => navigate("/auth?mode=signup")}>
                  Get Beta Access
                </Button>
              <Button size="lg" variant="outline" className="min-h-[44px] w-full sm:w-auto" onClick={() => navigate("/contact")}>
                Contact Sales
              </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Target, Zap, Users, TrendingUp, Heart, Lightbulb, Rocket, Plug, Settings, Shield, Code, MessageSquare, Sparkles } from "lucide-react";
import { Footer } from "@/components/Footer";
import { PublicHeader } from "@/components/PublicHeader";
export default function About() {
  const navigate = useNavigate();
  const roadmapSteps = [
    {
      number: "01",
      title: "Foundation",
      subtitle: "Agent Management Platform - Q4 2025",
      description: "Multi-platform monitoring (n8n/Make/Zapier), Steve AI foundation, CRM integration, marketplace infrastructure.",
      status: "In Progress",
      icon: Code,
      position: "left"
    },
    {
      number: "02",
      title: "Intelligence Layer",
      subtitle: "Account Access & Actions - Q1 2026",
      description: "AI agents access AutoPenguin accounts (contacts, projects, tasks) via API. Agents can make changes, updates, and perform actions on your behalf.",
      status: "Planned",
      icon: Settings,
      position: "right"
    },
    {
      number: "03",
      title: "Private Knowledge & MCP",
      subtitle: "Advanced Integration - Q1 2026",
      description: "Company and user-specific private knowledge bases. MCP server integration for enhanced platform connectivity. Pattern learning and personality customization.",
      status: "Planned",
      icon: Shield,
      position: "left"
    },
    {
      number: "04",
      title: "Proactive Resolution",
      subtitle: "Two-Way Intelligence - Q2 2026",
      description: "Autonomous problem detection and intelligent resolution. Agents actively handle conflicts (scheduling, priorities) and escalate only when human input is required.",
      status: "Planned",
      icon: MessageSquare,
      position: "right"
    },
    {
      number: "05",
      title: "Multi-User Collaboration",
      subtitle: "Inter-Agent Networks - Q2 2026",
      description: "Company-wide agent ecosystem where multiple users' agents collaborate. Management agents delegate to employee agents, optimizing human-AI workload distribution.",
      status: "Planned",
      icon: Users,
      position: "left"
    },
    {
      number: "06",
      title: "Executive Mode",
      subtitle: "AI as Business Leadership - Q3 2026",
      description: "Agents operate at CEO/CMO/COO level. Full operational control with strategic decision-making, freeing founders for creative work and networking.",
      status: "Planned",
      icon: TrendingUp,
      position: "right"
    }
  ];
  const values = [{
    icon: Zap,
    title: "Innovation",
    description: "Pushing boundaries with AI-powered generation"
  }, {
    icon: Users,
    title: "Accessibility",
    description: "No coding required, just describe your needs"
  }, {
    icon: Plug,
    title: "Open Ecosystem",
    description: "Connect platforms, not create walls"
  }, {
    icon: Heart,
    title: "Simplicity",
    description: "Complex workflows made simple"
  }];
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500";
      case "In Progress":
        return "bg-blue-500";
      default:
        return "bg-gray-400";
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="h-5 w-5" />;
      case "In Progress":
        return <Clock className="h-5 w-5 animate-pulse" />;
      default:
        return <Target className="h-5 w-5" />;
    }
  };
  return <div className="min-h-screen bg-background">
      <PublicHeader />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in">
            
            <h1 className="text-4xl md:text-5xl font-bold">
              The AI Agent Management System
            </h1>
            <p className="text-lg text-muted-foreground">
              Deploy agents from any platform. Steve AI monitors, learns, and optimizes everything. One intelligent dashboard.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
            <Card className="border-2 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Make AI agent operations invisible. Deploy from anywhere, let Steve manage the complexity, focus on growth.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Rocket className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Unified platform for all your agents. Steve monitors, learns, manages your CRM, with a marketplace for specialists.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-2 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="p-8 md:p-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">500+</div>
                    <div className="text-sm text-muted-foreground">Active Agents</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
                    <div className="text-sm text-muted-foreground">Management</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-primary mb-2">3</div>
                    <div className="text-sm text-muted-foreground">Platforms Unified</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 space-y-4">
              
              <h2 className="text-3xl md:text-4xl font-bold">What Drives Us</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{value.title}</CardTitle>
                    <CardDescription>{value.description}</CardDescription>
                  </CardHeader>
                </Card>)}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold">
                <span className="text-foreground">Development</span>{" "}
                <span className="text-primary">Roadmap</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                From simple automation to autonomous AI workforce - our journey to make AI your business partner
              </p>
            </div>

            {/* Winding Road Roadmap */}
            <div className="relative">
              {/* Connecting Dashed Line Through All Steps */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 pointer-events-none">
                <div className="w-full h-full border-l-2 border-dashed border-primary/40" />
              </div>

              {/* Roadmap Steps */}
              <div className="relative space-y-32 py-8">
                {roadmapSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isLeft = step.position === "left";
                  
                  return (
                    <div 
                      key={index}
                      className={`flex items-center gap-8 ${isLeft ? 'flex-row' : 'flex-row-reverse'} animate-fade-in`}
                      style={{ animationDelay: `${index * 0.15}s` }}
                    >
                      {/* Content Card */}
                      <div className={`flex-1 ${isLeft ? 'text-right' : 'text-left'}`}>
                        <Card className={`inline-block max-w-md hover:shadow-lg transition-all duration-300 border-2 ${
                          step.status === 'Completed' ? 'border-green-500/50 bg-green-500/5' :
                          step.status === 'In Progress' ? 'border-blue-500/50 bg-blue-500/5' :
                          'border-border'
                        }`}>
                          <CardHeader>
                            <div className={`flex items-center gap-3 ${isLeft ? 'flex-row-reverse' : 'flex-row'}`}>
                              <Badge 
                                variant="secondary" 
                                className={`${getStatusColor(step.status)} text-white`}
                              >
                                {step.status}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{step.subtitle}</span>
                            </div>
                            <CardTitle className="text-2xl mt-2">{step.title}</CardTitle>
                            <CardDescription className="text-base mt-2">
                              {step.description}
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      </div>

                      {/* Icon Circle */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${
                          step.status === 'Completed' ? 'bg-green-500 border-green-400' :
                          step.status === 'In Progress' ? 'bg-blue-500 border-blue-400 animate-pulse' :
                          'bg-muted border-border'
                        } shadow-lg transition-all duration-300`}>
                          <Icon className={`h-10 w-10 ${
                            step.status === 'Completed' || step.status === 'In Progress' 
                              ? 'text-white' 
                              : 'text-muted-foreground'
                          }`} />
                        </div>
                        
                        {/* Step Number Badge */}
                        <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg">
                          {step.number}
                        </div>
                      </div>

                      {/* Spacer for alignment */}
                      <div className="flex-1" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">Start Managing Your Agents</h2>
            <p className="text-lg text-muted-foreground">
              Let Steve handle the complexity. Join the beta.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="min-h-[44px] w-full sm:w-auto" onClick={() => navigate("/auth")}>
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" className="min-h-[44px] w-full sm:w-auto" onClick={() => navigate("/contact")}>
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>;
}
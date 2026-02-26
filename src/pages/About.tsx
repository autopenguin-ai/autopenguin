import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
      subtitle: "Agent Management Platform",
      timeline: "2025",
      description: "Multi-platform monitoring (n8n/Make/Zapier), Steve AI foundation, CRM integration, marketplace infrastructure.",
      status: "Completed",
      icon: Code,
    },
    {
      number: "02",
      title: "Intelligence Layer",
      subtitle: "Account Access & Actions",
      timeline: "Q1 2026",
      description: "AI agents access AutoPenguin accounts (contacts, projects, tasks) via API. Agents can make changes, updates, and perform actions on your behalf.",
      status: "In Progress",
      icon: Settings,
    },
    {
      number: "03",
      title: "Private Knowledge & MCP",
      subtitle: "Advanced Integration",
      timeline: "Q1 2026",
      description: "Company and user-specific private knowledge bases. MCP server integration for enhanced platform connectivity. Pattern learning and personality customization.",
      status: "In Progress",
      icon: Shield,
    },
    {
      number: "04",
      title: "Proactive Resolution",
      subtitle: "Two-Way Intelligence",
      timeline: "Q2 2026",
      description: "Autonomous problem detection and intelligent resolution. Agents actively handle conflicts (scheduling, priorities) and escalate only when human input is required.",
      status: "Planned",
      icon: MessageSquare,
    },
    {
      number: "05",
      title: "Multi-User Collaboration",
      subtitle: "Inter-Agent Networks",
      timeline: "Q2 2026",
      description: "Company-wide agent ecosystem where multiple users' agents collaborate. Management agents delegate to employee agents, optimizing human-AI workload distribution.",
      status: "Planned",
      icon: Users,
    },
    {
      number: "06",
      title: "Executive Mode",
      subtitle: "AI as Business Leadership",
      timeline: "Q3 2026",
      description: "Agents operate at CEO/CMO/COO level. Full operational control with strategic decision-making, freeing founders for creative work and networking.",
      status: "Planned",
      icon: TrendingUp,
    },
  ];

  const values = [
    {
      icon: Zap,
      title: "Innovation",
      description: "Pushing boundaries with AI-powered generation",
      color: "#FF4D4D",
    },
    {
      icon: Users,
      title: "Accessibility",
      description: "No coding required, just describe your needs",
      color: "#2563EB",
    },
    {
      icon: Plug,
      title: "Open Ecosystem",
      description: "Connect platforms, not create walls",
      color: "#22C55E",
    },
    {
      icon: Heart,
      title: "Simplicity",
      description: "Complex workflows made simple",
      color: "#8B5CF6",
    },
  ];

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

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "#22C55E";
      case "In Progress":
        return "#2563EB";
      default:
        return "#94A3B8";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero Section - Dark bold */}
      <section className="py-20 md:py-32" style={{ backgroundColor: "#0F172A" }}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              The AI Agent Management System
            </h1>
            <p className="text-lg md:text-xl text-slate-300">
              Deploy agents from any platform. Steve AI monitors, learns, and optimizes everything. One intelligent dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Vision & Mission - Colored section */}
      <section className="py-16 md:py-24" style={{ backgroundColor: "#2563EB" }}>
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl p-8 md:p-10" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                <Lightbulb className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Our Vision</h2>
              <p className="text-blue-100 text-lg leading-relaxed">
                Make AI agent operations invisible. Deploy from anywhere, let Steve manage the complexity, focus on growth.
              </p>
            </div>

            <div className="rounded-2xl p-8 md:p-10" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                <Rocket className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Our Mission</h2>
              <p className="text-blue-100 text-lg leading-relaxed">
                Unified platform for all your agents. Steve monitors, learns, manages your CRM, with a marketplace for specialists.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Honest beta stats */}
      <section className="py-16 md:py-20" style={{ backgroundColor: "#FACC15" }}>
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: "#0F172A" }}>Open Source</div>
                <div className="text-sm font-medium" style={{ color: "#422006" }}>MIT Licensed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: "#0F172A" }}>Self-Hostable</div>
                <div className="text-sm font-medium" style={{ color: "#422006" }}>Full Docker Stack</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2" style={{ color: "#0F172A" }}>BYOLLM</div>
                <div className="text-sm font-medium" style={{ color: "#422006" }}>6+ Providers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section - Each value gets a bold color */}
      <section>
        {values.map((value, index) => {
          const isLight = value.color === "#FACC15";
          const textColor = isLight ? "#0F172A" : "#FFFFFF";
          const subtextColor = isLight ? "#422006" : "rgba(255,255,255,0.8)";
          const iconBg = isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)";

          return (
            <div
              key={index}
              className="py-16 md:py-20"
              style={{ backgroundColor: value.color }}
            >
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: iconBg }}
                  >
                    <value.icon className="h-10 w-10" style={{ color: textColor }} />
                  </div>
                  <div>
                    <h3 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: textColor }}>
                      {value.title}
                    </h3>
                    <p className="text-lg md:text-xl" style={{ color: subtextColor }}>
                      {value.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Roadmap Section - Clean vertical timeline */}
      <section className="py-16 md:py-24" style={{ backgroundColor: "#0F172A" }}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold text-white">
                Development Roadmap
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                From simple automation to autonomous AI workforce - our journey to make AI your business partner
              </p>
            </div>

            {/* Vertical Timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-700" />

              <div className="space-y-10">
                {roadmapSteps.map((step, index) => {
                  const Icon = step.icon;
                  const dotColor = getStatusDotColor(step.status);

                  return (
                    <div key={index} className="relative flex gap-6">
                      {/* Dot */}
                      <div className="relative flex-shrink-0 z-10">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center border-4"
                          style={{
                            backgroundColor: dotColor,
                            borderColor: "#0F172A",
                          }}
                        >
                          <span className="text-white text-xs font-bold">{step.number}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-2">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{step.title}</h3>
                          <Badge
                            className={`${getStatusColor(step.status)} text-white border-0 text-xs`}
                          >
                            {getStatusIcon(step.status)}
                            <span className="ml-1">{step.status}</span>
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-500 mb-2">
                          {step.subtitle} &middot; {step.timeline}
                        </div>
                        <p className="text-slate-300 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Bold colored */}
      <section className="py-16 md:py-24" style={{ backgroundColor: "#22C55E" }}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold text-white">
              Start Managing Your Agents
            </h2>
            <p className="text-lg text-green-100">
              Let Steve handle the complexity. Join the beta.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="min-h-[44px] w-full sm:w-auto text-base font-semibold"
                style={{ backgroundColor: "#0F172A", color: "#FFFFFF" }}
                onClick={() => navigate("/auth")}
              >
                Start Free Trial
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-h-[44px] w-full sm:w-auto text-base font-semibold border-2"
                style={{ borderColor: "#FFFFFF", color: "#FFFFFF", backgroundColor: "transparent" }}
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

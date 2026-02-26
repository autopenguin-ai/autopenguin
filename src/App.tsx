import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { IndustryProvider } from "@/contexts/IndustryContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "@/lib/i18n";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import WhyAP from "./pages/WhyAP";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import ContactUs from "./pages/ContactUs";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Projects from "./pages/Projects";
import Clients from "./pages/Clients";
import Tasks from "./pages/Tasks";
import Communications from "./pages/Communications";
import Automations from "./pages/Automations";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import { Navigate } from "react-router-dom";
import OpenAIComparison from "./pages/OpenAIComparison";
import LangflowComparison from "./pages/LangflowComparison";
import NoCodeComparison from "./pages/NoCodeComparison";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import Onboarding from "./pages/Onboarding";
import Marketplace from "./pages/Marketplace";
import MarketplaceTemplate from "./pages/MarketplaceTemplate";
import MarketplaceCreator from "./pages/MarketplaceCreator";
import MarketplacePurchases from "./pages/MarketplacePurchases";
import MarketplaceCreateTemplate from "./pages/MarketplaceCreateTemplate";
import Changelog from "./pages/Changelog";
import BetaGuide from "./pages/BetaGuide";
import Chat from "./pages/Chat";
import Talent from "./pages/Talent";
import Bookings from "./pages/Bookings";
import Finance from "./pages/Finance";
import OpenSource from "./pages/OpenSource";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <AuthProvider>
        <IndustryProvider>
          <Toaster />
          <Sonner />
          <CookieConsentBanner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/why-ap" element={<WhyAP />} />
            <Route path="/about" element={<About />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/open-source" element={<OpenSource />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/reset" element={<Auth />} />
            <Route path="/waitlist" element={<Navigate to="/auth?mode=signup" replace />} />
            <Route path="/alternatives/openai-agent-builder" element={<OpenAIComparison />} />
            <Route path="/alternatives/langflow" element={<LangflowComparison />} />
            <Route path="/compare/no-code-automation" element={<NoCodeComparison />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="/beta-guide" element={<BetaGuide />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace/template/:templateId" element={<MarketplaceTemplate />} />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route 
              path="/projects" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Projects />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/clients" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Clients />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tasks" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Tasks />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/communications" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Communications />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/automations"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Automations />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/marketplace/creator"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MarketplaceCreator />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/marketplace/purchases"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MarketplacePurchases />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/marketplace/create"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MarketplaceCreateTemplate />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/marketplace/edit/:templateId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MarketplaceCreateTemplate />
                  </Layout>
                </ProtectedRoute>
              } 
            />
            <Route
              path="/talent"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Talent />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Bookings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Finance />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </IndustryProvider>
      </AuthProvider>
    </TooltipProvider>
  </ThemeProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Bug, Rocket } from "lucide-react";
import { Link } from "react-router-dom";

export default function BetaGuide() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3">
            <Rocket className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">
              {t("betaGuide.title", "Beta Testing Guide")}
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {t("betaGuide.description", "Help us improve AutoPenguin by testing and providing feedback.")}
          </p>
          <Badge variant="secondary" className="text-sm">
            {t("betaGuide.version", "v1.0.0 Beta")}
          </Badge>
        </div>

        {/* Welcome Message */}
        <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              {t("betaGuide.welcomeTitle", "Welcome Beta Tester! 歡迎測試員！")}
            </CardTitle>
            <CardDescription>
              {t("betaGuide.welcomeDescription", 
                "Thank you for helping us test AutoPenguin. Your feedback is invaluable in shaping the future of this platform."
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* What to Test */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {t("betaGuide.whatToTestTitle", "What to Test")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-primary">1.</span>
                {t("betaGuide.authenticationTitle", "Authentication & Onboarding")}
              </h3>
              <ul className="space-y-1 ml-6 text-sm text-muted-foreground">
                <li>• {t("betaGuide.auth1", "Sign up with Google OAuth")}</li>
                <li>• {t("betaGuide.auth2", "Complete the onboarding flow")}</li>
                <li>• {t("betaGuide.auth3", "Log out and log back in")}</li>
                <li>• {t("betaGuide.auth4", "Test language switching (EN ↔ 繁體中文)")}</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-primary">2.</span>
                {t("betaGuide.steveTitle", "Steve AI Assistant")}
              </h3>
              <ul className="space-y-1 ml-6 text-sm text-muted-foreground">
                <li>• {t("betaGuide.steve1", 'Try: "Create a new project called Website Redesign"')}</li>
                <li>• {t("betaGuide.steve2", 'Ask: "Show me all my tasks"')}</li>
                <li>• {t("betaGuide.steve3", 'Request: "Add a new client named John Doe"')}</li>
                <li>• {t("betaGuide.steve4", "Test search and knowledge base queries")}</li>
                <li>• {t("betaGuide.steve5", "Try creating tasks, updating records, and analyzing data")}</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-primary">3.</span>
                {t("betaGuide.crudTitle", "CRUD Operations")}
              </h3>
              <ul className="space-y-1 ml-6 text-sm text-muted-foreground">
                <li>• {t("betaGuide.crud1", "Create, edit, and delete projects")}</li>
                <li>• {t("betaGuide.crud2", "Manage clients and their information")}</li>
                <li>• {t("betaGuide.crud3", "Add, update, and complete tasks")}</li>
                <li>• {t("betaGuide.crud4", "Test inline editing features")}</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-primary">4.</span>
                {t("betaGuide.n8nTitle", "N8n Integration (if applicable)")}
              </h3>
              <ul className="space-y-1 ml-6 text-sm text-muted-foreground">
                <li>• {t("betaGuide.n8n1", "Connect your n8n instance")}</li>
                <li>• {t("betaGuide.n8n2", "Test workflow synchronization")}</li>
                <li>• {t("betaGuide.n8n3", "Verify automation outcomes tracking")}</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-primary">5.</span>
                {t("betaGuide.uiTitle", "UI/UX & Performance")}
              </h3>
              <ul className="space-y-1 ml-6 text-sm text-muted-foreground">
                <li>• {t("betaGuide.ui1", "Test mobile responsiveness on different devices")}</li>
                <li>• {t("betaGuide.ui2", "Switch between light and dark modes")}</li>
                <li>• {t("betaGuide.ui3", "Navigate through all pages and features")}</li>
                <li>• {t("betaGuide.ui4", "Check loading times and performance")}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* How to Report Bugs */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-destructive" />
              {t("betaGuide.reportTitle", "How to Report Bugs")}
            </CardTitle>
            <CardDescription>
              {t("betaGuide.reportDescription", "Found an issue? Here's how to report it:")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-3 ml-4">
              <li className="text-sm">
                <span className="font-semibold">1.</span>{" "}
                {t("betaGuide.reportStep1", 'Click the "Report Bug" button (🐛) in the sidebar')}
              </li>
              <li className="text-sm">
                <span className="font-semibold">2.</span>{" "}
                {t("betaGuide.reportStep2", "Provide a clear title describing the issue")}
              </li>
              <li className="text-sm">
                <span className="font-semibold">3.</span>{" "}
                {t("betaGuide.reportStep3", "Include steps to reproduce the bug")}
              </li>
              <li className="text-sm">
                <span className="font-semibold">4.</span>{" "}
                {t("betaGuide.reportStep4", "Select the appropriate category and severity")}
              </li>
              <li className="text-sm">
                <span className="font-semibold">5.</span>{" "}
                {t("betaGuide.reportStep5", "Submit - browser info and page URL are captured automatically")}
              </li>
            </ol>

            <Button asChild className="w-full">
              <Link to="/dashboard">
                <Bug className="mr-2 h-4 w-4" />
                {t("betaGuide.reportButton", "Go to Dashboard to Report")}
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Known Limitations */}
        <Card className="border-yellow-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              {t("betaGuide.limitationsTitle", "Known Limitations")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                • {t("betaGuide.limitation1", "Some Steve AI features are still being refined")}
              </li>
              <li>
                • {t("betaGuide.limitation2", "Real-time notifications may have delays")}
              </li>
              <li>
                • {t("betaGuide.limitation3", "File upload size is currently limited to 10MB")}
              </li>
              <li>
                • {t("betaGuide.limitation4", "Mobile app is not yet available (web-only)")}
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            {t("betaGuide.thanks", "Thank you for your contribution! 感謝您的貢獻！")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("betaGuide.questions", "Questions? Contact us at support@autopenguin.com")}
          </p>
        </div>
      </div>
    </div>
  );
}

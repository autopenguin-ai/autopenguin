import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import wavingPenguin from "@/assets/waving-penguin.png";

export function WelcomeBanner() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("has_seen_welcome");
    if (!hasSeenWelcome) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("has_seen_welcome", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <Card className="relative mb-6 border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-8 w-8"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <img 
            src={wavingPenguin} 
            alt="AutoPenguin mascot" 
            className="h-16 w-16 object-contain" 
          />
        </div>
        
        <div className="flex-1 space-y-3">
          <h2 className="text-xl font-semibold">
            {t("welcomeBanner.title", "Welcome to AutoPenguin! 歡迎使用 AutoPenguin!")}
          </h2>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              {t("welcomeBanner.subtitle", "Here's what you can do:")}
            </p>
            
            <ul className="space-y-1.5 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  {t("welcomeBanner.feature1", "Ask Steve AI to create projects, tasks, and manage your workflow")}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  {t("welcomeBanner.feature2", "Manage clients, projects, and tasks in one place")}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  {t("welcomeBanner.feature3", "Connect n8n workflows for powerful automation")}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  {t("welcomeBanner.feature4", "Track analytics and monitor your business performance")}
                </span>
              </li>
            </ul>
          </div>
          
          <div className="rounded-lg bg-background/50 p-3 border border-primary/20">
            <p className="text-sm">
              <span className="font-semibold text-primary">
                {t("welcomeBanner.tip", "💡 Quick Tip:")}
              </span>{" "}
              {t("welcomeBanner.tipContent", 'Try asking Steve: "Create a new project for website redesign"')}
            </p>
          </div>
          
          <Button onClick={handleDismiss} className="mt-2">
            {t("welcomeBanner.gotIt", "Got it!")}
          </Button>
        </div>
      </div>
    </Card>
  );
}

import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Bug, Wrench } from "lucide-react";

export default function Changelog() {
  const { t } = useTranslation();

  const versions = [
    {
      version: "v1.0.0 Beta",
      date: "2025-01-26",
      changes: {
        newFeatures: [
          {
            en: "Steve AI Assistant with 18 powerful tools for automation and data management",
            zh: "Steve AI 助理，配備 18 個強大工具用於自動化和數據管理"
          },
          {
            en: "Dashboard with real-time analytics and business insights",
            zh: "即時分析和業務洞察的儀表板"
          },
          {
            en: "Projects, Clients, and Tasks management system",
            zh: "項目、客戶和任務管理系統"
          },
          {
            en: "Google OAuth authentication for secure login",
            zh: "Google OAuth 身份驗證以實現安全登錄"
          },
          {
            en: "N8n integration support for workflow automation",
            zh: "N8n 整合支援工作流程自動化"
          },
          {
            en: "Full bilingual support (English / Traditional Chinese)",
            zh: "完整雙語支援（英文 / 繁體中文）"
          },
          {
            en: "Properties and Leads tracking with automation outcomes",
            zh: "物業和潛在客戶追蹤與自動化結果"
          },
          {
            en: "Real-time communications monitoring and management",
            zh: "即時通訊監控和管理"
          }
        ],
        improvements: [
          {
            en: "Optimized mobile-responsive design across all pages",
            zh: "優化所有頁面的移動響應式設計"
          },
          {
            en: "Enhanced dark mode with improved contrast and readability",
            zh: "增強的深色模式，提高對比度和可讀性"
          },
          {
            en: "Improved Steve AI response streaming and error handling",
            zh: "改進 Steve AI 響應串流和錯誤處理"
          }
        ],
        bugFixes: [
          {
            en: "Fixed authentication redirect issues after login",
            zh: "修復登錄後身份驗證重定向問題"
          },
          {
            en: "Resolved data synchronization delays in dashboard widgets",
            zh: "解決儀表板小部件中的數據同步延遲"
          },
          {
            en: "Fixed language toggle persistence across sessions",
            zh: "修復跨會話的語言切換持久性"
          }
        ]
      }
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="space-y-4 mb-8">
          <h1 className="text-4xl font-bold">
            {t("changelog.title", "Changelog")}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t("changelog.description", "Track all updates, improvements, and fixes to AutoPenguin.")}
          </p>
        </div>

        <div className="space-y-8">
          {versions.map((release) => (
            <Card key={release.version} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">{release.version}</CardTitle>
                  <Badge variant="secondary">{release.date}</Badge>
                </div>
                <CardDescription>
                  {t("changelog.releaseDate", "Released on")} {release.date}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6 space-y-6">
                {/* New Features */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">
                      {t("changelog.newFeatures", "✨ New Features")}
                    </h3>
                  </div>
                  <ul className="space-y-2 ml-7">
                    {release.changes.newFeatures.map((feature, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">
                        • {t(`changelog.newFeatures.${idx}`, feature.en)}
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                {/* Improvements */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Wrench className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">
                      {t("changelog.improvements", "🔧 Improvements")}
                    </h3>
                  </div>
                  <ul className="space-y-2 ml-7">
                    {release.changes.improvements.map((improvement, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">
                        • {t(`changelog.improvements.${idx}`, improvement.en)}
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                {/* Bug Fixes */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Bug className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">
                      {t("changelog.bugFixes", "🐛 Bug Fixes")}
                    </h3>
                  </div>
                  <ul className="space-y-2 ml-7">
                    {release.changes.bugFixes.map((fix, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">
                        • {t(`changelog.bugFixes.${idx}`, fix.en)}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            {t("changelog.footer", "More updates coming soon. Stay tuned! 更多更新即將推出，敬請期待！")}
          </p>
        </div>
      </div>
    </div>
  );
}

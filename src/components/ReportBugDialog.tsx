import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Bug, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserCompany } from "@/hooks/useCompany";

const bugReportSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string(),
  severity: z.string(),
});

type BugReportForm = z.infer<typeof bugReportSchema>;

interface ReportBugDialogProps {
  trigger?: React.ReactNode;
}

export function ReportBugDialog({ trigger }: ReportBugDialogProps = {}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { data: company } = useUserCompany();

  const form = useForm<BugReportForm>({
    resolver: zodResolver(bugReportSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "general",
      severity: "medium",
    },
  });

  const onSubmit = async (data: BugReportForm) => {
    if (!user) {
      toast({
        title: t("reportBug.error", "Error"),
        description: t("reportBug.loginRequired", "You must be logged in to report bugs"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Capture browser info
      const browserInfo = `${navigator.userAgent} | Screen: ${window.screen.width}x${window.screen.height}`;
      const pageUrl = window.location.href;

      const { error } = await supabase.functions.invoke('send-bug-report', {
        body: {
          user_id: user.id,
          company_id: company?.id || null,
          title: data.title,
          description: data.description,
          category: data.category,
          severity: data.severity,
          browser_info: browserInfo,
          page_url: pageUrl,
          user_email: user.email,
        }
      });

      if (error) throw error;

      toast({
        title: t("reportBug.success", "Bug Report Submitted"),
        description: t(
          "reportBug.successDescription",
          "Thank you for helping us improve AutoPenguin!"
        ),
      });

      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error submitting bug report:", error);
      toast({
        title: t("reportBug.error", "Error"),
        description: t("reportBug.submitError", "Failed to submit bug report. Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Bug className="h-4 w-4" />
            {t("reportBug.button", "Report Bug")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-destructive" />
            {t("reportBug.title", "Report a Bug")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "reportBug.description",
              "Help us improve by reporting issues you encounter. Browser info and page URL are captured automatically."
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reportBug.titleLabel", "Bug Title")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("reportBug.titlePlaceholder", "e.g., Login button not working")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reportBug.descriptionLabel", "Description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t(
                        "reportBug.descriptionPlaceholder",
                        "Please describe the bug in detail:\n1. What were you trying to do?\n2. What happened?\n3. What did you expect to happen?\n4. Steps to reproduce..."
                      )}
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("reportBug.descriptionHelper", "Include steps to reproduce the issue")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("reportBug.categoryLabel", "Category")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">{t("reportBug.general", "General")}</SelectItem>
                        <SelectItem value="ui">{t("reportBug.ui", "UI/Design")}</SelectItem>
                        <SelectItem value="steve_ai">{t("reportBug.steveAI", "Steve AI")}</SelectItem>
                        <SelectItem value="projects">{t("reportBug.projects", "Projects")}</SelectItem>
                        <SelectItem value="tasks">{t("reportBug.tasks", "Tasks")}</SelectItem>
                        <SelectItem value="clients">{t("reportBug.clients", "Clients")}</SelectItem>
                        <SelectItem value="n8n">{t("reportBug.n8n", "N8n Integration")}</SelectItem>
                        <SelectItem value="other">{t("reportBug.other", "Other")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("reportBug.severityLabel", "Severity")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">{t("reportBug.low", "Low")}</SelectItem>
                        <SelectItem value="medium">{t("reportBug.medium", "Medium")}</SelectItem>
                        <SelectItem value="high">{t("reportBug.high", "High")}</SelectItem>
                        <SelectItem value="critical">{t("reportBug.critical", "Critical")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                {t("reportBug.cancel", "Cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("reportBug.submit", "Submit Report")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

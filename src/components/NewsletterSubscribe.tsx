import { useState } from "react";
import { Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function NewsletterSubscribe() {
  const { t } = useTranslation();
  const [consentGiven, setConsentGiven] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!consentGiven) {
      toast({
        title: t("newsletter.consent_required"),
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: t("newsletter.invalid_email"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("beehiiv-subscribe", {
        body: {
          email,
          utmSource: "website",
          utmMedium: "organic",
          utmCampaign: "footer_newsletter",
        },
      });

      if (error) throw error;

      toast({
        title: t("newsletter.success"),
      });

      setEmail("");
      setConsentGiven(false);
    } catch (error: any) {
      console.error("Newsletter subscription error:", error);
      toast({
        title: t("newsletter.error"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Mail className="h-4 w-4" />
        <span>{t("newsletter.title")}</span>
      </div>

      <div className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("newsletter.email_placeholder")}
          className="h-10 text-sm flex-1"
          disabled={isSubmitting}
          required
        />
        <Button
          type="submit"
          disabled={!consentGiven || isSubmitting}
          className="h-10 text-sm"
        >
          {isSubmitting ? t("newsletter.subscribing") : t("newsletter.subscribe_button")}
        </Button>
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="newsletter-consent"
          checked={consentGiven}
          onCheckedChange={(checked) => setConsentGiven(checked === true)}
          className="mt-1"
        />
        <label
          htmlFor="newsletter-consent"
          className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
        >
          {t("newsletter.consent_label")}{" "}
          <Link to="/privacy-policy" className="text-primary hover:underline">
            {t("newsletter.privacy_policy")}
          </Link>
        </label>
      </div>
    </form>
  );
}
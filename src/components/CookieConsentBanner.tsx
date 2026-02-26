import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface CookieConsent {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

export const CookieConsentBanner = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsent>({
    essential: true,
    functional: true,
    analytics: true,
    marketing: true,
    timestamp: Date.now(),
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    } else {
      const parsed = JSON.parse(consent);
      // Initialize Facebook Pixel if marketing consent given
      if (parsed.marketing) {
        initializeFacebookPixel();
      }
    }
  }, []);

  const initializeFacebookPixel = () => {
    // Facebook Pixel is already in index.html, but we can control it here
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('consent', 'grant');
    }
  };

  const revokeFacebookPixel = () => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('consent', 'revoke');
    }
  };

  const saveConsent = (consent: CookieConsent) => {
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    
    // Handle Facebook Pixel based on marketing consent
    if (consent.marketing) {
      initializeFacebookPixel();
    } else {
      revokeFacebookPixel();
    }
    
    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    const consent: CookieConsent = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
    };
    saveConsent(consent);
  };

  const handleRejectNonEssential = () => {
    const consent: CookieConsent = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
    };
    saveConsent(consent);
  };

  const handleSavePreferences = () => {
    saveConsent({ ...preferences, timestamp: Date.now() });
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Dark backdrop overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsVisible(false)}
      />
      
      {/* Centered popup card */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        <Card className={`max-w-md w-full p-6 shadow-2xl pointer-events-auto transition-transform duration-300 ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">{t('cookies.banner.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('cookies.banner.description')}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsVisible(false)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-col gap-3 mb-4">
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleAcceptAll} className="flex-1 min-w-[120px]">
                {t('cookies.banner.acceptAll')}
              </Button>
              <Button
                onClick={handleRejectNonEssential}
                variant="outline"
                className="flex-1 min-w-[120px]"
              >
                {t('cookies.banner.rejectNonEssential')}
              </Button>
            </div>

            <Button
              onClick={() => setShowCustomize(!showCustomize)}
              variant="ghost"
              className="w-full justify-between"
            >
              {t('cookies.banner.customize')}
              {showCustomize ? (
                <ChevronUp className="h-4 w-4 ml-2" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-2" />
              )}
            </Button>
          </div>

          {showCustomize && (
            <div className="space-y-4 mb-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    {t('cookies.categories.essential')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('cookies.categories.essential.description')}
                  </p>
                </div>
                <Switch checked disabled />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    {t('cookies.categories.functional')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('cookies.categories.functional.description')}
                  </p>
                </div>
                <Switch
                  checked={preferences.functional}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, functional: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    {t('cookies.categories.analytics')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('cookies.categories.analytics.description')}
                  </p>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, analytics: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    {t('cookies.categories.marketing')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('cookies.categories.marketing.description')}
                  </p>
                </div>
                <Switch
                  checked={preferences.marketing}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, marketing: checked })
                  }
                />
              </div>

              <Button onClick={handleSavePreferences} className="w-full mt-4">
                {t('cookies.banner.savePreferences')}
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center mt-4">
            {t('cookies.banner.learnMore')}{' '}
            <a href="/cookie-policy" className="underline hover:text-foreground">
              {t('cookies.banner.cookiePolicy')}
            </a>{' '}
            {t('cookies.banner.and')}{' '}
            <a href="/privacy-policy" className="underline hover:text-foreground">
              {t('cookies.banner.privacyPolicy')}
            </a>
          </p>
        </Card>
      </div>
    </>
  );
};

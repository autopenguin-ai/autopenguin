import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Rocket, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

type ExperienceLevel = 'beginner' | 'experienced' | 'professional' | null;

interface OnboardingData {
  experienceLevel: ExperienceLevel;
  fullName: string;
  companyName: string;
  industry: string;
  automationFrequency: string;
  newsletterConsent: boolean;
  termsAccepted: boolean;
  plan: 'free' | 'paid' | null;
}

export default function Onboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, userProfile, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [data, setData] = useState<OnboardingData>({
    experienceLevel: null,
    fullName: `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim(),
    companyName: '',
    industry: '',
    automationFrequency: '',
    newsletterConsent: false,
    termsAccepted: false,
    plan: null,
  });

  const handleExperienceSelect = (level: ExperienceLevel) => {
    setData({ ...data, experienceLevel: level });
    setStep(2);
  };

  const handleSkipExperience = () => {
    setStep(2);
  };

  const handleAccountSetup = async () => {
    if (!data.companyName.trim()) {
      toast.error(t('onboarding.setup.company_name'), {
        description: t('onboarding.setup.company_name_required')
      });
      return;
    }

    if (!data.termsAccepted) {
      toast.error(t('onboarding.setup.terms_required'));
      return;
    }

    if (!data.newsletterConsent) {
      toast.error(t('onboarding.setup.newsletter_required'));
      return;
    }

    setLoading(true);
    try {
      // Get user's existing company_id
      const { data: profileData, error: fetchError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user?.id)
        .single();

      if (fetchError) throw fetchError;
      if (!profileData?.company_id) throw new Error('No company found');

      // Update the blank company with actual details
      const { error: companyError } = await supabase
        .from('companies')
        .update({
          display_name: data.companyName,
        })
        .eq('id', profileData.company_id);

      if (companyError) throw companyError;

      // Update profile with onboarding data
      const industryValue = data.industry || 'default';
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          experience_level: data.experienceLevel,
          industry: industryValue || null,
          automation_frequency: data.automationFrequency || null,
          terms_accepted_at: new Date().toISOString(),
          subscription_plan: data.plan,
        })
        .eq('user_id', user?.id);

      if (profileError) throw profileError;

      // Refresh profile state to reflect onboarding_completed: true
      await refreshProfile();

      // Always record newsletter subscription preference
      if (user?.email) {
        await supabase.from('newsletter_subscriptions').insert({
          email: user.email,
          source: 'onboarding',
          is_active: data.newsletterConsent,
        });
      }

      toast.success(t('onboarding.plan.complete_success'));
      navigate('/chat');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error(t('onboarding.plan.complete_error'), {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{t('onboarding.experience.title')}</h1>
        <p className="text-muted-foreground">{t('onboarding.experience.subtitle')}</p>
      </div>

      <div className="grid gap-4 mt-8">
        <Card
          className="p-6 cursor-pointer hover:border-primary transition-all hover:shadow-lg"
          onClick={() => handleExperienceSelect('beginner')}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{t('onboarding.experience.beginner')}</h3>
              <p className="text-sm text-muted-foreground">{t('onboarding.experience.beginner_desc')}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:border-primary transition-all hover:shadow-lg"
          onClick={() => handleExperienceSelect('experienced')}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{t('onboarding.experience.experienced')}</h3>
              <p className="text-sm text-muted-foreground">{t('onboarding.experience.experienced_desc')}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>

        <Card
          className="p-6 cursor-pointer hover:border-primary transition-all hover:shadow-lg"
          onClick={() => handleExperienceSelect('professional')}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{t('onboarding.experience.professional')}</h3>
              <p className="text-sm text-muted-foreground">{t('onboarding.experience.professional_desc')}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>
      </div>

      <div className="text-center mt-6">
        <Button variant="ghost" onClick={handleSkipExperience}>
          {t('onboarding.experience.skip')}
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{t('onboarding.setup.title')}</h1>
        <p className="text-muted-foreground">{t('onboarding.setup.subtitle')}</p>
      </div>

      <div className="space-y-4 mt-8">
        <div className="space-y-2">
          <Label htmlFor="fullName">{t('onboarding.setup.full_name')}</Label>
          <Input
            id="fullName"
            value={data.fullName}
            onChange={(e) => setData({ ...data, fullName: e.target.value })}
            placeholder={t('first-name') + ' ' + t('last-name')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyName">{t('onboarding.setup.company_name')} *</Label>
          <Input
            id="companyName"
            value={data.companyName}
            onChange={(e) => setData({ ...data, companyName: e.target.value })}
            placeholder={t('company-name')}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>{t('onboarding.setup.industry')}</Label>
          <div className="grid gap-3">
            {[
              { value: 'default', label: 'Project Management', desc: 'For agencies, consultancies, and general business. Manage projects, tasks, contacts, and finances.' },
              { value: 'talent_agency', label: 'Social Media / Talent Agency', desc: 'For talent management, influencer agencies, and content creators. Everything in PM plus talent roster.' },
              { value: 'real_estate', label: 'Real Estate', desc: 'For property management, real estate agencies, and brokerages. Track properties, viewings, and deals.' },
            ].map((opt) => (
              <Card
                key={opt.value}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  data.industry === opt.value ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                }`}
                onClick={() => setData({ ...data, industry: opt.value })}
              >
                <div className="flex items-center gap-3">
                  {data.industry === opt.value && <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />}
                  <div>
                    <p className="font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">{t('onboarding.setup.automation_frequency')}</Label>
          <Select value={data.automationFrequency} onValueChange={(value) => setData({ ...data, automationFrequency: value })}>
            <SelectTrigger id="frequency">
              <SelectValue placeholder={t('onboarding.setup.frequency_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">{t('onboarding.setup.daily')}</SelectItem>
              <SelectItem value="weekly">{t('onboarding.setup.weekly')}</SelectItem>
              <SelectItem value="monthly">{t('onboarding.setup.monthly')}</SelectItem>
              <SelectItem value="rarely">{t('onboarding.setup.rarely')}</SelectItem>
              <SelectItem value="first_time">{t('onboarding.setup.first_time')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Consent Checkboxes */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-start gap-3">
            <Checkbox
              id="newsletter"
              checked={data.newsletterConsent}
              onCheckedChange={(checked) => setData({ ...data, newsletterConsent: checked as boolean })}
            />
            <Label htmlFor="newsletter" className="text-sm font-normal leading-relaxed cursor-pointer">
              {t('onboarding.setup.newsletter_consent')} <span className="text-destructive">*</span>
            </Label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={data.termsAccepted}
              onCheckedChange={(checked) => setData({ ...data, termsAccepted: checked as boolean })}
            />
                <Label htmlFor="terms" className="text-sm font-normal leading-relaxed cursor-pointer">
                  {t('onboarding.setup.terms_acceptance_prefix')}{' '}
                  <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {t('onboarding.setup.terms_of_service')}
                  </a>
                  {' '}{t('onboarding.setup.and')}{' '}
                  <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {t('onboarding.setup.privacy_policy')}
                  </a>
                  {' '}<span className="text-destructive">*</span>
                </Label>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('onboarding.setup.back')}
        </Button>
        <Button 
          onClick={() => {
            setData(prev => ({ ...prev, plan: 'free' }));
            handleAccountSetup();
          }}
          disabled={loading || !data.companyName.trim() || !data.termsAccepted || !data.newsletterConsent} 
          className="flex-1"
        >
          {t('next')}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-2xl p-8 shadow-xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {t('onboarding.step', { current: step, total: 2 })}
            </span>
          </div>
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </Card>
    </div>
  );
}

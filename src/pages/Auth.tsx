import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import autoPenguinLogo from '@/assets/autopenguin-new-logo.png';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const authSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
});

export default function Auth() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'reset'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/chat');
    }
  }, [user, navigate]);

  // Clean up OAuth tokens from URL and detect reset mode
  useEffect(() => {
    const hash = window.location.hash;
    
    // Check if we're on /auth/reset route
    if (location.pathname === '/auth/reset' || hash.includes('type=recovery')) {
      setMode('reset');
    }
    
    // Clean up OAuth tokens from URL
    if (hash.includes('access_token') || hash.includes('refresh_token')) {
      supabase.auth.getSession().then(() => {
        window.history.replaceState(null, '', window.location.pathname);
      });
    }
  }, [location.pathname]);

  const validateForm = () => {
    try {
      if (mode === 'signup') {
        authSchema.parse({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
      } else if (mode === 'forgot') {
        // Only validate email for password reset request
        authSchema.pick({ email: true }).parse({
          email: formData.email,
        });
      } else if (mode === 'reset') {
        // Validate password for setting new password
        authSchema.pick({ password: true }).parse({
          password: formData.password,
        });
      } else {
        // signin mode - validate email and password
        authSchema.pick({ email: true, password: true }).parse({
          email: formData.email,
          password: formData.password,
        });
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.issues[0].message,
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'azure') => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth`,
          skipBrowserRedirect: true,
        }
      });
      if (error) throw error;
      
      // Redirect top-level window (not iframe)
      if (data?.url) {
        const topWindow = window.top ?? window;
        topWindow.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      if (mode === 'signup') {
        const { error } = await signUp(
          formData.email,
          formData.password,
          formData.firstName,
          formData.lastName
        );
        
        if (error) {
          toast({
            title: t('auth.signup_failed', 'Sign up failed'),
            description: error,
            variant: "destructive",
          });
        } else {
          toast({
            title: t('auth.account_created', 'Account created successfully!'),
            description: t('auth.check_email_verify', 'Please check your email to verify your account.'),
          });
          setMode('signin');
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/auth/reset`,
        });
        
        if (error) {
          toast({
            title: t('auth.reset_failed', 'Failed to send reset email'),
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: t('auth.reset_email_sent', 'Password reset email sent!'),
            description: t('auth.check_inbox', 'Check your inbox for the reset link.'),
          });
          setMode('signin');
        }
      } else if (mode === 'reset') {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: t('auth.passwords_must_match', 'Passwords must match'),
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        const { error } = await supabase.auth.updateUser({
          password: formData.password,
        });
        
        if (error) {
          toast({
            title: t('auth.reset_failed', 'Password reset failed'),
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: t('auth.reset_success', 'Password updated successfully!'),
            description: t('auth.redirecting', 'Redirecting to dashboard...'),
          });
          setTimeout(() => navigate('/chat'), 1500);
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);
        
        if (error) {
          toast({
            title: t('auth.signin_failed', 'Sign in failed'),
            description: error,
            variant: "destructive",
          });
        } else {
          navigate('/chat');
        }
      }
    } catch (error) {
      toast({
        title: t('auth.error_occurred', 'An error occurred'),
        description: t('auth.try_again', 'Please try again later.'),
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-3">
            <img src={autoPenguinLogo} alt="AutoPenguin" className="h-10 w-10" />
            <h1 className="text-2xl font-bold">AutoPenguin</h1>
          </div>
        </div>

        {/* Back to home button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>
              {mode === 'signup' && t('auth.create_account_title', 'Create Your Account')}
              {mode === 'signin' && t('auth.welcome_back_title', 'Welcome Back')}
              {mode === 'forgot' && t('auth.forgot_password_title', 'Reset Password')}
              {mode === 'reset' && t('auth.set_new_password', 'Set New Password')}
            </CardTitle>
            <CardDescription>
              {mode === 'signup' && t('auth.signup_description', 'Start automating your workflows with AI agents')}
              {mode === 'signin' && t('auth.signin_description', 'Sign in to access your dashboard')}
              {mode === 'forgot' && t('auth.forgot_description', 'Enter your email to receive a password reset link')}
              {mode === 'reset' && t('auth.reset_description', 'Enter your new password below')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}
              
              {mode !== 'reset' && (
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email', 'Email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              )}
              
              {(mode === 'signin' || mode === 'signup') && (
                <div className="space-y-2">
                  <Label htmlFor="password">{t('password', 'Password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={mode === 'signup' ? t('auth.create_secure_password', 'Create a secure password') : t('auth.enter_password', 'Enter your password')}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  {mode === 'signup' && (
                    <p className="text-xs text-muted-foreground">
                      {t('auth.password_requirement', 'Password must be at least 6 characters long')}
                    </p>
                  )}
                </div>
              )}
              
              {mode === 'reset' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('auth.new_password', 'New Password')}</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder={t('auth.enter_new_password', 'Enter new password')}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('auth.confirm_password', 'Confirm Password')}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder={t('auth.confirm_new_password', 'Confirm new password')}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}
              
              {mode === 'signin' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-sm text-primary hover:underline"
                  >
                    {t('auth.forgot_password', 'Forgot password?')}
                  </button>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'signup' && t('create-account', 'Create Account')}
                {mode === 'signin' && t('sign-in', 'Sign In')}
                {mode === 'forgot' && t('auth.send_reset_link', 'Send Reset Link')}
                {mode === 'reset' && t('auth.update_password', 'Update Password')}
              </Button>
            </form>

            {/* OAuth Sign In Options */}
            {mode === 'signin' && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={isLoading}
                  className="w-full"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
              </>
            )}
            
            {/* Toggle between sign in and sign up */}
            {(mode === 'signin' || mode === 'signup') && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {mode === 'signup' ? t('already-have-account', 'Already have an account?') : t('dont-have-account', "Don't have an account?")}
                  {' '}
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
                    className="text-primary hover:underline font-medium"
                  >
                    {mode === 'signup' ? t('sign-in', 'Sign In') : t('sign-up', 'Sign Up')}
                  </button>
                </p>
              </div>
            )}
            
            {(mode === 'forgot' || mode === 'reset') && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-sm text-primary hover:underline"
                >
                  {t('auth.back_to_signin', 'Back to Sign In')}
                </button>
              </div>
            )}
            
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                © 2025 AutoPenguin. All rights reserved.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                For support or issues, reach out to{' '}
                <a href="mailto:info@autopenguin.app" className="text-primary hover:underline">
                  info@autopenguin.app
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
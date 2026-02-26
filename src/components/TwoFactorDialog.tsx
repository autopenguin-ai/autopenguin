import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { QrCode, Shield, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TwoFactorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEnabled: boolean;
  onSuccess: () => void;
}

export function TwoFactorDialog({ open, onOpenChange, isEnabled, onSuccess }: TwoFactorDialogProps) {
  const [step, setStep] = useState<'confirm' | 'setup' | 'verify' | 'disable-verify'>('confirm');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [factorId, setFactorId] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [disableVerificationCode, setDisableVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEnable2FA = async () => {
    setIsLoading(true);
    try {
      // Check for existing factors and clean up orphaned ones
      const { data: existingFactors } = await supabase.auth.mfa.listFactors();
      
      if (existingFactors?.totp && existingFactors.totp.length > 0) {
        toast({
          title: "Cleaning up",
          description: "Found existing 2FA setup. Removing...",
        });
        
        // Try to unenroll existing factors
        for (const factor of existingFactors.totp) {
          try {
            await supabase.auth.mfa.unenroll({ factorId: factor.id });
          } catch (e: any) {
            // If unenroll fails, factor might be verified and need AAL2
            throw new Error('Please disable your current 2FA properly before enabling again');
          }
        }
      }

      // Create new factor
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setStep('setup');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set up 2FA",
        variant: "destructive",
      });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!verificationCode) {
      toast({
        title: "Missing code",
        description: "Please enter the 6-digit code from your authenticator app",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verificationCode
      });

      if (error) throw error;

      // Update profile to reflect 2FA is enabled
      await supabase
        .from('profiles')
        .update({ two_factor_enabled: true })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been successfully enabled for your account.",
      });

      onSuccess();
      onOpenChange(false);
      resetState();
    } catch (error: any) {
      toast({
        title: "Invalid code",
        description: "The verification code is incorrect. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disableVerificationCode || disableVerificationCode.length !== 6) {
      toast({
        title: "Missing code",
        description: "Please enter your current 6-digit 2FA code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Get the factor to disable
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (!factors?.totp || factors.totp.length === 0) {
        throw new Error('No 2FA factors found');
      }
      
      const factorToDisable = factors.totp[0];
      
      // Step 2: Create challenge to reach AAL2
      const { data: challengeData, error: challengeError } = 
        await supabase.auth.mfa.challenge({ factorId: factorToDisable.id });
      
      if (challengeError) throw challengeError;
      
      // Step 3: Verify with user's code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factorToDisable.id,
        challengeId: challengeData.id,
        code: disableVerificationCode
      });
      
      if (verifyError) throw new Error('Invalid verification code. Please check your authenticator app.');
      
      // Step 4: NOW we can unenroll (we're at AAL2)
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: factorToDisable.id
      });
      
      if (unenrollError) throw unenrollError;
      
      // Step 5: ONLY update profile if unenroll succeeded
      await supabase
        .from('profiles')
        .update({ two_factor_enabled: false })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled.",
      });

      onSuccess();
      onOpenChange(false);
      resetState();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disable 2FA. Please check your code.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setStep('confirm');
    setQrCode('');
    setSecret('');
    setFactorId('');
    setVerificationCode('');
    setDisableVerificationCode('');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>
              {isEnabled ? 'Disable Two-Factor Authentication' : 'Enable Two-Factor Authentication'}
            </span>
          </DialogTitle>
          <DialogDescription>
            {step === 'confirm' && !isEnabled && 
              "Secure your account with two-factor authentication using an authenticator app."
            }
            {step === 'confirm' && isEnabled && 
              "This will remove two-factor authentication from your account."
            }
            {step === 'setup' && 
              "Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)"
            }
            {step === 'verify' && 
              "Enter the 6-digit code from your authenticator app to complete setup."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'confirm' && !isEnabled && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You'll need an authenticator app like Google Authenticator or Authy to scan the QR code.
                </AlertDescription>
              </Alert>
              <div className="flex space-x-2">
                <Button onClick={() => onOpenChange(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleEnable2FA} disabled={isLoading} className="flex-1">
                  {isLoading ? 'Setting up...' : 'Continue'}
                </Button>
              </div>
            </div>
          )}

          {step === 'confirm' && isEnabled && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Disabling 2FA will make your account less secure. Are you sure you want to continue?
                </AlertDescription>
              </Alert>
            <div className="flex space-x-2">
              <Button onClick={() => onOpenChange(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => setStep('disable-verify')} disabled={isLoading} variant="destructive" className="flex-1">
                Continue
              </Button>
            </div>
            </div>
          )}

          {step === 'setup' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg border">
                  <img src={qrCode} alt="QR Code for 2FA setup" className="w-48 h-48" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Can't scan? Enter this code manually:
                </p>
                <code className="text-xs bg-muted p-2 rounded font-mono break-all">
                  {secret}
                </code>
              </div>
              <Button onClick={() => setStep('verify')} className="w-full">
                I've Added the Account
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  className="text-center text-lg tracking-wider"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => setStep('setup')} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button onClick={handleVerifyAndEnable} disabled={isLoading || !verificationCode} className="flex-1">
                  {isLoading ? 'Verifying...' : 'Enable 2FA'}
                </Button>
              </div>
            </div>
          )}

          {step === 'disable-verify' && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Open your authenticator app and enter the current 6-digit code to confirm this action.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="disable-code">Current 2FA Code</Label>
                <Input
                  id="disable-code"
                  placeholder="Enter 6-digit code"
                  value={disableVerificationCode}
                  onChange={(e) => setDisableVerificationCode(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  autoFocus
                  className="text-center text-lg tracking-wider"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => setStep('confirm')} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleDisable2FA} 
                  disabled={isLoading || disableVerificationCode.length !== 6} 
                  variant="destructive" 
                  className="flex-1"
                >
                  {isLoading ? 'Verifying...' : 'Disable 2FA'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
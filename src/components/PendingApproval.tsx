import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function PendingApproval() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
            <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
          <CardDescription>
            Your account request has been submitted and is waiting for admin approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium">What happens next?</p>
              <ul className="mt-2 space-y-1 text-blue-700 dark:text-blue-300">
                <li>• A company admin will review your request</li>
                <li>• You'll receive an email when approved</li>
                <li>• Check your email regularly for updates</li>
              </ul>
            </div>
          </div>
          <Button 
            onClick={handleSignOut} 
            variant="outline" 
            className="w-full"
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
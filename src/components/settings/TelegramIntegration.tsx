import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Link, Unlink, Copy, CheckCircle } from "lucide-react";

export function TelegramIntegration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [botToken, setBotToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connection, setConnection] = useState<{
    id: string;
    is_verified: boolean;
    is_active: boolean;
    telegram_chat_id: number | null;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [botName, setBotName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    const { data, error } = await supabase.functions.invoke("manage-telegram", {
      body: { action: "status" },
    });
    if (data?.connection) {
      setConnection(data.connection);
    }
  };

  const handleConnect = async () => {
    if (!botToken.trim()) {
      toast({ title: "Bot token required", variant: "destructive" });
      return;
    }
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-telegram", {
        body: { action: "connect", bot_token: botToken },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setVerificationCode(data.verification_code);
      setBotName(data.bot_username);
      setBotToken("");
      toast({ title: `Connected to @${data.bot_username}!` });
      fetchStatus();
    } catch (err: any) {
      toast({ title: "Connection failed", description: err.message, variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-telegram", {
        body: { action: "disconnect" },
      });
      if (error) throw error;
      setConnection(null);
      setVerificationCode(null);
      setBotName(null);
      toast({ title: "Telegram disconnected" });
    } catch (err: any) {
      toast({ title: "Disconnect failed", description: err.message, variant: "destructive" });
    } finally {
      setDisconnecting(false);
    }
  };

  const copyCode = () => {
    if (verificationCode) {
      navigator.clipboard.writeText(verificationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <CardTitle className="text-lg">Telegram</CardTitle>
          {connection?.is_verified && (
            <Badge variant="default" className="ml-auto">Connected</Badge>
          )}
          {connection && !connection.is_verified && (
            <Badge variant="secondary" className="ml-auto">Pending Verification</Badge>
          )}
        </div>
        <CardDescription>
          Connect a Telegram bot to chat with Steve AI from your phone
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connection?.is_verified ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span>Steve AI is available on Telegram</span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              <Unlink className="h-4 w-4 mr-2" />
              {disconnecting ? "Disconnecting..." : "Disconnect Telegram"}
            </Button>
          </div>
        ) : verificationCode ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Open Telegram and send this code to your bot
              {botName ? ` (@${botName})` : ""}:
            </p>
            <div className="flex items-center gap-2">
              <code className="px-3 py-2 bg-muted rounded-md text-lg font-mono font-bold tracking-wider">
                {verificationCode}
              </code>
              <Button variant="ghost" size="sm" onClick={copyCode}>
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Once verified, you can message Steve directly on Telegram.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              1. Open Telegram and message @BotFather<br />
              2. Send /newbot and follow the steps<br />
              3. Copy the bot token and paste it below
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Paste your bot token here"
                type="password"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
              />
              <Button onClick={handleConnect} disabled={connecting}>
                <Link className="h-4 w-4 mr-2" />
                {connecting ? "Connecting..." : "Connect"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

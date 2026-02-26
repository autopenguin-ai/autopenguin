import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { Brain, Link, Unlink, Zap, Loader2, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PROVIDERS = [
  { value: 'openrouter', label: 'OpenRouter', description: 'One key, all models (Recommended)' },
  { value: 'anthropic', label: 'Anthropic', description: 'Claude models direct' },
  { value: 'openai', label: 'OpenAI', description: 'GPT models direct' },
  { value: 'google', label: 'Google', description: 'Gemini models' },
  { value: 'ollama', label: 'Ollama', description: 'Local models (requires public URL)' },
  { value: 'lmstudio', label: 'LM Studio', description: 'Local models (requires public URL)' },
];

const STATIC_MODEL_OPTIONS: Record<string, { value: string; label: string }[]> = {
  anthropic: [
    { value: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5' },
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  ],
  openai: [
    { value: 'gpt-4.1', label: 'GPT-4.1' },
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  ],
  google: [
    { value: 'gemini-2.5-flash-preview', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  ],
};

interface OpenRouterModel {
  id: string;
  name: string;
}

const CLOUD_PROVIDERS = ['openrouter', 'anthropic', 'openai', 'google'];
const LOCAL_PROVIDERS = ['ollama', 'lmstudio'];

interface LLMConnectionState {
  provider: string;
  model: string;
  connected_at: string;
}

export function LLMConnection() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [connection, setConnection] = useState<LLMConnectionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testing, setTesting] = useState(false);

  // Form state
  const [provider, setProvider] = useState("openrouter");
  const [model, setModel] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  // OpenRouter dynamic models
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelSearchOpen, setModelSearchOpen] = useState(false);

  const isLocal = LOCAL_PROVIDERS.includes(provider);
  const isCloud = CLOUD_PROVIDERS.includes(provider);

  useEffect(() => {
    fetchStatus();
  }, []);

  // Fetch OpenRouter models when provider is openrouter
  useEffect(() => {
    if (provider === 'openrouter' && openRouterModels.length === 0) {
      fetchOpenRouterModels();
    }
  }, [provider]);

  // Reset model when provider changes
  useEffect(() => {
    setModel("");
    setCustomModel("");
    setApiKey("");
    setBaseUrl("");
  }, [provider]);

  const fetchOpenRouterModels = async () => {
    setLoadingModels(true);
    try {
      const res = await fetch('https://openrouter.ai/api/v1/models');
      if (res.ok) {
        const data = await res.json();
        const models: OpenRouterModel[] = (data.data || [])
          .filter((m: any) => m.id && m.name)
          .map((m: any) => ({ id: m.id, name: m.name }))
          .sort((a: OpenRouterModel, b: OpenRouterModel) => a.name.localeCompare(b.name));
        setOpenRouterModels(models);
      }
    } catch (err) {
      console.error('Failed to fetch OpenRouter models:', err);
    } finally {
      setLoadingModels(false);
    }
  };

  const selectedModelLabel = useMemo(() => {
    if (!model) return null;
    if (provider === 'openrouter') {
      return openRouterModels.find(m => m.id === model)?.name || model;
    }
    return STATIC_MODEL_OPTIONS[provider]?.find(m => m.value === model)?.label || model;
  }, [model, provider, openRouterModels]);

  const fetchStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-llm", {
        body: { action: "status" },
      });
      if (error) throw error;
      if (data?.connection) {
        setConnection(data.connection);
      } else {
        setConnection(null);
      }
    } catch (err: any) {
      console.error("Failed to fetch LLM status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    const selectedModel = isLocal ? customModel : model;
    if (!selectedModel.trim()) {
      toast({ title: "Model is required", variant: "destructive" });
      return;
    }
    if (isCloud && !apiKey.trim()) {
      toast({ title: "API key is required", variant: "destructive" });
      return;
    }
    if (isLocal && !baseUrl.trim()) {
      toast({ title: "Base URL is required", variant: "destructive" });
      return;
    }

    setConnecting(true);
    try {
      const body: Record<string, string> = {
        action: "connect",
        provider,
        model: selectedModel,
      };
      if (isCloud) body.api_key = apiKey;
      if (isLocal) body.base_url = baseUrl;

      const { data, error } = await supabase.functions.invoke("manage-llm", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setConnection({ provider, model: selectedModel, connected_at: new Date().toISOString() });
      setApiKey("");
      setBaseUrl("");
      toast({ title: "AI provider connected!" });
    } catch (err: any) {
      toast({ title: "Connection failed", description: err.message, variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-llm", {
        body: { action: "test" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Connection test passed", description: data?.message || "Your AI provider is working correctly." });
    } catch (err: any) {
      toast({ title: "Connection test failed", description: err.message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-llm", {
        body: { action: "disconnect" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setConnection(null);
      toast({ title: "AI provider disconnected" });
    } catch (err: any) {
      toast({ title: "Disconnect failed", description: err.message, variant: "destructive" });
    } finally {
      setDisconnecting(false);
    }
  };

  const getProviderLabel = (value: string) => {
    return PROVIDERS.find(p => p.value === value)?.label || value;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <CardTitle className="text-lg">AI Connection</CardTitle>
          </div>
          <CardDescription>Connect your AI provider to power your assistant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking connection status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          <CardTitle className="text-lg">AI Connection</CardTitle>
          {connection && <Badge variant="default" className="ml-auto">Connected</Badge>}
        </div>
        <CardDescription>
          Connect your AI provider to power your assistant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connection ? (
          // Connected state
          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Provider</span>
                <span className="text-sm font-medium">{getProviderLabel(connection.provider)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Model</span>
                <span className="text-sm font-medium font-mono">{connection.model}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={testing}
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                <Unlink className="h-4 w-4 mr-2" />
                {disconnecting ? "Disconnecting..." : "Disconnect"}
              </Button>
            </div>
          </div>
        ) : (
          // Not connected state - show form
          <div className="space-y-4">
            {/* Provider selector */}
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <div className="flex flex-col">
                        <span>{p.label}</span>
                        <span className="text-xs text-muted-foreground">{p.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* API Key (cloud providers) */}
            {isCloud && (
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  placeholder={`Enter your ${getProviderLabel(provider)} API key`}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
            )}

            {/* Base URL (local providers) */}
            {isLocal && (
              <div className="space-y-2">
                <Label>Base URL</Label>
                <Input
                  type="url"
                  placeholder={provider === 'ollama' ? 'http://your-server:11434' : 'http://your-server:1234'}
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Must be publicly accessible (not localhost) for cloud functions to reach it
                </p>
              </div>
            )}

            {/* Model selector */}
            <div className="space-y-2">
              <Label>Model</Label>
              {isLocal ? (
                <Input
                  placeholder="e.g. llama3, mistral, codellama"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                />
              ) : provider === 'openrouter' ? (
                // Searchable combobox for OpenRouter (hundreds of models)
                <Popover open={modelSearchOpen} onOpenChange={setModelSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={modelSearchOpen}
                      className="w-full justify-between font-normal"
                    >
                      {loadingModels ? (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading models...
                        </span>
                      ) : model ? (
                        <span className="truncate">{selectedModelLabel}</span>
                      ) : (
                        <span className="text-muted-foreground">Search models...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search models..." />
                      <CommandList>
                        <CommandEmpty>No models found.</CommandEmpty>
                        <CommandGroup>
                          {openRouterModels.map((m) => (
                            <CommandItem
                              key={m.id}
                              value={`${m.name} ${m.id}`}
                              onSelect={() => {
                                setModel(m.id);
                                setModelSearchOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", model === m.id ? "opacity-100" : "opacity-0")} />
                              <div className="flex flex-col min-w-0">
                                <span className="truncate">{m.name}</span>
                                <span className="text-xs text-muted-foreground truncate">{m.id}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                // Static select for other cloud providers
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {(STATIC_MODEL_OPTIONS[provider] || []).map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Connect button */}
            <Button onClick={handleConnect} disabled={connecting} className="w-full">
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link className="h-4 w-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Trash2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUserCompany } from "@/hooks/useCompany";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const INTEGRATION_TYPES = [
  { value: "n8n", label: "N8N", apiUrlPlaceholder: "https://yourinstance.app.n8n.cloud", disabled: false },
  { value: "make", label: "Make", apiUrlPlaceholder: "https://hook.make.com/...", disabled: true },
  { value: "zapier", label: "Zapier", apiUrlPlaceholder: "https://hooks.zapier.com/...", disabled: true },
] as const;

interface Integration {
  id: string;
  integration_type: string;
  api_url: string;
  is_active: boolean;
  last_verified_at: string | null;
  created_at: string;
}

export function IntegrationManager() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { data: company } = useUserCompany();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    integrationType: "",
    apiUrl: "",
    apiKey: "",
  });

  // Fetch integrations
  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ["integrations", company?.id],
    queryFn: async () => {
      if (!company?.id) return [];
      const { data, error } = await supabase.functions.invoke("manage-integration", {
        body: { action: "list", company_id: company.id },
      });
      if (error) throw error;
      return data.integrations || [];
    },
    enabled: !!company?.id,
  });

  // Create integration mutation
  const createMutation = useMutation({
    mutationFn: async (data: { integrationType: string; apiUrl: string; apiKey: string }) => {
      const { data: result, error } = await supabase.functions.invoke("manage-integration", {
        body: {
          action: "create",
          company_id: company?.id,
          integration_type: data.integrationType,
          api_url: data.apiUrl,
          api_key: data.apiKey,
        },
      });
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast({ 
        title: t("integrations.addedSuccess", "Integration added successfully"), 
        description: t("integrations.testToActivate", "Click 'Test' to verify and activate the connection.") 
      });
      setDialogOpen(false);
      setFormData({ integrationType: "", apiUrl: "", apiKey: "" });
    },
    onError: (error: any) => {
      const message = error.message || "Failed to add integration";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  // Test integration mutation
  const testMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const { data, error } = await supabase.functions.invoke("manage-integration", {
        body: {
          action: "test",
          company_id: company?.id,
          integration_id: integrationId,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Connection successful", description: "Integration is working correctly." });
        queryClient.invalidateQueries({ queryKey: ["integrations"] });
      } else {
        toast({ title: "Connection failed", description: data.error || "Unable to verify connection", variant: "destructive" });
      }
    },
    onError: (error: any) => {
      const message = error.message || "Failed to test connection";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  // Delete integration mutation
  const deleteMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await supabase.functions.invoke("manage-integration", {
        body: {
          action: "delete",
          company_id: company?.id,
          integration_id: integrationId,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast({ title: "Integration removed", description: "The integration and its API key have been deleted." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete integration", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.integrationType || !formData.apiUrl || !formData.apiKey) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const selectedType = INTEGRATION_TYPES.find((t) => t.value === formData.integrationType);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Integration Management</h2>
          <p className="text-muted-foreground">Configure your automation tools. All API keys are encrypted and stored securely.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add New Integration</DialogTitle>
                <DialogDescription>
                  Configure a new third-party service integration. Your API key will be encrypted and stored securely.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Service Type</Label>
                  <Select value={formData.integrationType} onValueChange={(value) => setFormData({ ...formData, integrationType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {INTEGRATION_TYPES.map((type) => (
                        <SelectItem 
                          key={type.value} 
                          value={type.value}
                          disabled={type.disabled}
                          className={type.disabled ? "opacity-50" : ""}
                        >
                          {type.label}{type.disabled && <span className="text-xs text-muted-foreground ml-2">(Coming Soon)</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="apiUrl">API URL</Label>
                  <Input
                    id="apiUrl"
                    placeholder={selectedType?.apiUrlPlaceholder || "https://api.example.com"}
                    value={formData.apiUrl}
                    onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                  />
                  {formData.integrationType === 'n8n' && (
                    <div className="text-xs space-y-3 mt-2">
                      {/* URL guidance */}
                      <div className="text-muted-foreground">
                        <p className="font-medium mb-1">{t("integrations.n8nUrlTitle", "📍 Your n8n URL:")}</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>n8n Cloud: <code className="bg-muted px-1 rounded">https://yourinstance.app.n8n.cloud</code></li>
                          <li>{t("integrations.n8nSelfHosted", "Self-hosted/Community")}: <code className="bg-muted px-1 rounded">https://n8n.yourdomain.com</code></li>
                        </ul>
                        <p className="mt-2 text-muted-foreground/80">{t("integrations.n8nUrlHint", "Your URL is in your browser address bar when logged into n8n. Do NOT add /api/v1 at the end.")}</p>
                      </div>
                      
                      {/* API Key guidance */}
                      <div className="text-muted-foreground">
                        <p className="font-medium mb-1">{t("integrations.n8nApiKeyTitle", "🔑 Find your API Key:")}</p>
                        <p>{t("integrations.n8nApiKeyHint", "In n8n: Settings → n8n API → Create API Key")}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-..."
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Your API key will be encrypted and stored securely.</p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Integration
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {integrations.length === 0 ? (
          <Card className="col-span-2">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="text-muted-foreground mb-4">No integrations configured yet.</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Integration
              </Button>
            </CardContent>
          </Card>
        ) : (
          integrations.map((integration: Integration) => {
            const type = INTEGRATION_TYPES.find((t) => t.value === integration.integration_type);
            return (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{type?.label || integration.integration_type}</CardTitle>
                      <CardDescription className="mt-1">{integration.api_url}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {integration.is_active ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      {integration.last_verified_at ? (
                        <span className="text-muted-foreground">
                          {t("integrations.lastVerified", "Last verified")}: {new Date(integration.last_verified_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-500 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {t("integrations.clickTestToActivate", "Click 'Test' to activate")}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testMutation.mutate(integration.id)}
                        disabled={testMutation.isPending}
                      >
                        {testMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(integration.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserCompany } from "./useCompany";

export function useHasN8nIntegration() {
  const { data: company } = useUserCompany();

  return useQuery({
    queryKey: ["has-n8n-integration", company?.id],
    queryFn: async () => {
      if (!company?.id) return false;

      const { data, error } = await supabase
        .from("company_integrations")
        .select("id")
        .eq("company_id", company.id)
        .eq("integration_type", "n8n")
        .eq("is_active", true)
        .not("last_verified_at", "is", null)
        .maybeSingle();

      if (error) {
        console.error("Error checking n8n integration:", error);
        return false;
      }

      return !!data;
    },
    enabled: !!company?.id,
    staleTime: 30000, // 30 seconds
  });
}

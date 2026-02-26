import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { getAppUrl, getEmailFrom } from '../_shared/env.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function generateInvitationCode(length: number = 8): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const maxValid = Math.floor(256 / chars.length) * chars.length;
  let code = "";
  while (code.length < length) {
    const randomBytes = crypto.getRandomValues(new Uint8Array(1));
    if (randomBytes[0] < maxValid) {
      code += chars[randomBytes[0] % chars.length];
    }
  }
  return code;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization")!;

    // User-scoped client for auth
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (
      !roleData ||
      (roleData.role !== "ADMIN" && roleData.role !== "SUPER_ADMIN")
    ) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get company_id from profiles
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("user_id", user.id)
      .single();
    const companyId = profile?.company_id;

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: "No company associated with user" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get company name for emails
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("display_name")
      .eq("id", companyId)
      .single();
    const companyName = company?.display_name || "your team";

    const { action, email, role, invitation_id } = await req.json();

    switch (action) {
      case "invite": {
        if (!email || typeof email !== "string" || !email.includes("@")) {
          return new Response(
            JSON.stringify({ error: "Valid email is required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        if (!role || typeof role !== "string") {
          return new Response(
            JSON.stringify({ error: "Role is required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        // Check for existing pending invitation for same email + company
        const { data: existingInvite } = await supabaseAdmin
          .from("invitations")
          .select("id")
          .eq("company_id", companyId)
          .eq("email", email.toLowerCase())
          .eq("status", "pending")
          .maybeSingle();

        if (existingInvite) {
          return new Response(
            JSON.stringify({
              error: "A pending invitation already exists for this email",
            }),
            {
              status: 409,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        // Check if user is already a member of the company
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("company_id", companyId)
          .eq("email", email.toLowerCase())
          .maybeSingle();

        if (existingProfile) {
          return new Response(
            JSON.stringify({
              error: "This user is already a member of the company",
            }),
            {
              status: 409,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        const invitationCode = generateInvitationCode();
        const expiresAt = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString();

        const { data: invitation, error: insertError } = await supabaseAdmin
          .from("invitations")
          .insert({
            company_id: companyId,
            email: email.toLowerCase(),
            role,
            invitation_code: invitationCode,
            invited_by: user.id,
            created_by: user.id,
            status: "pending",
            expires_at: expiresAt,
          })
          .select("id")
          .single();

        if (insertError) {
          console.error("manage-invitations insert error:", insertError);
          return new Response(
            JSON.stringify({ error: "Failed to create invitation" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        // Send invite email via Resend
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (resendApiKey) {
          try {
            const resend = new Resend(resendApiKey);
            const inviteUrl = `${getAppUrl()}/auth?invite=${invitationCode}`;

            await resend.emails.send({
              from: getEmailFrom('team'),
              to: [email.toLowerCase()],
              subject: `You're invited to join ${companyName} on AutoPenguin`,
              html: `
<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <p>Hi,</p>
  <p>You've been invited to join <strong>${companyName}</strong> on AutoPenguin as a <strong>${role}</strong>.</p>
  <p><a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px;">Accept Invitation</a></p>
  <p style="color: #6b7280; font-size: 14px;">This invitation expires in 7 days.</p>
  <p style="color: #9ca3af; font-size: 12px;">If the button doesn't work, copy this link: ${inviteUrl}</p>
</div>`.trim(),
            });
          } catch (emailError) {
            // Log but don't fail the invitation - it was created successfully
            console.error("manage-invitations email error:", emailError);
          }
        } else {
          console.warn(
            "RESEND_API_KEY not set - invitation created but email not sent",
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            invitation_id: invitation.id,
            invitation_code: invitationCode,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      case "list": {
        const { data: invitations, error: listError } = await supabaseAdmin
          .from("invitations")
          .select("id, email, role, status, created_at, expires_at")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false });

        if (listError) {
          console.error("manage-invitations list error:", listError);
          return new Response(
            JSON.stringify({ error: "Failed to list invitations" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        return new Response(JSON.stringify({ invitations: invitations || [] }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "cancel": {
        if (!invitation_id) {
          return new Response(
            JSON.stringify({ error: "invitation_id is required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        // Verify invitation belongs to same company and is still pending
        const { data: invite, error: fetchError } = await supabaseAdmin
          .from("invitations")
          .select("id, status, company_id")
          .eq("id", invitation_id)
          .single();

        if (fetchError || !invite) {
          return new Response(
            JSON.stringify({ error: "Invitation not found" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        if (invite.company_id !== companyId) {
          return new Response(
            JSON.stringify({ error: "Invitation does not belong to your company" }),
            {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        if (invite.status !== "pending") {
          return new Response(
            JSON.stringify({
              error: `Cannot cancel invitation with status: ${invite.status}`,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        const { error: updateError } = await supabaseAdmin
          .from("invitations")
          .update({ status: "cancelled" })
          .eq("id", invitation_id);

        if (updateError) {
          console.error("manage-invitations cancel error:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to cancel invitation" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("manage-invitations error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

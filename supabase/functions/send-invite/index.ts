import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendInviteRequest {
  inviteId: string;
  email: string;
  familyName: string;
  role: string;
  token: string;
  inviterName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inviteId, email, familyName, role, token, inviterName }: SendInviteRequest = await req.json();

    const inviteUrl = `${new URL(req.url).origin.replace('functions', 'lovableproject.com')}/invite/${token}`;
    
    const roleDescriptions = {
      admin: 'full family management permissions',
      contributor: 'can create and share stories',
      member: 'can create and share stories', // legacy role
      viewer: 'can view and comment on content',
      guest: 'can view and comment on content' // legacy role
    };

    const emailResponse = await resend.emails.send({
      from: "LifeScribe <onboarding@resend.dev>",
      to: [email],
      subject: `You're invited to join ${familyName} on LifeScribe`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">You're Invited!</h1>
          
          <p>Hi there!</p>
          
          <p><strong>${inviterName}</strong> has invited you to join <strong>${familyName}</strong> on LifeScribe with ${roleDescriptions[role as keyof typeof roleDescriptions] || 'family member'} access.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Join ${familyName}
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This invitation expires in 7 days. If you have any questions, reach out to your family member who sent this invite.
          </p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            LifeScribe - Preserve and share your family memories
          </p>
        </div>
      `,
    });

    console.log("Invite email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.data?.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending invite email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
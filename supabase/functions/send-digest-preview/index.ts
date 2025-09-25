import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DigestPreviewRequest {
  email: string;
  family_name?: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

function generateSampleDigestHTML(familyName: string = "Your Family") {
  const today = new Date();
  const weekStart = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${familyName} Weekly Digest</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f8f9fa;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 8px; 
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
          }
          .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 300; 
          }
          .header p { 
            margin: 10px 0 0 0; 
            opacity: 0.9; 
            font-size: 16px; 
          }
          .content { 
            padding: 30px; 
          }
          .section { 
            margin-bottom: 40px; 
          }
          .section h2 { 
            color: #667eea; 
            font-size: 20px; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #f1f3f4; 
            padding-bottom: 10px; 
          }
          .story-card { 
            background: #f8f9fa; 
            border-radius: 8px; 
            padding: 20px; 
            margin-bottom: 15px; 
            border-left: 4px solid #667eea; 
          }
          .story-title { 
            font-weight: 600; 
            margin-bottom: 8px; 
            color: #333; 
          }
          .story-author { 
            color: #666; 
            font-size: 14px; 
            margin-bottom: 10px; 
          }
          .story-excerpt { 
            color: #555; 
            line-height: 1.5; 
          }
          .photo-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
            gap: 15px; 
            margin-top: 15px; 
          }
          .photo-item { 
            background: #f1f3f4; 
            border-radius: 6px; 
            height: 120px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: #666; 
            font-size: 12px; 
          }
          .stats { 
            background: #f8f9fa; 
            border-radius: 8px; 
            padding: 20px; 
            margin: 30px 0; 
          }
          .stats h3 { 
            margin-top: 0; 
            color: #333; 
          }
          .stat-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); 
            gap: 15px; 
            margin-top: 15px; 
          }
          .stat-item { 
            text-align: center; 
            padding: 15px; 
            background: white; 
            border-radius: 6px; 
          }
          .stat-number { 
            font-size: 24px; 
            font-weight: bold; 
            color: #667eea; 
          }
          .stat-label { 
            font-size: 12px; 
            color: #666; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
          }
          .birthday-card { 
            background: linear-gradient(135deg, #ffeaa7, #fab1a0); 
            border-radius: 8px; 
            padding: 20px; 
            margin-bottom: 15px; 
            color: #333; 
          }
          .cta { 
            text-align: center; 
            margin: 40px 0; 
          }
          .cta-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #667eea, #764ba2); 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 600; 
          }
          .footer { 
            background: #f8f9fa; 
            padding: 30px; 
            text-align: center; 
            color: #666; 
            font-size: 14px; 
            border-top: 1px solid #e9ecef; 
          }
          .footer a { 
            color: #667eea; 
            text-decoration: none; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>${familyName} Weekly Digest</h1>
            <p>Your family's week in review • ${weekStart.toLocaleDateString()} - ${today.toLocaleDateString()}</p>
          </div>

          <!-- Main Content -->
          <div class="content">
            
            <!-- Weekly Stats -->
            <div class="stats">
              <h3>📊 This Week's Activity</h3>
              <div class="stat-grid">
                <div class="stat-item">
                  <div class="stat-number">7</div>
                  <div class="stat-label">New Stories</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">23</div>
                  <div class="stat-label">Photos Shared</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">15</div>
                  <div class="stat-label">Comments</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">42</div>
                  <div class="stat-label">Reactions</div>
                </div>
              </div>
            </div>

            <!-- New Stories Section -->
            <div class="section">
              <h2>📖 New Stories This Week</h2>
              
              <div class="story-card">
                <div class="story-title">Grandma's Famous Apple Pie Recipe</div>
                <div class="story-author">Shared by Mom • 3 days ago</div>
                <div class="story-excerpt">
                  After years of asking, Grandma finally shared her secret apple pie recipe! The key ingredient? A pinch of cinnamon and lots of love. This recipe has been in our family for three generations...
                </div>
              </div>

              <div class="story-card">
                <div class="story-title">Little Emma's First Steps!</div>
                <div class="story-author">Shared by Dad • 2 days ago</div>
                <div class="story-excerpt">
                  Emma took her very first steps today! She walked from the couch to the coffee table with the biggest smile on her face. We were all cheering and she looked so proud of herself...
                </div>
              </div>

              <div class="story-card">
                <div class="story-title">Weekend Camping Adventure</div>
                <div class="story-author">Shared by Uncle Joe • 1 day ago</div>
                <div class="story-excerpt">
                  What an incredible weekend at Pine Lake! The kids caught their first fish, we told ghost stories around the campfire, and nobody wanted to come home. Already planning our next trip...
                </div>
              </div>
            </div>

            <!-- Photos Section -->
            <div class="section">
              <h2>📷 Photo Highlights</h2>
              <p>Your family shared 23 beautiful moments this week:</p>
              <div class="photo-grid">
                <div class="photo-item">🍎 Apple Pie Making</div>
                <div class="photo-item">👶 Emma's First Steps</div>
                <div class="photo-item">🏕️ Camping Fun</div>
                <div class="photo-item">🐟 First Catch</div>
                <div class="photo-item">🔥 Campfire Stories</div>
                <div class="photo-item">🌅 Lake Sunrise</div>
              </div>
            </div>

            <!-- Upcoming Birthdays -->
            <div class="section">
              <h2>🎂 Upcoming Celebrations</h2>
              
              <div class="birthday-card">
                <strong>🎉 Sarah's Birthday</strong> is coming up on September 28th!<br>
                She's turning 8 - maybe we should plan something special? 
              </div>

              <div class="birthday-card">
                <strong>💑 Mom & Dad's Anniversary</strong> is on October 3rd!<br>
                25 beautiful years together - time for a celebration!
              </div>
            </div>

            <!-- Call to Action -->
            <div class="cta">
              <a href="https://lifescribe.lovable.app/dashboard" class="cta-button">View All Stories & Photos</a>
            </div>

            <!-- Family Activity Prompt -->
            <div class="section">
              <h2>💭 This Week's Memory Prompt</h2>
              <div class="story-card">
                <div class="story-title">"What was your favorite family tradition growing up?"</div>
                <div class="story-excerpt">
                  Share a story about a special family tradition from your childhood. What made it special? Do you still continue it today?
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>💝 Sent with love from your LifeScribe family app</p>
            <p>
              <a href="https://lifescribe.lovable.app/settings/notifications">Update preferences</a> • 
              <a href="https://lifescribe.lovable.app/unsubscribe">Unsubscribe</a> • 
              <a href="https://lifescribe.lovable.app/digest/preview">View online</a>
            </p>
            <p style="margin-top: 20px; font-size: 12px; color: #999;">
              This digest was automatically generated based on your family's activity.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, family_name }: DigestPreviewRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Generate sample digest HTML
    const digestHTML = generateSampleDigestHTML(family_name);

    // Send preview email
    const emailResponse = await resend.emails.send({
      from: "LifeScribe Weekly Digest <onboarding@resend.dev>", // Use verified domain
      to: [email],
      subject: `📨 ${family_name || "Your Family"} Weekly Digest Preview`,
      html: digestHTML,
    });

    console.log("Resend API response:", emailResponse);

    // Check if there was an error in the Resend response
    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: emailResponse.error.message || "Failed to send email",
          details: emailResponse.error
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Digest preview sent successfully!",
        email_id: emailResponse.data?.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-digest-preview function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send digest preview",
        details: error.toString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
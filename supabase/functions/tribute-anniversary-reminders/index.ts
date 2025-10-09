import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { Resend } from 'npm:resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Tribute {
  id: string
  title: string
  anniversary_date: string
  family_id: string
}

interface FamilyMember {
  profile_id: string
  profiles: {
    full_name: string
    email: string
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get today's date
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    console.log(`Checking for tribute anniversaries on ${todayStr}`)

    // Find tributes with anniversaries today
    const { data: tributes, error: tributesError } = await supabase
      .from('tributes')
      .select('id, title, anniversary_date, family_id')
      .not('anniversary_date', 'is', null)
      .like('anniversary_date', `%${todayStr.substring(5)}`) // Match month-day only
    
    if (tributesError) throw tributesError
    
    if (!tributes || tributes.length === 0) {
      console.log('No tribute anniversaries today')
      return new Response(
        JSON.stringify({ message: 'No anniversaries today', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${tributes.length} tribute anniversary(ies)`)

    let emailsSent = 0

    // For each tribute, send reminders to family members
    for (const tribute of tributes as Tribute[]) {
      // Get family members
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('profile_id, profiles(full_name, email)')
        .eq('family_id', tribute.family_id)
      
      if (membersError) {
        console.error(`Error fetching members for tribute ${tribute.id}:`, membersError)
        continue
      }

      if (!members || members.length === 0) continue

      // Send email to each family member
      for (const member of members as FamilyMember[]) {
        if (!member.profiles?.email) continue

        try {
          const { error: emailError } = await resend.emails.send({
            from: 'Family Tributes <memories@resend.dev>',
            to: [member.profiles.email],
            subject: `On This Day - ${tribute.title}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #4B5563; margin-bottom: 16px;">On This Day</h1>
                <p style="font-size: 16px; color: #6B7280; margin-bottom: 24px;">
                  Today marks a special day of remembrance for <strong>${tribute.title}</strong>.
                </p>
                <div style="background: linear-gradient(to bottom right, #EFF6FF, #DBEAFE); padding: 24px; border-radius: 8px; margin-bottom: 24px;">
                  <h2 style="color: #1E40AF; margin-bottom: 12px;">${tribute.title}</h2>
                  <p style="color: #1E3A8A;">
                    Take a moment today to remember, reflect, and share your memories.
                  </p>
                </div>
                <a href="https://yourdomain.com/tribute/${tribute.id}" 
                   style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-bottom: 24px;">
                  Visit Tribute Page
                </a>
                <p style="font-size: 14px; color: #9CA3AF; margin-top: 32px;">
                  With love,<br>
                  Your Family
                </p>
              </div>
            `,
          })

          if (emailError) {
            console.error(`Error sending email to ${member.profiles.email}:`, emailError)
          } else {
            emailsSent++
            
            // Log the reminder
            await supabase
              .from('tribute_anniversary_reminders')
              .insert({
                tribute_id: tribute.id,
                recipient_id: member.profile_id,
                reminder_date: todayStr,
                sent_at: new Date().toISOString()
              })
          }
        } catch (error) {
          console.error(`Failed to send email to ${member.profiles.email}:`, error)
        }
      }
    }

    console.log(`Successfully sent ${emailsSent} anniversary reminders`)

    return new Response(
      JSON.stringify({ 
        message: 'Anniversary reminders processed',
        tributesFound: tributes.length,
        emailsSent 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('Error processing tribute anniversaries:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

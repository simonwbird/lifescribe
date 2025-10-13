# Elder Mode & Telephony Integration Setup

## Overview
Elder Mode provides a voice-first experience optimized for seniors with:
- Extra-large UI with three main buttons
- Call-in capability for leaving voice messages
- WhatsApp integration (optional)
- Auto-transcription of voice messages into drafts

## Features
- ✅ Elder Mode UI with XL buttons
- ✅ Unique 6-digit code per elder
- ✅ Voice message transcription (OpenAI Whisper)
- ✅ Auto-draft creation from voice messages
- ✅ Settings page to enable/disable Elder Mode
- ✅ Persistent Elder Mode across sessions

## Setup Instructions

### 1. Enable OpenAI API (Required)
The system uses OpenAI Whisper for voice transcription.

1. Get an OpenAI API key from https://platform.openai.com/api-keys
2. Add the key to Supabase secrets:
   - Go to: https://supabase.com/dashboard/project/imgtnixyralpdrmedwzi/settings/functions
   - Add secret: `OPENAI_API_KEY` with your API key

### 2. Enable Twilio for Phone Integration (Optional)
To enable call-in functionality:

1. **Create Twilio Account**
   - Sign up at https://www.twilio.com
   - Get your Account SID and Auth Token

2. **Buy a Phone Number**
   - Purchase a phone number from Twilio console
   - Choose one that supports voice and SMS

3. **Add Twilio Credentials to Supabase**
   Go to: https://supabase.com/dashboard/project/imgtnixyralpdrmedwzi/settings/functions
   
   Add these secrets:
   - `TWILIO_ACCOUNT_SID`: Your Twilio Account SID
   - `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token

4. **Configure Webhooks**
   In Twilio console, configure your phone number webhooks:
   
   **Voice Webhook (Incoming Calls):**
   ```
   https://imgtnixyralpdrmedwzi.supabase.co/functions/v1/inbound-voice
   ```
   Method: POST
   
   **Recording Callback:**
   ```
   https://imgtnixyralpdrmedwzi.supabase.co/functions/v1/inbound-voice
   ```
   Method: POST

5. **Set Up Call Flow**
   The Twilio call flow will:
   - Ask caller to enter their 6-digit code
   - Record their message
   - Send recording to edge function
   - Transcribe and create draft

### 3. Enable WhatsApp (Optional)
To enable WhatsApp messages:

1. **Apply for WhatsApp Business API**
   - Through Twilio: https://www.twilio.com/whatsapp
   - Or direct with Facebook/Meta

2. **Configure WhatsApp Webhooks**
   Similar to phone webhooks, point to:
   ```
   https://imgtnixyralpdrmedwzi.supabase.co/functions/v1/inbound-voice
   ```

3. **Update Edge Function**
   The edge function already handles WhatsApp by checking the `source` field

## How It Works

### User Flow
1. Elder enables "Elder Mode" in Profile Settings
2. System assigns unique 6-digit code (e.g., "123456")
3. Elder calls designated number: (555) 123-4567
4. System prompts: "Enter your code"
5. Elder enters code using phone keypad
6. System says: "Leave your message after the beep"
7. Elder leaves message (up to 5 minutes)
8. System transcribes and creates draft within 60 seconds

### Technical Flow
```
Call/WhatsApp → Twilio → inbound-voice function
                          ↓
                    Lookup user by code
                          ↓
                    Download audio from Twilio
                          ↓
                    Create inbound_voice_messages record
                          ↓
                    Trigger transcribe-voice-message function
                          ↓
                    OpenAI Whisper transcription
                          ↓
                    Create draft story
                          ↓
                    Update message with transcript & draft_id
```

## Database Schema

### profiles table
- `elder_mode`: boolean - Whether Elder Mode is enabled
- `elder_phone_code`: text - Unique 6-digit code for phone auth

### inbound_voice_messages table
- `id`: uuid - Primary key
- `user_id`: uuid - Reference to user
- `family_id`: uuid - Reference to family
- `phone_number`: text - Caller's phone number
- `audio_url`: text - Twilio recording URL
- `transcript`: text - Transcribed text
- `duration_seconds`: integer - Recording length
- `source`: text - 'phone' or 'whatsapp'
- `status`: text - 'processing', 'completed', or 'failed'
- `draft_id`: uuid - Reference to created story draft
- `created_at`: timestamp
- `processed_at`: timestamp

## Edge Functions

### inbound-voice
**Purpose:** Handles incoming calls/WhatsApp messages from Twilio
**URL:** `https://imgtnixyralpdrmedwzi.supabase.co/functions/v1/inbound-voice`
**Method:** POST
**Auth:** Public (authenticated via Twilio signatures)

**Request (from Twilio):**
- `Digits`: 6-digit code entered by caller
- `RecordingUrl`: URL to recording on Twilio
- `From`: Caller's phone number
- `RecordingDuration`: Length in seconds

**Response:** TwiML XML for call handling

### transcribe-voice-message
**Purpose:** Transcribes audio and creates draft story
**URL:** `https://imgtnixyralpdrmedwzi.supabase.co/functions/v1/transcribe-voice-message`
**Method:** POST
**Auth:** Service role key

**Request:**
```json
{
  "message_id": "uuid",
  "audio_base64": "base64_encoded_audio",
  "user_id": "uuid",
  "family_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "transcript": "transcribed text",
  "draft_id": "uuid",
  "message_id": "uuid"
}
```

## Testing

### Test Elder Mode UI
1. Go to Profile Settings
2. Enable "Elder Mode"
3. Note your 6-digit code
4. Navigate to home page
5. Should see XL button interface

### Test Call-In (with Twilio setup)
1. Call your Twilio number
2. Enter your 6-digit code
3. Leave a test message
4. Check drafts within 60 seconds
5. Verify transcript accuracy

### Test WhatsApp (with WhatsApp setup)
1. Send WhatsApp to Twilio number
2. Include code in first message
3. Send voice message
4. Check drafts for transcription

## Costs

### OpenAI Whisper
- $0.006 per minute of audio
- Example: 100 x 2-minute calls = $1.20

### Twilio Phone
- Phone number: ~$1/month
- Incoming calls: ~$0.0085/minute
- Recordings: ~$0.0025/minute
- Example: 100 x 2-minute calls = $2.10

### Twilio WhatsApp
- Free for template messages
- $0.005 per session for user-initiated

## Security Considerations
1. Phone codes are unique and randomly generated
2. Codes are stored securely in database
3. Twilio webhooks should validate signatures (add in production)
4. Service role key used server-side only
5. Audio files deleted after transcription (configurable)

## Troubleshooting

### "Invalid phone code"
- Code may have been revoked or user doesn't exist
- Check `profiles.elder_phone_code` matches

### No draft created
- Check `inbound_voice_messages` table for status
- Check edge function logs
- Verify OpenAI API key is set
- Check audio format compatibility

### Transcription errors
- Ensure audio quality is good
- Check audio format (Whisper supports many formats)
- Review Whisper API limits and quotas

## Future Enhancements
- [ ] SMS fallback for transcription
- [ ] Multi-language support
- [ ] Custom greeting messages
- [ ] Family member notification when elder calls
- [ ] Photo upload via MMS
- [ ] Voice message playback in UI
- [ ] Analytics dashboard for call patterns

## Support
For issues or questions, check:
- Twilio status: https://status.twilio.com
- OpenAI status: https://status.openai.com
- Supabase logs: https://supabase.com/dashboard/project/imgtnixyralpdrmedwzi/functions

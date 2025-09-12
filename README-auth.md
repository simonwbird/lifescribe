# Google OAuth Setup for LifeScribe

## Supabase Configuration

1. **Enable Google Provider**
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable the Google provider
   - Configure Client ID and Client Secret from Google Cloud Console

2. **Set Redirect URLs**
   - Development: `http://localhost:5173/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`

## Google Cloud Console Setup

1. **Create OAuth 2.0 Credentials**
   - Go to Google Cloud Console → APIs & Credentials
   - Create OAuth 2.0 Client ID for Web Application
   - Add authorized JavaScript origins:
     - `http://localhost:5173` (development)
     - `https://yourdomain.com` (production)
   - Add authorized redirect URIs:
     - `http://localhost:5173/auth/callback` (development)
     - `https://yourdomain.com/auth/callback` (production)

2. **Configure OAuth Consent Screen**
   - Set up consent screen with your app details
   - Add scopes: `email`, `profile`, `openid`
   - Add authorized domains

## Environment Variables

No additional environment variables needed - Supabase client is already configured.

## Features

- **Google OAuth Sign-in**: Primary authentication method
- **Email/Password**: Secondary option
- **Auto Profile Creation**: Creates profiles table entry for new Google users
- **Profile Syncing**: Updates avatar and name from Google data
- **Secure Redirects**: Proper callback handling with error management
- **Toast Notifications**: User-friendly error and success messages

## Testing

1. Click "Continue with Google" button
2. Complete Google OAuth flow
3. User should be redirected to `/auth/callback`
4. Profile should be created/updated automatically
5. User should land on `/home` (family member) or `/onboarding` (new user)
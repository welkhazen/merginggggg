# Stytch Authentication Setup Guide

## Getting Your Stytch API Keys

### Step 1: Create a Stytch Account
1. Go to [https://stytch.com](https://stytch.com)
2. Click **"Start for Free"** or **"Sign Up"**
3. Complete the signup process with your email and password

### Step 2: Create a Project
1. After signing up, you'll be taken to the Stytch Dashboard
2. Click **"Create a new project"** or select an existing one
3. Give your project a name (e.g., "Raw War App")
4. Select your environment (Sandbox for development, Production for live)

### Step 3: Get Your Public Token
1. In the Stytch Dashboard, go to **API Keys** (usually in the sidebar)
2. You'll see your **Public Token** (starts with `public-` or similar)
3. Copy this token

### Step 4: Configure Your Frontend
1. Open `.env.local` in your project root
2. Replace `YOUR_PUBLIC_TOKEN_HERE` with your actual public token:
   ```
   VITE_STYTCH_PUBLIC_TOKEN=public-your-actual-token-here
   ```
3. Save the file

### Step 5: Configure Redirect URLs (Important!)
1. In the Stytch Dashboard, go to **SDK Configuration** or **Redirect URLs**
2. Add your application URLs:
   - Development: `http://localhost:5173` (or your dev port)
   - Production: `https://yourdomain.com`
3. Save the configuration

### Step 6: Configure OAuth (Optional)
To enable Google login or other social providers:

1. In the Stytch Dashboard, go to **OAuth** settings
2. For **Google OAuth**:
   - Click "Connect Google"
   - You'll be guided to set up OAuth in Google Cloud Console
   - Create OAuth credentials and copy the Client ID/Secret
   - Return to Stytch and complete the setup
3. Similar process for other providers (GitHub, Microsoft, etc.)

## Environment Variables Reference

```
# Required
VITE_STYTCH_PUBLIC_TOKEN=public-xxxxxxxxxxxx

# Optional
VITE_STYTCH_REDIRECT_URL=http://localhost:5173/dashboard
```

## Using the Authentication

### Login Page
- Navigate to `/login` to see the login form
- Users can sign in with:
  - Email (Magic Links)
  - Google OAuth (if configured)
  - Other OAuth providers (if configured)

### Check Authentication Status
```typescript
import { useStytchSession } from '@stytch/react';

export function MyComponent() {
  const { session, isInitialized } = useStytchSession();
  
  if (!isInitialized) return <div>Loading...</div>;
  
  if (session) {
    return <div>Welcome! You're logged in</div>;
  }
  
  return <div>Please log in</div>;
}
```

### Using the Custom Hook
```typescript
import { useAuthStatus } from '@/hooks/useAuthStatus';

export function MyComponent() {
  const { isAuthenticated, session, isLoadingAuth } = useAuthStatus();
  
  if (isLoadingAuth) return <div>Loading...</div>;
  
  return isAuthenticated ? <div>Logged in!</div> : <div>Not logged in</div>;
}
```

## Testing Your Setup

1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:5173/login`
3. Try signing in with an email
4. Check the browser console for any errors
5. You should be redirected to `/dashboard` after successful login

## Troubleshooting

### "VITE_STYTCH_PUBLIC_TOKEN is not set" Warning
- Make sure `.env.local` is created in your project root
- The file should contain: `VITE_STYTCH_PUBLIC_TOKEN=your-token`
- Restart the dev server after creating `.env.local`

### OAuth Provider Not Showing
- Verify you've configured the provider in the Stytch Dashboard
- Check that your redirect URLs are correct
- Clear your browser cache and reload

### 401 Unauthorized Error
- Double-check your public token is correct
- Verify your domain is added to Authorized Domains in Stytch Dashboard
- Make sure you're not using a Secret token (use Public token only)

## Additional Resources

- **Stytch Documentation**: https://stytch.com/docs
- **API Reference**: https://stytch.com/docs/api
- **React SDK Docs**: https://stytch.com/docs/sdks/frontend-sdks/react
- **Dashboard**: https://stytch.com/dashboard

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env.local` to version control
- Only use your **Public Token** in frontend code
- Keep your **Secret API Key** secure on your backend
- For API calls from your backend, use your Secret Key (stored server-side)

---

**Need help?** Visit the Stytch Discord community or contact support at https://stytch.com/contact

# Google Sign-In Troubleshooting Guide

## Environment Variables Set But Still Not Working?

### Step 1: Debug Your Public URL
Open your public URL in browser and run this in console:

```javascript
// Copy and paste this entire script in browser console
fetch('/api/config').then(r => r.json()).then(console.log)
```

**Expected output:**
```json
{
  "ok": true,
  "googleClientId": "344110356663-foa7unsastgg0hp57qdaaj5qvmkgd8lg.apps.googleusercontent.com"
}
```

**If you see empty googleClientId:** Environment variable not properly set in deployment.

### Step 2: Check Google OAuth Configuration
Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. Select your project
2. Go to "Credentials" 
3. Find your OAuth 2.0 Client ID
4. Click "Edit" and check:

**Authorized JavaScript origins** must include:
- `http://localhost:3000` (for local)
- `https://your-public-url.com` (for production)
- `https://your-netlify-site.netlify.app` (if using Netlify)

**Authorized redirect URIs** is less critical for popup mode but should include:
- `http://localhost:3000`
- `https://your-public-url.com`

### Step 3: Run Enhanced Debug Script
Copy the contents of `debug-google-signin.js` and run in your browser console on the public URL.

### Step 4: Common Issues & Solutions

#### Issue 1: "Origin not allowed" error
**Solution:** Add your public URL to Google OAuth JavaScript origins

#### Issue 2: Button container not found
**Solution:** React component not mounting properly - check if HeaderAuthCluster is rendered

#### Issue 3: Google SDK not loaded
**Solution:** Check network tab for failed requests to `accounts.google.com/gsi/client`

#### Issue 4: Environment variable not working
**Solution:** 
- Netlify: Check environment variables in Site Settings
- Vercel: Check environment variables in Project Settings
- Ensure you've redeployed after setting variables

#### Issue 5: CORS issues
**Solution:** Your domain must be whitelisted in Google OAuth settings

### Step 5: Manual Verification Commands

```bash
# Test config endpoint
curl https://your-public-url.com/api/config

# Test if Google SDK loads
curl -I https://accounts.google.com/gsi/client
```

### Step 6: Google OAuth App Settings
Make sure your Google OAuth app has:

1. **Application type:** Web application
2. **Authorized JavaScript origins:** All domains where you'll deploy
3. **Consent screen configured:** With required fields filled
4. **Testing users:** If app is in testing mode, add your email

### Step 7: Browser Console Errors to Look For
- `Origin not allowed` → OAuth origins misconfigured
- `Invalid client_id` → Wrong client ID or not configured
- `Network error` → Google SDK blocked or failed to load
- `Container not found` → React mounting issue

### Step 8: Last Resort - Hardcoded Client ID
If environment variables still don't work, temporarily hardcode in `netlify/functions/api.js`:

```javascript
if (route === "config" && event.httpMethod === "GET") {
  return json(200, { 
    ok: true, 
    googleClientId: "344110356663-foa7unsastgg0hp57qdaaj5qvmkgd8lg.apps.googleusercontent.com" 
  });
}
```

### Still Not Working?
1. Check browser network tab for failed requests
2. Verify Google OAuth app is published (not in testing)
3. Ensure no ad blockers are blocking Google scripts
4. Try incognito/private browsing mode

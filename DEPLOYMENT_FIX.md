# Fix Google Sign-In Button on Public URL

## Issue
The Google Sign-In button is not visible on the public deployment URL because the `GOOGLE_CLIENT_ID` environment variable is not configured in the deployment environment.

## Solution

### 1. Netlify Deployment
If you're deploying to Netlify, you need to set the environment variable in the Netlify dashboard:

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Build & deploy** → **Environment**
3. Add a new environment variable:
   - **Key**: `GOOGLE_CLIENT_ID`
   - **Value**: `344110356663-foa7unsastgg0hp57qdaaj5qvmkgd8lg.apps.googleusercontent.com`

4. Trigger a new deployment or redeploy your site

### 2. Vercel Deployment
If you're deploying to Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name**: `GOOGLE_CLIENT_ID`
   - **Value**: `344110356663-foa7unsastgg0hp57qdaaj5qvmkgd8lg.apps.googleusercontent.com`

4. Redeploy your project

### 3. Other Platforms
For any other deployment platform, ensure the `GOOGLE_CLIENT_ID` environment variable is set to:
```
344110356663-foa7unsastgg0hp57qdaaj5qvmkgd8lg.apps.googleusercontent.com
```

## Verification
After setting the environment variable and redeploying:

1. Visit your public URL
2. Check the browser console - you should see Google Sign-In related logs
3. The Google Sign-In button should appear in the top-right navbar
4. You can test the `/api/config` endpoint to verify the client ID is being served

## Testing
To test if the fix works:
```bash
curl https://your-public-url.com/api/config
```

You should see:
```json
{"ok":true,"googleClientId":"344110356663-foa7unsastgg0hp57qdaaj5qvmkgd8lg.apps.googleusercontent.com"}
```

## Common Issues
- **Button not appearing**: Environment variable not set or deployment not triggered
- **CORS errors**: Make sure your Google OAuth consent screen includes your public URL
- **Button appears but doesn't work**: Check Google Cloud Console for proper OAuth configuration

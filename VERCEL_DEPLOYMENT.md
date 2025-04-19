
# Vercel Deployment Guide for Verbo Chat

This guide will help you deploy the Verbo chat application on Vercel, ensuring that WebSockets work correctly for real-time communication.

## Prerequisites

- A [Vercel account](https://vercel.com/signup)
- The Verbo codebase (this repository)

## Deployment Steps

1. **Push your code to a Git repository** (GitHub, GitLab, or Bitbucket)

2. **Connect to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository 

3. **Configure the project**
   - Framework preset: Select `Vite`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`

4. **Add environment variables**
   If you're using your own Firebase project, add your Firebase configuration as environment variables:
   
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
   ```

5. **Deploy the project**
   - Click "Deploy"
   - Wait for the build to complete

## Troubleshooting WebSocket Connection Issues

If you experience WebSocket connection issues with the error "Using offline mode" or "WebSocket error" after deploying to Vercel, here's how to fix it:

### 1. Verify Path Configuration

Make sure the client and server paths match:

- In `src/utils/socket.ts`: Set `path: '/api/socket'`
- In `vercel.json`: Make sure routing is set up correctly:
  ```json
  "rewrites": [
    { "source": "/api/socket", "destination": "/api/socket" },
    { "source": "/socket.io/(.*)", "destination": "/api/socket" },
    { "source": "/(.*)", "destination": "/" }
  ]
  ```

### 2. Test API Endpoints

Visit these URLs to verify your serverless functions are working:
- `https://your-project-url.vercel.app/api/debug` - Should return a JSON response
- `https://your-project-url.vercel.app/api/socket-debug` - Should confirm Socket.IO is reachable

### 3. Check Vercel Function Logs

1. Go to your Vercel project dashboard
2. Click on "Functions" in the left sidebar
3. Look for any errors in the logs for the `/api/socket` function

### 4. Ensure Required Dependencies

Make sure your project includes these server dependencies:
```bash
npm install express socket.io cors
```

### 5. Redeploy with Cache Reset

If you've made changes but still experience issues:
1. Go to your Vercel project settings
2. Find "Build & Development Settings"
3. Click "Clear Cache and Redeploy"

## Using Firebase as a Backup

The Verbo chat application uses Firebase Realtime Database as a backup when Socket.IO connections fail. This provides redundancy and ensures your chat application works even when there are WebSocket connection issues.

To configure your Firebase project:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable Realtime Database
4. Add your Firebase configuration to your environment variables (as described above)

## Need Help?

If you continue to experience issues with the Vercel deployment:
- Review the Vercel deployment logs for errors
- Check console logs in your browser for connection issues
- Try accessing the debug endpoints (`/api/debug` and `/api/socket-debug`)
- Ensure all necessary dependencies are installed

For more information, refer to:
- [Socket.IO Serverless Documentation](https://socket.io/docs/v4/server-installation/#running-with-vercel)
- [Vercel Serverless Functions Documentation](https://vercel.com/docs/concepts/functions/serverless-functions)

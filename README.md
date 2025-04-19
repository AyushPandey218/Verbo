
# Verbo - Real-time Chat Application

A beautiful, real-time messaging experience built with React, Socket.io, and Tailwind CSS.

## Features

- Real-time messaging with Socket.io
- Beautiful UI with Tailwind CSS and shadcn/ui
- User authentication with Google sign-in or guest mode
- Multiple chat rooms
- Random chat matching (like Omegle)
- Message reactions
- Voice messages
- Online user status

## IMPORTANT: Firebase Setup Required

**This application requires Firebase to work properly.** The demo Firebase project used as a fallback has limited capacity and may not work reliably.

Follow these easy steps to set up your own Firebase project (it's free):

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Sign in with your Google account
3. Click "Add project" and follow the steps to create a new project
4. Once your project is created, click on "Realtime Database" in the left sidebar
5. Click "Create Database" and choose a location closest to your users
6. Start in "test mode" for development (you can add security rules later)
7. In your project settings (gear icon > Project settings), scroll down to "Your apps"
8. Click the web icon (</>) to add a web app to your project
9. Register your app with a nickname (e.g., "verbo-chat")
10. Copy the Firebase configuration object (it looks like this):
    ```js
    const firebaseConfig = {
      apiKey: "...",
      authDomain: "...",
      projectId: "...",
      storageBucket: "...",
      messagingSenderId: "...",
      appId: "...",
      databaseURL: "..."
    };
    ```

## Using Your Firebase Config

### Option 1: Replace the Default Config (Simplest)

1. Open `src/utils/config.ts`
2. Replace the values in the `defaultFirebaseConfig` object with your own Firebase config values
3. Rebuild and deploy your app

### Option 2: Use Environment Variables (Recommended for Production)

For local development, create a `.env` file in the root of your project:
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
```

## Vercel Deployment with Your Firebase Config

When deploying to Vercel, you need to add your Firebase environment variables to your project:

1. In your Vercel project dashboard, go to "Settings" > "Environment Variables"
2. Add each Firebase environment variable from your `.env` file:
   - VITE_FIREBASE_API_KEY
   - VITE_FIREBASE_AUTH_DOMAIN
   - VITE_FIREBASE_PROJECT_ID
   - VITE_FIREBASE_STORAGE_BUCKET
   - VITE_FIREBASE_MESSAGING_SENDER_ID
   - VITE_FIREBASE_APP_ID
   - VITE_FIREBASE_DATABASE_URL (this one is especially critical!)
3. Click "Save" to update your project settings
4. Redeploy your project for the changes to take effect

**IMPORTANT:** Without a proper Firebase configuration, the chat functionality will not work reliably. The default Firebase project is rate-limited and may be unavailable.

## Local Development

### Prerequisites

You'll need to have Node.js installed on your computer.

### Setting up the Socket.io Server

1. First, manually install the required server dependencies:
   ```
   npm install express socket.io cors
   ```
   
2. Start the Socket.io server:
   ```
   node server/index.js
   ```
   
   The server will run on port 3001 by default.

### Running the Client

1. In a separate terminal, start the client:
   ```
   npm run dev
   ```
   
   The client will run on port 8080 by default.

2. Open your browser and navigate to http://localhost:8080

## Deployment on Vercel

This application is configured for seamless deployment on Vercel.

1. Connect your GitHub repository to Vercel
2. Set up a new project in Vercel and import your repository
3. Add your Firebase environment variables in the Vercel project settings
4. Use the following settings:
   - Framework Preset: Vite
   - Build Command: npm run build
   - Output Directory: dist
   - Install Command: npm install

5. Deploy! Vercel will automatically set up both the client and the serverless function for Socket.io.

## License

MIT

# Firestore Configuration Guide

## Steps to Configure Firestore

### 1. Download Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **fluzio-13af2**
3. Click ⚙️ → **Project settings** → **Service accounts** tab
4. Click **Generate new private key**
5. Save as `server/serviceAccountKey.json`

### 2. Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode**
4. Select a location (e.g., `us-central`)

### 3. Deploy Firestore Rules

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init firestore

# Deploy the security rules
firebase deploy --only firestore:rules
```

### 4. Restart Backend Server

Once you've placed `serviceAccountKey.json` in the `server` folder:

```bash
cd server
node index.js
```

The server will automatically detect the key and connect to Firestore.

## Current Status

- ✅ Firestore rules created
- ⚠️  Service account key needed
- ⚠️  Firestore database needs to be enabled in Firebase Console

## Manual Rule Deployment (Alternative)

If you prefer to deploy rules manually:

1. Go to Firebase Console → Firestore Database → Rules tab
2. Copy the contents of `firestore.rules`
3. Paste into the Firebase Console
4. Click **Publish**

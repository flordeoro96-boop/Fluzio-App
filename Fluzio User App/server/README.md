# Fluzio Backend Server

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. (Optional) Add Firebase Admin credentials:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the file as `server/serviceAccountKey.json`

3. Start the server:
```bash
npm start
```

The server will run on http://localhost:3000

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user by ID

## Note

The server works in two modes:
- **With Firebase Admin**: Saves data to Firestore
- **Without Firebase Admin**: Returns mock responses (for testing)

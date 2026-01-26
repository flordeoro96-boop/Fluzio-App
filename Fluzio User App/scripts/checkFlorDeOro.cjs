require('dotenv').config({ path: '../.env' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkFlorDeOro() {
  try {
    console.log('🔍 Searching for Flor de Oro posts...\n');
    
    const feedRef = collection(db, 'feedPosts');
    const q = query(feedRef, where('creatorName', '==', 'Flor de Oro'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('❌ No posts found for "Flor de Oro"');
      console.log('\nSearching for similar names...\n');
      
      // Search for posts with "flor" or "oro" in name
      const allSnapshot = await getDocs(collection(db, 'feedPosts'));
      let found = false;
      
      allSnapshot.forEach(doc => {
        const data = doc.data();
        const name = (data.creatorName || '').toLowerCase();
        if (name.includes('flor') || name.includes('oro')) {
          found = true;
          console.log(`✅ Found: ${data.creatorName}`);
          console.log(`   ID: ${doc.id}`);
          console.log(`   Type: ${data.contentType}`);
          console.log(`   Status: ${data.status} / ${data.moderationStatus}`);
          console.log('');
        }
      });
      
      if (!found) {
        console.log('❌ No posts found with "flor" or "oro" in creator name');
      }
    } else {
      console.log(`✅ Found ${snapshot.size} post(s) for Flor de Oro:\n`);
      
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`Post ID: ${doc.id}`);
        console.log(`Content Type: ${data.contentType}`);
        console.log(`Caption: ${data.caption?.substring(0, 50)}...`);
        console.log(`Status: ${data.status}`);
        console.log(`Moderation: ${data.moderationStatus}`);
        console.log(`Created By: ${data.createdBy}`);
        console.log(`Location: ${data.location?.city || 'N/A'}`);
        console.log('---\n');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkFlorDeOro();

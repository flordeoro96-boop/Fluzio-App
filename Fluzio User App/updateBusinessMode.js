// Script to update businessMode to ONLINE for Flor de Oro
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDX5H3bEP0ByzdEstmkz40RGTmMqoy48IE",
  authDomain: "fluzio-13af2.firebaseapp.com",
  projectId: "fluzio-13af2",
  storageBucket: "fluzio-13af2.firebasestorage.app",
  messagingSenderId: "51642420144",
  appId: "1:51642420144:web:5eb34a14e4ed6557f9a137",
  measurementId: "G-G2SWQNKFBZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateBusinessMode() {
  try {
    const userId = 'UaK0Co1BgChaprDV0aMMfbIFv8E2'; // Your actual user ID from logs
    
    console.log('Updating businessMode to ONLINE for user:', userId);
    
    await updateDoc(doc(db, 'users', userId), {
      businessMode: 'ONLINE'
    });
    
    console.log('✅ Successfully updated businessMode to ONLINE');
    console.log('Please refresh your browser to see the changes');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating businessMode:', error);
    process.exit(1);
  }
}

updateBusinessMode();

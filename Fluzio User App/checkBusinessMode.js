// Quick script to check businessMode for Flor de Oro
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

async function checkBusinessMode() {
  try {
    const userId = 'yRCaT5CTI0hwIRv1Hxkg0i6zyWf2'; // Flor de Oro user ID
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log('\n=== Business Mode Check ===');
      console.log('businessMode:', data.businessMode);
      console.log('businessType:', data.businessType);
      console.log('Full data:', JSON.stringify({
        businessMode: data.businessMode,
        businessType: data.businessType,
        name: data.name,
        category: data.category
      }, null, 2));
    } else {
      console.log('❌ User not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBusinessMode();

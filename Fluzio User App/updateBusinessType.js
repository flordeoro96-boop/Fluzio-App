// Script to update businessType for Flor de Oro
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDV6SI2w5p8lcwF_CkAdvc3t3m7vlOFrPc",
  authDomain: "fluzio-13af2.firebaseapp.com",
  projectId: "fluzio-13af2",
  storageBucket: "fluzio-13af2.firebasestorage.app",
  messagingSenderId: "661439642019",
  appId: "1:661439642019:web:c96c2e8ca12e2df06f2df7",
  measurementId: "G-DCLKPKB6XB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateFlorDeOro() {
  try {
    console.log('Searching for Flor de Oro...');
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('name', '==', 'Flor de Oro'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('❌ Flor de Oro not found');
      console.log('Searching for businesses with similar names...');
      
      const allBusinessesQuery = query(usersRef, where('role', '==', 'BUSINESS'));
      const allSnapshot = await getDocs(allBusinessesQuery);
      
      console.log(`Found ${allSnapshot.size} businesses:`);
      allSnapshot.forEach(doc => {
        console.log(`  - ${doc.data().name} (ID: ${doc.id})`);
      });
      
      return;
    }
    
    console.log(`✅ Found ${snapshot.size} document(s)`);
    
    for (const document of snapshot.docs) {
      console.log(`\nUpdating: ${document.id}`);
      console.log('Current data:', document.data());
      
      await updateDoc(doc(db, 'users', document.id), {
        businessType: 'Jewelry Online Shop'
      });
      
      console.log('✅ Updated businessType to "Jewelry Online Shop"');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateFlorDeOro();

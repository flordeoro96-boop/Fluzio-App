// Script to add isCreatorOnly: false to all missions that don't have this field set
// This fixes the visibility issue for customer accounts

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCmh-gI9u3sEE6ArzqYW1DWfR_rcdI3gjg",
  authDomain: "fluzio-13af2.firebaseapp.com",
  projectId: "fluzio-13af2",
  storageBucket: "fluzio-13af2.firebasestorage.app",
  messagingSenderId: "828439477852",
  appId: "1:828439477852:web:1d23c0dd5f98b17b0d6ed1",
  measurementId: "G-YNRXBXEG0M"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixMissions() {
  try {
    console.log('Starting mission fix...');
    console.log('Fetching all missions...');
    
    const missionsRef = collection(db, 'missions');
    const snapshot = await getDocs(missionsRef);
    
    console.log(`Found ${snapshot.size} missions in database`);
    
    let updatedCount = 0;
    let alreadySetCount = 0;
    
    for (const missionDoc of snapshot.docs) {
      const data = missionDoc.data();
      
      // Check if isCreatorOnly field exists
      if (data.isCreatorOnly === undefined || data.isCreatorOnly === null) {
        console.log(`\n📝 Mission: "${data.title}" (${missionDoc.id})`);
        console.log(`   Business: ${data.businessName || 'Unknown'}`);
        console.log(`   Status: ${data.lifecycleStatus}, Active: ${data.isActive}`);
        console.log(`   ❌ Missing isCreatorOnly field - Adding it...`);
        
        // Update the mission
        await updateDoc(doc(db, 'missions', missionDoc.id), {
          isCreatorOnly: false
        });
        
        console.log(`   ✅ Updated successfully`);
        updatedCount++;
      } else {
        console.log(`✓ Mission "${data.title}" already has isCreatorOnly: ${data.isCreatorOnly}`);
        alreadySetCount++;
      }
    }
    
    console.log('\n===========================================');
    console.log('MISSION FIX COMPLETE');
    console.log('===========================================');
    console.log(`Total missions: ${snapshot.size}`);
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`✓ Already set: ${alreadySetCount}`);
    console.log('===========================================\n');
    
    if (updatedCount > 0) {
      console.log('🎉 All business missions should now be visible to customer accounts!');
      console.log('Please test by logging in as a customer and checking the missions list.');
    } else {
      console.log('ℹ️ No missions needed updating. All missions already have isCreatorOnly field set.');
    }
    
  } catch (error) {
    console.error('❌ Error fixing missions:', error);
    throw error;
  }
}

// Run the fix
fixMissions()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

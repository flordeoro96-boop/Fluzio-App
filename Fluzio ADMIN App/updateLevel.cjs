// Quick script to update business level in Firestore
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./fluzio-13af2-firebase-adminsdk-lvihg-e89a1ad7a7.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateBusinessLevel() {
  try {
    const userId = 'UaK0Co1BgChaprDV0aMMfbIFv8E2';
    const newLevel = 2;
    
    console.log(`Updating user ${userId} subscription level to ${newLevel}...`);
    console.log('NOTE: This is the subscription level (1=Aspiring, 2=Established)');
    console.log('      businessLevel (2.9) is the progression/XP system\n');
    
    await db.collection('users').doc(userId).update({
      level: newLevel,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Successfully updated subscription level to', newLevel);
    
    // Verify the update
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    console.log('\nCurrent values:');
    console.log('  - level (subscription):', userData.level);
    console.log('  - businessLevel (progression):', userData.businessLevel);
    console.log('  - businessSubLevel:', userData.businessSubLevel);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating level:', error);
    process.exit(1);
  }
}

updateBusinessLevel();

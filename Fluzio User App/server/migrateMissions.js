const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function migrateMissions() {
  try {
    console.log('Starting mission migration...');
    
    // Get all missions
    const missionsSnapshot = await db.collection('missions').get();
    console.log(`Found ${missionsSnapshot.size} missions to check`);
    
    let updatedCount = 0;
    
    for (const missionDoc of missionsSnapshot.docs) {
      const missionData = missionDoc.data();
      
      // Skip if already has businessName
      if (missionData.businessName) {
        console.log(`Mission ${missionDoc.id} already has businessName: ${missionData.businessName}`);
        continue;
      }
      
      // Get businessId
      const businessId = missionData.businessId;
      if (!businessId) {
        console.log(`Mission ${missionDoc.id} has no businessId, skipping`);
        continue;
      }
      
      // Fetch business user data
      const userDoc = await db.collection('users').doc(businessId).get();
      
      if (!userDoc.exists) {
        console.log(`Business user ${businessId} not found for mission ${missionDoc.id}`);
        continue;
      }
      
      const userData = userDoc.data();
      const businessName = userData.name || userData.businessName || 'Business';
      const businessLogo = userData.photoUrl || userData.logo || '';
      
      // Update mission
      await db.collection('missions').doc(missionDoc.id).update({
        businessName: businessName,
        businessLogo: businessLogo
      });
      
      console.log(`✅ Updated mission ${missionDoc.id} with businessName: ${businessName}`);
      updatedCount++;
    }
    
    console.log(`\n✅ Migration complete! Updated ${updatedCount} missions`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateMissions();

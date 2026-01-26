/**
 * Standalone script to populate cities collection from user data
 * Run with: node scripts/populateCities.js
 */

const admin = require('firebase-admin');

// Initialize with application default credentials (works in Cloud Functions and locally with gcloud auth)
// Or uses GOOGLE_APPLICATION_CREDENTIALS environment variable if set
try {
  admin.initializeApp({
    projectId: 'fluzio-13af2'
  });
  console.log('✅ Firebase Admin initialized with project: fluzio-13af2');
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  console.log('\nPlease run: firebase login');
  process.exit(1);
}

const db = admin.firestore();

// City name normalization mapping
const CITY_NAME_MAPPINGS = {
  // Germany
  'München': 'Munich',
  'Munchen': 'Munich',
  'munich': 'Munich',
  'MUNICH': 'Munich',
  
  // Add more mappings as needed
};

function normalizeCityName(cityName) {
  if (!cityName) return null;
  const trimmed = cityName.trim();
  return CITY_NAME_MAPPINGS[trimmed] || trimmed;
}

async function aggregateCityMetrics() {
  console.log('🏙️  Starting city metrics aggregation...');
  
  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`📊 Found ${usersSnapshot.size} total users`);
    
    // Group users by city and country
    const cityMap = new Map();
    
    usersSnapshot.docs.forEach(doc => {
      const user = doc.data();
      const rawCity = user.city || user.homeCity || user.geo?.city;
      const countryCode = user.operatingCountry || (user.countryCode?.replace('+', '') === '49' ? 'DE' : user.countryCode?.replace('+', '') === '507' ? 'PA' : null);
      
      if (!rawCity || !countryCode) return;
      
      const normalizedCity = normalizeCityName(rawCity);
      const cityKey = `${normalizedCity}_${countryCode}`;
      
      if (!cityMap.has(cityKey)) {
        cityMap.set(cityKey, {
          name: normalizedCity,
          countryCode,
          totalUsers: 0,
          businesses: 0,
          creators: 0,
          members: 0,
          activeMissions: 0,
        });
      }
      
      const cityData = cityMap.get(cityKey);
      cityData.totalUsers++;
      
      if (user.role === 'BUSINESS' || user.accountType === 'business') {
        cityData.businesses++;
      } else if (user.role === 'CREATOR' || user.accountType === 'creator') {
        cityData.creators++;
      } else if (user.role === 'MEMBER' || user.accountType === 'member') {
        cityData.members++;
      }
    });
    
    console.log(`🏙️  Found ${cityMap.size} unique cities`);
    
    // Write to Firestore
    const batch = db.batch();
    let count = 0;
    
    for (const [cityKey, data] of cityMap.entries()) {
      const cityId = cityKey.replace(/[^a-zA-Z0-9_-]/g, '_');
      const cityRef = db.collection('cities').doc(cityId);
      
      batch.set(cityRef, {
        name: data.name,
        countryCode: data.countryCode,
        status: 'ACTIVE',
        stats: {
          totalUsers: data.totalUsers,
          businesses: data.businesses,
          creators: data.creators,
          members: data.members,
          activeMissions: data.activeMissions,
          lastUpdated: admin.firestore.Timestamp.now(),
        },
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      }, { merge: true });
      
      count++;
      console.log(`  ✅ ${data.name}, ${data.countryCode}: ${data.totalUsers} users (${data.businesses} businesses, ${data.creators} creators)`);
      
      // Commit batch every 500 operations
      if (count % 500 === 0) {
        await batch.commit();
        console.log(`  💾 Committed batch of ${count} cities`);
      }
    }
    
    // Commit remaining
    if (count % 500 !== 0) {
      await batch.commit();
    }
    
    console.log(`\n✅ Successfully aggregated ${count} cities!`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error aggregating city metrics:', error);
    process.exit(1);
  }
}

aggregateCityMetrics();

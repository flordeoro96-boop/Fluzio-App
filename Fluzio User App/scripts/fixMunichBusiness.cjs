/**
 * Script to diagnose and fix Munich business visibility issues
 * Run with: node scripts/fixMunichBusiness.cjs
 */

const admin = require('firebase-admin');

try {
  admin.initializeApp({
    projectId: 'fluzio-13af2'
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Error initializing Firebase:', error.message);
  process.exit(1);
}

const db = admin.firestore();

async function fixMunichBusinesses() {
  console.log('\n🔍 Searching for Munich businesses...\n');
  
  try {
    // Find all businesses in Munich
    const usersRef = db.collection('users');
    const munichQuery = usersRef.where('role', '==', 'BUSINESS')
      .where('city', 'in', ['Munich', 'München', 'munich']);
    
    const snapshot = await munichQuery.get();
    
    if (snapshot.empty) {
      console.log('❌ No Munich businesses found');
      console.log('\nTrying broader search...\n');
      
      // Try all businesses
      const allBusinesses = await usersRef.where('role', '==', 'BUSINESS').get();
      console.log(`Found ${allBusinesses.size} total businesses`);
      
      allBusinesses.docs.forEach(doc => {
        const data = doc.data();
        console.log(`\n📍 Business: ${data.name}`);
        console.log(`   City: ${data.city || 'NOT SET'}`);
        console.log(`   ID: ${doc.id}`);
      });
      
      return;
    }
    
    console.log(`Found ${snapshot.size} Munich business(es)\n`);
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const businessId = doc.id;
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📍 Business: ${data.name}`);
      console.log(`   ID: ${businessId}`);
      console.log(`   City: ${data.city}`);
      console.log(`${'='.repeat(60)}`);
      
      // Check all required fields
      const issues = [];
      const fixes = {};
      
      // 1. Check geo location
      if (!data.geo || !data.geo.latitude || !data.geo.longitude) {
        issues.push('❌ Missing geo location (latitude/longitude)');
        
        // Munich coordinates (center of city)
        fixes.geo = new admin.firestore.GeoPoint(48.1351, 11.5820);
        console.log('   ⚠️  Will set default Munich coordinates');
      } else {
        console.log(`   ✅ Geo: ${data.geo.latitude}, ${data.geo.longitude}`);
      }
      
      // 2. Check businessMode
      if (!data.businessMode) {
        issues.push('❌ Missing businessMode field');
        fixes.businessMode = 'PHYSICAL';
        console.log('   ⚠️  Will set businessMode to PHYSICAL');
      } else if (data.businessMode === 'ONLINE') {
        issues.push('⚠️  businessMode is ONLINE (won\'t show on map)');
        console.log('   ℹ️  Change to PHYSICAL or HYBRID to show on map');
      } else {
        console.log(`   ✅ businessMode: ${data.businessMode}`);
      }
      
      // 3. Check isAspiringBusiness
      if (data.isAspiringBusiness === true) {
        issues.push('❌ isAspiringBusiness flag is true (filtered out)');
        fixes.isAspiringBusiness = false;
        console.log('   ⚠️  Will remove aspiring business flag');
      } else {
        console.log(`   ✅ isAspiringBusiness: ${data.isAspiringBusiness || false}`);
      }
      
      // 4. Check other important fields
      console.log(`   Role: ${data.role}`);
      console.log(`   Business Type: ${data.businessType || 'NOT SET'}`);
      console.log(`   Category: ${data.category || 'NOT SET'}`);
      console.log(`   Address: ${data.address || 'NOT SET'}`);
      console.log(`   Home City: ${data.homeCity || 'NOT SET'}`);
      
      // Apply fixes if needed
      if (Object.keys(fixes).length > 0) {
        console.log(`\n🔧 Applying ${Object.keys(fixes).length} fix(es)...`);
        
        await usersRef.doc(businessId).update(fixes);
        
        console.log('✅ Fixes applied successfully!');
        console.log('\nUpdated fields:');
        Object.entries(fixes).forEach(([key, value]) => {
          console.log(`   ${key}: ${JSON.stringify(value)}`);
        });
      } else {
        console.log('\n✅ No fixes needed - business should be visible!');
      }
      
      // Additional recommendations
      if (!data.homeCity || data.homeCity !== 'Munich') {
        console.log('\n💡 Recommendation: Set homeCity to "Munich" for better targeting');
      }
      
      if (!data.address) {
        console.log('💡 Recommendation: Add full address for better customer discovery');
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Diagnostic complete!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  }
}

// Run the script
fixMunichBusinesses()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

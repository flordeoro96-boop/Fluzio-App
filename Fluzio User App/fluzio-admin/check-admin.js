const admin = require('firebase-admin');
const { config } = require('dotenv');
const { resolve } = require('path');

config({ path: resolve(__dirname, '.env.local') });

const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = 'UBXDsrOJxWdi8hdWBi3dmUEkiV93';

admin.firestore().collection('admins').doc(uid).get()
  .then(doc => {
    console.log('✅ Doc exists:', doc.exists);
    if (doc.exists) {
      console.log('📄 Data:', JSON.stringify(doc.data(), null, 2));
    } else {
      console.log('❌ Document not found for UID:', uid);
      console.log('\n🔍 Let me list all admin UIDs...');
      return admin.firestore().collection('admins').get();
    }
  })
  .then(snapshot => {
    if (snapshot) {
      console.log(`\n📋 Found ${snapshot.size} admin documents:`);
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${doc.id}: ${data.email} (${data.role})`);
      });
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });

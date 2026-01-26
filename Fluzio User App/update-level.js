import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('./functions/fluzio-13af2-firebase-adminsdk-l54ub-8c1cbfbab1.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateBusinessLevel() {
  try {
    const uid = 'fKu5X9hQWzPKknRnwJIFzGsCVCw1';
    await db.collection('users').doc(uid).update({
      businessLevel: 2
    });
    console.log('✅ Successfully updated businessLevel to 2');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit();
  }
}

updateBusinessLevel();

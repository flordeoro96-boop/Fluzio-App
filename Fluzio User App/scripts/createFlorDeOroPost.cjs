require('dotenv').config({ path: '../.env' });
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs, Timestamp, GeoPoint } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createFlorDeOroPost() {
  try {
    console.log('🔍 Finding Flor de Oro business...\n');
    
    // Search for Flor de Oro business
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'BUSINESS'));
    const snapshot = await getDocs(q);
    
    let florDeOroUser = null;
    snapshot.forEach(doc => {
      const data = doc.data();
      const name = (data.name || data.businessName || '').toLowerCase();
      if (name.includes('flor') || name.includes('oro')) {
        florDeOroUser = { id: doc.id, ...data };
      }
    });
    
    if (!florDeOroUser) {
      console.log('❌ Flor de Oro business not found in users collection');
      console.log('Creating sample post with placeholder ID...\n');
      florDeOroUser = {
        id: 'flordeoro_placeholder',
        name: 'Flor de Oro',
        email: 'contact@flordeoro.com',
        city: 'Munich',
        country: 'Germany'
      };
    } else {
      console.log(`✅ Found: ${florDeOroUser.name || florDeOroUser.businessName}`);
      console.log(`   ID: ${florDeOroUser.id}`);
      console.log(`   City: ${florDeOroUser.city || 'N/A'}\n`);
    }
    
    // Create feed posts for Flor de Oro
    const posts = [
      {
        contentType: 'BUSINESS_ANNOUNCEMENT',
        createdBy: florDeOroUser.id,
        creatorName: 'Flor de Oro',
        creatorAvatar: 'https://i.pravatar.cc/150?img=20',
        creatorRole: 'BUSINESS',
        caption: '🌸 Experience authentic Colombian cuisine in the heart of Munich! Our famous Bandeja Paisa is waiting for you. Fresh ingredients, traditional recipes, and warm hospitality. Join us for lunch or dinner!',
        media: [
          {
            id: 'flor1',
            type: 'IMAGE',
            url: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=800',
            thumbnailUrl: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400',
            order: 0
          }
        ],
        location: {
          name: 'Flor de Oro',
          city: florDeOroUser.city || 'Munich',
          country: florDeOroUser.country || 'Germany',
          address: 'Somewhere in Munich',
          geo: new GeoPoint(48.1351, 11.5820) // Munich coordinates
        },
        tags: ['colombian', 'restaurant', 'munich', 'food', 'latinamerican'],
        businessTag: florDeOroUser.id,
        status: 'PUBLISHED',
        moderationStatus: 'APPROVED',
        viewCount: 0,
        saveCount: 0,
        shareCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        publishedAt: Timestamp.now()
      },
      {
        contentType: 'EXPERIENCE_POST',
        createdBy: florDeOroUser.id,
        creatorName: 'Flor de Oro',
        creatorAvatar: 'https://i.pravatar.cc/150?img=20',
        creatorRole: 'BUSINESS',
        caption: '✨ Behind the scenes at Flor de Oro! Our chef preparing today\'s special - Ajiaco Colombiano. Made with love, served with pride. Come taste the difference that homemade makes! 🥘',
        media: [
          {
            id: 'flor2',
            type: 'IMAGE',
            url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800',
            thumbnailUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400',
            order: 0
          }
        ],
        location: {
          name: 'Flor de Oro',
          city: florDeOroUser.city || 'Munich',
          country: florDeOroUser.country || 'Germany',
          address: 'Somewhere in Munich',
          geo: new GeoPoint(48.1351, 11.5820)
        },
        tags: ['behindthescenes', 'chef', 'homemade', 'colombian', 'munich'],
        businessTag: florDeOroUser.id,
        status: 'PUBLISHED',
        moderationStatus: 'APPROVED',
        viewCount: 0,
        saveCount: 0,
        shareCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        publishedAt: Timestamp.now()
      },
      {
        contentType: 'MOMENT',
        createdBy: florDeOroUser.id,
        creatorName: 'Flor de Oro',
        creatorAvatar: 'https://i.pravatar.cc/150?img=20',
        creatorRole: 'BUSINESS',
        caption: '🎉 Saturday night vibes! Thank you to all our wonderful guests. Your smiles make it all worth it! #FlorDeOro #MunichNightlife',
        media: [
          {
            id: 'flor3',
            type: 'IMAGE',
            url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
            thumbnailUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
            order: 0
          }
        ],
        location: {
          name: 'Flor de Oro',
          city: florDeOroUser.city || 'Munich',
          country: florDeOroUser.country || 'Germany',
          geo: new GeoPoint(48.1351, 11.5820)
        },
        tags: ['weekend', 'nightlife', 'restaurant', 'munich', 'atmosphere'],
        businessTag: florDeOroUser.id,
        status: 'PUBLISHED',
        moderationStatus: 'APPROVED',
        viewCount: 0,
        saveCount: 0,
        shareCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        publishedAt: Timestamp.now()
      }
    ];
    
    console.log('📝 Creating feed posts for Flor de Oro...\n');
    
    const feedPostsRef = collection(db, 'feedPosts');
    
    for (const post of posts) {
      const docRef = await addDoc(feedPostsRef, post);
      console.log(`✅ Created: ${post.contentType}`);
      console.log(`   Caption: ${post.caption.substring(0, 60)}...`);
      console.log(`   ID: ${docRef.id}\n`);
    }
    
    console.log('🎉 Done! Created 3 feed posts for Flor de Oro');
    console.log('\n📱 These posts will now appear in:');
    console.log('   - Experiences tab (BUSINESS_ANNOUNCEMENT & EXPERIENCE_POST)');
    console.log('   - Moments tab (MOMENT)');
    console.log('\n💡 Refresh the app to see them!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createFlorDeOroPost();

/**
 * Simple Seed Script (Plain JavaScript)
 * Creates 3 example feed posts
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp, GeoPoint } = require('firebase/firestore');

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

const posts = [
  // 1. USER - Experience Post
  {
    contentType: 'EXPERIENCE_POST',
    createdBy: 'demo-user-001',
    creatorName: 'Sarah Martinez',
    creatorAvatar: 'https://i.pravatar.cc/150?img=1',
    creatorRole: 'MEMBER',
    caption: 'Just discovered this amazing coffee shop in Berlin Mitte! ☕✨ Perfect spot for working or meeting friends. The flat white is incredible!',
    media: [
      {
        id: 'm1',
        type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
        order: 0
      }
    ],
    location: {
      name: 'Café Mitte, Berlin',
      city: 'Berlin',
      country: 'Germany',
      geo: new GeoPoint(52.5200, 13.4050)
    },
    tags: ['coffee', 'cafe', 'berlin', 'mitte'],
    status: 'PUBLISHED',
    moderationStatus: 'APPROVED',
    viewCount: 0,
    saveCount: 0,
    shareCount: 0,
    createdAt: Timestamp.now(),
    publishedAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },

  // 2. BUSINESS - Collaboration Call
  {
    contentType: 'COLLABORATION_CALL',
    createdBy: 'demo-business-001',
    creatorName: 'Urban Threads',
    creatorAvatar: 'https://i.pravatar.cc/150?img=20',
    creatorRole: 'BUSINESS',
    caption: 'Looking for fashion creators to showcase our sustainable streetwear collection! 🌿👕 Seeking 3 creators who align with eco-friendly values.',
    media: [
      {
        id: 'm2',
        type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
        order: 0
      }
    ],
    location: {
      name: 'Urban Threads Store, Munich',
      city: 'Munich',
      country: 'Germany',
      geo: new GeoPoint(48.1351, 11.5820)
    },
    tags: ['fashion', 'streetwear', 'sustainable', 'collaboration'],
    status: 'PUBLISHED',
    moderationStatus: 'APPROVED',
    collaborationDetails: {
      budget: 500,
      compensation: 'PAID',
      requirements: ['Min 1k followers', 'Portfolio required', 'Interest in sustainable fashion'],
      deadline: '2026-02-15T00:00:00.000Z',
      spotsAvailable: 3,
      applicants: []
    },
    viewCount: 0,
    saveCount: 0,
    shareCount: 0,
    createdAt: Timestamp.now(),
    publishedAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  },

  // 3. CREATOR - Creator Content
  {
    contentType: 'CREATOR_CONTENT',
    createdBy: 'demo-creator-001',
    creatorName: 'Alex Photography',
    creatorAvatar: 'https://i.pravatar.cc/150?img=5',
    creatorRole: 'CREATOR',
    caption: 'Recent product photography session for a sustainable fashion brand 📸 Shot with natural light to showcase organic textures. Love working with ethical brands!',
    media: [
      {
        id: 'm3',
        type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
        order: 0
      }
    ],
    location: {
      name: 'Studio Berlin',
      city: 'Berlin',
      country: 'Germany',
      geo: new GeoPoint(52.5200, 13.4050)
    },
    tags: ['photography', 'productphotography', 'fashion', 'berlin'],
    status: 'PUBLISHED',
    moderationStatus: 'APPROVED',
    viewCount: 0,
    saveCount: 0,
    shareCount: 0,
    createdAt: Timestamp.now(),
    publishedAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }
];

async function seed() {
  console.log('🌱 Creating 3 example feed posts...\n');
  
  try {
    const feedPostsRef = collection(db, 'feedPosts');
    
    for (const post of posts) {
      const docRef = await addDoc(feedPostsRef, post);
      console.log(`✅ Created: ${post.contentType} by ${post.creatorName}`);
      console.log(`   ID: ${docRef.id}\n`);
    }
    
    console.log('🎉 Done! Visit https://fluzio-13af2.web.app/ and go to Feed tab');
    console.log('\n📱 Test as:');
    console.log('   - User: See the coffee shop experience');
    console.log('   - Creator: See the collaboration call + creator work');
    console.log('   - Business: See creator work + collab call');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seed();

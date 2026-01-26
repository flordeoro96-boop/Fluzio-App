/**
 * Seed Feed Data Script
 * Creates sample feed posts for testing the native feed system
 * Run with: ts-node scripts/seedFeedData.ts
 * 
 * NOTE: This script is disabled during Supabase migration
 * TODO: Rewrite to use Supabase client
 */

// import { initializeApp } from 'firebase/app';
import { collection, addDoc, Timestamp } from '../services/firestoreCompat';
import { ContentType, MediaType } from '../types';

console.log('[Seed Script] This script is disabled during Supabase migration');
console.log('[Seed Script] Please use Supabase dashboard or SQL to seed data');

// Stubbed for migration
const db: any = null;

const samplePosts = [
  {
    contentType: ContentType.EXPERIENCE_POST,
    createdBy: 'user123',
    creatorName: 'Sarah Martinez',
    creatorAvatar: 'https://i.pravatar.cc/150?img=1',
    creatorRole: 'MEMBER',
    caption: 'Just had the most amazing coffee at this hidden gem in Berlin Mitte! ☕✨ The atmosphere is perfect for working or catching up with friends. Highly recommend the flat white!',
    media: [
      {
        id: '1',
        type: MediaType.IMAGE,
        url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
        order: 0
      }
    ],
    location: {
      name: 'Café Mitte',
      city: 'Berlin',
      country: 'Germany',
      geo: {
        latitude: 52.5200,
        longitude: 13.4050
      }
    },
    tags: ['coffee', 'cafe', 'berlin', 'mitte', 'workfriendly'],
    status: 'PUBLISHED',
    moderationStatus: 'APPROVED',
    viewCount: 0,
    saveCount: 0,
    shareCount: 0
  },
  {
    contentType: ContentType.COLLABORATION_CALL,
    createdBy: 'business456',
    creatorName: 'Urban Threads',
    creatorAvatar: 'https://i.pravatar.cc/150?img=20',
    creatorRole: 'BUSINESS',
    caption: 'Looking for fashion creators to showcase our new sustainable streetwear collection! 🌿👕 We\'re seeking 3 creators who share our values of eco-friendly fashion.',
    media: [
      {
        id: '2',
        type: MediaType.IMAGE,
        url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
        order: 0
      }
    ],
    location: {
      name: 'Urban Threads Store',
      city: 'Munich',
      country: 'Germany',
      geo: {
        latitude: 48.1351,
        longitude: 11.5820
      }
    },
    tags: ['fashion', 'streetwear', 'sustainable', 'collaboration', 'creators'],
    status: 'PUBLISHED',
    moderationStatus: 'APPROVED',
    collaborationDetails: {
      budget: 500,
      compensation: 'PAID',
      requirements: ['Minimum 1k followers', 'Portfolio required', 'Interest in sustainable fashion'],
      deadline: new Date('2026-02-15').toISOString(),
      spotsAvailable: 3,
      applicants: []
    },
    viewCount: 0,
    saveCount: 0,
    shareCount: 0
  },
  {
    contentType: ContentType.CREATOR_CONTENT,
    createdBy: 'creator789',
    creatorName: 'Alex Photography',
    creatorAvatar: 'https://i.pravatar.cc/150?img=5',
    creatorRole: 'CREATOR',
    caption: 'Golden hour at Brandenburg Gate 🌅 One of my favorite spots in Berlin for architectural photography. The light during sunset creates such magical moments.',
    media: [
      {
        id: '3',
        type: MediaType.IMAGE,
        url: 'https://images.unsplash.com/photo-1560930950-5cc20e80e392?w=800',
        order: 0
      }
    ],
    location: {
      name: 'Brandenburg Gate',
      city: 'Berlin',
      country: 'Germany',
      geo: {
        latitude: 52.5163,
        longitude: 13.3777
      }
    },
    tags: ['photography', 'berlin', 'architecture', 'goldenhour', 'travel'],
    status: 'PUBLISHED',
    moderationStatus: 'APPROVED',
    viewCount: 0,
    saveCount: 0,
    shareCount: 0
  },
  {
    contentType: ContentType.BUSINESS_ANNOUNCEMENT,
    createdBy: 'business999',
    creatorName: 'Green Eats Berlin',
    creatorAvatar: 'https://i.pravatar.cc/150?img=15',
    creatorRole: 'BUSINESS',
    caption: '🎉 New Menu Launch! We\'re excited to introduce our winter specials featuring locally sourced ingredients from Brandenburg farms. Come try our new vegan comfort food dishes!',
    media: [
      {
        id: '4',
        type: MediaType.IMAGE,
        url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
        order: 0
      }
    ],
    location: {
      name: 'Green Eats Berlin',
      city: 'Berlin',
      country: 'Germany',
      geo: {
        latitude: 52.5070,
        longitude: 13.4262
      }
    },
    tags: ['vegan', 'food', 'restaurant', 'berlin', 'sustainable', 'local'],
    status: 'PUBLISHED',
    moderationStatus: 'APPROVED',
    viewCount: 0,
    saveCount: 0,
    shareCount: 0
  },
  {
    contentType: ContentType.EVENT_PREVIEW,
    createdBy: 'admin001',
    creatorName: 'Fluzio Events',
    creatorAvatar: 'https://i.pravatar.cc/150?img=25',
    creatorRole: 'ADMIN',
    caption: '📅 Join us for the Berlin Creator Meetup! Network with local creators, businesses, and fellow community members. Limited spots available - register now!',
    media: [
      {
        id: '5',
        type: MediaType.IMAGE,
        url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
        order: 0
      }
    ],
    location: {
      name: 'Impact Hub Berlin',
      city: 'Berlin',
      country: 'Germany',
      geo: {
        latitude: 52.5238,
        longitude: 13.4127
      }
    },
    tags: ['networking', 'creators', 'event', 'meetup', 'berlin', 'community'],
    eventId: 'event_berlin_creators_2026',
    status: 'PUBLISHED',
    moderationStatus: 'APPROVED',
    viewCount: 0,
    saveCount: 0,
    shareCount: 0
  },
  {
    contentType: ContentType.MOMENT,
    createdBy: 'user456',
    creatorName: 'Mike Johnson',
    creatorAvatar: 'https://i.pravatar.cc/150?img=12',
    creatorRole: 'MEMBER',
    caption: 'Sunday brunch vibes 🥐☕',
    media: [
      {
        id: '6',
        type: MediaType.IMAGE,
        url: 'https://images.unsplash.com/photo-1533910534207-90f31029a78e?w=800',
        order: 0
      }
    ],
    location: {
      name: 'Kreuzberg',
      city: 'Berlin',
      country: 'Germany',
      geo: {
        latitude: 52.4991,
        longitude: 13.4102
      }
    },
    tags: ['brunch', 'sunday', 'food', 'berlin'],
    status: 'PUBLISHED',
    moderationStatus: 'APPROVED',
    viewCount: 0,
    saveCount: 0,
    shareCount: 0
  }
];

async function seedFeedData() {
  console.log('🌱 Starting feed data seeding...');
  
  try {
    const feedPostsRef = collection(db, 'feedPosts');
    
    for (const post of samplePosts) {
      const docData = {
        ...post,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        publishedAt: Timestamp.now(),
        // Convert geo to Firestore GeoPoint if present
        ...(post.location?.geo && {
          location: {
            ...post.location,
            geo: new GeoPoint(post.location.geo.latitude, post.location.geo.longitude)
          }
        })
      };
      
      const docRef = await addDoc(feedPostsRef, docData);
      console.log(`✅ Created post: ${post.contentType} by ${post.creatorName} (ID: ${docRef.id})`);
    }
    
    console.log('\n🎉 Feed data seeding complete!');
    console.log(`Created ${samplePosts.length} sample posts`);
    console.log('\nYou can now:');
    console.log('- Open the app and navigate to the Feed tab');
    console.log('- Test role-based filtering (User/Creator/Business views)');
    console.log('- Try creating new posts with the + button');
    console.log('- Test save/unsave functionality');
    console.log('- Apply to collaboration posts as a creator');
    
  } catch (error) {
    console.error('❌ Error seeding feed data:', error);
  }
}

// Run the seeding function
seedFeedData().then(() => {
  console.log('\n✨ Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

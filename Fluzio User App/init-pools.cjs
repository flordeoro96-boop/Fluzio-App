/**
 * One-time script to initialize participant and energy pools for existing users
 */

const admin = require('firebase-admin');

// Use default credentials (requires GOOGLE_APPLICATION_CREDENTIALS env var)
// Or we can use the functions service account
admin.initializeApp({
  projectId: 'fluzio-13af2'
});

const db = admin.firestore();

const PARTICIPANT_POOL_LIMITS = {
  FREE: 20,
  SILVER: 40,
  GOLD: 120,
  PLATINUM: -1 // unlimited
};

const ENERGY_POOL_LIMITS = {
  FREE: 20,
  SILVER: 40,
  GOLD: 80,
  PLATINUM: 150
};

async function initializePoolsForUser(userId, subscriptionLevel) {
  try {
    console.log(`\n=== Initializing pools for user: ${userId} ===`);
    console.log(`Subscription Level: ${subscriptionLevel}`);
    
    const batch = db.batch();
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);
    
    // Initialize Participant Pool
    const participantPoolRef = db.collection('participantPools').doc(userId);
    const participantPoolData = {
      businessId: userId,
      tier: subscriptionLevel,
      used: 0,
      limit: PARTICIPANT_POOL_LIMITS[subscriptionLevel] || 20,
      cycleStart: admin.firestore.Timestamp.fromDate(now),
      cycleEnd: admin.firestore.Timestamp.fromDate(nextMonth),
      lastReset: admin.firestore.Timestamp.fromDate(now)
    };
    batch.set(participantPoolRef, participantPoolData);
    console.log(`✓ Participant Pool: ${participantPoolData.limit} participants/month`);
    
    // Initialize Mission Energy Pool
    const energyPoolRef = db.collection('missionEnergyPools').doc(userId);
    const energyPoolData = {
      businessId: userId,
      tier: subscriptionLevel,
      used: 0,
      limit: ENERGY_POOL_LIMITS[subscriptionLevel] || 20,
      cycleStart: admin.firestore.Timestamp.fromDate(now),
      cycleEnd: admin.firestore.Timestamp.fromDate(nextMonth),
      lastReset: admin.firestore.Timestamp.fromDate(now)
    };
    batch.set(energyPoolRef, energyPoolData);
    console.log(`✓ Mission Energy Pool: ${energyPoolData.limit} energy/month`);
    
    await batch.commit();
    console.log(`✅ Pools initialized successfully!\n`);
    
  } catch (error) {
    console.error('Error initializing pools:', error);
  }
}

// Initialize pools for your user
const userId = 'fKu5X9hQWzPKknRnwJIFzGsCVCw1';
const subscriptionLevel = 'GOLD'; // Your subscription level

initializePoolsForUser(userId, subscriptionLevel)
  .then(() => {
    console.log('✅ All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

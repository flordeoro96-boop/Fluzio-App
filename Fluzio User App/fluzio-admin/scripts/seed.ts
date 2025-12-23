// Seed script to populate Firestore with initial data
// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { AdminRole } from '@/lib/types';

const db = getAdminDb();
const auth = getAdminAuth();

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // ============ CREATE ADMINS ============
    console.log('Creating admins...');

    // Super Admin
    const superAdminUser = await auth.createUser({
      email: 'super@fluzio.com',
      password: 'SuperAdmin123!',
      emailVerified: true,
    });

    await db.collection('admins').doc(superAdminUser.uid).set({
      uid: superAdminUser.uid,
      email: 'super@fluzio.com',
      role: AdminRole.SUPER_ADMIN,
      countryScopes: ['GLOBAL'],
      status: 'ACTIVE',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log('✅ Super Admin created: super@fluzio.com / SuperAdmin123!');

    // Country Admin (Germany)
    const deAdminUser = await auth.createUser({
      email: 'admin.de@fluzio.com',
      password: 'AdminDE123!',
      emailVerified: true,
    });

    await db.collection('admins').doc(deAdminUser.uid).set({
      uid: deAdminUser.uid,
      email: 'admin.de@fluzio.com',
      role: AdminRole.COUNTRY_ADMIN,
      countryScopes: ['DE'],
      status: 'ACTIVE',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log('✅ Country Admin (DE) created: admin.de@fluzio.com / AdminDE123!');

    // Finance Admin (Global)
    const financeUser = await auth.createUser({
      email: 'finance@fluzio.com',
      password: 'Finance123!',
      emailVerified: true,
    });

    await db.collection('admins').doc(financeUser.uid).set({
      uid: financeUser.uid,
      email: 'finance@fluzio.com',
      role: AdminRole.FINANCE,
      countryScopes: ['GLOBAL'],
      status: 'ACTIVE',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log('✅ Finance Admin created: finance@fluzio.com / Finance123!');

    // ============ CREATE COUNTRIES ============
    console.log('\nCreating countries...');

    await db.collection('countries').doc('DE').set({
      countryId: 'DE',
      name: 'Germany',
      status: 'SOFT_LAUNCH',
      currency: 'EUR',
      language: 'de',
      timeZone: 'Europe/Berlin',
      featureFlags: {
        publicSignupEnabled: true,
        missionsEnabled: true,
        eventsEnabled: false,
        payoutAutomationEnabled: false,
        marketingToolsEnabled: false,
      },
      fees: {
        subscription: 29.99,
        commissionPct: 15,
        eventTicketFeePct: 5,
      },
      payoutRules: {
        minPayoutAmount: 50,
        newCreatorHoldDays: 14,
      },
      moderationThresholds: {
        strikeLimit: 3,
        autoSuspendDisputeRate: 0.2,
      },
      allowedMissionTypes: ['INSTAGRAM_POST', 'INSTAGRAM_STORY', 'TIKTOK_VIDEO'],
      allowedEventTypes: ['FUN_MEETUP', 'BUSINESS_EVENT'],
      launch: {
        readinessScore: 75,
        checklistByPhase: {
          SOFT_LAUNCH: {
            items: [
              { id: '1', label: 'Payment gateway integrated', completed: true, completedAt: Timestamp.now() },
              { id: '2', label: 'First 10 businesses onboarded', completed: true, completedAt: Timestamp.now() },
              { id: '3', label: 'First 20 creators verified', completed: false },
              { id: '4', label: 'Legal compliance verified', completed: true, completedAt: Timestamp.now() },
            ],
          },
        },
      },
      admins: [deAdminUser.uid],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log('✅ Country created: Germany (DE) - SOFT_LAUNCH');

    await db.collection('countries').doc('AE').set({
      countryId: 'AE',
      name: 'United Arab Emirates',
      status: 'PLANNED',
      currency: 'AED',
      language: 'ar',
      timeZone: 'Asia/Dubai',
      featureFlags: {
        publicSignupEnabled: false,
        missionsEnabled: false,
        eventsEnabled: false,
        payoutAutomationEnabled: false,
        marketingToolsEnabled: false,
      },
      fees: {
        subscription: 109.99,
        commissionPct: 15,
        eventTicketFeePct: 5,
      },
      payoutRules: {
        minPayoutAmount: 200,
        newCreatorHoldDays: 21,
      },
      moderationThresholds: {
        strikeLimit: 3,
        autoSuspendDisputeRate: 0.15,
      },
      allowedMissionTypes: ['INSTAGRAM_POST', 'INSTAGRAM_STORY'],
      allowedEventTypes: ['BUSINESS_EVENT', 'HYBRID'],
      launch: {
        readinessScore: 30,
        checklistByPhase: {
          PLANNED: {
            items: [
              { id: '1', label: 'Market research completed', completed: true, completedAt: Timestamp.now() },
              { id: '2', label: 'Legal entity established', completed: false },
              { id: '3', label: 'Payment gateway selected', completed: false },
              { id: '4', label: 'Initial team hired', completed: false },
            ],
          },
        },
      },
      admins: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log('✅ Country created: UAE (AE) - PLANNED');

    // ============ CREATE POLICIES ============
    console.log('\nCreating governance policies...');

    await db.collection('policies').add({
      version: 1,
      thresholds: {
        eventApprovalLimit: 20000,
        payoutReleaseTrustMin: 70,
        highRiskScore: 80,
      },
      updatedAt: Timestamp.now(),
      updatedByAdminId: superAdminUser.uid,
    });
    console.log('✅ Policy v1 created with initial thresholds');

    // ============ CREATE BUSINESSES ============
    console.log('\nCreating sample businesses...');

    const business1Ref = await db.collection('businesses').add({
      countryId: 'DE',
      name: 'Berlin Coffee House',
      industry: 'Food & Beverage',
      tier: 'GOLD',
      verified: true,
      status: 'ACTIVE',
      riskScore: 20,
      disputeCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const business2Ref = await db.collection('businesses').add({
      countryId: 'DE',
      name: 'Munich Fashion Boutique',
      industry: 'Retail',
      tier: 'PLATINUM',
      verified: true,
      status: 'ACTIVE',
      riskScore: 15,
      disputeCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log(`✅ Created 2 businesses (IDs: ${business1Ref.id}, ${business2Ref.id})`);

    // ============ CREATE CREATORS ============
    console.log('\nCreating sample creators...');

    const creator1Ref = await db.collection('creators').add({
      countryId: 'DE',
      displayName: 'Anna Schmidt',
      verified: true,
      status: 'ACTIVE',
      trustScore: 85,
      riskScore: 10,
      disputeCount: 0,
      payoutFrozen: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const creator2Ref = await db.collection('creators').add({
      countryId: 'DE',
      displayName: 'Max Mueller',
      verified: true,
      status: 'ACTIVE',
      trustScore: 92,
      riskScore: 5,
      disputeCount: 0,
      payoutFrozen: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const creator3Ref = await db.collection('creators').add({
      countryId: 'DE',
      displayName: 'Sarah Weber',
      verified: false,
      status: 'ACTIVE',
      trustScore: 45,
      riskScore: 30,
      disputeCount: 1,
      payoutFrozen: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log(`✅ Created 3 creators (IDs: ${creator1Ref.id}, ${creator2Ref.id}, ${creator3Ref.id})`);

    // ============ CREATE MISSIONS ============
    console.log('\nCreating sample missions...');

    await db.collection('missions').add({
      countryId: 'DE',
      businessId: business1Ref.id,
      creatorIds: [creator1Ref.id],
      status: 'COMPLETED',
      missionType: 'INSTAGRAM_POST',
      budget: 150,
      dispute: { isDisputed: false },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await db.collection('missions').add({
      countryId: 'DE',
      businessId: business2Ref.id,
      creatorIds: [creator2Ref.id],
      status: 'LIVE',
      missionType: 'INSTAGRAM_STORY',
      budget: 200,
      dispute: { isDisputed: false },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await db.collection('missions').add({
      countryId: 'DE',
      businessId: business1Ref.id,
      creatorIds: [creator3Ref.id],
      status: 'DISPUTED',
      missionType: 'INSTAGRAM_POST',
      budget: 180,
      dispute: {
        isDisputed: true,
        reason: 'Content did not match requirements',
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log('✅ Created 3 missions (1 completed, 1 live, 1 disputed)');

    // ============ CREATE EVENTS ============
    console.log('\nCreating sample events...');

    await db.collection('events').add({
      countryId: 'DE',
      type: 'FUN_MEETUP',
      title: 'Berlin Creator Meetup',
      organizerBusinessId: business1Ref.id,
      capacity: 50,
      budget: 5000,
      ticketing: { mode: 'FREE' },
      attendanceCount: 0,
      status: 'PUBLISHED',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await db.collection('events').add({
      countryId: 'DE',
      type: 'BUSINESS_EVENT',
      title: 'Fashion Brand Launch Party',
      organizerBusinessId: business2Ref.id,
      capacity: 100,
      budget: 25000,
      ticketing: { mode: 'PAID', price: 49.99, tierGate: ['GOLD', 'PLATINUM'] },
      attendanceCount: 0,
      status: 'DRAFT',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log('✅ Created 2 events (1 published, 1 draft)');

    // ============ CREATE PAYOUTS ============
    console.log('\nCreating sample payouts...');

    await db.collection('payouts').add({
      countryId: 'DE',
      creatorId: creator1Ref.id,
      amount: 150,
      currency: 'EUR',
      status: 'PAID',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await db.collection('payouts').add({
      countryId: 'DE',
      creatorId: creator2Ref.id,
      amount: 200,
      currency: 'EUR',
      status: 'PENDING',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await db.collection('payouts').add({
      countryId: 'DE',
      creatorId: creator3Ref.id,
      amount: 180,
      currency: 'EUR',
      status: 'HELD',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log('✅ Created 3 payouts (1 paid, 1 pending, 1 held)');

    // ============ CREATE TRANSACTIONS ============
    console.log('\nCreating sample transactions...');

    for (let i = 0; i < 5; i++) {
      await db.collection('transactions').add({
        countryId: 'DE',
        type: 'MISSION_PAYMENT',
        amount: 150 + i * 10,
        currency: 'EUR',
        sourceEntityType: 'BUSINESS',
        sourceEntityId: business1Ref.id,
        destEntityType: 'CREATOR',
        destEntityId: creator1Ref.id,
        createdAt: Timestamp.now(),
      });
    }

    console.log('✅ Created 5 transactions');

    // ============ CREATE MODERATION REPORTS ============
    console.log('\nCreating sample moderation reports...');

    await db.collection('moderationReports').add({
      countryId: 'DE',
      entityType: 'CREATOR',
      entityId: creator3Ref.id,
      reason: 'Inappropriate content posted',
      status: 'IN_REVIEW',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log('✅ Created 1 moderation report');

    console.log('\n✅ Database seeded successfully!\n');
    console.log('🔐 Admin Credentials:');
    console.log('   Super Admin:   super@fluzio.com / SuperAdmin123!');
    console.log('   Country Admin: admin.de@fluzio.com / AdminDE123!');
    console.log('   Finance Admin: finance@fluzio.com / Finance123!\n');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log('Seed completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });

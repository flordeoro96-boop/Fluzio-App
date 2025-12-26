import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    // Get first 10 users to see their structure
    const usersSnapshot = await db.collection('users')
      .limit(10)
      .get();
    
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));
    
    // Get count by different fields
    const queries = await Promise.all([
      db.collection('users').where('operatingCountry', '==', 'DE').limit(5).get(),
      db.collection('users').where('countryCode', '==', '+49').limit(5).get(),
      db.collection('users').where('country', '==', 'Germany').limit(5).get(),
      db.collection('users').where('country', '==', 'DE').limit(5).get(),
    ]);
    
    return NextResponse.json({
      totalUsers: usersSnapshot.size,
      sampleUsers: users,
      queryResults: {
        operatingCountryDE: queries[0].size,
        countryCodePlus49: queries[1].size,
        countryGermany: queries[2].size,
        countryDE: queries[3].size,
      },
      sampleFromQueries: {
        operatingCountryDE: queries[0].docs[0]?.data(),
        countryCodePlus49: queries[1].docs[0]?.data(),
        countryGermany: queries[2].docs[0]?.data(),
        countryDE: queries[3].docs[0]?.data(),
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

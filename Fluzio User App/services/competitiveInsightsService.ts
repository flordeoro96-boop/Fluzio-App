/**
 * Competitive Insights Service
 * 
 * Provides market intelligence, competitor analysis, and pricing insights
 * to help creators stay competitive and optimize their offerings.
 */

import { db } from './apiService';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  limit,
  Timestamp
} from '../services/firestoreCompat';

export interface MarketInsights {
  averageRating: number;
  averageResponseTime: number; // in hours
  averageBookingRate: number; // percentage
  averageProjectValue: number;
  topSkills: string[];
  trendingCategories: string[];
  marketGrowth: number; // percentage
  totalActiveCreators: number;
}

export interface CompetitorProfile {
  id: string;
  name: string;
  category: string;
  rating: number;
  totalProjects: number;
  averagePrice: number;
  responseTime: number;
  skills: string[];
  strengths: string[];
  lastActive: Timestamp;
}

export interface PricingRecommendation {
  suggestedMinPrice: number;
  suggestedMaxPrice: number;
  marketAverage: number;
  yourCurrentPrice: number;
  confidence: number; // 0-100
  reasoning: string[];
  category: string;
}

export interface PerformanceBenchmark {
  metric: string;
  yourValue: number;
  marketAverage: number;
  topPerformers: number;
  percentile: number; // 0-100, where you rank
  status: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'BELOW_AVERAGE' | 'NEEDS_IMPROVEMENT';
  recommendation: string;
}

export interface CompetitiveAnalysis {
  creatorId: string;
  marketPosition: 'LEADER' | 'STRONG' | 'AVERAGE' | 'EMERGING' | 'NEW';
  competitivenessScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  marketInsights: MarketInsights;
  topCompetitors: CompetitorProfile[];
  pricingRecommendations: PricingRecommendation[];
  performanceBenchmarks: PerformanceBenchmark[];
  generatedAt: Timestamp;
}

/**
 * Get market insights for a specific category
 */
export const getMarketInsights = async (category: string): Promise<MarketInsights> => {
  try {
    // Query all creators in the same category
    const creatorsRef = collection(db, 'users');
    const q = query(
      creatorsRef,
      where('role', '==', 'CREATOR'),
      where('category', '==', category),
      limit(100)
    );

    const snapshot = await getDocs(q);
    const creators = snapshot.docs.map(doc => doc.data());

    // Calculate aggregated metrics
    const totalCreators = creators.length;
    const avgRating = creators.reduce((sum, c) => sum + (c.rating || 0), 0) / totalCreators || 0;
    
    // Collect all skills from creators
    const allSkills = creators.flatMap(c => c.skills || []);
    const skillCounts: { [key: string]: number } = {};
    allSkills.forEach(skill => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
    
    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill]) => skill);

    return {
      averageRating: avgRating,
      averageResponseTime: 4.5, // Mock data - would come from actual response time tracking
      averageBookingRate: 65, // Mock data
      averageProjectValue: 1250, // Mock data
      topSkills,
      trendingCategories: [category, 'Content Creation', 'Social Media'], // Mock
      marketGrowth: 12.5, // Mock data - percentage growth
      totalActiveCreators: totalCreators
    };
  } catch (error) {
    console.error('[CompetitiveInsights] Error getting market insights:', error);
    return {
      averageRating: 0,
      averageResponseTime: 0,
      averageBookingRate: 0,
      averageProjectValue: 0,
      topSkills: [],
      trendingCategories: [],
      marketGrowth: 0,
      totalActiveCreators: 0
    };
  }
};

/**
 * Find competitors for a creator
 */
export const findCompetitors = async (
  creatorId: string,
  category: string,
  skills: string[],
  maxResults: number = 5
): Promise<CompetitorProfile[]> => {
  try {
    const creatorsRef = collection(db, 'users');
    const q = query(
      creatorsRef,
      where('role', '==', 'CREATOR'),
      where('category', '==', category),
      limit(20) // Get more to filter and rank
    );

    const snapshot = await getDocs(q);
    const competitors: CompetitorProfile[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      
      // Skip self
      if (docSnap.id === creatorId) continue;

      // Calculate skill overlap
      const competitorSkills = data.skills || [];
      const skillOverlap = skills.filter(s => competitorSkills.includes(s)).length;

      // Only include if there's skill overlap
      if (skillOverlap > 0) {
        competitors.push({
          id: docSnap.id,
          name: data.displayName || data.name || 'Anonymous Creator',
          category: data.category || category,
          rating: data.rating || 0,
          totalProjects: data.completedProjects || 0,
          averagePrice: data.averagePrice || 1000,
          responseTime: data.averageResponseTime || 24,
          skills: competitorSkills,
          strengths: [
            skillOverlap >= 3 ? 'Similar skill set' : 'Complementary skills',
            data.rating >= 4.5 ? 'Highly rated' : 'Good reputation',
            data.completedProjects >= 10 ? 'Experienced' : 'Active'
          ],
          lastActive: data.lastActive || Timestamp.now()
        });
      }
    }

    // Sort by rating and project count
    competitors.sort((a, b) => {
      const scoreA = a.rating * 20 + a.totalProjects;
      const scoreB = b.rating * 20 + b.totalProjects;
      return scoreB - scoreA;
    });

    return competitors.slice(0, maxResults);
  } catch (error) {
    console.error('[CompetitiveInsights] Error finding competitors:', error);
    return [];
  }
};

/**
 * Generate pricing recommendations
 */
export const generatePricingRecommendations = async (
  category: string,
  currentPrice: number,
  rating: number,
  experienceLevel: number
): Promise<PricingRecommendation[]> => {
  try {
    // Get market data for pricing
    const insights = await getMarketInsights(category);
    
    const marketAvg = insights.averageProjectValue;
    const ratingMultiplier = rating / 4.0; // Normalize rating to multiplier
    const experienceMultiplier = 1 + (experienceLevel / 10); // Add 10% per experience level
    
    const suggestedBase = marketAvg * ratingMultiplier * experienceMultiplier;
    const suggestedMin = suggestedBase * 0.8;
    const suggestedMax = suggestedBase * 1.4;

    const reasoning: string[] = [];
    
    if (currentPrice < suggestedMin) {
      reasoning.push('Your prices are below market average - consider increasing');
      reasoning.push(`${rating >= 4.0 ? 'Your high rating' : 'Your experience'} justifies higher rates`);
    } else if (currentPrice > suggestedMax) {
      reasoning.push('Your prices are above market average');
      reasoning.push('Consider offering premium packages to justify premium pricing');
    } else {
      reasoning.push('Your pricing is competitive with the market');
      reasoning.push('Consider creating tiered packages for different budgets');
    }

    if (insights.marketGrowth > 10) {
      reasoning.push(`Market is growing ${insights.marketGrowth.toFixed(1)}% - opportunity to increase rates`);
    }

    const priceVariance = Math.abs(currentPrice - suggestedBase) / suggestedBase;
    const confidence = Math.max(0, Math.min(100, 100 - priceVariance * 100));

    return [
      {
        suggestedMinPrice: Math.round(suggestedMin),
        suggestedMaxPrice: Math.round(suggestedMax),
        marketAverage: Math.round(marketAvg),
        yourCurrentPrice: currentPrice,
        confidence: Math.round(confidence),
        reasoning,
        category
      }
    ];
  } catch (error) {
    console.error('[CompetitiveInsights] Error generating pricing recommendations:', error);
    return [];
  }
};

/**
 * Generate performance benchmarks
 */
export const generatePerformanceBenchmarks = async (
  creatorId: string,
  category: string
): Promise<PerformanceBenchmark[]> => {
  try {
    const insights = await getMarketInsights(category);
    
    // Get creator's own analytics
    const analyticsRef = collection(db, 'creatorAnalytics');
    const q = query(analyticsRef, where('creatorId', '==', creatorId), limit(1));
    const snapshot = await getDocs(q);
    
    const creatorAnalytics = snapshot.docs[0]?.data() || {};
    
    const benchmarks: PerformanceBenchmark[] = [];

    // Rating Benchmark
    const yourRating = creatorAnalytics.averageRating || 0;
    const ratingPercentile = (yourRating / 5.0) * 100;
    benchmarks.push({
      metric: 'Client Satisfaction (Rating)',
      yourValue: yourRating,
      marketAverage: insights.averageRating,
      topPerformers: 4.8,
      percentile: ratingPercentile,
      status: yourRating >= 4.5 ? 'EXCELLENT' : yourRating >= 4.0 ? 'GOOD' : yourRating >= 3.5 ? 'AVERAGE' : 'NEEDS_IMPROVEMENT',
      recommendation: yourRating < 4.0 ? 'Focus on client communication and quality delivery' : 'Maintain high quality standards'
    });

    // Response Time Benchmark
    const yourResponseTime = creatorAnalytics.averageResponseTime || 24;
    const responsePercentile = Math.max(0, 100 - (yourResponseTime / 24) * 100);
    benchmarks.push({
      metric: 'Response Time (hours)',
      yourValue: yourResponseTime,
      marketAverage: insights.averageResponseTime,
      topPerformers: 2,
      percentile: responsePercentile,
      status: yourResponseTime <= 4 ? 'EXCELLENT' : yourResponseTime <= 12 ? 'GOOD' : yourResponseTime <= 24 ? 'AVERAGE' : 'NEEDS_IMPROVEMENT',
      recommendation: yourResponseTime > 12 ? 'Faster responses lead to more bookings' : 'Excellent responsiveness!'
    });

    // Booking Rate Benchmark
    const yourBookingRate = creatorAnalytics.bookingRate || 50;
    benchmarks.push({
      metric: 'Booking Conversion Rate (%)',
      yourValue: yourBookingRate,
      marketAverage: insights.averageBookingRate,
      topPerformers: 85,
      percentile: yourBookingRate,
      status: yourBookingRate >= 75 ? 'EXCELLENT' : yourBookingRate >= 60 ? 'GOOD' : yourBookingRate >= 45 ? 'AVERAGE' : 'NEEDS_IMPROVEMENT',
      recommendation: yourBookingRate < 60 ? 'Improve your portfolio and response quality' : 'Great conversion rate!'
    });

    // Project Value Benchmark
    const yourProjectValue = creatorAnalytics.averageProjectValue || 800;
    const valuePercentile = (yourProjectValue / insights.averageProjectValue) * 50 + 50;
    benchmarks.push({
      metric: 'Average Project Value ($)',
      yourValue: yourProjectValue,
      marketAverage: insights.averageProjectValue,
      topPerformers: insights.averageProjectValue * 1.5,
      percentile: Math.min(100, valuePercentile),
      status: yourProjectValue >= insights.averageProjectValue * 1.2 ? 'EXCELLENT' : 
              yourProjectValue >= insights.averageProjectValue ? 'GOOD' : 
              yourProjectValue >= insights.averageProjectValue * 0.8 ? 'AVERAGE' : 'NEEDS_IMPROVEMENT',
      recommendation: yourProjectValue < insights.averageProjectValue ? 'Consider upselling premium services' : 'Strong pricing strategy'
    });

    return benchmarks;
  } catch (error) {
    console.error('[CompetitiveInsights] Error generating benchmarks:', error);
    return [];
  }
};

/**
 * Generate comprehensive competitive analysis
 */
export const generateCompetitiveAnalysis = async (
  creatorId: string,
  category: string,
  skills: string[],
  rating: number,
  completedProjects: number,
  currentPrice: number
): Promise<CompetitiveAnalysis> => {
  try {
    const [marketInsights, competitors, pricingRecommendations, performanceBenchmarks] = await Promise.all([
      getMarketInsights(category),
      findCompetitors(creatorId, category, skills),
      generatePricingRecommendations(category, currentPrice, rating, completedProjects),
      generatePerformanceBenchmarks(creatorId, category)
    ]);

    // Calculate competitiveness score
    const ratingScore = (rating / 5.0) * 30;
    const experienceScore = Math.min(30, completedProjects * 2);
    const pricingScore = pricingRecommendations[0]?.confidence || 0;
    const benchmarkScore = performanceBenchmarks.reduce((sum, b) => sum + b.percentile, 0) / performanceBenchmarks.length * 0.4;
    
    const competitivenessScore = Math.round(ratingScore + experienceScore + pricingScore * 0.2 + benchmarkScore);

    // Determine market position
    let marketPosition: CompetitiveAnalysis['marketPosition'];
    if (competitivenessScore >= 85) marketPosition = 'LEADER';
    else if (competitivenessScore >= 70) marketPosition = 'STRONG';
    else if (competitivenessScore >= 50) marketPosition = 'AVERAGE';
    else if (competitivenessScore >= 30) marketPosition = 'EMERGING';
    else marketPosition = 'NEW';

    // Generate SWOT analysis
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const opportunities: string[] = [];
    const threats: string[] = [];

    // Strengths
    if (rating >= 4.5) strengths.push('Excellent client satisfaction ratings');
    if (completedProjects >= 20) strengths.push('Extensive project experience');
    if (skills.length >= 5) strengths.push('Diverse skill set');
    if (performanceBenchmarks.some(b => b.status === 'EXCELLENT')) {
      strengths.push('Strong performance in key metrics');
    }

    // Weaknesses
    if (rating < 4.0) weaknesses.push('Rating below market average');
    if (completedProjects < 5) weaknesses.push('Limited project history');
    if (currentPrice < marketInsights.averageProjectValue * 0.8) {
      weaknesses.push('Underpriced compared to market');
    }
    if (performanceBenchmarks.some(b => b.status === 'NEEDS_IMPROVEMENT')) {
      weaknesses.push('Some performance metrics need improvement');
    }

    // Opportunities
    if (marketInsights.marketGrowth > 10) {
      opportunities.push(`Growing market (+${marketInsights.marketGrowth.toFixed(1)}%)`);
    }
    if (currentPrice < marketInsights.averageProjectValue) {
      opportunities.push('Opportunity to increase pricing');
    }
    if (skills.some(s => marketInsights.topSkills.includes(s))) {
      opportunities.push('Your skills are in high demand');
    }
    opportunities.push('Expand service offerings to capture more market share');

    // Threats
    if (competitors.length > 3) {
      threats.push(`${competitors.length} direct competitors identified`);
    }
    if (competitors.some(c => c.rating > rating)) {
      threats.push('Some competitors have higher ratings');
    }
    if (marketInsights.totalActiveCreators > 50) {
      threats.push('Saturated market - differentiation is key');
    }

    return {
      creatorId,
      marketPosition,
      competitivenessScore,
      strengths,
      weaknesses,
      opportunities,
      threats,
      marketInsights,
      topCompetitors: competitors,
      pricingRecommendations,
      performanceBenchmarks,
      generatedAt: Timestamp.now()
    };
  } catch (error) {
    console.error('[CompetitiveInsights] Error generating analysis:', error);
    throw error;
  }
};

/**
 * Save competitive analysis to Firestore
 */
export const saveCompetitiveAnalysis = async (
  analysis: CompetitiveAnalysis
): Promise<{ success: boolean; error?: string }> => {
  try {
    await addDoc(collection(db, 'competitiveAnalyses'), {
      ...analysis,
      createdAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('[CompetitiveInsights] Error saving analysis:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Get saved competitive analyses
 */
export const getSavedAnalyses = async (creatorId: string): Promise<CompetitiveAnalysis[]> => {
  try {
    const analysesRef = collection(db, 'competitiveAnalyses');
    const q = query(
      analysesRef,
      where('creatorId', '==', creatorId),
      orderBy('generatedAt', 'desc'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data()
    } as CompetitiveAnalysis));
  } catch (error) {
    console.error('[CompetitiveInsights] Error getting saved analyses:', error);
    return [];
  }
};

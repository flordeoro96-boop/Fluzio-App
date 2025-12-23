import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Gift, MapPin, Star, Clock, ShoppingBag, TrendingUp, Zap, ChevronRight, Flame, Award, History } from 'lucide-react';
import { Card, Button, Badge } from './Common';
import { getRewardsForCity, getAffordableRewards } from '../src/services/rewardService';
import { getUserBehavior, calculatePersonalizedScore, UserBehavior } from '../services/userBehaviorService';
import { MyRewardsModal } from './MyRewardsModal';
import { redeemReward } from '../services/redemptionService';
import { useTranslation } from 'react-i18next';
import { SkeletonCard, SkeletonList } from './Skeleton';

interface Reward {
    id: string;
    businessId: string;
    businessName?: string;
    title: string;
    description: string;
    costPoints: number;
    city: string;
    district?: string;
    imageUrl?: string;
    type: 'DISCOUNT' | 'FREE_ITEM' | 'VOUCHER' | 'EXPERIENCE' | 'CASHBACK';
    discountPercent?: number;
    totalAvailable?: number;
    remaining?: number;
    terms?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'SOLD_OUT';
}

interface RewardsScreenProps {
    user: User;
}

export const RewardsScreen: React.FC<RewardsScreenProps> = ({ user }) => {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState<string>('All');
    const [showAffordableOnly, setShowAffordableOnly] = useState(false);
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [userBehavior, setUserBehavior] = useState<UserBehavior | null>(null);
    const [showMyRewards, setShowMyRewards] = useState(false);
    const [redeeming, setRedeeming] = useState(false);

    // Reward Points integration
    const [pointsBalance, setPointsBalance] = useState(user.points || 0);
    const [pointsData, setPointsData] = useState<any>(null);
    
    const userPoints = pointsBalance; // Use real-time points balance
    const userCity = user.currentCity || 'Munich';
    const userLevel = user.level || 1;

    // Level-up prediction logic
    const getLevelThresholds = (level: number) => {
        // Progressive point requirements: Level 1=0, 2=100, 3=300, 4=600, 5=1000...
        const base = 100;
        const multiplier = level - 1;
        const currentLevelPoints = multiplier * base * multiplier;
        const nextLevelPoints = level * base * level;
        return { current: currentLevelPoints, next: nextLevelPoints };
    };

    const thresholds = getLevelThresholds(userLevel);
    const pointsInCurrentLevel = userPoints - thresholds.current;
    const pointsNeededForLevel = thresholds.next - thresholds.current;
    const levelProgress = (pointsInCurrentLevel / pointsNeededForLevel) * 100;
    const pointsToNextLevel = thresholds.next - userPoints;
    const isCloseToLevelUp = levelProgress >= 80;

    // Load user behavior profile
    useEffect(() => {
        const loadBehavior = async () => {
            if (user.id) {
                const behavior = await getUserBehavior(user.id);
                setUserBehavior(behavior);
            }
        };
        loadBehavior();
    }, [user.id]);
    
    // Fetch user's reward points from Cloud Function
    useEffect(() => {
        const fetchUserPoints = async () => {
            try {
                const response = await fetch(
                    'https://us-central1-fluzio-13af2.cloudfunctions.net/getUserRewardPoints',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user.id })
                    }
                );
                const data = await response.json();
                
                if (data.success) {
                    setPointsBalance(data.rewardPoints.available);
                    setPointsData(data.rewardPoints);
                } else {
                    // Keep default from user.points
                    console.log('Points API returned error, using user.points');
                }
            } catch (error) {
                console.error('Failed to fetch points:', error);
                // Keep default from user.points
            }
        };
        fetchUserPoints();
    }, [user.id]);

    // Load rewards
    useEffect(() => {
        const loadRewards = async () => {
            setLoading(true);
            try {
                // Call Cloud Function to get available rewards
                const response = await fetch(
                    'https://us-central1-fluzio-13af2.cloudfunctions.net/getAvailableRewards',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            userId: user.id,
                            city: userCity
                        })
                    }
                );
                const data = await response.json();
                
                if (data.success && data.rewards.length > 0) {
                    // Filter by affordability if needed
                    const filtered = showAffordableOnly 
                        ? data.rewards.filter((r: Reward) => r.costPoints <= pointsBalance)
                        : data.rewards;
                    setRewards(filtered);
                } else {
                    // Fallback to mock data if no rewards or API fails
                    const mockData = getMockRewards();
                    const filtered = showAffordableOnly 
                        ? mockData.filter(r => r.costPoints <= pointsBalance)
                        : mockData;
                    setRewards(filtered);
                }
            } catch (error) {
                console.error('Failed to load rewards:', error);
                // Fallback to mock data
                const mockData = getMockRewards();
                const filtered = showAffordableOnly 
                    ? mockData.filter(r => r.costPoints <= pointsBalance)
                    : mockData;
                setRewards(filtered);
            } finally {
                setLoading(false);
            }
        };
        loadRewards();
    }, [userCity, pointsBalance, showAffordableOnly]);

    // Filter rewards by type
    const filteredRewards = selectedType === 'All' 
        ? rewards 
        : rewards.filter(r => r.type === selectedType);

    const types = [
        { key: 'All', icon: '🎁', label: 'All' },
        { key: 'DISCOUNT', icon: '💰', label: 'Discounts' },
        { key: 'FREE_ITEM', icon: '🎉', label: 'Free Items' },
        { key: 'VOUCHER', icon: '🎟️', label: 'Vouchers' },
        { key: 'EXPERIENCE', icon: '✨', label: 'Experiences' },
        { key: 'CASHBACK', icon: '💸', label: 'Cashback' }
    ];

    const getTypeIcon = (type: string) => {
        switch(type) {
            case 'DISCOUNT': return '💰';
            case 'FREE_ITEM': return '🎉';
            case 'VOUCHER': return '🎟️';
            case 'EXPERIENCE': return '✨';
            case 'CASHBACK': return '💸';
            default: return '🎁';
        }
    };

    const canAfford = (cost: number) => userPoints >= cost;

    // Time-based smart sorting
    const getTimeOfDay = () => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 11) return 'morning';       // 6-11am
        if (hour >= 11 && hour < 14) return 'lunch';        // 11am-2pm
        if (hour >= 14 && hour < 17) return 'afternoon';    // 2-5pm
        if (hour >= 17 && hour < 22) return 'evening';      // 5-10pm
        return 'night';                                      // 10pm-6am
    };

    const getRewardRelevanceScore = (reward: Reward) => {
        const timeOfDay = getTimeOfDay();
        let score = 0;
        const lowerTitle = reward.title.toLowerCase();
        const lowerDesc = reward.description.toLowerCase();
        const lowerBusiness = (reward.businessName || '').toLowerCase();
        const combined = `${lowerTitle} ${lowerDesc} ${lowerBusiness}`;

        // AI-Powered personalization boost (0-75 points)
        const personalizedScore = calculatePersonalizedScore(reward, userBehavior);
        score += personalizedScore;

        // Time-based relevance (0-10 points)
        // Morning boost (6-11am)
        if (timeOfDay === 'morning') {
            if (combined.match(/coffee|café|breakfast|bakery|croissant|smoothie/)) score += 5;
        }
        
        // Lunch boost (11am-2pm)
        if (timeOfDay === 'lunch') {
            if (combined.match(/lunch|pizza|burger|restaurant|food|meal/)) score += 5;
        }
        
        // Afternoon boost (2-5pm)
        if (timeOfDay === 'afternoon') {
            if (combined.match(/coffee|café|spa|relaxation|massage|tea/)) score += 5;
        }
        
        // Evening boost (5-10pm)
        if (timeOfDay === 'evening') {
            if (combined.match(/dinner|restaurant|cinema|movie|entertainment|theater/)) score += 5;
        }
        
        // Night boost (10pm-6am)
        if (timeOfDay === 'night') {
            if (combined.match(/bar|club|nightlife|late night/)) score += 5;
        }

        // Boost for affordable rewards
        if (canAfford(reward.costPoints)) score += 5;

        // Boost for limited availability
        if (reward.remaining && reward.remaining < 10) score += 3;

        return score;
    };

    const getTimeBasedLabel = () => {
        const timeOfDay = getTimeOfDay();
        const labels = {
            morning: { text: '☀️ Perfect for Morning', color: 'bg-yellow-100 text-yellow-700' },
            lunch: { text: '🍽️ Great for Lunch', color: 'bg-orange-100 text-orange-700' },
            afternoon: { text: '☕ Afternoon Picks', color: 'bg-amber-100 text-amber-700' },
            evening: { text: '🌆 Evening Specials', color: 'bg-purple-100 text-purple-700' },
            night: { text: '🌙 Late Night Deals', color: 'bg-indigo-100 text-indigo-700' }
        };
        return labels[timeOfDay];
    };

    // Urgency detection
    const getUrgencyLevel = (reward: Reward): 'high' | 'medium' | 'low' | 'none' => {
        if (reward.status === 'SOLD_OUT') return 'none';
        
        if (reward.remaining !== undefined) {
            if (reward.remaining <= 3) return 'high';
            if (reward.remaining <= 10) return 'medium';
            if (reward.remaining <= 20) return 'low';
        }
        
        return 'none';
    };

    const getUrgencyDisplay = (reward: Reward) => {
        const level = getUrgencyLevel(reward);
        
        if (level === 'high') {
            return {
                icon: <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />,
                text: `Only ${reward.remaining} left!`,
                bgColor: 'bg-red-50',
                textColor: 'text-red-700',
                borderColor: 'border-red-200'
            };
        }
        
        if (level === 'medium') {
            return {
                icon: <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />,
                text: `${reward.remaining} remaining`,
                bgColor: 'bg-orange-50',
                textColor: 'text-orange-700',
                borderColor: 'border-orange-200'
            };
        }
        
        if (level === 'low') {
            return {
                icon: null,
                text: `${reward.remaining} available`,
                bgColor: 'bg-gray-50',
                textColor: 'text-gray-600',
                borderColor: 'border-gray-200'
            };
        }
        
        return null;
    };

    // Sort rewards by relevance
    const sortedRewards = [...filteredRewards].sort((a, b) => {
        return getRewardRelevanceScore(b) - getRewardRelevanceScore(a);
    });
    
    // Handle reward redemption
    const handleRedeem = async (reward: Reward) => {
        if (!canAfford(reward.costPoints) || reward.status === 'SOLD_OUT') return;
        
        setRedeeming(true);
        try {
            // Call Cloud Function to redeem
            const response = await fetch(
                'https://us-central1-fluzio-13af2.cloudfunctions.net/redeemRewardPoints',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.id,
                        rewardId: reward.id
                    })
                }
            );
            const data = await response.json();
            
            if (data.success) {
                // Success - show voucher code and update balance
                alert(`✅ ${reward.title} redeemed!\n\nVoucher Code: ${data.voucherCode}\n\nCheck "My Rewards" for details.`);
                setPointsBalance(data.pointsRemaining);
                setSelectedReward(null);
                
                // Reload rewards to reflect updated balance
                const rewardsResponse = await fetch(
                    'https://us-central1-fluzio-13af2.cloudfunctions.net/getAvailableRewards',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user.id, city: userCity })
                    }
                );
                const rewardsData = await rewardsResponse.json();
                if (rewardsData.success) {
                    const filtered = showAffordableOnly 
                        ? rewardsData.rewards.filter((r: Reward) => r.costPoints <= data.pointsRemaining)
                        : rewardsData.rewards;
                    setRewards(filtered);
                }
            } else {
                // Error from API
                alert(`❌ ${data.error || 'Redemption failed. Please try again.'}`);
            }
        } catch (error) {
            console.error('Failed to redeem reward:', error);
            alert('❌ Redemption failed. Please try again.');
        } finally {
            setRedeeming(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FE] pb-24">
            {/* Header with Points Balance */}
            <div className="bg-gradient-to-br from-[#FFB86C] via-[#00E5FF] to-[#6C4BFF] px-6 pt-6 pb-12 rounded-b-[40px] shadow-xl shadow-[#00E5FF]/20">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="font-clash font-bold text-3xl text-white">Rewards</h1>
                    <button
                        onClick={() => setShowMyRewards(true)}
                        className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-white font-semibold text-sm hover:bg-white/30 transition-all flex items-center gap-2"
                    >
                        <History className="w-4 h-4" />
                        My Rewards
                    </button>
                </div>
                <p className="text-white/80 text-sm mb-6">Redeem your points for exclusive offers</p>
                
                {/* Points Balance Card */}
                <Card className="p-5 bg-white/95 backdrop-blur-md border-none">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Your Balance</div>
                            <div className="text-3xl font-clash font-bold text-[#1E0E62] flex items-center gap-2">
                                <Zap className="w-7 h-7 text-yellow-500 fill-yellow-500" />
                                {userPoints.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">points available</div>
                        </div>
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-[#00E5FF] font-bold"
                            onClick={() => setShowAffordableOnly(!showAffordableOnly)}
                        >
                            {showAffordableOnly ? 'Show All' : 'Affordable Only'}
                        </Button>
                    </div>
                    
                    {/* Bonuses Display */}
                    {pointsData && (pointsData.tierBonus > 0 || pointsData.streakMultiplier > 1) && (
                        <div className="pt-3 border-t border-gray-200 flex items-center gap-3">
                            {pointsData.tierBonus > 0 && (
                                <div className="text-xs text-gray-600">
                                    ⭐ <span className="font-semibold text-purple-600">{pointsData.tierBonus}%</span> tier bonus
                                </div>
                            )}
                            {pointsData.streakMultiplier > 1 && (
                                <div className="text-xs text-gray-600">
                                    🔥 <span className="font-semibold text-orange-600">{pointsData.streakMultiplier}x</span> streak
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>

            {/* Level-Up Nudge */}
            {isCloseToLevelUp && (
                <div className="px-6 -mt-2 mb-4">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-2xl text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shrink-0">
                                <Award className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="text-sm font-bold mb-1">
                                    🎉 Almost Level {userLevel + 1}!
                                </div>
                                <div className="text-xs text-white/90 mb-2">
                                    Just {pointsToNextLevel} more points to level up
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="bg-white h-full rounded-full transition-all duration-500"
                                        style={{ width: `${levelProgress}%` }}
                                    />
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold">{Math.round(levelProgress)}%</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Pills */}
            <div className="px-6 -mt-4 mb-6">
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {types.map(type => (
                        <button
                            key={type.key}
                            onClick={() => setSelectedType(type.key)}
                            className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border ${
                                selectedType === type.key
                                    ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white border-transparent shadow-md'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }`}
                        >
                            <span className="mr-1">{type.icon}</span>
                            {type.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Time-Based Context */}
            <div className="px-6 mb-4">
                <div className="flex items-center gap-2">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold ${getTimeBasedLabel().color}`}>
                        {getTimeBasedLabel().text}
                    </div>
                    {userBehavior && userBehavior.engagementScore > 70 && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700">
                            🧠 Personalized for You
                        </div>
                    )}
                </div>
            </div>

            {/* Rewards Grid */}
            <div className="px-6 space-y-4">
                {loading && (
                    <div className="space-y-4">
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                )}

                {!loading && filteredRewards.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Gift className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="font-bold text-[#1E0E62] mb-2">No Rewards Available</h3>
                        <p className="text-gray-500 text-sm">
                            {showAffordableOnly 
                                ? 'Complete more missions to earn points for rewards!'
                                : 'Check back soon for new offers'}
                        </p>
                    </div>
                )}

                {!loading && sortedRewards.map((reward, index) => {
                    const affordable = canAfford(reward.costPoints);
                    const isRelevant = getRewardRelevanceScore(reward) >= 10;
                    const urgency = getUrgencyDisplay(reward);
                    const urgencyLevel = getUrgencyLevel(reward);
                    const helpsLevelUp = isCloseToLevelUp && reward.costPoints <= pointsToNextLevel && affordable;
                    const personalizedScore = calculatePersonalizedScore(reward, userBehavior);
                    const isHighlyPersonalized = personalizedScore >= 50;
                    
                    return (
                        <Card 
                            key={reward.id} 
                            className={`overflow-hidden cursor-pointer transition-all hover:shadow-xl ${
                                !affordable ? 'opacity-60' : ''
                            } ${
                                urgencyLevel === 'high' ? 'border-2 border-red-300 shadow-lg shadow-red-100 animate-pulse' : ''
                            } ${
                                urgencyLevel === 'medium' ? 'border border-orange-200' : ''
                            } ${
                                helpsLevelUp ? 'border-2 border-purple-400 shadow-lg shadow-purple-100' : ''
                            }`}
                            onClick={() => setSelectedReward(reward)}
                        >
                            <div className="flex gap-4">
                                {/* Image */}
                                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden shrink-0">
                                    {reward.imageUrl ? (
                                        <img 
                                            src={reward.imageUrl} 
                                            alt={reward.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl">
                                            {getTypeIcon(reward.type)}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 py-2">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h3 className="font-bold text-[#1E0E62] text-sm">{reward.title}</h3>
                                                {isHighlyPersonalized && index < 5 && (
                                                    <span className="px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                                                        🧠 FOR YOU
                                                    </span>
                                                )}
                                                {isRelevant && index < 3 && !isHighlyPersonalized && (
                                                    <span className="px-2 py-0.5 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white text-[10px] font-bold rounded-full">
                                                        PERFECT NOW
                                                    </span>
                                                )}
                                                {helpsLevelUp && (
                                                    <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                                                        <Award className="w-2.5 h-2.5" />
                                                        HELPS LEVEL UP
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">{reward.businessName || 'Local Business'}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </div>
                                    
                                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">{reward.description}</p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            <span className={`text-sm font-bold ${
                                                affordable ? 'text-[#00E5FF]' : 'text-gray-400'
                                            }`}>
                                                {reward.costPoints.toLocaleString()}
                                            </span>
                                        </div>
                                        
                                        {urgency && (
                                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${
                                                urgency.bgColor
                                            } ${
                                                urgency.borderColor
                                            }`}>
                                                {urgency.icon}
                                                <span className={`text-[10px] font-bold ${
                                                    urgency.textColor
                                                }`}>
                                                    {urgency.text}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Reward Detail Modal */}
            {selectedReward && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-t-[32px] w-full max-w-lg max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
                        {/* Header Image */}
                        <div className="h-48 bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF] relative">
                            {selectedReward.imageUrl && (
                                <img 
                                    src={selectedReward.imageUrl} 
                                    alt={selectedReward.title}
                                    className="w-full h-full object-cover"
                                />
                            )}
                            <button
                                onClick={() => setSelectedReward(null)}
                                className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Title & Business */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="font-clash font-bold text-2xl text-[#1E0E62] mb-1">
                                        {selectedReward.title}
                                    </h2>
                                    <p className="text-gray-600 text-sm">{selectedReward.businessName}</p>
                                </div>
                                <div className="text-2xl">{getTypeIcon(selectedReward.type)}</div>
                            </div>

                            {/* Description */}
                            <p className="text-gray-700 mb-6">{selectedReward.description}</p>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 p-4 rounded-2xl">
                                    <div className="text-xs text-gray-500 mb-1">Cost</div>
                                    <div className="flex items-center gap-1">
                                        <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                        <span className="text-xl font-bold text-[#1E0E62]">
                                            {selectedReward.costPoints.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Urgency/Availability Box */}
                                {selectedReward.remaining !== undefined ? (
                                    <div className={`p-4 rounded-2xl border-2 ${
                                        getUrgencyLevel(selectedReward) === 'high' 
                                            ? 'bg-red-50 border-red-300' 
                                            : getUrgencyLevel(selectedReward) === 'medium'
                                            ? 'bg-orange-50 border-orange-200'
                                            : 'bg-gray-50 border-gray-200'
                                    }`}>
                                        <div className="text-xs text-gray-500 mb-1">Availability</div>
                                        <div className="flex items-center gap-1">
                                            {getUrgencyLevel(selectedReward) !== 'none' && getUrgencyLevel(selectedReward) !== 'low' && (
                                                <Flame className={`w-5 h-5 ${
                                                    getUrgencyLevel(selectedReward) === 'high' 
                                                        ? 'text-red-500 fill-red-500 animate-pulse' 
                                                        : 'text-orange-500 fill-orange-500'
                                                }`} />
                                            )}
                                            <span className={`text-sm font-bold ${
                                                getUrgencyLevel(selectedReward) === 'high' 
                                                    ? 'text-red-700' 
                                                    : getUrgencyLevel(selectedReward) === 'medium'
                                                    ? 'text-orange-700'
                                                    : 'text-[#1E0E62]'
                                            }`}>
                                                {selectedReward.remaining <= 3 
                                                    ? `Only ${selectedReward.remaining} left!`
                                                    : `${selectedReward.remaining} available`}
                                            </span>
                                        </div>
                                    </div>
                                ) : selectedReward.district ? (
                                    <div className="bg-gray-50 p-4 rounded-2xl">
                                        <div className="text-xs text-gray-500 mb-1">Location</div>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4 text-gray-600" />
                                            <span className="text-sm font-semibold text-[#1E0E62]">
                                                {selectedReward.district}
                                            </span>
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            {/* Terms */}
                            {selectedReward.terms && (
                                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-2xl mb-6">
                                    <div className="text-xs font-bold text-yellow-800 mb-2">Terms & Conditions</div>
                                    <p className="text-xs text-yellow-700">{selectedReward.terms}</p>
                                </div>
                            )}

                            {/* Redeem Button */}
                            <Button
                                disabled={!canAfford(selectedReward.costPoints) || selectedReward.status === 'SOLD_OUT' || redeeming}
                                onClick={() => handleRedeem(selectedReward)}
                                className="h-14 w-full"
                            >
                                {redeeming 
                                    ? 'Redeeming...'
                                    : selectedReward.status === 'SOLD_OUT' 
                                    ? 'Sold Out' 
                                    : !canAfford(selectedReward.costPoints)
                                    ? `Need ${(selectedReward.costPoints - userPoints).toLocaleString()} more points`
                                    : `Redeem for ${selectedReward.costPoints.toLocaleString()} points`}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* My Rewards Modal */}
            <MyRewardsModal
                isOpen={showMyRewards}
                onClose={() => setShowMyRewards(false)}
                userId={user.id}
            />
        </div>
    );
};

// Mock data for development
function getMockRewards(): Reward[] {
    return [
        {
            id: '1',
            businessId: 'biz1',
            businessName: 'Café Central',
            title: '20% Off Any Drink',
            description: 'Get 20% off any beverage during happy hour (3-6 PM)',
            costPoints: 150,
            city: 'Munich',
            district: 'Schwabing',
            imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&h=300&fit=crop',
            type: 'DISCOUNT',
            discountPercent: 20,
            remaining: 50,
            totalAvailable: 100,
            status: 'ACTIVE',
            terms: 'Valid Monday-Friday. One per customer per day.'
        },
        {
            id: '2',
            businessId: 'biz2',
            businessName: 'FitZone Gym',
            title: 'Free Personal Training Session',
            description: '60-minute one-on-one training session with a certified trainer',
            costPoints: 500,
            city: 'Munich',
            district: 'Maxvorstadt',
            imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
            type: 'FREE_ITEM',
            remaining: 10,
            totalAvailable: 20,
            status: 'ACTIVE',
            terms: 'Book in advance. Valid for new members only.'
        },
        {
            id: '3',
            businessId: 'biz3',
            businessName: 'Pizza Paradise',
            title: 'Buy 1 Get 1 Free Pizza',
            description: 'Purchase any large pizza and get a second one free',
            costPoints: 300,
            city: 'Munich',
            imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop',
            type: 'VOUCHER',
            status: 'ACTIVE',
            terms: 'Cannot be combined with other offers.'
        },
        {
            id: '4',
            businessId: 'biz4',
            businessName: 'Spa Serenity',
            title: 'Relaxation Spa Day',
            description: 'Full day spa access including sauna, pool, and relaxation areas',
            costPoints: 800,
            city: 'Munich',
            district: 'Lehel',
            imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop',
            type: 'EXPERIENCE',
            remaining: 5,
            totalAvailable: 10,
            status: 'ACTIVE',
            terms: 'Valid weekdays only. Reservation required 48h in advance.'
        },
        {
            id: '5',
            businessId: 'biz5',
            businessName: 'Book Haven',
            title: '€10 Cashback on Any Purchase',
            description: 'Get €10 back on your next purchase of €30 or more',
            costPoints: 250,
            city: 'Munich',
            imageUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=300&fit=crop',
            type: 'CASHBACK',
            status: 'ACTIVE',
            terms: 'Valid for 30 days from redemption.'
        },
        {
            id: '6',
            businessId: 'biz6',
            businessName: 'Green Smoothie Bar',
            title: 'Free Superfood Smoothie',
            description: 'Any large smoothie on the house',
            costPoints: 200,
            city: 'Munich',
            district: 'Glockenbachviertel',
            imageUrl: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&h=300&fit=crop',
            type: 'FREE_ITEM',
            remaining: 30,
            totalAvailable: 50,
            status: 'ACTIVE',
            terms: 'One per week. Valid until end of month.'
        },
        {
            id: '7',
            businessId: 'biz7',
            businessName: 'Cinema Lux',
            title: '2-for-1 Movie Tickets',
            description: 'Buy one ticket, get one free for any showing',
            costPoints: 400,
            city: 'Munich',
            imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop',
            type: 'VOUCHER',
            remaining: 20,
            totalAvailable: 40,
            status: 'ACTIVE',
            terms: 'Valid Monday-Thursday only. Excludes special screenings.'
        },
        {
            id: '8',
            businessId: 'biz8',
            businessName: 'Yoga Studio',
            title: '50% Off Monthly Membership',
            description: 'Get half off your first month of unlimited yoga classes',
            costPoints: 600,
            city: 'Munich',
            district: 'Haidhausen',
            imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
            type: 'DISCOUNT',
            discountPercent: 50,
            remaining: 8,
            totalAvailable: 15,
            status: 'ACTIVE',
            terms: 'New members only. Valid for first month.'
        }
    ];
}

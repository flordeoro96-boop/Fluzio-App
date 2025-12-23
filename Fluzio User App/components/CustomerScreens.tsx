
import React, { useState, useEffect } from 'react';
import { User, Mission } from '../types';
import { store } from '../services/mockStore';
import { Card, Button } from './Common';
import { MissionCard } from './MissionCard';
import { MissionDetailScreen } from './MissionDetailScreen';
import { ExploreScreen } from './ExploreScreen';
import { CreatorWalletScreen } from './CreatorWalletScreen';
import { Map, Calendar, MessageCircle, Heart, Share2, Users, TrendingUp, Target, Filter, X, SlidersHorizontal } from 'lucide-react';
import { useGeolocation } from '../hooks/useLocation';
import { getActiveMissions } from '../src/services/missionService';
import { getParticipation, getParticipationsForUser } from '../src/services/participationService';
import { useTranslation } from 'react-i18next';

// --- 1. Missions Screen (Daily Drops) ---

// Helper component to check participation status for each mission
const MissionCardWithStatus: React.FC<{
    mission: Mission;
    userId: string;
    userLocation: any;
    onViewDetails: () => void;
    onApply: () => void;
}> = ({ mission, userId, userLocation, onViewDetails, onApply }) => {
    const [isApplied, setIsApplied] = useState(false);
    
    useEffect(() => {
        const checkParticipation = async () => {
            const participation = await getParticipation(mission.id, userId);
            setIsApplied(!!participation);
        };
        checkParticipation();
    }, [mission.id, userId]);

    return (
        <MissionCard 
            mission={mission} 
            isApplied={isApplied} 
            userLocation={userLocation}
            onViewDetails={onViewDetails}
            onApply={onApply}
        />
    );
};

const StoryRing: React.FC<{ img: string, name: string, seen?: boolean }> = ({ img, name, seen }) => (
    <div className="flex flex-col items-center space-y-1 cursor-pointer active:scale-95 transition-transform">
        <div className={`p-[3px] rounded-full ${seen ? 'bg-gray-200' : 'bg-gradient-to-tr from-[#FFB86C] via-[#00E5FF] to-[#6C4BFF]'}`}>
            <div className="bg-white p-[2px] rounded-full">
                <img src={img} alt={name} className="w-16 h-16 rounded-full object-cover border border-white" />
            </div>
        </div>
        <span className="text-[10px] font-bold text-[#1E0E62]">{name}</span>
    </div>
);

export const MissionsScreen: React.FC<{ user: User; onNavigateToCollaborate?: () => void }> = ({ user, onNavigateToCollaborate }) => {
    const { t } = useTranslation();
    const [missions, setMissions] = useState<Mission[]>([]);
    const [filteredMissions, setFilteredMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const { location } = useGeolocation();
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    
    // Filter states
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedRewardType, setSelectedRewardType] = useState<string>('All');
    const [selectedMissionType, setSelectedMissionType] = useState<string>('All');
    const [selectedDistance, setSelectedDistance] = useState<string>('All');
    const [sortBy, setSortBy] = useState<string>('newest');

    // Translated option labels (values remain stable for filtering logic)
    const categoryOptions = [
        { value: 'All', label: t('missions.all') },
        { value: 'Fashion', label: t('missions.fashion') },
        { value: 'Food', label: t('missions.food') },
        { value: 'Coffee', label: t('missions.coffee') },
        { value: 'Tech', label: t('missions.tech') },
        { value: 'Fitness', label: t('missions.fitness') },
        { value: 'Beauty', label: t('missions.beauty') },
        { value: 'Lifestyle', label: t('missions.lifestyle') }
    ];

    const missionTypeOptions = [
        { value: 'All', label: t('missions.all') },
        { value: 'Social Post', label: t('missions.socialPost') },
        { value: 'Review', label: t('missions.review') },
        { value: 'Check-in', label: t('missions.checkIn') }
    ];

    const rewardTypeOptions = [
        { value: 'All', label: t('missions.all') },
        { value: 'Points Only', label: t('missions.pointsOnly') },
        { value: 'Item Reward', label: t('missions.itemReward') },
        { value: 'Both', label: t('missions.both') }
    ];

    const distanceOptions = [
        { value: 'All', label: t('missions.all') },
        { value: 'Nearby (5km)', label: t('missions.nearby5km') },
        { value: 'Same City', label: t('missions.sameCity') },
        { value: 'Online', label: t('missions.online') }
    ];

    useEffect(() => {
        const loadMissions = async () => {
            setLoading(true);
            try {
                const activeMissions = await getActiveMissions();
                console.log('[MissionsScreen] Loaded missions from Firestore:', activeMissions.length);
                
                // Get user's participations to filter out applied/completed missions
                const participations = await getParticipationsForUser(user.id);
                console.log('[MissionsScreen] User participations:', participations.length);
                
                // Filter out missions user has already applied to
                const appliedMissionIds = new Set(participations.map(p => p.missionId));
                const availableMissions = activeMissions.filter(m => !appliedMissionIds.has(m.id));
                
                console.log('[MissionsScreen] Available missions (not applied):', availableMissions.length);
                setMissions(availableMissions as any);
                setFilteredMissions(availableMissions as any);
            } catch (error) {
                console.error('[MissionsScreen] Error loading missions:', error);
                setMissions([]);
                setFilteredMissions([]);
            } finally {
                setLoading(false);
            }
        };
        loadMissions();
    }, []);

    // Apply filters whenever filter states change
    useEffect(() => {
        let result = [...missions];

        // Category filter
        if (selectedCategory !== 'All') {
            result = result.filter(m => m.category === selectedCategory);
        }

        // Reward type filter
        if (selectedRewardType !== 'All') {
            if (selectedRewardType === 'Points Only') {
                result = result.filter(m => m.reward?.type === 'POINTS_ONLY');
            } else if (selectedRewardType === 'Item Reward') {
                result = result.filter(m => m.reward?.type === 'POINTS_AND_ITEM' || m.reward?.type === 'POINTS_AND_DISCOUNT');
            } else if (selectedRewardType === 'Both') {
                result = result.filter(m => m.reward?.type === 'POINTS_AND_ITEM' || m.reward?.type === 'POINTS_AND_DISCOUNT');
            }
        }

        // Mission type filter
        if (selectedMissionType !== 'All') {
            if (selectedMissionType === 'Social Post') {
                result = result.filter(m => m.goal === 'CONTENT' || m.detailedRequirements?.postType);
            } else if (selectedMissionType === 'Review') {
                result = result.filter(m => m.goal === 'GROWTH');
            } else if (selectedMissionType === 'Check-in') {
                result = result.filter(m => m.goal === 'TRAFFIC' || m.triggerType === 'GPS_PROXIMITY');
            }
        }

        // Distance filter (simplified - would need actual geolocation calculation)
        if (selectedDistance !== 'All' && location) {
            // This is a placeholder - you'd calculate actual distance
            if (selectedDistance === 'Nearby (5km)') {
                result = result.filter(m => m.location && m.location.includes(location.city || ''));
            } else if (selectedDistance === 'Same City') {
                result = result.filter(m => m.location && m.location.includes(location.city || ''));
            }
        }

        // Sort
        if (sortBy === 'newest') {
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else if (sortBy === 'reward') {
            result.sort((a, b) => (b.reward?.points || 0) - (a.reward?.points || 0));
        } else if (sortBy === 'ending-soon') {
            result.sort((a, b) => {
                const aTime = a.validUntil ? new Date(a.validUntil).getTime() : Infinity;
                const bTime = b.validUntil ? new Date(b.validUntil).getTime() : Infinity;
                return aTime - bTime;
            });
        }

        setFilteredMissions(result);
    }, [missions, selectedCategory, selectedRewardType, selectedMissionType, selectedDistance, sortBy, location]);

    const activeFilterCount = [
        selectedCategory !== 'All',
        selectedRewardType !== 'All',
        selectedMissionType !== 'All',
        selectedDistance !== 'All',
        sortBy !== 'newest'
    ].filter(Boolean).length;

    return (
        <div className="pb-24">
            {/* Header */}
            <div className="pt-12 px-6 pb-4 bg-white/50 backdrop-blur-sm sticky top-0 z-30">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-clash font-bold text-3xl text-[#1E0E62]">{t('missions.dailyDrops')} <span className="animate-pulse">🔥</span></h1>
                        <p className="text-[#8F8FA3] text-sm font-medium">
                            {location ? t('missions.near', { location: location.address }) : t('missions.completeEarnRewards')}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="relative p-3 rounded-full bg-white shadow-sm hover:shadow-md transition-all active:scale-95"
                    >
                        <SlidersHorizontal className="w-5 h-5 text-[#6C4BFF]" />
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#00E5FF] text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="px-4 pb-4 bg-white/80 backdrop-blur-sm sticky top-[120px] z-20 border-b border-gray-100">
                    <div className="space-y-4">
                        {/* Category Filter */}
                        <div>
                            <label className="text-xs font-bold text-[#1E0E62] uppercase tracking-wide mb-2 block">{t('missions.category')}</label>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                {categoryOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setSelectedCategory(opt.value)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                                            selectedCategory === opt.value
                                                ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white shadow-lg'
                                                : 'bg-gray-100 text-[#8F8FA3] hover:bg-gray-200'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Mission Type Filter */}
                        <div>
                            <label className="text-xs font-bold text-[#1E0E62] uppercase tracking-wide mb-2 block">{t('missions.missionType')}</label>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                {missionTypeOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setSelectedMissionType(opt.value)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                                            selectedMissionType === opt.value
                                                ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white shadow-lg'
                                                : 'bg-gray-100 text-[#8F8FA3] hover:bg-gray-200'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Reward Type Filter */}
                        <div>
                            <label className="text-xs font-bold text-[#1E0E62] uppercase tracking-wide mb-2 block">{t('missions.rewardType')}</label>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                {rewardTypeOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setSelectedRewardType(opt.value)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                                            selectedRewardType === opt.value
                                                ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white shadow-lg'
                                                : 'bg-gray-100 text-[#8F8FA3] hover:bg-gray-200'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Distance Filter */}
                        <div>
                            <label className="text-xs font-bold text-[#1E0E62] uppercase tracking-wide mb-2 block">{t('missions.distance')}</label>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                {distanceOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setSelectedDistance(opt.value)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                                            selectedDistance === opt.value
                                                ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white shadow-lg'
                                                : 'bg-gray-100 text-[#8F8FA3] hover:bg-gray-200'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sort By */}
                        <div>
                            <label className="text-xs font-bold text-[#1E0E62] uppercase tracking-wide mb-2 block">{t('missions.sortBy')}</label>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                {[
                                    { value: 'newest', label: t('missions.newest') },
                                    { value: 'reward', label: t('missions.highestReward') },
                                    { value: 'ending-soon', label: t('missions.endingSoon') }
                                ].map(sort => (
                                    <button
                                        key={sort.value}
                                        onClick={() => setSortBy(sort.value)}
                                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                                            sortBy === sort.value
                                                ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white shadow-lg'
                                                : 'bg-gray-100 text-[#8F8FA3] hover:bg-gray-200'
                                        }`}
                                    >
                                        {sort.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Clear Filters */}
                        {activeFilterCount > 0 && (
                            <button
                                onClick={() => {
                                    setSelectedCategory('All');
                                    setSelectedRewardType('All');
                                    setSelectedMissionType('All');
                                    setSelectedDistance('All');
                                    setSortBy('newest');
                                }}
                                className="w-full py-2 text-sm font-bold text-[#00E5FF] hover:text-[#6C4BFF] transition-colors"
                            >
                                {t('missions.clearAllFilters')}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Results Count */}
            <div className="px-6 py-3 text-sm text-[#8F8FA3]">
                {filteredMissions.length} {filteredMissions.length === 1 ? t('missions.missionAvailable', { count: filteredMissions.length }) : t('missions.missionsAvailable', { count: filteredMissions.length })}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E5FF]"></div>
                </div>
            )}

            {/* Feed */}
            {!loading && (
                <div className="px-4 space-y-4 mt-2">
                    {filteredMissions.map(m => (
                        <MissionCardWithStatus 
                            key={m.id} 
                            mission={m} 
                            userId={user.id}
                            userLocation={location}
                            onViewDetails={() => setSelectedMission(m)}
                            onApply={() => setSelectedMission(m)}
                        />
                    ))}
                    {missions.length === 0 && (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">📍</div>
                            <h3 className="font-bold text-[#1E0E62] mb-2">{t('missions.noDropsNearby')}</h3>
                            <p className="text-[#8F8FA3]">{t('missions.checkBackLater')}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Detail Overlay */}
            {selectedMission && (
                <MissionDetailScreen 
                    mission={selectedMission} 
                    user={user} 
                    onClose={() => setSelectedMission(null)}
                    onFindCollaborator={() => {
                        setSelectedMission(null);
                        onNavigateToCollaborate?.();
                    }}
                />
            )}
        </div>
    );
};

// --- 2. Community Screen (Enhanced with Real Features) ---

const StatCard: React.FC<{ icon: React.ElementType; label: string; value: string; color: string }> = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="text-2xl font-clash font-bold text-[#1E0E62] mb-1">{value}</div>
        <div className="text-xs font-bold text-[#8F8FA3] uppercase tracking-wide">{label}</div>
    </div>
);

export const CommunityScreen: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useTranslation();
    const [tab, setTab] = useState<'STATS' | 'NETWORK' | 'EVENTS'>('STATS');
    const [stats, setStats] = useState({
        activeMissions: 0,
        totalEarnings: 0,
        completionRate: 0,
        rank: 0
    });

    useEffect(() => {
        // Calculate real user stats from Firestore
        const loadStats = async () => {
            const participations = await getParticipationsForUser(user.id);
            const completed = participations.filter(p => p.status === 'APPROVED').length;
            const total = participations.length;
            
            setStats({
                activeMissions: participations.filter(p => p.status === 'PENDING' || p.status === 'APPROVED').length,
                totalEarnings: user.points || 0,
                completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
                rank: Math.floor(Math.random() * 100) + 1 // Mock rank for now
            });
        };
        loadStats();
    }, [user.id, user.points]);

    return (
        <div className="pb-24">
            <div className="pt-12 px-6 pb-2 bg-white sticky top-0 z-30">
                 <h1 className="font-clash font-bold text-3xl text-[#1E0E62] mb-4">{t('community.title')} <span className="text-yellow-500">⚡</span></h1>
                 
                 <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                     {['STATS', 'NETWORK', 'EVENTS'].map((tabKey) => (
                         <button 
                            key={tabKey}
                            onClick={() => setTab(tabKey as any)}
                            className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${tab === tabKey ? 'bg-[#1E0E62] text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                         >
                            {tabKey === 'STATS' ? t('community.myStats') : tabKey === 'NETWORK' ? t('community.network') : t('community.events')}
                         </button>
                     ))}
                 </div>
            </div>

            <div className="px-4 mt-4">
                {tab === 'STATS' && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-2 gap-3">
                            <StatCard 
                                icon={Target}
                                label={t('community.activeMissionsCount')}
                                value={stats.activeMissions.toString()}
                                color="bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF]"
                            />
                            <StatCard 
                                icon={TrendingUp}
                                label={t('community.totalPoints')}
                                value={stats.totalEarnings.toString()}
                                color="bg-gradient-to-br from-[#FFB86C] to-[#FF8C00]"
                            />
                            <StatCard 
                                icon={Users}
                                label={t('community.cityRank')}
                                value={`#${stats.rank}`}
                                color="bg-gradient-to-br from-blue-500 to-blue-600"
                            />
                            <StatCard 
                                icon={Heart}
                                label={t('community.successRate')}
                                value={`${stats.completionRate}%`}
                                color="bg-gradient-to-br from-green-500 to-green-600"
                            />
                        </div>

                        {/* Quick Actions */}
                        <Card className="p-5">
                            <h3 className="font-bold text-[#1E0E62] mb-4">{t('community.quickActions')}</h3>
                            <div className="space-y-3">
                                <button className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="w-10 h-10 bg-[#00E5FF]/10 rounded-lg flex items-center justify-center">
                                        <Map className="w-5 h-5 text-[#00E5FF]" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-sm text-[#1E0E62]">{t('community.findMissionsNearMe')}</div>
                                        <div className="text-xs text-[#8F8FA3]">{t('community.browseLocalOpportunities')}</div>
                                    </div>
                                </button>
                                <button className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="w-10 h-10 bg-[#6C4BFF]/10 rounded-lg flex items-center justify-center">
                                        <Users className="w-5 h-5 text-[#6C4BFF]" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-sm text-[#1E0E62]">{t('community.joinSquad')}</div>
                                        <div className="text-xs text-[#8F8FA3]">{t('community.connectWithCreators')}</div>
                                    </div>
                                </button>
                            </div>
                        </Card>
                    </div>
                )}
                
                {tab === 'NETWORK' && (
                    <div className="text-center py-12 animate-in fade-in duration-500">
                        <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-500">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-[#1E0E62] mb-2">{t('community.yourNetwork')}</h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">
                            {t('community.networkDescription')}
                        </p>
                        <p className="text-xs text-[#8F8FA3] mt-4">{t('community.comingSoon')}</p>
                    </div>
                )}
                
                {tab === 'EVENTS' && (
                    <div className="text-center py-12 animate-in fade-in duration-500">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-[#1E0E62] mb-2">{t('community.communityEvents')}</h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">
                            {t('community.eventsDescription')}
                        </p>
                        <p className="text-xs text-[#8F8FA3] mt-4">{t('community.comingSoon')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

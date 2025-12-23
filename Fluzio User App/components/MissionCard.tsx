
import React from 'react';
import { Mission, GeoPoint } from '../types';
import { Card, Button, Badge } from './Common';
import { MapPin, Users, Gift, Tag, Lock, Clock, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { calculateDistance, formatDistance, estimateWalkTime } from '../hooks/useLocation';
import { store } from '../services/mockStore';
import { getMaxParticipantsBySubscription } from '../services/missionService';
import { useTranslation } from 'react-i18next';

interface MissionStats {
  applicants: number;
  completed: number;
  rating?: number;
}

interface MissionCardProps {
  mission: Mission;
  onApply?: () => void;
  isApplied?: boolean;
  isOwner?: boolean;
  onViewDetails?: () => void;
  stats?: MissionStats;
  userLocation?: GeoPoint | null;
  onToggleActive?: (missionId: string, currentStatus: boolean) => void;
  isToggling?: boolean;
  businessId?: string;
}

export const MissionCard: React.FC<MissionCardProps> = ({ 
  mission, 
  onApply, 
  isApplied, 
  isOwner, 
  onViewDetails, 
  stats, 
  userLocation, 
  onToggleActive, 
  isToggling, 
  businessId 
}) => {
  const { t } = useTranslation();
  
  // Safe date parsing helper
  const safeParseDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;
    try {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };
  
  // Determine mission state
  const expiryDate = safeParseDate(mission.expiresAt || mission.validUntil);
  const isExpired = expiryDate ? expiryDate < new Date() : false;
  const isCompleted = isApplied && mission.status === 'COMPLETED';
  const daysRemaining = expiryDate 
    ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Badge logic
  let badge = null;
  if (isExpired) {
    badge = <Badge text={t('missions.expired')} color="bg-gray-500 text-white" />;
  } else if (daysRemaining && daysRemaining <= 2) {
    badge = <Badge text={t('missions.endsSoon')} color="bg-red-500 text-white" />;
  } else if (mission.reward?.points && mission.reward.points >= 200) {
    badge = <Badge text={t('missions.highReward')} color="bg-yellow-500 text-white" />;
  }

  // Distance calculation
  let distanceInfo = null;
  let isLocked = false;
  if (userLocation && mission.geo) {
    const distanceMeters = calculateDistance(userLocation, mission.geo);
    distanceInfo = formatDistance(distanceMeters);
    
    if (mission.goal === 'TRAFFIC' && mission.radiusMeters && distanceMeters > mission.radiusMeters) {
      isLocked = true;
    }
  }

  // CTA Button logic
  let ctaText = t('missions.acceptMission');
  let ctaVariant: 'primary' | 'outline' | 'ghost' = 'primary';
  let ctaDisabled = false;

  if (isExpired) {
    ctaText = t('missions.expired');
    ctaVariant = 'outline';
    ctaDisabled = true;
  } else if (isCompleted) {
    ctaText = t('missions.completedCheck');
    ctaVariant = 'outline';
    ctaDisabled = true;
  } else if (isApplied) {
    ctaText = t('missions.continueMission');
    ctaVariant = 'outline';
  } else if (isLocked) {
    ctaText = t('missions.goToLocation');
    ctaVariant = 'outline';
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      {/* Business Header */}
      <div className="p-4 pb-3 flex items-center gap-3">
        {mission.businessLogo ? (
          <img 
            src={mission.businessLogo} 
            alt={mission.businessName || 'Business'} 
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" 
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C4BFF] to-[#00E5FF] flex items-center justify-center text-white font-bold shadow-sm">
            {(mission.businessName || 'B').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#1E0E62] truncate">
            {mission.businessName || 'Business'}
          </h3>
          <div className="flex items-center gap-2 text-xs text-[#8F8FA3]">
            <span className="font-medium">{mission.category || 'General'}</span>
            <span>•</span>
            <span>{(() => {
              try {
                const createdDate = safeParseDate(mission.createdAt);
                return createdDate 
                  ? formatDistanceToNow(createdDate, { addSuffix: true })
                  : 'Recently';
              } catch {
                return 'Recently';
              }
            })()}</span>
          </div>
        </div>
        {badge}
      </div>

      {/* Mission Title Area */}
      <div className="px-4 pb-3">
        <h2 className="text-lg font-clash font-bold text-[#1E0E62] leading-tight mb-1">
          {mission.title}
        </h2>
        <p className="text-sm text-[#8F8FA3] line-clamp-1">
          {mission.description}
        </p>
      </div>

      {/* Mission Image */}
      {mission.image && (
        <div className="relative w-full aspect-video mb-3 overflow-hidden">
          <img 
            src={mission.image} 
            alt={mission.title} 
            className="w-full h-full object-cover" 
          />
          {isLocked && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center text-white">
                <Lock className="w-8 h-8 mb-2 mx-auto" />
                <p className="text-sm font-bold">{t('missions.locationLocked')}</p>
                <p className="text-xs opacity-80 mt-1">{t('missions.beWithinRadius', { radius: mission.radiusMeters })}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Row Chips */}
      <div className="px-4 pb-4 flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold">
          <MapPin className="w-3.5 h-3.5" />
          {mission.location || distanceInfo || 'Online'}
        </div>
        <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-xs font-bold">
          <Users className="w-3.5 h-3.5" />
          {mission.currentParticipants || 0} {t('missions.joined')}
        </div>
        {mission.reward?.points && (
          <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full text-xs font-bold">
            <Gift className="w-3.5 h-3.5" />
            {mission.reward.points} pts
          </div>
        )}
        {daysRemaining && daysRemaining > 0 && daysRemaining <= 7 && (
          <div className="flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            {daysRemaining}{t('missions.daysLeft')}
          </div>
        )}
      </div>

      {/* Business Stats (Owner Only) */}
      {isOwner && stats && (
        <div className="mx-4 mb-4 p-3 bg-gray-50 rounded-xl">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs text-[#8F8FA3] font-medium mb-1">{t('missions.applicants')}</div>
              <div className="text-lg font-bold text-[#1E0E62]">{stats.applicants}</div>
            </div>
            <div>
              <div className="text-xs text-[#8F8FA3] font-medium mb-1">{t('common.done')}</div>
              <div className="text-lg font-bold text-[#6C4BFF]">{stats.completed}</div>
            </div>
            <div>
              <div className="text-xs text-[#8F8FA3] font-medium mb-1">{t('missions.success')}</div>
              <div className="text-lg font-bold text-[#4CC9F0]">
                {stats.applicants > 0 ? Math.round((stats.completed / stats.applicants) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mission Status Toggle (Owner Only) */}
      {isOwner && onToggleActive && (
        <div className="mx-4 mb-4 flex items-center justify-between p-3 bg-white rounded-xl border">
          <div className="flex-1">
            <div className="text-sm font-bold text-[#1E0E62]">
              {mission.isActive || mission.lifecycleStatus === 'ACTIVE' ? t('missions.active') : t('missions.paused')}
            </div>
            <div className="text-xs text-[#8F8FA3]">
              {mission.isActive || mission.lifecycleStatus === 'ACTIVE' 
                ? t('missions.acceptingApplications') 
                : t('missions.notAcceptingApplications')}
            </div>
          </div>
          <button 
            onClick={() => onToggleActive(mission.id, mission.isActive || mission.lifecycleStatus === 'ACTIVE')}
            disabled={isToggling}
            className={`w-12 h-7 rounded-full transition-colors p-1 flex items-center ${
              mission.isActive || mission.lifecycleStatus === 'ACTIVE' ? 'bg-[#00E5FF]' : 'bg-gray-300'
            } ${isToggling ? 'opacity-50' : ''}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
              mission.isActive || mission.lifecycleStatus === 'ACTIVE' ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      )}

      {/* CTA Button */}
      <div className="px-4 pb-4">
        <Button 
          onClick={isApplied && !isCompleted ? onViewDetails : onApply}
          disabled={ctaDisabled}
          variant={ctaVariant}
          className={`w-full font-bold ${
            isCompleted ? 'bg-green-50 text-green-600 border-green-200' : ''
          } ${isExpired ? 'bg-gray-100 text-gray-400' : ''}`}
        >
          {ctaText}
        </Button>
      </div>
    </Card>
  );
};

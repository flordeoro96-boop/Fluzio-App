/**
 * PARTICIPANT POOL STATUS COMPONENT
 * 
 * Displays shared monthly participant pool status for businesses
 * Shows usage, remaining capacity, and upgrade prompts
 * 
 * Design Principles:
 * - Clear, non-alarming messaging
 * - Proactive upgrade suggestions (not punitive)
 * - Always visible, minimal space
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Infinity,
  ArrowUp
} from 'lucide-react';
import { 
  getParticipantPool, 
  formatPoolStatus, 
  getDaysUntilReset,
  type ParticipantPool 
} from '../services/participantPoolService';
import { Level2Tier } from '../services/level2SubscriptionService';

interface ParticipantPoolStatusProps {
  businessId: string;
  onUpgradeClick?: () => void;
  compact?: boolean; // Minimal version for navbar
}

export const ParticipantPoolStatus: React.FC<ParticipantPoolStatusProps> = ({
  businessId,
  onUpgradeClick,
  compact = false
}) => {
  const [pool, setPool] = useState<ParticipantPool | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPool();
    
    // Refresh every 5 minutes
    const interval = setInterval(loadPool, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [businessId]);

  const loadPool = async () => {
    try {
      const poolData = await getParticipantPool(businessId);
      setPool(poolData);
    } catch (error) {
      console.error('[ParticipantPoolStatus] Error loading pool:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00E5FF]"></div>
      </div>
    );
  }

  // Pool not initialized yet - show default message
  if (!pool) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-[#1E0E62] text-sm mb-1">Participant Pool Initializing</h4>
            <p className="text-xs text-[#8F8FA3]">
              Your monthly participant pool will be created when you activate your first mission. 
              All missions share one pool that resets monthly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const usagePercentage = pool.isUnlimited 
    ? 0 
    : (pool.currentUsage / pool.monthlyParticipantLimit) * 100;
    
  const isLow = usagePercentage >= 80 && !pool.isUnlimited;
  const isDepleted = pool.remaining <= 0 && !pool.isUnlimited;
  
  // Safe timestamp conversion
  const cycleEndDate = pool.cycleEndDate instanceof Date 
    ? pool.cycleEndDate 
    : (typeof pool.cycleEndDate?.toDate === 'function' 
        ? pool.cycleEndDate.toDate() 
        : new Date());
  const daysLeft = getDaysUntilReset(cycleEndDate);

  // Compact version for navbar/header
  if (compact) {
    return (
      <div className={`pool-status-compact ${isDepleted ? 'depleted' : isLow ? 'low' : ''}`}>
        <Users className="icon" size={16} />
        <span className="count">
          {pool.isUnlimited ? '∞' : pool.remaining}
        </span>
      </div>
    );
  }

  // Full version for dashboard
  return (
    <div className={`participant-pool-card ${isDepleted ? 'depleted' : isLow ? 'warning' : 'normal'}`}>
      <div className="pool-header">
        <div className="title-row">
          <Users className="icon" size={20} />
          <h3>Monthly Participant Pool</h3>
          {pool.isUnlimited && (
            <span className="unlimited-badge">
              <Infinity size={14} />
              Unlimited
            </span>
          )}
        </div>
        
        <div className="tier-badge">{pool.subscriptionTier}</div>
      </div>

      {/* Usage Bar */}
      {!pool.isUnlimited && (
        <div className="usage-section">
          <div className="usage-stats">
            <span className="current">{pool.currentUsage} used</span>
            <span className="remaining">
              {pool.remaining} remaining
            </span>
            <span className="total">of {pool.monthlyParticipantLimit}</span>
          </div>
          
          <div className="progress-bar">
            <div 
              className={`progress-fill ${isDepleted ? 'depleted' : isLow ? 'warning' : 'normal'}`}
              style={{ width: `${Math.min(100, usagePercentage)}%` }}
            />
          </div>
          
          <div className="percentage-label">
            {Math.round(usagePercentage)}% used this month
          </div>
        </div>
      )}

      {/* Status Message */}
      <div className={`status-message ${isDepleted ? 'alert' : isLow ? 'info' : 'success'}`}>
        {isDepleted ? (
          <>
            <AlertCircle size={16} />
            <span>
              Pool depleted for this month. Missions visible but accepting no new participants until reset.
            </span>
          </>
        ) : isLow ? (
          <>
            <AlertCircle size={16} />
            <span>
              Running low! {pool.remaining} participant slots remaining. Consider upgrading.
            </span>
          </>
        ) : (
          <>
            <CheckCircle size={16} />
            <span>
              {pool.isUnlimited 
                ? 'Your missions can accept unlimited participants this month'
                : `${pool.remaining} participant slots available`
              }
            </span>
          </>
        )}
      </div>

      {/* Reset Timer */}
      <div className="reset-timer">
        <Calendar size={14} />
        <span>
          Pool resets in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
        </span>
      </div>

      {/* Upgrade CTA (only if not unlimited) */}
      {!pool.isUnlimited && (isDepleted || isLow) && onUpgradeClick && (
        <button 
          className="upgrade-button"
          onClick={onUpgradeClick}
        >
          <TrendingUp size={16} />
          Upgrade for More Participants
          <ArrowUp size={14} />
        </button>
      )}

      {/* Info Footer */}
      <div className="info-footer">
        <span className="info-text">
          All missions share this participant pool
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// MISSION CARD POOL INDICATOR
// ============================================================================

interface MissionPoolIndicatorProps {
  businessId: string;
  missionId: string;
  isActive: boolean;
}

/**
 * Small indicator for mission cards showing pool status
 */
export const MissionPoolIndicator: React.FC<MissionPoolIndicatorProps> = ({
  businessId,
  missionId,
  isActive
}) => {
  const [pool, setPool] = useState<ParticipantPool | null>(null);

  useEffect(() => {
    if (isActive) {
      getParticipantPool(businessId).then(setPool);
    }
  }, [businessId, isActive]);

  if (!isActive || !pool || pool.isUnlimited) {
    return null;
  }

  const isDepleted = pool.remaining <= 0;

  if (isDepleted) {
    return (
      <div className="mission-pool-indicator depleted">
        <AlertCircle size={12} />
        <span>Pool depleted - No new participants this month</span>
      </div>
    );
  }

  if (pool.remaining <= 5) {
    return (
      <div className="mission-pool-indicator low">
        <AlertCircle size={12} />
        <span>Only {pool.remaining} participant slots left this month</span>
      </div>
    );
  }

  return null;
};

// ============================================================================
// STYLES
// ============================================================================

const styles = `
.participant-pool-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #E5E7EB;
  transition: all 0.3s ease;
}

.participant-pool-card.warning {
  border-color: #F59E0B;
  background: linear-gradient(to bottom, #FFF7ED, white);
}

.participant-pool-card.depleted {
  border-color: #EF4444;
  background: linear-gradient(to bottom, #FEF2F2, white);
}

.pool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-row .icon {
  color: #6366F1;
}

.title-row h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.unlimited-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: white;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.tier-badge {
  padding: 4px 12px;
  background: #F3F4F6;
  color: #374151;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.usage-section {
  margin: 16px 0;
}

.usage-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
}

.usage-stats .current {
  color: #6366F1;
  font-weight: 600;
}

.usage-stats .remaining {
  color: #10B981;
  font-weight: 600;
}

.usage-stats .total {
  color: #6B7280;
}

.progress-bar {
  height: 8px;
  background: #F3F4F6;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progress-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 4px;
}

.progress-fill.normal {
  background: linear-gradient(90deg, #6366F1, #8B5CF6);
}

.progress-fill.warning {
  background: linear-gradient(90deg, #F59E0B, #F97316);
}

.progress-fill.depleted {
  background: linear-gradient(90deg, #EF4444, #DC2626);
}

.percentage-label {
  text-align: right;
  font-size: 11px;
  color: #6B7280;
}

.status-message {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
  margin: 16px 0;
}

.status-message.success {
  background: #F0FDF4;
  color: #166534;
  border: 1px solid #BBF7D0;
}

.status-message.info {
  background: #FFF7ED;
  color: #9A3412;
  border: 1px solid #FED7AA;
}

.status-message.alert {
  background: #FEF2F2;
  color: #991B1B;
  border: 1px solid #FECACA;
}

.status-message svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.reset-timer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #F9FAFB;
  border-radius: 6px;
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 12px;
}

.reset-timer svg {
  color: #9CA3AF;
}

.upgrade-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 12px;
}

.upgrade-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.upgrade-button:active {
  transform: translateY(0);
}

.info-footer {
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid #E5E7EB;
}

.info-text {
  font-size: 11px;
  color: #9CA3AF;
}

/* Compact Version */
.pool-status-compact {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #F9FAFB;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.pool-status-compact.low {
  background: #FFF7ED;
  color: #9A3412;
}

.pool-status-compact.depleted {
  background: #FEF2F2;
  color: #991B1B;
}

.pool-status-compact .icon {
  color: currentColor;
}

/* Mission Pool Indicator */
.mission-pool-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  margin-top: 8px;
}

.mission-pool-indicator.low {
  background: #FFF7ED;
  color: #9A3412;
  border: 1px solid #FED7AA;
}

.mission-pool-indicator.depleted {
  background: #FEF2F2;
  color: #991B1B;
  border: 1px solid #FECACA;
}

.mission-pool-indicator svg {
  flex-shrink: 0;
}

/* Loading State */
.pool-status.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #E5E7EB;
  border-top-color: #6366F1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .participant-pool-card {
    padding: 16px;
  }
  
  .title-row h3 {
    font-size: 14px;
  }
  
  .usage-stats {
    font-size: 12px;
  }
  
  .status-message {
    font-size: 12px;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

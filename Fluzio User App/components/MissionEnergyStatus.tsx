/**
 * Mission Energy Status Component
 * 
 * Displays mission energy pool status for businesses (internal view only).
 * Shows remaining energy, tier limits, and energy costs for different mission types.
 */

import React, { useState, useEffect } from 'react';
import { 
  getMissionEnergyPool, 
  getEnergyUsageStats,
  MISSION_ENERGY_COSTS,
  getEnergyLevelDescription
} from '../services/missionEnergyService';
import type { MissionEnergyPool, EnergyCost } from '../services/missionEnergyService';

interface MissionEnergyStatusProps {
  businessId: string;
  onUpgradeClick?: () => void;
  compact?: boolean;
}

export const MissionEnergyStatus: React.FC<MissionEnergyStatusProps> = ({
  businessId,
  onUpgradeClick,
  compact = false
}) => {
  const [pool, setPool] = useState<MissionEnergyPool | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnergyPool();
    const interval = setInterval(loadEnergyPool, 5 * 60 * 1000); // Refresh every 5 min
    return () => clearInterval(interval);
  }, [businessId]);

  const loadEnergyPool = async () => {
    try {
      const data = await getMissionEnergyPool(businessId);
      setPool(data);
    } catch (error) {
      console.error('Failed to load energy pool:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="energy-status-card loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <span className="text-2xl">⚡</span>
          </div>
          <div className="flex-1">
            <h3 className="font-clash font-bold text-[#1E0E62] text-lg mb-1">Mission Energy Pool Initializing</h3>
            <p className="text-sm text-[#8F8FA3]">
              Your monthly mission energy pool will be created when you activate your first mission. 
              Each mission activation costs energy (1-5 points), and your pool resets on the 1st of each month.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const usagePercentage = pool.isUnlimited 
    ? 0 
    : (pool.currentUsage / pool.monthlyEnergyLimit) * 100;

  const isLow = usagePercentage >= 80 && !pool.isUnlimited;
  const isDepleted = pool.remaining <= 0 && !pool.isUnlimited;

  // Safe timestamp conversion
  const cycleEndDate = pool.cycleEndDate instanceof Date 
    ? pool.cycleEndDate 
    : (typeof pool.cycleEndDate?.toDate === 'function' 
        ? pool.cycleEndDate.toDate() 
        : new Date());

  const daysUntilReset = Math.ceil(
    (cycleEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (compact) {
    return (
      <div className={`energy-compact ${isDepleted ? 'depleted' : isLow ? 'low' : 'normal'}`}>
        <span className="energy-icon">⚡</span>
        <span className="energy-value">{pool.remaining}</span>
      </div>
    );
  }

  return (
    <div className={`energy-status-card ${isDepleted ? 'depleted' : isLow ? 'low' : 'normal'}`}>
      {/* Header */}
      <div className="energy-header">
        <div>
          <h3 className="energy-title">Mission Energy</h3>
          <p className="energy-subtitle">Monthly budget for creating missions</p>
        </div>
        <div className={`energy-tier-badge ${pool.subscriptionTier?.toLowerCase() || 'starter'}`}>
          {pool.subscriptionTier || 'STARTER'}
        </div>
      </div>

      {/* Usage Bar */}
      <div className="energy-usage-section">
        <div className="energy-stats">
          <span className="stat-label">Used</span>
          <span className="stat-value">{pool.currentUsage}</span>
          <span className="stat-separator">•</span>
          <span className="stat-label">Remaining</span>
          <span className="stat-value">{pool.remaining}</span>
          <span className="stat-separator">of</span>
          <span className="stat-total">{pool.monthlyEnergyLimit}</span>
        </div>
        
        <div className="energy-progress-bar">
          <div 
            className={`energy-progress-fill ${isDepleted ? 'depleted' : isLow ? 'low' : 'normal'}`}
            style={{ width: `${Math.min(100, usagePercentage)}%` }}
          />
        </div>
        
        <div className="energy-percentage">
          {usagePercentage.toFixed(0)}% used
        </div>
      </div>

      {/* Status Message */}
      <div className={`energy-status-message ${isDepleted ? 'error' : isLow ? 'warning' : 'success'}`}>
        {pool.isUnlimited ? (
          <>
            <span className="status-icon">♾️</span>
            <div>
              <strong>Unlimited Energy</strong>
              <p>Create as many missions as you need!</p>
            </div>
          </>
        ) : isDepleted ? (
          <>
            <span className="status-icon">🚫</span>
            <div>
              <strong>Energy Depleted</strong>
              <p>Cannot activate new missions until pool resets in {daysUntilReset} days</p>
            </div>
          </>
        ) : isLow ? (
          <>
            <span className="status-icon">⚠️</span>
            <div>
              <strong>Running Low!</strong>
              <p>Only {pool.remaining} energy remaining. Consider upgrading.</p>
            </div>
          </>
        ) : (
          <>
            <span className="status-icon">✅</span>
            <div>
              <strong>Good to Go!</strong>
              <p>You have {pool.remaining} energy to activate missions</p>
            </div>
          </>
        )}
      </div>

      {/* Reset Timer */}
      <div className="energy-reset-timer">
        <span className="timer-icon">🔄</span>
        <span className="timer-text">Pool resets in {daysUntilReset} days</span>
      </div>

      {/* Upgrade CTA */}
      {(isLow || isDepleted) && onUpgradeClick && !pool.isUnlimited && (
        <button onClick={onUpgradeClick} className="energy-upgrade-btn">
          Upgrade for More Energy
        </button>
      )}

      {/* Energy Costs Reference */}
      <div className="energy-costs-section">
        <h4 className="costs-title">Mission Energy Costs</h4>
        <div className="costs-grid">
          <div className="cost-item low">
            <span className="cost-badge">LOW</span>
            <span className="cost-types">Check-in, Visit</span>
            <span className="cost-value">15 energy</span>
          </div>
          <div className="cost-item medium">
            <span className="cost-badge">MEDIUM</span>
            <span className="cost-types">Review, Feedback</span>
            <span className="cost-value">25 energy</span>
          </div>
          <div className="cost-item high">
            <span className="cost-badge">HIGH</span>
            <span className="cost-types">Photo, Video</span>
            <span className="cost-value">40 energy</span>
          </div>
          <div className="cost-item very-high">
            <span className="cost-badge">VERY HIGH</span>
            <span className="cost-types">Referral</span>
            <span className="cost-value">60 energy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   STYLES
============================================================================ */

const styles = `
.energy-status-card {
  background: linear-gradient(to bottom, #ffffff, #f9fafb);
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.energy-status-card.low {
  border-color: #f59e0b;
  background: linear-gradient(to bottom, #fff7ed, #ffffff);
}

.energy-status-card.depleted {
  border-color: #ef4444;
  background: linear-gradient(to bottom, #fef2f2, #ffffff);
}

.energy-status-card.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

/* Header */
.energy-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.energy-title {
  font-size: 20px;
  font-weight: bold;
  color: #1e0e62;
  margin: 0;
}

.energy-subtitle {
  font-size: 13px;
  color: #8f8fa3;
  margin: 4px 0 0 0;
}

.energy-tier-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.energy-tier-badge.starter {
  background: #e5e7eb;
  color: #6b7280;
}

.energy-tier-badge.silver {
  background: #c0c0c0;
  color: #374151;
}

.energy-tier-badge.gold {
  background: linear-gradient(135deg, #ffd700, #ffa500);
  color: #92400e;
}

.energy-tier-badge.platinum {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
}

/* Usage Section */
.energy-usage-section {
  margin-bottom: 20px;
}

.energy-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.stat-label {
  color: #8f8fa3;
}

.stat-value {
  font-weight: bold;
  color: #1e0e62;
}

.stat-separator {
  color: #d1d5db;
}

.stat-total {
  color: #6b7280;
}

.energy-progress-bar {
  width: 100%;
  height: 12px;
  background: #f3f4f6;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 8px;
}

.energy-progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease, background 0.3s ease;
}

.energy-progress-fill.normal {
  background: linear-gradient(90deg, #10b981, #059669);
}

.energy-progress-fill.low {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.energy-progress-fill.depleted {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.energy-percentage {
  text-align: right;
  font-size: 12px;
  color: #6b7280;
}

/* Status Message */
.energy-status-message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.energy-status-message.success {
  background: #f0fdf4;
  border: 1px solid #86efac;
}

.energy-status-message.warning {
  background: #fff7ed;
  border: 1px solid #fdba74;
}

.energy-status-message.error {
  background: #fef2f2;
  border: 1px solid #fca5a5;
}

.status-icon {
  font-size: 24px;
  line-height: 1;
}

.energy-status-message strong {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1e0e62;
  margin-bottom: 4px;
}

.energy-status-message p {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

/* Reset Timer */
.energy-reset-timer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 16px;
}

.timer-icon {
  font-size: 16px;
}

/* Upgrade Button */
.energy-upgrade-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-bottom: 16px;
}

.energy-upgrade-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

/* Energy Costs */
.energy-costs-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
}

.costs-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e0e62;
  margin: 0 0 12px 0;
}

.costs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.cost-item {
  padding: 10px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cost-item.low {
  background: #f0fdf4;
  border: 1px solid #86efac;
}

.cost-item.medium {
  background: #fff7ed;
  border: 1px solid #fdba74;
}

.cost-item.high {
  background: #fef3c7;
  border: 1px solid #fbbf24;
}

.cost-item.very-high {
  background: #fef2f2;
  border: 1px solid #fca5a5;
}

.cost-badge {
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cost-types {
  font-size: 12px;
  color: #6b7280;
}

.cost-value {
  font-size: 13px;
  font-weight: 600;
  color: #1e0e62;
}

/* Compact Mode */
.energy-compact {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.energy-compact.normal {
  background: #f0fdf4;
  color: #059669;
}

.energy-compact.low {
  background: #fff7ed;
  color: #d97706;
}

.energy-compact.depleted {
  background: #fef2f2;
  color: #dc2626;
}

.energy-icon {
  font-size: 14px;
}

.energy-value {
  font-weight: 700;
}

/* Spinner */
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 640px) {
  .costs-grid {
    grid-template-columns: 1fr;
  }
  
  .energy-stats {
    font-size: 13px;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

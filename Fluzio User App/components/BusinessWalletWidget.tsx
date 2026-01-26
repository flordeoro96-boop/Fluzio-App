/**
 * Business Points Wallet Component
 * 
 * Displays business wallet balance and allows spending points on:
 * - Extra participant slots (60/40 rule enforced)
 * - Visibility boosts
 * - Premium features
 */

import React, { useState, useEffect } from 'react';
import {
  getBusinessWallet,
  getWalletSummary,
  purchaseParticipantSlots,
  purchaseVisibilityBoost,
  canPurchaseMoreSlots,
  POINTS_PRICING
} from '../services/businessPointsWalletService';
import type { BusinessPointsWallet } from '../services/businessPointsWalletService';

interface BusinessWalletProps {
  businessId: string;
  onPurchaseSuccess?: () => void;
}

export const BusinessWalletWidget: React.FC<BusinessWalletProps> = ({
  businessId,
  onPurchaseSuccess
}) => {
  const [wallet, setWallet] = useState<BusinessPointsWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  useEffect(() => {
    loadWallet();
    const interval = setInterval(loadWallet, 2 * 60 * 1000); // Refresh every 2 min
    return () => clearInterval(interval);
  }, [businessId]);

  const loadWallet = async () => {
    try {
      const data = await getBusinessWallet(businessId);
      setWallet(data);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseSlots = async (slotsCount: number) => {
    setPurchasing(true);
    setPurchaseError(null);
    
    try {
      // Check eligibility first
      const eligibility = await canPurchaseMoreSlots(businessId);
      
      if (!eligibility.canPurchase) {
        setPurchaseError(eligibility.reason || 'Cannot purchase slots');
        setPurchasing(false);
        return;
      }
      
      if (slotsCount > eligibility.maxAvailable) {
        setPurchaseError(`Can only purchase up to ${eligibility.maxAvailable} slots`);
        setPurchasing(false);
        return;
      }
      
      const result = await purchaseParticipantSlots(businessId, slotsCount);
      
      if (result.success) {
        await loadWallet();
        onPurchaseSuccess?.();
        setShowShop(false);
        setPurchaseError(null);
      } else {
        setPurchaseError(result.error || 'Purchase failed');
      }
    } catch (error) {
      setPurchaseError('An error occurred. Please try again.');
      console.error('Purchase error:', error);
    } finally {
      setPurchasing(false);
    }
  };

  const handlePurchaseBoost = async (duration: '24H' | '7D') => {
    setPurchasing(true);
    setPurchaseError(null);
    
    try {
      const result = await purchaseVisibilityBoost(businessId, duration);
      
      if (result.success) {
        await loadWallet();
        onPurchaseSuccess?.();
        setShowShop(false);
        setPurchaseError(null);
      } else {
        setPurchaseError(result.error || 'Purchase failed');
      }
    } catch (error) {
      setPurchaseError('An error occurred. Please try again.');
      console.error('Purchase error:', error);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="wallet-widget loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!wallet) return null;

  return (
    <div className="wallet-widget">
      {/* Balance Card */}
      <div className="wallet-balance-card">
        <div className="balance-header">
          <div>
            <h3 className="balance-title">Points Wallet</h3>
            <p className="balance-subtitle">Earned from customer redemptions</p>
          </div>
          <div className="points-icon">💰</div>
        </div>

        <div className="balance-amount">
          <span className="amount-value">{wallet.balance.toLocaleString()}</span>
          <span className="amount-label">points</span>
        </div>

        <div className="balance-stats">
          <div className="stat-item">
            <span className="stat-label">Total Earned</span>
            <span className="stat-value">{wallet.totalEarned.toLocaleString()}</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-label">Total Spent</span>
            <span className="stat-value">{wallet.totalSpent.toLocaleString()}</span>
          </div>
        </div>

        <button 
          onClick={() => setShowShop(!showShop)} 
          className="wallet-shop-btn"
          disabled={wallet.balance === 0}
        >
          {showShop ? 'Close Shop' : 'Spend Points'}
        </button>
      </div>

      {/* Points Shop */}
      {showShop && (
        <div className="points-shop">
          <h4 className="shop-title">Points Shop</h4>
          
          {purchaseError && (
            <div className="shop-error">
              <span className="error-icon">⚠️</span>
              <span>{purchaseError}</span>
            </div>
          )}

          <div className="shop-items">
            {/* Extra Participants */}
            <div className="shop-item">
              <div className="item-header">
                <span className="item-icon">👥</span>
                <div>
                  <h5 className="item-title">Extra Participants</h5>
                  <p className="item-description">
                    Unlock 40% more slots after using organic pool
                  </p>
                </div>
              </div>
              <div className="item-pricing">
                <span className="price">{POINTS_PRICING.EXTRA_PARTICIPANT_SLOT} pts</span>
                <span className="per-unit">per slot</span>
              </div>
              <div className="item-actions">
                <button
                  onClick={() => handlePurchaseSlots(1)}
                  disabled={purchasing || wallet.balance < POINTS_PRICING.EXTRA_PARTICIPANT_SLOT}
                  className="purchase-btn small"
                >
                  Buy 1 Slot
                </button>
                <button
                  onClick={() => handlePurchaseSlots(5)}
                  disabled={purchasing || wallet.balance < POINTS_PRICING.EXTRA_PARTICIPANT_SLOT * 5}
                  className="purchase-btn small"
                >
                  Buy 5 Slots
                </button>
              </div>
              <div className="item-info">
                <strong>60/40 Rule:</strong> Must use all organic slots first!
              </div>
            </div>

            {/* Visibility Boost */}
            <div className="shop-item">
              <div className="item-header">
                <span className="item-icon">🚀</span>
                <div>
                  <h5 className="item-title">Visibility Boost</h5>
                  <p className="item-description">
                    Featured placement on map and feed
                  </p>
                </div>
              </div>
              <div className="item-options">
                <div className="option">
                  <div className="option-info">
                    <span className="option-duration">24 Hours</span>
                    <span className="option-price">{POINTS_PRICING.VISIBILITY_BOOST_24H} pts</span>
                  </div>
                  <button
                    onClick={() => handlePurchaseBoost('24H')}
                    disabled={purchasing || wallet.balance < POINTS_PRICING.VISIBILITY_BOOST_24H}
                    className="purchase-btn"
                  >
                    Purchase
                  </button>
                </div>
                <div className="option">
                  <div className="option-info">
                    <span className="option-duration">7 Days</span>
                    <span className="option-price">{POINTS_PRICING.VISIBILITY_BOOST_7D} pts</span>
                  </div>
                  <button
                    onClick={() => handlePurchaseBoost('7D')}
                    disabled={purchasing || wallet.balance < POINTS_PRICING.VISIBILITY_BOOST_7D}
                    className="purchase-btn"
                  >
                    Purchase
                  </button>
                </div>
              </div>
            </div>

            {/* Coming Soon */}
            <div className="shop-item disabled">
              <div className="item-header">
                <span className="item-icon">✨</span>
                <div>
                  <h5 className="item-title">Premium Features</h5>
                  <p className="item-description">
                    Advanced analytics and priority support
                  </p>
                </div>
              </div>
              <div className="coming-soon-badge">Coming Soon</div>
            </div>
          </div>

          <div className="shop-info">
            <h5 className="info-title">How It Works</h5>
            <ul className="info-list">
              <li>Customers redeem rewards and their points flow to your wallet</li>
              <li>Spend points on extra features to grow your business</li>
              <li>Extra participants are limited to 40% of your monthly pool</li>
              <li>Visibility boosts make your missions more discoverable</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   STYLES
============================================================================ */

const styles = `
.wallet-widget {
  margin-bottom: 24px;
}

.wallet-balance-card {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 16px;
  padding: 24px;
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.balance-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.balance-subtitle {
  font-size: 13px;
  opacity: 0.9;
  margin: 4px 0 0 0;
}

.points-icon {
  font-size: 32px;
}

.balance-amount {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 20px;
}

.amount-value {
  font-size: 42px;
  font-weight: 800;
  line-height: 1;
}

.amount-label {
  font-size: 16px;
  opacity: 0.9;
}

.balance-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 20px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
}

.wallet-shop-btn {
  width: 100%;
  padding: 12px;
  background: white;
  color: #6366f1;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.wallet-shop-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
}

.wallet-shop-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Points Shop */
.points-shop {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  margin-top: 16px;
}

.shop-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e0e62;
  margin: 0 0 16px 0;
}

.shop-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  color: #dc2626;
  font-size: 13px;
  margin-bottom: 16px;
}

.shop-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.shop-item {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  transition: border-color 0.2s;
}

.shop-item:hover:not(.disabled) {
  border-color: #6366f1;
}

.shop-item.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.item-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.item-icon {
  font-size: 32px;
  line-height: 1;
}

.item-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e0e62;
  margin: 0 0 4px 0;
}

.item-description {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.item-pricing {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 12px;
}

.price {
  font-size: 20px;
  font-weight: 700;
  color: #6366f1;
}

.per-unit {
  font-size: 13px;
  color: #6b7280;
}

.item-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.purchase-btn {
  flex: 1;
  padding: 10px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.purchase-btn:hover:not(:disabled) {
  background: #4f46e5;
}

.purchase-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.purchase-btn.small {
  flex: initial;
  min-width: 100px;
}

.item-info {
  font-size: 12px;
  color: #6b7280;
  padding: 8px;
  background: #f9fafb;
  border-radius: 6px;
}

.item-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.option-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-duration {
  font-size: 14px;
  font-weight: 600;
  color: #1e0e62;
}

.option-price {
  font-size: 13px;
  color: #6366f1;
  font-weight: 600;
}

.coming-soon-badge {
  display: inline-block;
  padding: 6px 12px;
  background: #fbbf24;
  color: #78350f;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

/* Info Section */
.shop-info {
  padding: 16px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 12px;
}

.info-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e0e62;
  margin: 0 0 12px 0;
}

.info-list {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
}

.info-list li {
  margin-bottom: 6px;
}

/* Loading */
.wallet-widget.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

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
  .balance-amount .amount-value {
    font-size: 36px;
  }
  
  .balance-stats {
    flex-direction: column;
    gap: 12px;
  }
  
  .stat-divider {
    display: none;
  }
  
  .stat-item {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  
  .item-actions {
    flex-direction: column;
  }
  
  .purchase-btn.small {
    width: 100%;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}

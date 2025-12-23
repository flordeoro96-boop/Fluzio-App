import React, { useState, useEffect } from 'react';
import { X, Gift, Check, Clock, QrCode, Copy, ExternalLink, Trash2, AlertCircle } from 'lucide-react';
import { Button } from './Common';
import { db } from '../services/AuthContext';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

interface RedeemedReward {
  id: string;
  rewardId: string;
  userId: string;
  businessId: string;
  businessName: string;
  title: string;
  description: string;
  costPoints: number;
  type: 'DISCOUNT' | 'FREE_ITEM' | 'VOUCHER' | 'EXPERIENCE' | 'CASHBACK';
  voucherCode?: string;
  qrCode?: string;
  redeemedAt: Date;
  expiresAt?: Date;
  usedAt?: Date;
  status: 'active' | 'used' | 'expired';
  terms?: string;
  imageUrl?: string;
}

interface MyRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const MyRewardsModal: React.FC<MyRewardsModalProps> = ({ isOpen, onClose, userId }) => {
  const { t } = useTranslation();
  const [rewards, setRewards] = useState<RedeemedReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'used' | 'expired'>('active');
  const [selectedReward, setSelectedReward] = useState<RedeemedReward | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadRewards();
    }
  }, [isOpen, userId]);

  const loadRewards = async () => {
    setLoading(true);
    try {
      const rewardsRef = collection(db, 'redeemedRewards');
      const q = query(rewardsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      const rewardsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          redeemedAt: data.redeemedAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate(),
          usedAt: data.usedAt?.toDate()
        } as RedeemedReward;
      });

      // Update expired rewards
      const now = new Date();
      rewardsData.forEach(async (reward) => {
        if (reward.expiresAt && reward.expiresAt < now && reward.status === 'active') {
          await updateDoc(doc(db, 'redeemedRewards', reward.id), {
            status: 'expired'
          });
          reward.status = 'expired';
        }
      });

      setRewards(rewardsData.sort((a, b) => b.redeemedAt.getTime() - a.redeemedAt.getTime()));
    } catch (error) {
      console.error('Failed to load redeemed rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsUsed = async (rewardId: string) => {
    try {
      await updateDoc(doc(db, 'redeemedRewards', rewardId), {
        status: 'used',
        usedAt: Timestamp.now()
      });
      
      setRewards(prev => prev.map(r => 
        r.id === rewardId 
          ? { ...r, status: 'used', usedAt: new Date() }
          : r
      ));
    } catch (error) {
      console.error('Failed to mark reward as used:', error);
    }
  };

  const deleteReward = async (rewardId: string) => {
    if (!confirm(t('rewards.deleteReward'))) return;
    
    try {
      await updateDoc(doc(db, 'redeemedRewards', rewardId), {
        deleted: true
      });
      
      setRewards(prev => prev.filter(r => r.id !== rewardId));
    } catch (error) {
      console.error('Failed to delete reward:', error);
    }
  };

  const copyVoucherCode = (code: string, rewardId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(rewardId);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return t('rewards.expired');
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getUrgencyColor = (expiresAt?: Date) => {
    if (!expiresAt) return 'text-gray-500';
    
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hoursRemaining = diff / (1000 * 60 * 60);
    
    if (hoursRemaining <= 24) return 'text-red-500 animate-pulse';
    if (hoursRemaining <= 72) return 'text-orange-500';
    return 'text-gray-500';
  };

  const filteredRewards = rewards.filter(r => r.status === tab);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">{t('rewards.myRewards')}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <div className="flex gap-2">
            {[
              { key: 'active', label: t('rewards.activeRewards'), icon: Gift, count: rewards.filter(r => r.status === 'active').length },
              { key: 'used', label: t('rewards.usedRewards'), icon: Check, count: rewards.filter(r => r.status === 'used').length },
              { key: 'expired', label: t('rewards.expiredRewards'), icon: Clock, count: rewards.filter(r => r.status === 'expired').length }
            ].map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => setTab(key as any)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  tab === key
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    tab === key ? 'bg-[#00E5FF] text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-[#00E5FF] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">{t('rewards.loading') || 'Loading your rewards...'}</p>
            </div>
          ) : filteredRewards.length === 0 ? (
            <div className="text-center py-12">
              {tab === 'active' && <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />}
              {tab === 'used' && <Check className="w-16 h-16 text-gray-300 mx-auto mb-4" />}
              {tab === 'expired' && <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />}
              <p className="text-gray-500 font-semibold mb-2">
                {tab === 'active' && t('rewards.noRewards')}
                {tab === 'used' && t('rewards.usedRewards')}
                {tab === 'expired' && t('rewards.expiredRewards')}
              </p>
              <p className="text-sm text-gray-400">
                {tab === 'active' && t('rewards.startEarning')}
                {tab === 'used' && t('rewards.usedRewards')}
                {tab === 'expired' && t('rewards.expiredRewards')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRewards.map(reward => (
                <div
                  key={reward.id}
                  onClick={() => setSelectedReward(reward)}
                  className={`bg-white border-2 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-lg ${
                    reward.status === 'active' 
                      ? 'border-[#00E5FF] hover:border-[#6C4BFF]' 
                      : reward.status === 'used'
                      ? 'border-green-200'
                      : 'border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Image */}
                    <img
                      src={reward.imageUrl || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200'}
                      className="w-20 h-20 rounded-xl object-cover"
                      alt={reward.title}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200';
                      }}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{getTypeIcon(reward.type)}</span>
                            <h3 className="font-bold text-gray-900">{reward.title}</h3>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{reward.businessName}</p>
                        </div>
                        
                        {reward.status === 'active' && reward.expiresAt && (
                          <div className={`text-right ${getUrgencyColor(reward.expiresAt)}`}>
                            <Clock className="w-4 h-4 inline mr-1" />
                            <span className="text-xs font-bold">{getTimeRemaining(reward.expiresAt)}</span>
                          </div>
                        )}
                        
                        {reward.status === 'used' && (
                          <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                            <Check className="w-4 h-4" />
                            {t('rewards.used')}
                          </div>
                        )}
                        
                        {reward.status === 'expired' && (
                          <div className="flex items-center gap-1 text-gray-400 text-xs font-semibold">
                            <AlertCircle className="w-4 h-4" />
                            {t('rewards.expired')}
                          </div>
                        )}
                      </div>
                      
                      {/* Voucher Code */}
                      {reward.voucherCode && reward.status === 'active' && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2 font-mono text-sm font-bold text-gray-900">
                            {reward.voucherCode}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyVoucherCode(reward.voucherCode!, reward.id);
                            }}
                            className="px-3 py-2 bg-[#00E5FF] text-white rounded-lg hover:bg-[#6C4BFF] transition-all"
                          >
                            {copiedCode === reward.id ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                      
                      {/* Metadata */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>{t('rewards.redeemed')} {reward.redeemedAt.toLocaleDateString()}</span>
                        {reward.usedAt && (
                          <span>• {t('rewards.used')} {reward.usedAt.toLocaleDateString()}</span>
                        )}
                        <span>• {reward.costPoints} {t('rewards.credits') || 'pts'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reward Detail Modal */}
        {selectedReward && (
          <div className="absolute inset-0 bg-white rounded-3xl z-10 flex flex-col">
            {/* Detail Header */}
            <div className="bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => setSelectedReward(null)}
                className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30"
              >
                ←
              </button>
              <h3 className="font-bold text-white">{t('rewards.details') || 'Reward Details'}</h3>
              <button
                onClick={() => deleteReward(selectedReward.id)}
                className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Image */}
              <img
                src={selectedReward.imageUrl || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600'}
                className="w-full h-48 rounded-2xl object-cover"
                alt={selectedReward.title}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600';
                }}
              />

              {/* Title & Business */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{getTypeIcon(selectedReward.type)}</span>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedReward.title}</h2>
                </div>
                <p className="text-lg text-gray-600 mb-1">{selectedReward.businessName}</p>
                <p className="text-sm text-gray-500">{selectedReward.description}</p>
              </div>

              {/* Expiry Warning */}
              {selectedReward.expiresAt && selectedReward.status === 'active' && (
                <div className={`p-4 rounded-xl border-2 ${
                  getUrgencyColor(selectedReward.expiresAt).includes('red')
                    ? 'bg-red-50 border-red-200'
                    : getUrgencyColor(selectedReward.expiresAt).includes('orange')
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className={`w-5 h-5 ${getUrgencyColor(selectedReward.expiresAt)}`} />
                    <span className={`font-bold ${getUrgencyColor(selectedReward.expiresAt)}`}>
                      Expires in {getTimeRemaining(selectedReward.expiresAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Valid until {selectedReward.expiresAt.toLocaleString()}
                  </p>
                </div>
              )}

              {/* Voucher Code (Large) */}
              {selectedReward.voucherCode && selectedReward.status === 'active' && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border-2 border-dashed border-gray-300">
                  <p className="text-sm text-gray-600 font-semibold mb-2 text-center">{t('rewards.voucherCode')}</p>
                  <div className="bg-white rounded-xl px-6 py-4 font-mono text-2xl font-bold text-center text-gray-900 mb-3 tracking-wider">
                    {selectedReward.voucherCode}
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => copyVoucherCode(selectedReward.voucherCode!, selectedReward.id)}
                  >
                    {copiedCode === selectedReward.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        {t('rewards.copied')}
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        {t('rewards.copyCode')}
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* QR Code */}
              {selectedReward.qrCode && selectedReward.status === 'active' && (
                <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 text-center">
                  <p className="text-sm text-gray-600 font-semibold mb-3">{t('rewards.scanAtBusiness') || 'Scan at Business'}</p>
                  <img
                    src={selectedReward.qrCode}
                    className="w-48 h-48 mx-auto"
                    alt="QR Code"
                  />
                </div>
              )}

              {/* Terms */}
              {selectedReward.terms && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm font-semibold text-gray-700 mb-2">{t('rewards.termsAndConditions')}</p>
                  <p className="text-xs text-gray-600 whitespace-pre-wrap">{selectedReward.terms}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('rewards.cost') || 'Cost'}</span>
                  <span className="font-bold text-gray-900">{selectedReward.costPoints} {t('rewards.points') || 'points'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('rewards.redeemed')}</span>
                  <span className="font-semibold text-gray-900">{selectedReward.redeemedAt.toLocaleString()}</span>
                </div>
                {selectedReward.usedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('rewards.used')}</span>
                    <span className="font-semibold text-green-600">{selectedReward.usedAt.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('rewards.status') || 'Status'}</span>
                  <span className={`font-bold capitalize ${
                    selectedReward.status === 'active' ? 'text-[#00E5FF]' :
                    selectedReward.status === 'used' ? 'text-green-600' :
                    'text-gray-400'
                  }`}>
                    {selectedReward.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {selectedReward.status === 'active' && (
              <div className="p-6 bg-gray-50 border-t border-gray-200">
                <Button
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => markAsUsed(selectedReward.id)}
                >
                  <Check className="w-5 h-5" />
                  {t('rewards.markAsUsed')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

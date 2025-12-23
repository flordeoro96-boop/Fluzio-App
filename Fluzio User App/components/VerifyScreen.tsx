
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, MissionStatus, Mission } from '../types';
import { store } from '../services/mockStore';
import { getParticipationsForBusiness, approveParticipation, rejectParticipation, Participation } from '../src/services/participationService';
import { getMissionById } from '../services/missionService';
import { api } from '../services/apiService';
import { useAuth } from '../services/AuthContext';
import { Button, Card } from './Common';
import { X, Check, ArrowLeft, Sparkles, ExternalLink, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VerifyScreenProps {
  user: User; // The business user
  onBack: () => void;
}

export const VerifyScreen: React.FC<VerifyScreenProps> = ({ user, onBack }) => {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [userCache, setUserCache] = useState<Map<string, User>>(new Map());
  const [missionCache, setMissionCache] = useState<Map<string, Mission>>(new Map());
  
  // Use consistent businessId
  const businessId = userProfile?.uid || user.id;

  useEffect(() => {
    const loadParticipations = async () => {
      console.log('[VerifyScreen] Loading participations for businessId:', businessId);
      const all = await getParticipationsForBusiness(businessId);
      const pending = all.filter(p => p.status === 'PENDING');
      console.log('[VerifyScreen] Found', pending.length, 'pending participations');
      setParticipations(pending);
      
      // Fetch user and mission data for each participation
      const users = new Map<string, User>();
      const missions = new Map<string, Mission>();
      
      for (const p of pending) {
        // Fetch user data
        if (!users.has(p.userId)) {
          try {
            const result = await api.getUser(p.userId);
            console.log('[VerifyScreen] API result for user', p.userId, ':', result);
            if (result.success && result.user) {
              users.set(p.userId, result.user);
              console.log('[VerifyScreen] ✅ Cached user:', result.user.name);
            } else {
              console.error('[VerifyScreen] ❌ Failed to get user:', result.error);
            }
          } catch (error) {
            console.error('[VerifyScreen] Error fetching user:', p.userId, error);
          }
        }
        
        // Fetch mission data
        if (!missions.has(p.missionId)) {
          try {
            const missionData = await getMissionById(p.missionId);
            if (missionData) {
              missions.set(p.missionId, missionData);
            }
          } catch (error) {
            console.error('[VerifyScreen] Error fetching mission:', p.missionId, error);
          }
        }
      }
      
      setUserCache(users);
      setMissionCache(missions);
    };
    loadParticipations();
  }, [user.id, businessId]);

  const handleDecision = async (participationId: string, approved: boolean) => {
      setProcessingId(participationId);
      
      try {
        if (approved) {
          console.log('[VerifyScreen] Approving participation:', participationId);
          const result = await approveParticipation(participationId);
          if (result.success) {
            console.log('[VerifyScreen] ✅ Participation approved successfully');
            alert('✅ Mission approved! Points awarded to user.');
          } else {
            console.error('[VerifyScreen] ❌ Approval failed:', result.error);
            alert('❌ Failed to approve: ' + result.error);
            setProcessingId(null);
            return;
          }
        } else {
          console.log('[VerifyScreen] Rejecting participation:', participationId);
          const feedback = prompt('Optional: Add feedback for the user (or leave empty)');
          const result = await rejectParticipation(participationId, feedback || undefined);
          if (result.success) {
            console.log('[VerifyScreen] ✅ Participation rejected successfully');
            alert('❌ Mission rejected. User has been notified.');
          } else {
            console.error('[VerifyScreen] ❌ Rejection failed:', result.error);
            alert('❌ Failed to reject: ' + result.error);
            setProcessingId(null);
            return;
          }
        }
        
        // Update local state
        setParticipations(prev => prev.filter(p => p.id !== participationId));
      } catch (error) {
        console.error('[VerifyScreen] Error processing decision:', error);
      } finally {
        setProcessingId(null);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#F8F9FE] flex flex-col font-sans overflow-hidden">
        
        {/* --- Header --- */}
        <div className="h-20 flex items-center justify-between px-6 bg-white border-b border-gray-200 shrink-0">
             <button onClick={onBack} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-[#1E0E62] transition-colors">
                 <ArrowLeft className="w-5 h-5" />
             </button>
             <div className="font-clash font-bold text-xl text-[#1E0E62]">{t('missions.approvals')}</div>
             <div className="w-9"></div>
        </div>

        {/* --- Main Content (Grid) --- */}
        <div className="flex-1 overflow-y-auto p-6">
            
            {/* Zero State */}
            {participations.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in duration-500 pb-20">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                        <Check className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-clash font-bold text-[#1E0E62] mb-2">{t('missions.allCaughtUp')}</h2>
                    <p className="text-[#8F8FA3] font-medium mb-8">{t('missions.noPendingSubmissions')}</p>
                    <Button variant="secondary" onClick={onBack}>{t('navigation.returnToDashboard')}</Button>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {participations.map(p => {
                    const submitter = userCache.get(p.userId);
                    const mission = missionCache.get(p.missionId);
                    const isProcessing = processingId === p.id;

                    if (!submitter || !mission) {
                        return (
                            <Card key={p.id} className="flex items-center justify-center h-64">
                                <div className="text-center text-gray-400">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00E5FF] mx-auto mb-2"></div>
                                    <div className="text-sm">Loading...</div>
                                </div>
                            </Card>
                        );
                    }

                    return (
                        <Card key={p.id} className={`flex flex-col overflow-hidden transition-all ${isProcessing ? 'opacity-50 scale-95' : 'hover:shadow-lg'}`}>
                            {/* Image Header */}
                            <div className="relative h-64 bg-gray-100 group cursor-pointer" onClick={() => window.open(p.proofUrl, '_blank')}>
                                <img 
                                    src={p.proofUrl || 'https://via.placeholder.com/400x600'} 
                                    className="w-full h-full object-cover" 
                                    alt="Proof"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <ExternalLink className="w-8 h-8 text-white" />
                                </div>
                                
                                {/* Status Tag */}
                                <div className="absolute top-3 right-3">
                                    <div className="px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md flex items-center gap-1.5 shadow-sm bg-blue-500/90 text-white border-blue-400">
                                        <Sparkles className="w-3 h-3" />
                                        Pending Review
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <img src={submitter.avatarUrl} className="w-10 h-10 rounded-full border border-gray-100 object-cover" alt={submitter.name} />
                                        <div>
                                            <h4 className="font-bold text-[#1E0E62] text-sm">{submitter.name}</h4>
                                            <div className="text-xs text-[#8F8FA3] flex items-center gap-1">
                                                <UserIcon className="w-3 h-3" /> @{submitter.socialLinks?.instagram?.username?.replace('@','') || 'user'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-bold text-[#8F8FA3] bg-gray-100 px-2 py-1 rounded">
                                        {p.proofSubmittedAt ? formatDistanceToNow(new Date(p.proofSubmittedAt)) : p.appliedAt ? formatDistanceToNow(new Date(p.appliedAt)) : 'Just now'}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="text-xs font-bold text-[#8F8FA3] uppercase tracking-wide mb-1">{t('navigation.missions')}</div>
                                    <div className="font-bold text-[#1E0E62] text-sm line-clamp-1">{mission.title}</div>
                                    {p.proofText && (
                                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700 line-clamp-2">
                                            {p.proofText}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100">
                                    <button 
                                        onClick={() => handleDecision(p.id, false)}
                                        disabled={isProcessing}
                                        className="flex-1 py-2.5 rounded-xl border border-red-100 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <X className="w-4 h-4" /> {t('common.reject')}
                                    </button>
                                    <button 
                                        onClick={() => handleDecision(p.id, true)}
                                        disabled={isProcessing}
                                        className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-4 h-4" /> {t('common.approve')}
                                    </button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    </div>
  );
};

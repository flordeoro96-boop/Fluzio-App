
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mission, User, SubscriptionLevel, MissionCategory, RewardType, ProofType, BusinessCategory } from '../types';
import { store } from '../services/mockStore';
import { Card, Button, Modal, Input, TextArea } from './Common';
import { Star, Instagram, Users, Video, MapPin, Lock, ChevronRight, Edit2 } from 'lucide-react';
import { createMission, publishMission, getMaxParticipantsBySubscription, toggleMissionStatus } from '../services/missionService';

// Helper to map BusinessCategory to MissionCategory
const mapBusinessCategoryToMissionCategory = (businessCat?: BusinessCategory): MissionCategory => {
  if (!businessCat) return MissionCategory.OTHER;
  
  const mapping: Record<BusinessCategory, MissionCategory> = {
    [BusinessCategory.GASTRONOMY]: MissionCategory.FOOD,
    [BusinessCategory.RETAIL]: MissionCategory.FASHION,
    [BusinessCategory.FITNESS]: MissionCategory.LIFESTYLE,
    [BusinessCategory.SERVICES]: MissionCategory.OTHER,
    [BusinessCategory.OTHER]: MissionCategory.OTHER
  };
  
  return mapping[businessCat] || MissionCategory.OTHER;
};

interface StandardMissionsListProps {
  missions: Mission[];
  user: User;
  onToggle: (id: string, mission: Mission) => void;
  onMissionActivated?: () => void;
  togglingMissionId?: string | null;
}

export const StandardMissionsList: React.FC<StandardMissionsListProps> = ({ missions, user, onToggle, onMissionActivated, togglingMissionId }) => {
  const { t } = useTranslation();
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [editForm, setEditForm] = useState({ description: '', points: 0 });
  const [activating, setActivating] = useState<string | null>(null);

  // Get current user subscription (includes localStorage override)
  const currentUser = store.getUser(user.id);
  const currentSubscription = currentUser?.subscriptionLevel || user.subscriptionLevel;
  console.log('[StandardMissionsList] Current subscription:', currentSubscription, 'Max participants:', getMaxParticipantsBySubscription(currentSubscription));

  const getIcon = (title: string) => {
    if (title.includes("Google")) return <Star className="w-5 h-5" />;
    if (title.includes("Instagram")) return <Instagram className="w-5 h-5" />;
    if (title.includes("Refer")) return <Users className="w-5 h-5" />;
    if (title.includes("TikTok")) return <Video className="w-5 h-5" />;
    if (title.includes("Facebook")) return <MapPin className="w-5 h-5" />;
    return <Star className="w-5 h-5" />;
  };

  const getIconColor = (title: string, isActive: boolean) => {
     if (isActive) return "text-white";
     if (title.includes("Google")) return "text-yellow-500";
     if (title.includes("Instagram")) return "text-pink-500";
     if (title.includes("Refer")) return "text-blue-500";
     if (title.includes("TikTok")) return "text-black";
     if (title.includes("Facebook")) return "text-blue-600";
     return "text-gray-500";
  };

  const getIconBg = (title: string, isActive: boolean) => {
      if (isActive) return "bg-gradient-to-br from-[#FFC300] via-[#F72585] to-[#7209B7]";
      if (title.includes("Google")) return "bg-yellow-50";
      if (title.includes("Instagram")) return "bg-pink-50";
      if (title.includes("Refer")) return "bg-blue-50";
      if (title.includes("TikTok")) return "bg-gray-100";
      if (title.includes("Facebook")) return "bg-blue-50";
      return "bg-gray-50";
  };

  const isLocked = (title: string) => {
      const isFree = currentSubscription === SubscriptionLevel.FREE || currentSubscription === SubscriptionLevel.SILVER;
      return title.includes("TikTok") && isFree;
  };

  const handleEditClick = (m: Mission) => {
      setEditingMission(m);
      setEditForm({ description: m.description, points: m.reward.points });
  };

  const saveEdit = () => {
      // In a real app, update store. For mock, we just close.
      // store.updateMission(editingMission.id, ...);
      setEditingMission(null);
  };

  const handleToggle = async (missionId: string, mission: Mission) => {
    setActivating(missionId);
    
    try {
      // If activating (not currently active), create in Firestore
      if (!mission.isActive) {
        // Get max participants based on subscription
        const maxParticipants = getMaxParticipantsBySubscription(currentSubscription);
        
        // Create mission in Firestore
        const result = await createMission({
          businessId: user.id,
          businessName: user.name,
          businessLogo: user.photoUrl || user.avatarUrl,
          title: mission.title,
          description: mission.description,
          category: mapBusinessCategoryToMissionCategory(user.category) || MissionCategory.OTHER,
          requirements: ['Standard mission'],
          location: user.location,
          reward: mission.reward,
          proofType: mission.proofType || ProofType.SCREENSHOT,
          maxParticipants: maxParticipants,
          validUntil: new Date(Date.now() + 86400000 * 30).toISOString(), // 30 days
          image: mission.image || 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=400&fit=crop',
          goal: 'REVIEWS' as Mission['goal'],
          detailedRequirements: {
            postType: 'ANY',
            hashtags: [],
            mentions: [],
            minFollowers: 0
          },
          isStandard: true
        });
        
        if (!result.success || !result.missionId) {
          console.error('Failed to create mission:', result.error);
          return;
        }
        
        // Publish it immediately
        await publishMission(result.missionId);
        
        // Update mission with firestoreId
        mission.firestoreId = result.missionId;
        
        // Call parent toggle with mission object
        onToggle(missionId, mission);
        
        // Trigger refresh
        if (onMissionActivated) {
          onMissionActivated();
        }
      } else {
        // Deactivating - handled by parent
        onToggle(missionId, mission);
      }
    } catch (error) {
      console.error('Error toggling standard mission:', error);
    } finally {
      setActivating(null);
    }
  };

  return (
    <div className="space-y-3">
       {missions.map(m => {
           const locked = isLocked(m.title);
           const activeClass = m.isActive 
             ? "border-transparent ring-2 ring-[#F72585] shadow-[0_0_20px_rgba(247,37,133,0.15)]" 
             : "border-white hover:border-gray-200";
           
           return (
             <div 
                key={m.id} 
                className={`relative bg-white rounded-2xl p-4 border transition-all duration-200 flex items-center gap-4 shadow-sm ${activeClass} ${locked ? 'opacity-70 grayscale' : ''}`}
             >
                 {/* Icon */}
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${getIconBg(m.title, !!m.isActive)} ${getIconColor(m.title, !!m.isActive)}`}>
                     {getIcon(m.title)}
                 </div>

                 {/* Text (Clickable for Edit) */}
                 <button 
                    onClick={() => !locked && handleEditClick(m)} 
                    className="flex-1 text-left"
                    disabled={locked}
                 >
                     <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#1E0E62] text-sm">{m.title}</h4>
                        {locked && <Lock className="w-3 h-3 text-gray-400" />}
                     </div>
                     <p className="text-xs text-[#8F8FA3] font-medium truncate pr-2">{m.description}</p>
                     <p className="text-[10px] text-[#F72585] font-bold mt-1">
                       {t('missions.maxParticipants', { count: getMaxParticipantsBySubscription(currentSubscription) })}
                     </p>
                 </button>

                 {/* Toggle Switch */}
                 <div className="shrink-0">
                     {locked ? (
                         <div className="w-10 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                             <Lock className="w-3 h-3 text-gray-400" />
                         </div>
                     ) : (
                         <button 
                            onClick={() => handleToggle(m.id, m)}
                            disabled={activating === m.id || togglingMissionId === m.id}
                            className={`w-12 h-7 rounded-full transition-colors p-1 flex items-center ${m.isActive ? 'bg-[#F72585]' : 'bg-gray-200'} ${(activating === m.id || togglingMissionId === m.id) ? 'opacity-50' : ''}`}
                         >
                             <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform transform ${m.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                         </button>
                     )}
                 </div>
             </div>
           );
       })}

       {/* Edit Modal */}
       <Modal isOpen={!!editingMission} onClose={() => setEditingMission(null)} title={t('missions.editMissionTitle', { title: editingMission?.title || '' })}>
           <div className="space-y-4">
               <Input 
                 label={t('missions.missionDescription')} 
                  value={editForm.description} 
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
               />
               <Input 
                 label={t('missions.pointsReward')} 
                  type="number"
                  value={editForm.points} 
                  onChange={e => setEditForm({...editForm, points: Number(e.target.value)})}
               />
               <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700">
                    <p className="font-bold mb-1">{t('common.proTip')}:</p>
                    {t('missions.standardTip')}
               </div>
                <Button className="w-full" onClick={saveEdit}>{t('settings.saveChanges')}</Button>
           </div>
       </Modal>
    </div>
  );
};

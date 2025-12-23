
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Mission, User, SubscriptionLevel, MissionCategory, RewardType, ProofType, BusinessCategory } from '../types';
import { store } from '../services/mockStore';
import { Card, Button, Modal, Input, TextArea } from './Common';
import { Star, Instagram, Users, Video, MapPin, Lock, ChevronRight, Edit2, QrCode, Navigation } from 'lucide-react';
import { createMission, publishMission, getMaxParticipantsBySubscription, toggleMissionStatus } from '../services/missionService';
import { db } from '../services/AuthContext';
import { doc, getDoc } from 'firebase/firestore';

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
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedCheckInMethod, setSelectedCheckInMethod] = useState<'QR_ONLY' | 'GPS' | 'BOTH'>('QR_ONLY');
  const [pendingMission, setPendingMission] = useState<Mission | null>(null);
  const [activeCheckInMethod, setActiveCheckInMethod] = useState<'QR_ONLY' | 'GPS' | 'BOTH' | null>(null);

  // Fetch active check-in method from Firestore
  const fetchActiveCheckInMethod = useCallback(async () => {
    try {
      const activationId = `${user.id}_VISIT_CHECKIN`;
      console.log('[StandardMissionsList] Fetching check-in method for:', activationId);
      const activationDoc = await getDoc(doc(db, 'missionActivations', activationId));
      
      if (activationDoc.exists()) {
        const data = activationDoc.data();
        console.log('[StandardMissionsList] Activation doc data:', data);
        const method = data.config?.checkInMethod;
        if (method) {
          setActiveCheckInMethod(method);
          console.log('[StandardMissionsList] ✅ Active check-in method set to:', method);
        } else {
          console.log('[StandardMissionsList] ⚠️ No checkInMethod found in config');
        }
      } else {
        console.log('[StandardMissionsList] ⚠️ No activation document found');
      }
    } catch (error) {
      console.error('[StandardMissionsList] ❌ Error fetching check-in method:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchActiveCheckInMethod();
    }
  }, [user?.id, missions, fetchActiveCheckInMethod]);

  // Get current user subscription level
  const currentSubscription = user.subscriptionLevel;
  console.log('[StandardMissionsList] Current subscription:', currentSubscription, 'Max participants:', getMaxParticipantsBySubscription(currentSubscription));
  console.log('[StandardMissionsList] User businessMode:', user.businessMode, 'User ID:', user.id);

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
      if (isActive) return "bg-gradient-to-br from-[#FFB86C] via-[#00E5FF] to-[#6C4BFF]";
      if (title.includes("Google")) return "bg-yellow-50";
      if (title.includes("Instagram")) return "bg-pink-50";
      if (title.includes("Refer")) return "bg-blue-50";
      if (title.includes("TikTok")) return "bg-gray-100";
      if (title.includes("Facebook")) return "bg-blue-50";
      return "bg-gray-50";
  };

  const isLocked = (title: string) => {
      const isFree = currentSubscription === SubscriptionLevel.FREE || currentSubscription === SubscriptionLevel.SILVER;
      
      // TikTok missions locked for free/silver
      if (title.includes("TikTok") && isFree) return true;
      
      // Google missions locked if Google not connected
      if (title.includes("Google Review")) {
        const hasGoogle = user.socialAccounts?.google?.connected || 
                          user.integrations?.googleBusiness?.connected;
        return !hasGoogle;
      }
      
      // Instagram missions locked if Instagram not connected
      if (title.includes("Instagram") || title.includes("Story") || 
          title.includes("Feed") || title.includes("Reel")) {
        const hasInstagram = user.socialAccounts?.instagram?.connected ||
                             user.integrations?.instagram?.connected;
        return !hasInstagram;
      }
      
      return false;
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

  const confirmCheckInMethod = async () => {
    if (!pendingMission) return;
    
    setShowCheckInModal(false);
    const mission = pendingMission;
    setPendingMission(null);
    setActivating(mission.id);
    
    try {
      const maxParticipants = getMaxParticipantsBySubscription(currentSubscription);
      const missionTemplateId = mission.missionTemplateId || 'VISIT_CHECKIN';
      const checkInMethod = selectedCheckInMethod;
      
      console.log('[StandardMissionsList] Activating with checkInMethod:', checkInMethod);
      
      const activateResponse = await fetch(
        `https://us-central1-fluzio-13af2.cloudfunctions.net/activateMission`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: user.id,
            missionId: missionTemplateId,
            config: {
              reward: mission.reward.points,
              maxParticipants: maxParticipants,
              validUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
              cooldownPeriod: 24,
              requiresApproval: mission.requiresApproval || false,
              checkInMethod: checkInMethod
            }
          })
        }
      );
      
      const activationResult = await activateResponse.json();
      
      if (!activateResponse.ok) {
        // Handle ALREADY_ACTIVE (409) - mission is already active, just sync UI state
        if (activationResult.error?.code === 'ALREADY_ACTIVE') {
          console.log('[StandardMissionsList] Mission already active in confirmCheckInMethod, syncing UI state');
          // Mark as active in UI without creating duplicate
          onToggle(mission.id, { ...mission, isActive: true });
          if (onMissionActivated) {
            onMissionActivated();
          }
          alert('✅ This mission is already active!');
          return;
        }
        
        if (activationResult.error?.code === 'MISSING_BUSINESS_CONNECTION') {
          const conn = activationResult.error.requiredConnection;
          alert(
            `⚠️ Connection Required\n\n` +
            `To activate "${mission.title}", you need to connect your ${conn.displayName}.\n\n` +
            `${conn.description}\n\n` +
            `Go to Settings → Integrations to connect.`
          );
          return;
        }
        alert(`Failed to activate mission: ${activationResult.error?.message || 'Unknown error'}`);
        return;
      }
      
      console.log('[StandardMissionsList] ✅ Connection check passed, proceeding with mission creation');
      
      // Show user requirements if any (warnings, not blockers)
      if (activationResult.activation?.userRequirements?.length > 0) {
        const requirements = activationResult.activation.userRequirements;
        const reqText = requirements.map((r: any) => 
          `• Users need ${r.displayName} to complete this mission`
        ).join('\n');
        console.log(`[StandardMissionsList] Mission activated with user requirements:\n${reqText}`);
      }
      
      // Now create the mission in Firestore (legacy flow)
      const isCheckInMission = mission.title.includes('Visit') || mission.title.includes('Check-In');
      const isBringAFriend = mission.title.includes('Bring a Friend');
      const needsQRScan = isCheckInMission || isBringAFriend;
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
        triggerType: needsQRScan ? 'QR_SCAN' : 'MANUAL',
        requiresApproval: (isCheckInMission || isBringAFriend) ? false : (mission.requiresApproval || false),
        maxParticipants: maxParticipants,
        validUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
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
      onToggle(mission.id, mission);
      
      // Trigger refresh
      if (onMissionActivated) {
        onMissionActivated();
      }
      
      // Update active check-in method display immediately
      console.log('[StandardMissionsList] Setting activeCheckInMethod to:', checkInMethod);
      setActiveCheckInMethod(checkInMethod);
      
      // Show success message with QR code instructions
      if (mission.title.includes('Visit') || mission.title.includes('Check-In')) {
        alert(
          `✅ Mission Activated Successfully!\n\n` +
          `Your "${mission.title}" mission is now live.\n\n` +
          `📱 Next Step: Get Your QR Code\n` +
          `Click the "Check-In QR" button at the top of your dashboard to:\n` +
          `• Download your QR code\n` +
          `• Print it for your store\n` +
          `• Order professional engraving\n\n` +
          `Customers will scan this QR code to complete the mission!`
        );
      }
      
      // Refetch from Firestore after a short delay to ensure backend has written
      setTimeout(() => {
        console.log('[StandardMissionsList] Refetching check-in method from Firestore...');
        fetchActiveCheckInMethod();
      }, 2000);
      
    } catch (error: any) {
      console.error('Error activating mission:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setActivating(null);
    }
  };

  const handleToggle = async (missionId: string, mission: Mission) => {
    setActivating(missionId);
    
    try {
      // If activating (not currently active), use new activation endpoint with connection gating
      if (!mission.isActive) {
        // Get max participants based on subscription
        const maxParticipants = getMaxParticipantsBySubscription(currentSubscription);
        
        // Map mission ID to template ID for connection checking
        const missionTemplateId = mission.missionTemplateId || 
          (mission.title.includes('Google Review with Photos') ? 'GOOGLE_REVIEW_PHOTOS' :
           mission.title.includes('Google Review') ? 'GOOGLE_REVIEW_TEXT' :
           mission.title.includes('Story') || mission.title.includes('Instagram') ? 'STORY_POST_TAG' :
           mission.title.includes('Feed') || mission.title.includes('Reel') ? 'FEED_REEL_POST_TAG' :
           'VISIT_CHECKIN');
        
        // For Visit & Check-In missions, show modal to select verification method
        if (mission.title.includes('Visit') || mission.title.includes('Check-In')) {
          setPendingMission(mission);
          setSelectedCheckInMethod('QR_ONLY');
          setShowCheckInModal(true);
          setActivating(null);
          return; // Wait for modal confirmation
        }
        
        const checkInMethod: 'QR_ONLY' | 'GPS' | 'BOTH' = 'QR_ONLY';
        
        // Call new activation endpoint with connection gating
        console.log('[StandardMissionsList] Calling activation endpoint:', {
          businessId: user.id,
          missionId: missionTemplateId,
          missionTitle: mission.title
        });
        
        const activateResponse = await fetch(
          `https://us-central1-fluzio-13af2.cloudfunctions.net/activateMission`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessId: user.id,
              missionId: missionTemplateId,
              config: {
                reward: mission.reward.points,
                maxParticipants: maxParticipants,
                validUntil: new Date(Date.now() + 86400000 * 30).toISOString(), // 30 days
                cooldownPeriod: 24,
                requiresApproval: mission.requiresApproval || false,
                checkInMethod: checkInMethod // Add check-in method for Visit & Check-In missions
              }
            })
          }
        );
        
        console.log('[StandardMissionsList] Activation response status:', activateResponse.status);
        
        const activationResult = await activateResponse.json();
        console.log('[StandardMissionsList] Activation result:', activationResult);
        
        // Handle connection errors (403 = missing business connection)
        if (!activateResponse.ok) {
          // Handle ALREADY_ACTIVE (409) - mission is already active, just sync UI state
          if (activationResult.error?.code === 'ALREADY_ACTIVE') {
            console.log('[StandardMissionsList] Mission already active, syncing UI state');
            // Mark as active in UI without creating duplicate
            onToggle(missionId, { ...mission, isActive: true });
            if (onMissionActivated) {
              onMissionActivated();
            }
            return;
          }
          
          if (activationResult.error?.code === 'MISSING_BUSINESS_CONNECTION') {
            const conn = activationResult.error.requiredConnection;
            console.error('[StandardMissionsList] ❌ BLOCKED - Missing connection:', conn);
            alert(
              `⚠️ Connection Required\n\n` +
              `To activate "${mission.title}", you need to connect your ${conn.displayName}.\n\n` +
              `${conn.description}\n\n` +
              `Go to Settings → Integrations to connect.`
            );
            return;
          }
          console.error('[StandardMissionsList] ❌ Activation failed:', activationResult.error);
          alert(`Failed to activate mission: ${activationResult.error?.message || 'Unknown error'}`);
          return;
        }
        
        console.log('[StandardMissionsList] ✅ Connection check passed, proceeding with mission creation');
        
        // Show user requirements if any (warnings, not blockers)
        if (activationResult.activation?.userRequirements?.length > 0) {
          const requirements = activationResult.activation.userRequirements;
          const reqText = requirements.map((r: any) => 
            `• Users need ${r.displayName} to complete this mission`
          ).join('\n');
          
          console.log(`[StandardMissionsList] Mission activated with user requirements:\n${reqText}`);
        }
        
        // Now create the mission in Firestore (legacy flow)
        const isCheckInMission = mission.title.includes('Visit') || mission.title.includes('Check-In');
        const isBringAFriend = mission.title.includes('Bring a Friend');
        const needsQRScan = isCheckInMission || isBringAFriend;
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
          triggerType: needsQRScan ? 'QR_SCAN' : 'MANUAL',
          requiresApproval: (isCheckInMission || isBringAFriend) ? false : (mission.requiresApproval || false),
          maxParticipants: maxParticipants,
          validUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
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
        // Deactivating - call deactivation endpoint
        const missionTemplateId = mission.missionTemplateId || 
          (mission.title.includes('Google Review with Photos') ? 'GOOGLE_REVIEW_PHOTOS' :
           mission.title.includes('Google Review') ? 'GOOGLE_REVIEW_TEXT' :
           mission.title.includes('Story') || mission.title.includes('Instagram') ? 'STORY_POST_TAG' :
           mission.title.includes('Feed') || mission.title.includes('Reel') ? 'FEED_REEL_POST_TAG' :
           'VISIT_CHECKIN');
        
        console.log('[StandardMissionsList] Calling deactivation endpoint:', {
          businessId: user.id,
          missionId: missionTemplateId,
          missionTitle: mission.title
        });
        
        const deactivateResponse = await fetch(
          `https://us-central1-fluzio-13af2.cloudfunctions.net/deactivateMission`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessId: user.id,
              missionId: missionTemplateId
            })
          }
        );
        
        console.log('[StandardMissionsList] Deactivation response status:', deactivateResponse.status);
        
        const deactivationResult = await deactivateResponse.json();
        console.log('[StandardMissionsList] Deactivation result:', deactivationResult);
        
        if (!deactivateResponse.ok) {
          console.error('[StandardMissionsList] ❌ Deactivation failed:', deactivationResult.error);
          alert(`Failed to deactivate mission: ${deactivationResult.error || 'Unknown error'}`);
          return;
        }
        
        console.log('[StandardMissionsList] ✅ Mission deactivated successfully');
        
        // Update mission status in Firestore if it has a firestoreId
        if (mission.firestoreId) {
          await toggleMissionStatus(mission.firestoreId, true); // true = pause
        }
        
        // Call parent toggle
        onToggle(missionId, mission);
      }
    } catch (error) {
      console.error('Error toggling standard mission:', error);
      alert('Failed to activate mission. Please try again.');
    } finally {
      setActivating(null);
    }
  };

  // Categorize missions
  const googleMissions = missions.filter(m => m.title.includes('Google Review'));
  const instagramMissions = missions.filter(m => 
    m.title.includes('Instagram') || 
    m.title.includes('Story') || 
    m.title.includes('Feed') || 
    m.title.includes('Reel') ||
    m.title.includes('Photo') && !m.title.includes('Google')
  );
  
  // Define which missions are in-person (these should be hidden for online-only businesses)
  const isInPersonMission = (m: Mission) => 
    m.title.includes('Visit') || 
    m.title.includes('Check-In') ||
    m.title.includes('Friend') ||
    m.title.includes('Consultation');
  
  // Filter in-person missions based on business mode (use businessMode field, not businessType)
  const businessMode = user.businessMode || 'PHYSICAL';
  const isOnlineOnly = businessMode === 'ONLINE';
  const inPersonMissions = isOnlineOnly ? [] : missions.filter(isInPersonMission);
  
  // For other missions: exclude google, instagram, and ALL in-person missions (even if online-only)
  const otherMissions = missions.filter(m => 
    !googleMissions.includes(m) && 
    !instagramMissions.includes(m) && 
    !isInPersonMission(m)
  );

  const renderMission = (m: Mission) => {
    const locked = isLocked(m.title);
    const activeClass = m.isActive 
      ? "border-transparent ring-2 ring-[#00E5FF] shadow-[0_0_20px_rgba(247,37,133,0.15)]" 
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
              <div className="flex items-center gap-2 flex-wrap">
                 <h4 className="font-bold text-[#1E0E62] text-sm">{m.title}</h4>
                 {locked && <Lock className="w-3 h-3 text-gray-400" />}
                 {/* Show active check-in method badge for Visit & Check-In missions */}
                 {m.isActive && (m.title.includes('Visit') || m.title.includes('Check-In')) && activeCheckInMethod && (
                   <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-[#00E5FF]/20 to-[#6C4BFF]/20 border border-[#00E5FF]/30 rounded-full text-[10px] font-bold text-[#1E0E62]">
                     {activeCheckInMethod === 'QR_ONLY' && (
                       <>
                         <QrCode className="w-3 h-3" />
                         QR Only
                       </>
                     )}
                     {activeCheckInMethod === 'GPS' && (
                       <>
                         <Navigation className="w-3 h-3" />
                         GPS Only
                       </>
                     )}
                     {activeCheckInMethod === 'BOTH' && (
                       <>
                         <QrCode className="w-3 h-3" />
                         <Navigation className="w-3 h-3" />
                         Flexible
                       </>
                     )}
                   </span>
                 )}
              </div>
              <p className="text-xs text-[#8F8FA3] font-medium truncate pr-2">{m.description}</p>
              <p className="text-[10px] text-[#00E5FF] font-bold mt-1">
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
                     className={`w-12 h-7 rounded-full transition-colors p-1 flex items-center ${m.isActive ? 'bg-[#00E5FF]' : 'bg-gray-200'} ${(activating === m.id || togglingMissionId === m.id) ? 'opacity-50' : ''}`}
                  >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform transform ${m.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
              )}
          </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
       {/* Google Reviews Section */}
       {googleMissions.length > 0 && (
         <div className="space-y-3">
           <div className="flex items-center gap-2 px-1">
             <Star className="w-4 h-4 text-yellow-500" />
             <h4 className="font-bold text-gray-900 text-sm">⭐ Google Reviews</h4>
           </div>
           <div className="space-y-3">
             {googleMissions.map(renderMission)}
           </div>
         </div>
       )}

       {/* Instagram / Social Media Section */}
       {instagramMissions.length > 0 && (
         <div className="space-y-3">
           <div className="flex items-center gap-2 px-1">
             <Instagram className="w-4 h-4 text-pink-500" />
             <h4 className="font-bold text-gray-900 text-sm">📸 Instagram & Social</h4>
           </div>
           <div className="space-y-3">
             {instagramMissions.map(renderMission)}
           </div>
         </div>
       )}

       {/* In-Person / Visit Section */}
       {inPersonMissions.length > 0 && (
         <div className="space-y-3">
           <div className="flex items-center gap-2 px-1">
             <MapPin className="w-4 h-4 text-green-500" />
             <h4 className="font-bold text-gray-900 text-sm">📍 In-Person & Visits</h4>
           </div>
           <div className="space-y-3">
             {inPersonMissions.map(renderMission)}
           </div>
         </div>
       )}

       {/* Other Missions Section */}
       {otherMissions.length > 0 && (
         <div className="space-y-3">
           <div className="flex items-center gap-2 px-1">
             <Users className="w-4 h-4 text-blue-500" />
             <h4 className="font-bold text-gray-900 text-sm">✨ Other Missions</h4>
           </div>
           <div className="space-y-3">
             {otherMissions.map(renderMission)}
           </div>
         </div>
       )}

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

       {/* Check-In Verification Method Modal */}
       <Modal 
         isOpen={showCheckInModal} 
         onClose={() => {
           setShowCheckInModal(false);
           setPendingMission(null);
         }} 
         title="Choose Check-In Verification Method"
       >
         <div className="space-y-4">
           <p className="text-sm text-gray-600 mb-4">
             How should customers verify their visit to your location?
           </p>

           {/* QR Code Only Option */}
           <button
             onClick={() => setSelectedCheckInMethod('QR_ONLY')}
             className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
               selectedCheckInMethod === 'QR_ONLY'
                 ? 'border-[#00E5FF] bg-[#00E5FF]/10'
                 : 'border-gray-200 hover:border-gray-300'
             }`}
           >
             <div className="flex items-start gap-3">
               <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                 selectedCheckInMethod === 'QR_ONLY' ? 'border-[#00E5FF] bg-[#00E5FF]' : 'border-gray-300'
               }`}>
                 {selectedCheckInMethod === 'QR_ONLY' && (
                   <div className="w-2 h-2 bg-white rounded-full" />
                 )}
               </div>
               <div className="flex-1">
                 <div className="font-bold text-gray-900 mb-1">🔒 QR Code Only (Recommended)</div>
                 <p className="text-xs text-gray-600">
                   Customers must scan your QR code at your location. This ensures they are physically present in your store.
                 </p>
               </div>
             </div>
           </button>

           {/* GPS Only Option */}
           <button
             onClick={() => setSelectedCheckInMethod('GPS')}
             className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
               selectedCheckInMethod === 'GPS'
                 ? 'border-[#00E5FF] bg-[#00E5FF]/10'
                 : 'border-gray-200 hover:border-gray-300'
             }`}
           >
             <div className="flex items-start gap-3">
               <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                 selectedCheckInMethod === 'GPS' ? 'border-[#00E5FF] bg-[#00E5FF]' : 'border-gray-300'
               }`}>
                 {selectedCheckInMethod === 'GPS' && (
                   <div className="w-2 h-2 bg-white rounded-full" />
                 )}
               </div>
               <div className="flex-1">
                 <div className="font-bold text-gray-900 mb-1">📍 GPS Only</div>
                 <p className="text-xs text-gray-600">
                   Customers can check in when within 100 meters of your location. No QR code required.
                 </p>
               </div>
             </div>
           </button>

           {/* Both Options */}
           <button
             onClick={() => setSelectedCheckInMethod('BOTH')}
             className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
               selectedCheckInMethod === 'BOTH'
                 ? 'border-[#00E5FF] bg-[#00E5FF]/10'
                 : 'border-gray-200 hover:border-gray-300'
             }`}
           >
             <div className="flex items-start gap-3">
               <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                 selectedCheckInMethod === 'BOTH' ? 'border-[#00E5FF] bg-[#00E5FF]' : 'border-gray-300'
               }`}>
                 {selectedCheckInMethod === 'BOTH' && (
                   <div className="w-2 h-2 bg-white rounded-full" />
                 )}
               </div>
               <div className="flex-1">
                 <div className="font-bold text-gray-900 mb-1">🔄 Flexible (QR Code or GPS)</div>
                 <p className="text-xs text-gray-600">
                   Customers can use either method. Maximum convenience but less verification security.
                 </p>
               </div>
             </div>
           </button>

           {/* Confirm Button */}
           <Button 
             className="w-full mt-6" 
             onClick={confirmCheckInMethod}
           >
             Activate Mission with Selected Method
           </Button>
         </div>
       </Modal>
    </div>
  );
};

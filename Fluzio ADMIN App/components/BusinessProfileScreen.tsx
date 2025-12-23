import React from 'react';
import { User } from '../types';
import { BusinessProfileHeader } from './business/BusinessProfileHeader';
import { BusinessAboutCard } from './business/BusinessAboutCard';
import { BusinessInfoPanel } from './business/BusinessInfoPanel';
import { BrandTags } from './business/BrandTags';
import { CollabStats } from './business/CollabStats';
import { CollabOffers } from './business/CollabOffers';
import { Edit, ArrowLeft } from 'lucide-react';
import { Button } from './Common';
import { socialAuthService } from '../services/socialAuthService';
import { useAuth } from '../services/AuthContext';
import { useTranslation } from 'react-i18next';

interface BusinessProfileScreenProps {
  business: User;
  isOwner?: boolean;
  onEdit?: () => void;
  onBack?: () => void;
}

export const BusinessProfileScreen: React.FC<BusinessProfileScreenProps> = ({ 
  business, 
  isOwner = false,
  onEdit,
  onBack
}) => {
  const { t } = useTranslation();
  const { refreshUserProfile } = useAuth();

  console.log('[BusinessProfileScreen] Rendering with business data:', {
    name: business.name,
    bio: business.bio,
    mission: business.mission,
    vibe: business.vibe,
    vibeTags: business.vibeTags,
    offers: business.offers,
    languages: business.languages,
    rating: business.rating,
    collabsCompleted: business.collabsCompleted
  });

  // Google handlers
  const handleConnectGoogle = async () => {
    if (!isOwner) return;
    try {
      const result = await socialAuthService.linkGoogle();
      if (result.success) {
        alert('Google account connected successfully!');
        await refreshUserProfile();
      } else {
        alert(result.error || 'Failed to connect Google account');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to connect Google account');
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!isOwner) return;
    const confirmed = confirm('Are you sure you want to disconnect your Google account?');
    if (!confirmed) return;
    
    try {
      const result = await socialAuthService.unlinkGoogle();
      if (result.success) {
        alert('Google account disconnected successfully');
        await refreshUserProfile();
      } else {
        alert(result.error || 'Failed to disconnect Google account');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to disconnect Google account');
    }
  };

  // Facebook handlers
  const handleConnectFacebook = async () => {
    if (!isOwner) return;
    try {
      const result = await socialAuthService.linkFacebook();
      if (result.success) {
        alert('Facebook account connected successfully!');
        await refreshUserProfile();
      } else {
        alert(result.error || 'Failed to connect Facebook account');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to connect Facebook account');
    }
  };

  const handleDisconnectFacebook = async () => {
    if (!isOwner) return;
    const confirmed = confirm('Are you sure you want to disconnect your Facebook account?');
    if (!confirmed) return;
    
    try {
      const result = await socialAuthService.unlinkFacebook();
      if (result.success) {
        alert('Facebook account disconnected successfully');
        await refreshUserProfile();
      } else {
        alert(result.error || 'Failed to disconnect Facebook account');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to disconnect Facebook account');
    }
  };

  // Instagram handlers (stubs)
  const handleConnectInstagram = async () => {
    if (!isOwner) return;
    alert('Instagram OAuth connection will be implemented with backend setup.');
  };

  const handleDisconnectInstagram = async () => {
    if (!isOwner) return;
    const confirmed = confirm('Are you sure you want to disconnect your Instagram account?');
    if (!confirmed) return;
    alert('Instagram disconnect will be implemented with backend.');
  };

  // TikTok handlers (stubs)
  const handleConnectTikTok = async () => {
    if (!isOwner) return;
    alert('TikTok OAuth connection will be implemented soon.');
  };

  const handleDisconnectTikTok = async () => {
    if (!isOwner) return;
    const confirmed = confirm('Are you sure you want to disconnect your TikTok account?');
    if (!confirmed) return;
    alert('TikTok disconnect will be implemented soon.');
  };

  // LinkedIn handlers (stubs)
  const handleConnectLinkedIn = async () => {
    if (!isOwner) return;
    alert('LinkedIn OAuth connection will be implemented soon.');
  };

  const handleDisconnectLinkedIn = async () => {
    if (!isOwner) return;
    const confirmed = confirm('Are you sure you want to disconnect your LinkedIn account?');
    if (!confirmed) return;
    alert('LinkedIn disconnect will be implemented soon.');
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#F8F9FE] overflow-y-auto">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <h1 className="text-lg font-bold text-[#1E0E62]">{t('businessProfile.title')}</h1>
          {isOwner && onEdit ? (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-[#1E0E62] text-white rounded-xl hover:bg-[#2D1B69] transition-colors font-semibold text-sm"
            >
              <Edit className="w-4 h-4" />
              <span>{t('common.edit')}</span>
            </button>
          ) : (
            <div className="w-20"></div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 1. Header with logo, tier, verification */}
        <BusinessProfileHeader business={business} isOwner={isOwner} />
        
        {/* 2. About - mission, bio, languages */}
        <BusinessAboutCard 
          business={business} 
          isOwner={isOwner}
          onUpdate={refreshUserProfile}
        />
        
        {/* 3. Collaboration Stats - rating, completed collabs, response time */}
        <CollabStats business={business} />
        
        {/* 4. What We Offer Creators */}
        <CollabOffers offers={business.offers} />
        
        {/* 5. Contact & Social Media */}
        <BusinessInfoPanel 
          business={business}
          isOwner={isOwner}
          onConnectGoogle={isOwner ? handleConnectGoogle : undefined}
          onDisconnectGoogle={isOwner ? handleDisconnectGoogle : undefined}
          onConnectFacebook={isOwner ? handleConnectFacebook : undefined}
          onDisconnectFacebook={isOwner ? handleDisconnectFacebook : undefined}
          onConnectInstagram={isOwner ? handleConnectInstagram : undefined}
          onDisconnectInstagram={isOwner ? handleDisconnectInstagram : undefined}
          onConnectTikTok={isOwner ? handleConnectTikTok : undefined}
          onDisconnectTikTok={isOwner ? handleDisconnectTikTok : undefined}
          onConnectLinkedIn={isOwner ? handleConnectLinkedIn : undefined}
          onDisconnectLinkedIn={isOwner ? handleDisconnectLinkedIn : undefined}
        />
        
        {/* 6. Vibe Tags - personality descriptors */}
        {((business.vibeTags && business.vibeTags.length > 0) || (business.vibe && business.vibe.length > 0)) && (
          <BrandTags tags={business.vibeTags || business.vibe || []} />
        )}
      </div>
    </div>
  );
};

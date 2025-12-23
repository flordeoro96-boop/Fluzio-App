import React, { useState } from 'react';
import { User } from '../types';
import { useAuth } from '../services/AuthContext';
import { Modal, Button, Input } from './Common';
import { 
  X, User as UserIcon, Mail, MapPin, Tag, Edit2, Save, Instagram, Link as LinkIcon, 
  Sparkles, Award, Calendar, Camera, Video, Briefcase, Star, TrendingUp, 
  Heart, MapPinned, Gift, Target, CheckCircle, Users, MessageCircle, Bookmark,
  Plus, Share2, BarChart3, Zap, Handshake, Folder, Medal, Trophy, CreditCard, FileText, Building2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  isOwner?: boolean; // True if viewing own profile
  onManageSubscription?: () => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  isOwner = true, // Default to owner view
  onManageSubscription
}) => {
  const { userProfile } = useAuth();
  const { t } = useTranslation();
  
  // Use Firestore profile data if available
  const displayName = userProfile?.name || user.name;
  const displayEmail = userProfile?.email || user.email;
  const displayCity = userProfile?.homeCity || userProfile?.city || user.currentCity || t('customerProfile.notSet');
  const displayCountry = 'Germany'; // TODO: Add to user profile
  const displayPhoto = userProfile?.photoUrl || user.avatarUrl;
  const displayHandle = user.socialLinks?.instagram?.username || '@' + displayName.toLowerCase().replace(' ', '_');
  const displayPoints = user.points || 0;
  const displayTier = user.subscriptionLevel || 'FREE';
  const isCreatorMode = user.creatorMode || false;
  const memberSince = user.createdAt || 'Recently';
  
  // Creator data
  const skills = user.skills || [];
  const missionsCompleted = user.missionsCompleted || 0;
  const eventsAttended = 0; // TODO: Add to user
  const checkInsCount = 0; // TODO: Add to user
  const savedPlaces = 0; // TODO: Add to user
  const displayBio = userProfile?.bio || user.bio || t('customerProfile.noBio');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-[32px] shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* ===== TOP SECTION: PROFILE BANNER ===== */}
        <div className="relative bg-gradient-to-br from-[#F72585] via-[#7209B7] to-[#560BAD] p-8 pb-24 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-1">
              {isOwner ? t('profile.yourProfile') : displayName}
            </h2>
            <p className="text-purple-100 text-sm font-medium">
              {isOwner ? t('customerProfile.viewAndManage') : t('customerProfile.profileInfo')}
            </p>
          </div>
        </div>

        {/* Profile Picture - Overlapping */}
        <div className="relative -mt-20 px-8 mb-4 flex-shrink-0">
          <div className="w-32 h-32 mx-auto rounded-full border-[6px] border-white shadow-2xl overflow-hidden bg-gradient-to-br from-[#7209B7] to-[#560BAD] flex items-center justify-center">
            {displayPhoto ? (
              <img 
                src={displayPhoto} 
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-5xl font-bold text-white">
                {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Creator Badge Overlay */}
          {isCreatorMode && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2">
              <div className="bg-gradient-to-r from-[#FFC300] to-[#F72585] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <Zap className="w-3 h-3" fill="white" />
                {t('customerProfile.creatorBadge')}
              </div>
            </div>
          )}
        </div>

        {/* Name, Handle, Location */}
        <div className="text-center mb-4 px-6 flex-shrink-0">
          <h3 className="text-2xl font-bold text-[#1E0E62] mb-1">{displayName}</h3>
          <p className="text-sm text-gray-500 mb-2">{displayHandle}</p>
          <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
            <MapPin className="w-4 h-4 text-[#F72585]" />
            {displayCity}, {displayCountry}
          </p>
        </div>

        {/* Tier Badge & Credits */}
        <div className="flex items-center justify-center gap-3 mb-6 px-6 flex-shrink-0">
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-4 py-2 rounded-full text-xs font-bold border-2 border-purple-200 flex items-center gap-1">
            <Award className="w-4 h-4" />
            {displayTier}
          </div>
          {isOwner && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 text-[#1E0E62] px-4 py-2 rounded-full text-xs font-bold border-2 border-yellow-200 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-yellow-600" />
              {displayPoints} {t('rewards.credits')}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!isOwner && (
          <div className="grid grid-cols-3 gap-2 mb-6 px-6 flex-shrink-0">
            <button className="bg-gradient-to-r from-[#F72585] to-[#7209B7] text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-1">
              <Users className="w-4 h-4" />
              {t('profile.follow')}
            </button>
            <button className="bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {t('profile.message')}
            </button>
            <button className="bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-1">
              <Bookmark className="w-4 h-4" />
              {t('common.save')}
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          
          {/* ===== EDIT PROFILE BUTTON (Top-right, Owner Only) ===== */}
          {isOwner && (
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => console.log('Edit Profile - TODO: Open edit modal')}
                className="px-4 py-2 rounded-xl bg-white border-2 border-[#F72585] text-[#F72585] text-sm font-bold flex items-center gap-2 hover:bg-pink-50 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                {t('profile.editProfile')}
              </button>
            </div>
          )}

          {/* ===== SUBSCRIPTION (Owner Only) ===== */}
          {isOwner && (
            <div className="mb-6">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">💳 {t('settings.subscription')}</h4>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="text-sm font-bold text-purple-900">{t('customerProfile.currentPlan')}</div>
                      <div className="text-xs text-purple-700">{displayTier}</div>
                    </div>
                  </div>
                  <span className="bg-purple-200 text-purple-900 text-xs font-bold px-3 py-1 rounded-full uppercase">{displayTier}</span>
                </div>
                <button
                  onClick={() => onManageSubscription ? onManageSubscription() : console.log('Manage Subscription - TODO')}
                  className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-[#F72585] to-[#7209B7] text-white text-sm font-bold hover:shadow-lg transition-all"
                >
                  {displayTier === 'FREE' ? t('customerProfile.upgradePlan') : t('customerProfile.manageSubscription')}
                </button>
              </div>
            </div>
          )}

          {/* ===== ABOUT ===== */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">📝 {t('customerProfile.about')}</h4>
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                <p className="text-sm text-gray-700 leading-relaxed">
                  {displayBio}
                </p>
              </div>
            </div>
          </div>
          
          {/* ===== ACTIVITY STATS ===== */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">📊 {t('customerProfile.activity')}</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-xl text-center border border-purple-100">
                <div className="text-xl font-bold text-[#1E0E62]">{missionsCompleted}</div>
                <div className="text-[9px] text-gray-600 font-bold uppercase tracking-wide">{t('customerProfile.stats.missions')}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-3 rounded-xl text-center border border-blue-100">
                <div className="text-xl font-bold text-[#1E0E62]">{checkInsCount}</div>
                <div className="text-[9px] text-gray-600 font-bold uppercase tracking-wide">{t('customerProfile.stats.checkIns')}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-xl text-center border border-green-100">
                <div className="text-xl font-bold text-[#1E0E62]">{eventsAttended}</div>
                <div className="text-[9px] text-gray-600 font-bold uppercase tracking-wide">{t('customerProfile.stats.events')}</div>
              </div>
            </div>
          </div>

          {/* ===== ACHIEVEMENTS ===== */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">🏆 {t('profile.achievements')}</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white border-2 border-yellow-200 p-3 rounded-xl text-center hover:shadow-md transition-shadow">
                <Medal className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                <div className="text-[9px] font-bold text-gray-700">{t('customerProfile.achievements.firstMission')}</div>
              </div>
              <div className="bg-white border-2 border-purple-200 p-3 rounded-xl text-center hover:shadow-md transition-shadow">
                <Trophy className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                <div className="text-[9px] font-bold text-gray-700">{t('customerProfile.achievements.tenCheckins')}</div>
              </div>
              <div className="bg-white border-2 border-blue-200 p-3 rounded-xl text-center hover:shadow-md transition-shadow">
                <Star className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <div className="text-[9px] font-bold text-gray-700">{t('customerProfile.achievements.hundredPoints')}</div>
              </div>
            </div>
          </div>

          {/* ===== CREATOR MODE SECTIONS ===== */}
          {isCreatorMode && (
            <>
              {/* Skills */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">🎨 {t('profile.skills')}</h4>
                  {isOwner && (
                    <button className="text-xs text-[#F72585] font-bold hover:underline flex items-center gap-1">
                      <Plus className="w-3 h-3" />
                      {t('linkedAccounts.add')}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.length > 0 ? skills.map((skill, idx) => (
                    <span key={idx} className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-2 rounded-lg text-xs font-bold border border-purple-200 flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      {skill}
                    </span>
                  )) : (
                    <div className="text-sm text-gray-400">
                      {isOwner ? t('customerProfile.skills.addToGetDiscovered') : t('customerProfile.skills.none')}
                    </div>
                  )}
                </div>
              </div>

              {/* Portfolio */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">📸 {t('customerProfile.portfolio')}</h4>
                  {isOwner && (
                    <button className="text-xs text-[#F72585] font-bold hover:underline flex items-center gap-1">
                      <Plus className="w-3 h-3" />
                      {t('linkedAccounts.add')}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {/* Placeholder portfolio items */}
                  <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                    <Camera className="w-8 h-8 text-purple-400" />
                  </div>
                  <div className="aspect-square bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                    <Video className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="aspect-square bg-gradient-to-br from-orange-100 to-pink-100 rounded-xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                    <Briefcase className="w-8 h-8 text-orange-400" />
                  </div>
                </div>
              </div>

              {/* Reviews */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">⭐ {t('customerProfile.reviews.title')}</h4>
                <div className="bg-white border-2 border-gray-200 p-4 rounded-xl text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
                    <span className="text-2xl font-bold text-[#1E0E62]">4.9</span>
                  </div>
                  <div className="text-xs text-gray-600">{t('customerProfile.reviews.basedOn', { count: 27 })}</div>
                </div>
              </div>

              {/* Past Collaborations */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">🤝 {t('customerProfile.pastCollaborations')}</h4>
                <div className="space-y-2">
                  <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-purple-600" />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-[#1E0E62]">Coffee Shop Campaign</div>
                      <div className="text-xs text-gray-600">Local Café • Dec 2024</div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 p-3 rounded-xl flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-blue-600" />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-[#1E0E62]">Fitness Studio Opening</div>
                      <div className="text-xs text-gray-600">Gym Pro • Nov 2024</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Creator Stats */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">📈 {t('customerProfile.creatorStats')}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-xl text-center border border-purple-100">
                    <div className="text-xl font-bold text-[#1E0E62]">1.2k</div>
                    <div className="text-[9px] text-gray-600 font-bold uppercase tracking-wide">{t('customerProfile.stats.profileViews')}</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-3 rounded-xl text-center border border-blue-100">
                    <div className="text-xl font-bold text-[#1E0E62]">89</div>
                    <div className="text-[9px] text-gray-600 font-bold uppercase tracking-wide">{t('customerProfile.stats.savedBy')}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ===== ACTIVITY OVERVIEW (Owner Only) ===== */}
          {isOwner && (
            <div className="mb-6">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">🎯 {t('customerProfile.activityOverview')}</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Heart className="w-4 h-4 text-[#F72585]" />
                    <span className="text-sm font-medium text-gray-700">{t('customerProfile.savedPlaces')}</span>
                  </div>
                  <span className="text-sm font-bold text-[#1E0E62]">{savedPlaces}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Gift className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">{t('customerProfile.rewardsClaimed')}</span>
                  </div>
                  <span className="text-sm font-bold text-[#1E0E62]">0</span>
                </div>
              </div>
            </div>
          )}

          {/* ===== MEMBER SINCE ===== */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-purple-600" />
              <label className="text-[10px] font-bold text-purple-700 uppercase tracking-wide">{t('customerProfile.memberSince')}</label>
            </div>
            <div className="text-base font-bold text-purple-900">{memberSince}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

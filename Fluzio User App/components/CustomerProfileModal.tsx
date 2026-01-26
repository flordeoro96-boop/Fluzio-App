import React, { useState } from 'react';
import { User } from '../types';
import { useAuth } from '../services/AuthContext';
import { Modal, Button, Input } from './Common';
import { storage } from '../services/storageCompat';
import { ref, uploadBytes, getDownloadURL } from '../services/storageCompat';
import { 
  X, User as UserIcon, Mail, MapPin, Tag, Edit2, Save, Link as LinkIcon, 
  Sparkles, Award, Calendar, Camera, Video, Briefcase, Star, TrendingUp, 
  Heart, MapPinned, Gift, Target, CheckCircle, Users, MessageCircle, Bookmark,
  Plus, Share2, BarChart3, Zap, Handshake, Folder, Medal, Trophy, CreditCard, FileText, Building2,
  Flame, Clock, Globe, ExternalLink, Copy, Bell
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomerPortfolioView } from './CustomerPortfolioView';

import { standardizeCityName } from '../utils/cityUtils';

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
  const { user: authUser, userProfile, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editedCity, setEditedCity] = useState('');
  const [editedCountry, setEditedCountry] = useState('');
  const [editedInstagram, setEditedInstagram] = useState('');
  const [editedWebsite, setEditedWebsite] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { t } = useTranslation();
  
  // Use Firestore profile data if available
  const displayName = userProfile?.name || user.name;
  const displayEmail = userProfile?.email || user.email;
  const displayCity = userProfile?.homeCity || userProfile?.city || user.currentCity || t('customerProfile.notSet');
  const displayCountry = userProfile?.country || 'Germany';
  const displayPhoto = imagePreview || userProfile?.photoUrl || user.avatarUrl;
  const displayHandle = userProfile?.instagram || user.socialLinks?.instagram?.username || '@' + displayName.toLowerCase().replace(' ', '_');
  const displayWebsite = userProfile?.website || '';
  const displayPoints = user.points || 0;
  const displayTier = user.subscriptionLevel || 'FREE';
  const isCreatorAccount = user.accountType === 'creator';
  const memberSince = user.createdAt || 'Recently';
  
  // Creator data
  const skills = user.skills || [];
  const missionsCompleted = user.missionsCompleted || 0;
  const eventsAttended = user.eventsAttended || 0;
  const checkInsCount = user.checkInsCount || 0;
  const savedPlaces = user.savedPlaces?.length || 0;
  const rewardsClaimed = user.rewardsClaimed || 0;
  const displayBio = userProfile?.bio || user.bio || t('customerProfile.noBio');

  // Initialize edit fields when entering edit mode
  React.useEffect(() => {
    if (isEditing) {
      setEditedName(displayName);
      setEditedBio(displayBio === t('customerProfile.noBio') ? '' : displayBio);
      setEditedCity(displayCity === t('customerProfile.notSet') ? '' : displayCity);
      setEditedCountry(displayCountry);
      setEditedInstagram(displayHandle.replace('@', ''));
      setEditedWebsite(displayWebsite);
      setImagePreview(null);
    }
  }, [isEditing]);

  const handleSave = async () => {
    try {
      const updates: any = {
        name: editedName,
        bio: editedBio,
        homeCity: standardizeCityName(editedCity), // Standardize to English
        city: standardizeCityName(editedCity), // Also update city field
        country: editedCountry,
        instagram: editedInstagram.replace('@', ''),
        website: editedWebsite
      };

      await updateUserProfile(updates);
      setIsEditing(false);
      setImagePreview(null);
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[200] animate-fade-in';
      successDiv.textContent = '✓ Profile updated successfully!';
      document.body.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    // Get the authenticated user ID
    const userId = authUser?.uid || userProfile?.uid;
    if (!userId) {
      alert('User not authenticated');
      return;
    }

    setUploading(true);
    try {
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Compress and upload image
      const compressedFile = await compressImage(file);
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;
      const storageRef = ref(storage, `profile-photos/${userId}/${fileName}`);
      
      await uploadBytes(storageRef, compressedFile, {
        contentType: file.type,
        customMetadata: {
          uploadedBy: userId,
          originalName: file.name
        }
      });
      
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update user profile with new photo URL
      await updateUserProfile({ photoUrl: downloadURL });
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[200]';
      successDiv.textContent = '✓ Profile photo updated!';
      document.body.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 3000);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  // Helper function to compress images
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Canvas to Blob conversion failed'));
              }
            },
            'image/jpeg',
            0.85
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-[32px] shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* ===== TOP SECTION: PROFILE BANNER ===== */}
        <div className="relative bg-gradient-to-br from-[#00E5FF] via-[#6C4BFF] to-[#6C4BFF] p-8 pb-24 flex-shrink-0">
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
        <div className="relative -mt-24 px-8 mb-6 flex-shrink-0">
          {/* Gradient Ring */}
          <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-[#00E5FF] via-[#6C4BFF] to-[#FF00E5] p-1 shadow-2xl">
            <div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-gradient-to-br from-[#6C4BFF] to-[#00E5FF] flex items-center justify-center relative group">
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
            
            {/* Edit Photo Overlay */}
            {isEditing && isOwner && (
              <label className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div className="text-white text-center">
                  <Camera className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-xs">{uploading ? 'Uploading...' : 'Change'}</span>
                </div>
              </label>
            )}
            </div>
          </div>
          
          {/* Creator Badge Overlay */}
          {isCreatorAccount && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2">
              <div className="bg-gradient-to-r from-[#FFB86C] to-[#00E5FF] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <Zap className="w-3 h-3" fill="white" />
                {t('customerProfile.creatorBadge')}
              </div>
            </div>
          )}
        </div>

        {/* Name, Handle, Location */}
        <div className="text-center mb-4 px-6 flex-shrink-0">
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-center font-bold text-xl focus:outline-none focus:border-[#00E5FF]"
                placeholder="Your name"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={editedCity}
                  onChange={(e) => setEditedCity(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-center text-sm focus:outline-none focus:border-[#00E5FF]"
                  placeholder="City"
                />
                <input
                  type="text"
                  value={editedCountry}
                  onChange={(e) => setEditedCountry(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-center text-sm focus:outline-none focus:border-[#00E5FF]"
                  placeholder="Country"
                />
              </div>
              <input
                type="text"
                value={editedInstagram}
                onChange={(e) => setEditedInstagram(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-center text-sm focus:outline-none focus:border-[#00E5FF]"
                placeholder="Instagram username"
              />
              <input
                type="url"
                value={editedWebsite}
                onChange={(e) => setEditedWebsite(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-center text-sm focus:outline-none focus:border-[#00E5FF]"
                placeholder="Website (optional)"
              />
            </div>
          ) : (
            <>
              <h3 className="text-2xl font-bold text-[#1E0E62] mb-1">{displayName}</h3>
              <p className="text-sm text-gray-500 mb-2">{displayHandle}</p>
              <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <MapPin className="w-4 h-4 text-[#00E5FF]" />
                {displayCity}, {displayCountry}
              </p>
            </>
          )}
        </div>

        {/* Social Links & Stats Row */}
        <div className="flex items-center justify-center gap-3 mb-4 px-6 flex-shrink-0">
          {displayHandle && displayHandle !== '@' && (
            <a
              href={`https://instagram.com/${displayHandle.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs font-bold hover:shadow-lg transition-all"
            >
              <Globe className="w-3.5 h-3.5" />
              {displayHandle}
            </a>
          )}
          {displayWebsite && (
            <a
              href={displayWebsite.startsWith('http') ? displayWebsite : `https://${displayWebsite}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-bold hover:bg-gray-200 transition-all"
            >
              <Globe className="w-3.5 h-3.5" />
              Website
            </a>
          )}
        </div>

        {/* Tier Badge & Credits */}
        <div className="flex items-center justify-center gap-2 mb-6 px-6 flex-shrink-0">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2">
            <Award className="w-5 h-5" />
            {displayTier}
          </div>
          {isOwner && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              {displayPoints}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!isOwner && (
          <div className="grid grid-cols-3 gap-2 mb-6 px-6 flex-shrink-0">
            <button className="bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-1">
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
                onClick={() => {
                  if (isEditing) {
                    handleSave();
                  } else {
                    setIsEditing(true);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-white border-2 border-[#00E5FF] text-[#00E5FF] text-sm font-bold flex items-center gap-2 hover:bg-pink-50 transition-colors"
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4" />
                    {t('common.save')}
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" />
                    {t('profile.editProfile')}
                  </>
                )}
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
                  className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white text-sm font-bold hover:shadow-lg transition-all"
                >
                  {displayTier === 'FREE' ? t('customerProfile.upgradePlan') : t('customerProfile.manageSubscription')}
                </button>
              </div>
            </div>
          )}

          {/* ===== ABOUT ===== */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#6C4BFF]" />
              {t('customerProfile.about')}
            </h4>
            <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-5 shadow-sm">
              {isEditing ? (
                <textarea
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#6C4BFF] min-h-[100px] resize-none"
                  placeholder="Tell us about yourself... What makes you unique?"
                />
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed">
                  {displayBio}
                </p>
              )}
            </div>
          </div>
          
          {/* ===== ACTIVITY STATS ===== */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#6C4BFF]" />
              {t('customerProfile.activity')}
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-2xl text-center shadow-lg hover:scale-105 transition-transform cursor-pointer">
                <Target className="w-6 h-6 text-white/80 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white mb-1">{missionsCompleted}</div>
                <div className="text-[10px] text-white/90 font-bold uppercase tracking-wide">{t('customerProfile.stats.missions')}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-2xl text-center shadow-lg hover:scale-105 transition-transform cursor-pointer">
                <MapPin className="w-6 h-6 text-white/80 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white mb-1">{checkInsCount}</div>
                <div className="text-[10px] text-white/90 font-bold uppercase tracking-wide">{t('customerProfile.stats.checkIns')}</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-2xl text-center shadow-lg hover:scale-105 transition-transform cursor-pointer">
                <Calendar className="w-6 h-6 text-white/80 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white mb-1">{eventsAttended}</div>
                <div className="text-[10px] text-white/90 font-bold uppercase tracking-wide">{t('customerProfile.stats.events')}</div>
              </div>
            </div>
          </div>

          {/* ===== ACHIEVEMENTS ===== */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#6C4BFF]" />
              {t('profile.achievements')}
            </h4>
            <div className="space-y-3">
              {/* First Mission */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Medal className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-bold text-gray-800">{t('customerProfile.achievements.firstMission')}</span>
                  </div>
                  {missionsCompleted > 0 && <CheckCircle className="w-5 h-5 text-green-600" />}
                </div>
                <div className="w-full bg-yellow-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all" style={{width: missionsCompleted > 0 ? '100%' : '0%'}}></div>
                </div>
              </div>
              
              {/* Ten Check-ins */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-bold text-gray-800">{t('customerProfile.achievements.tenCheckins')}</span>
                  </div>
                  {checkInsCount >= 10 && <CheckCircle className="w-5 h-5 text-green-600" />}
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all" style={{width: `${Math.min((checkInsCount / 10) * 100, 100)}%`}}></div>
                </div>
                <div className="text-xs text-gray-600 mt-1">{checkInsCount}/10</div>
              </div>
              
              {/* Hundred Points */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-bold text-gray-800">{t('customerProfile.achievements.hundredPoints')}</span>
                  </div>
                  {displayPoints >= 100 && <CheckCircle className="w-5 h-5 text-green-600" />}
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all" style={{width: `${Math.min((displayPoints / 100) * 100, 100)}%`}}></div>
                </div>
                <div className="text-xs text-gray-600 mt-1">{displayPoints}/100</div>
              </div>
            </div>
          </div>

          {/* ===== CREATOR SECTIONS ===== */}
          {isCreatorAccount && (
            <>
              {/* Skills */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">🎨 {t('profile.skills')}</h4>
                  {isOwner && (
                    <button className="text-xs text-[#00E5FF] font-bold hover:underline flex items-center gap-1">
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
                </div>
                <CustomerPortfolioView userId={authUser?.uid || user.firebaseUid} isOwner={isOwner} />
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
                    <Heart className="w-4 h-4 text-[#00E5FF]" />
                    <span className="text-sm font-medium text-gray-700">{t('customerProfile.savedPlaces')}</span>
                  </div>
                  <span className="text-sm font-bold text-[#1E0E62]">{savedPlaces}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Gift className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">{t('customerProfile.rewardsClaimed')}</span>
                  </div>
                  <span className="text-sm font-bold text-[#1E0E62]">{rewardsClaimed}</span>
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

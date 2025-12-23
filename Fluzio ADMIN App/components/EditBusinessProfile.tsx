import React, { useState, useEffect } from 'react';
import { User, BusinessCategory } from '../types';
import { Card, Button, Input, TextArea, Select } from './Common';
import { X, Camera, Plus, Trash2, Loader2 } from 'lucide-react';
import { storage, useAuth } from '../services/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { api } from '../services/apiService';
import { socialAuthService } from '../services/socialAuthService';
import { InstagramConnector } from './InstagramConnector';
import { COUNTRY_CODES } from '../utils/countryCodes';
import { useTranslation } from 'react-i18next';

interface EditBusinessProfileProps {
  isOpen: boolean;
  onClose: () => void;
  business: User;
  onSave: () => void;
}

const OFFER_OPTIONS = [
  'Free product samples',
  'Free food/drinks',
  'Space for content creation',
  'Paid collaborations',
  'Discount codes for followers',
  'Event invitations',
  'Product gifting',
  'Revenue sharing',
  'Cross-promotion',
  'Exclusive access'
];

const LANGUAGE_OPTIONS = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Arabic', 'Mandarin', 'Japanese', 'Korean'];

export const EditBusinessProfile: React.FC<EditBusinessProfileProps> = ({ 
  isOpen, 
  onClose, 
  business,
  onSave
}) => {
  const { t } = useTranslation();
  const { userProfile, refreshUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: BusinessCategory.OTHER,
    businessMode: 'PHYSICAL' as 'PHYSICAL' | 'ONLINE' | 'HYBRID',
    bio: '',
    mission: '',
    photoUrl: '',
    website: '',
    instagram: '',
    tiktok: '',
    phone: '',
    countryCode: '+49',
    address: '',
    city: '',
    latitude: '',
    longitude: '',
    yearFounded: '',
    teamSize: '',
    vibeTags: [] as string[],
    languages: [] as string[],
    offers: [] as string[],
    responseTime: 'Within 24 hours'
  });

  const [newVibeTag, setNewVibeTag] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(t('businessEdit.geolocationNotSupported'));
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        });
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert(t('businessEdit.unableToGetLocation'));
        setGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleOpenGoogleMaps = () => {
    const address = formData.address && formData.city 
      ? `${formData.address}, ${formData.city}`
      : formData.city || formData.name;
    const url = `https://www.google.com/maps/search/${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    if (business || userProfile) {
      // Prioritize userProfile data over mock business data
      const source = userProfile || business;
      setFormData({
        name: source.name || business?.name || '',
        category: (source.category || business?.category || BusinessCategory.OTHER) as BusinessCategory,
        businessMode: (source.businessMode || business?.businessMode || 'PHYSICAL') as 'PHYSICAL' | 'ONLINE' | 'HYBRID',
        bio: source.bio || business?.bio || '',
        mission: source.mission || '',
        photoUrl: source.photoUrl || business?.avatarUrl || '',
        website: source.socialLinks?.website || business?.socialLinks?.website || '',
        instagram: source.socialLinks?.instagram?.username || business?.socialLinks?.instagram?.username || '',
        tiktok: source.socialLinks?.tiktok?.username || business?.socialLinks?.tiktok?.username || '',
        phone: source.phone || business?.phone || '',
        countryCode: source.countryCode || business?.countryCode || '+49',
        address: source.address?.street || business?.address?.street || '',
        city: source.homeCity || source.city || business?.homeCity || business?.address?.city || '',
        latitude: source.geo?.latitude?.toString() || business?.geo?.latitude?.toString() || '',
        longitude: source.geo?.longitude?.toString() || business?.geo?.longitude?.toString() || '',
        yearFounded: source.yearFounded?.toString() || business?.yearFounded?.toString() || '',
        teamSize: source.teamSize?.toString() || business?.teamSize?.toString() || '',
        vibeTags: source.vibeTags || source.vibe || business?.vibe || [],
        languages: source.languages || business?.languages || [],
        offers: source.offers || business?.offers || [],
        responseTime: source.responseTime || business?.responseTime || 'Within 24 hours'
      });
    }
  }, [business, userProfile]);

  const handleUploadLogo = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert(t('businessEdit.imageTooLarge'));
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert(t('businessEdit.selectImageFile'));
        return;
      }

      try {
        setIsLoading(true);
        console.log('[EditBusinessProfile] Uploading logo...');
        
        const timestamp = Date.now();
        const storageRef = ref(storage, `logos/${business.id}/${timestamp}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        setFormData(prev => ({ ...prev, photoUrl: downloadURL }));
        console.log('[EditBusinessProfile] Logo uploaded successfully');
      } catch (error) {
        console.error('[EditBusinessProfile] Failed to upload logo:', error);
        alert(t('businessEdit.uploadLogoFailed'));
      } finally {
        setIsLoading(false);
      }
    };
    
    input.click();
  };

  const handleAddVibeTag = () => {
    if (newVibeTag.trim() && !formData.vibeTags.includes(newVibeTag.trim())) {
      setFormData(prev => ({
        ...prev,
        vibeTags: [...prev.vibeTags, newVibeTag.trim()]
      }));
      setNewVibeTag('');
    }
  };

  const handleRemoveVibeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      vibeTags: prev.vibeTags.filter(t => t !== tag)
    }));
  };

  const handleToggleLanguage = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  const handleToggleOffer = (offer: string) => {
    setFormData(prev => ({
      ...prev,
      offers: prev.offers.includes(offer)
        ? prev.offers.filter(o => o !== offer)
        : [...prev.offers, offer]
    }));
  };

  // Social Media Connection Handlers
  const handleConnectGoogle = async () => {
    console.log('[SocialMedia] Connecting Google...');
    try {
      setIsLoading(true);
      const result = await socialAuthService.linkGoogle();
      
      if (result.success) {
        alert('✅ Google account connected successfully!');
        
        // Try to get location from device when connecting Google
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setFormData({
                ...formData,
                latitude: position.coords.latitude.toFixed(6),
                longitude: position.coords.longitude.toFixed(6)
              });
              alert('📍 Location also detected and added!');
            },
            (error) => {
              console.log('Could not auto-detect location:', error);
              // Don't show error, location can be set manually
            },
            { enableHighAccuracy: true }
          );
        }
        
        await refreshUserProfile(); // Refresh to show updated connection
      } else {
        alert(result.error || 'Failed to connect Google account');
      }
    } catch (error: any) {
      console.error('[SocialMedia] Google connection error:', error);
      alert(error.message || 'Failed to connect Google account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    console.log('[SocialMedia] Disconnecting Google...');
    const confirmed = confirm(t('businessEdit.confirmDisconnect', { provider: 'Google' }));
    if (!confirmed) return;
    
    try {
      setIsLoading(true);
      const result = await socialAuthService.unlinkGoogle();
      
      if (result.success) {
        alert(t('businessEdit.disconnectSuccess', { provider: 'Google' }));
        await refreshUserProfile(); // Refresh to show updated connection
      } else {
        alert(result.error || t('businessEdit.disconnectFailed', { provider: 'Google' }));
      }
    } catch (error: any) {
      console.error('[SocialMedia] Google disconnect error:', error);
      alert(error.message || t('businessEdit.disconnectFailed', { provider: 'Google' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectFacebook = async () => {
    console.log('[SocialMedia] Connecting Facebook...');
    try {
      setIsLoading(true);
      const result = await socialAuthService.linkFacebook();
      
      if (result.success) {
        alert(t('businessEdit.connectSuccess', { provider: 'Facebook' }));
        await refreshUserProfile(); // Refresh to show updated connection
      } else {
        alert(result.error || t('businessEdit.connectFailed', { provider: 'Facebook' }));
      }
    } catch (error: any) {
      console.error('[SocialMedia] Facebook connection error:', error);
      alert(error.message || t('businessEdit.connectFailed', { provider: 'Facebook' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectFacebook = async () => {
    console.log('[SocialMedia] Disconnecting Facebook...');
    const confirmed = confirm(t('businessEdit.confirmDisconnect', { provider: 'Facebook' }));
    if (!confirmed) return;
    
    try {
      setIsLoading(true);
      const result = await socialAuthService.unlinkFacebook();
      
      if (result.success) {
        alert(t('businessEdit.disconnectSuccess', { provider: 'Facebook' }));
        await refreshUserProfile(); // Refresh to show updated connection
      } else {
        alert(result.error || t('businessEdit.disconnectFailed', { provider: 'Facebook' }));
      }
    } catch (error: any) {
      console.error('[SocialMedia] Facebook disconnect error:', error);
      alert(error.message || t('businessEdit.disconnectFailed', { provider: 'Facebook' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectInstagram = async () => {
    console.log('[SocialMedia] Connecting Instagram...');
    // TODO: Implement Instagram OAuth
    alert(t('businessEdit.instagramOauthPlanned'));
  };

  const handleDisconnectInstagram = async () => {
    console.log('[SocialMedia] Disconnecting Instagram...');
    const confirmed = confirm(t('businessEdit.confirmDisconnect', { provider: 'Instagram' }));
    if (!confirmed) return;
    // TODO: Implement disconnect
    alert(t('businessEdit.disconnectPlanned', { provider: 'Instagram' }));
  };

  const handleConnectTikTok = async () => {
    console.log('[SocialMedia] Connecting TikTok...');
    // TODO: Implement TikTok OAuth
    alert(t('businessEdit.tiktokOauthPlanned'));
  };

  const handleDisconnectTikTok = async () => {
    console.log('[SocialMedia] Disconnecting TikTok...');
    const confirmed = confirm(t('businessEdit.confirmDisconnect', { provider: 'TikTok' }));
    if (!confirmed) return;
    // TODO: Implement disconnect
    alert(t('businessEdit.disconnectPlanned', { provider: 'TikTok' }));
  };

  const handleConnectLinkedIn = async () => {
    console.log('[SocialMedia] Connecting LinkedIn...');
    // TODO: Implement LinkedIn OAuth
    alert(t('businessEdit.linkedinOauthPlanned'));
  };

  const handleDisconnectLinkedIn = async () => {
    console.log('[SocialMedia] Disconnecting LinkedIn...');
    const confirmed = confirm(t('businessEdit.confirmDisconnect', { provider: 'LinkedIn' }));
    if (!confirmed) return;
    // TODO: Implement disconnect
    alert(t('businessEdit.disconnectPlanned', { provider: 'LinkedIn' }));
  };

  const handleSave = async () => {
    if (!userProfile && !business) return;
    
    setIsLoading(true);
    
    try {
      console.log('[EditBusinessProfile] Saving to Firestore...');
      
      const userId = userProfile?.uid || business.id;
      
      const result = await api.updateUser(userId, {
        name: formData.name,
        legalName: formData.name,
        category: formData.category,
        businessMode: formData.businessMode,
        bio: formData.bio,
        mission: formData.mission,
        photoUrl: formData.photoUrl,
        phone: formData.phone,
        countryCode: formData.countryCode,
        homeCity: formData.city,
        yearFounded: formData.yearFounded ? parseInt(formData.yearFounded) : undefined,
        teamSize: formData.teamSize ? parseInt(formData.teamSize) : undefined,
        vibe: formData.vibeTags,
        vibeTags: formData.vibeTags,
        languages: formData.languages,
        offers: formData.offers,
        responseTime: formData.responseTime,
        profileComplete: true,
        socialLinks: {
          website: formData.website,
          instagram: formData.instagram ? { connected: true, username: formData.instagram } : undefined,
          tiktok: formData.tiktok ? { connected: true, username: formData.tiktok } : undefined
        },
        address: formData.address ? {
          street: formData.address,
          city: formData.city,
          zipCode: '',
          country: ''
        } : undefined,
        geo: (formData.latitude && formData.longitude) ? {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        } : undefined,
        location: formData.address && formData.city ? `${formData.address}, ${formData.city}` : formData.city || undefined
      });

      if (result.success) {
        console.log('[EditBusinessProfile] Save successful, refreshing profile...');
        
        // Refresh the profile from Firestore
        await refreshUserProfile();
        
        // Call parent onSave callback
        onSave();
        onClose();
      } else {
        console.error('[EditBusinessProfile] Failed to save:', result.error);
        alert('Failed to save: ' + result.error);
      }
    } catch (e) {
      console.error('[EditBusinessProfile] Error:', e);
      alert('Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-white flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0 z-10">
        <h2 className="font-bold text-xl text-gray-900">{t('businessEdit.title')}</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
          
          {/* Logo */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('businessEdit.logo')}</h3>
            <div className="flex flex-col items-center">
              <div className="relative group cursor-pointer" onClick={handleUploadLogo}>
                <img 
                  src={formData.photoUrl || business.avatarUrl} 
                  alt={formData.name}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md" 
                />
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              <span className="text-xs text-blue-600 mt-2 font-medium cursor-pointer hover:underline" onClick={handleUploadLogo}>
                {t('businessEdit.changeLogo')}
              </span>
            </div>
          </Card>

          {/* Basic Info */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('businessEdit.basicInfo')}</h3>
            <div className="space-y-4">
              <Input 
                label={t('businessEdit.nameLabel')} 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required
              />
              
              <Select 
                label={t('businessEdit.categoryLabel')} 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value as BusinessCategory})}
              >
                {Object.values(BusinessCategory).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>

              <Select 
                label="Business Mode" 
                value={formData.businessMode} 
                onChange={e => setFormData({...formData, businessMode: e.target.value as 'PHYSICAL' | 'ONLINE' | 'HYBRID'})}
              >
                <option value="PHYSICAL">Physical Location Only</option>
                <option value="ONLINE">Online Shop Only</option>
                <option value="HYBRID">Both Physical & Online</option>
              </Select>

              <Input 
                label={t('businessEdit.cityLabel')} 
                value={formData.city} 
                onChange={e => setFormData({...formData, city: e.target.value})} 
              />

              <TextArea 
                label={t('businessEdit.bioLabel')} 
                value={formData.bio} 
                onChange={e => setFormData({...formData, bio: e.target.value})} 
                rows={3} 
                placeholder={t('businessEdit.bioPlaceholder')}
              />

              <TextArea 
                label={t('businessEdit.missionLabel')} 
                value={formData.mission} 
                onChange={e => setFormData({...formData, mission: e.target.value})} 
                rows={2} 
                placeholder={t('businessEdit.missionPlaceholder')}
              />
            </div>
          </Card>

          {/* Contact Info */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('businessEdit.contactInfo')}</h3>
            <div className="space-y-4">
              <Input 
                label={t('businessEdit.websiteLabel')} 
                value={formData.website} 
                onChange={e => setFormData({...formData, website: e.target.value})} 
                placeholder={t('businessEdit.websitePlaceholder')}
              />
              
              {/* Instagram OAuth Integration */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">{t('businessEdit.socialMediaLabel')}</label>
                <InstagramConnector user={business} />
              </div>

              <Input 
                label={t('businessEdit.tiktokLabel')} 
                value={formData.tiktok} 
                onChange={e => setFormData({...formData, tiktok: e.target.value})} 
                placeholder={t('businessEdit.tiktokPlaceholder')}
              />

              {/* Phone with Country Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('businessEdit.phoneLabel')}</label>
                <div className="flex gap-2">
                  <select
                    value={formData.countryCode}
                    onChange={e => setFormData({...formData, countryCode: e.target.value})}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  >
                    {COUNTRY_CODES.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder={t('businessEdit.phonePlaceholder')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <Input 
                label={t('businessEdit.addressLabel')} 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
                placeholder={t('businessEdit.addressPlaceholder')}
              />

              {/* GPS Coordinates - Automatic via Address */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900 text-base">GPS Location</h4>
                      <p className="text-sm text-blue-700 mt-0.5">
                        {formData.latitude && formData.longitude 
                          ? t('businessEdit.gpsSet') 
                          : t('businessEdit.gpsRequired')}
                      </p>
                    </div>
                  </div>
                  {formData.latitude && formData.longitude && (
                    <div className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                      {t('businessEdit.activeStatus')}
                    </div>
                  )}
                </div>

                {/* Current Location Display */}
                {formData.latitude && formData.longitude && (
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 font-medium mb-1">{t('businessEdit.currentCoordinates')}</p>
                        <p className="text-sm font-mono text-gray-900">
                          {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
                        </p>
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${formData.latitude},${formData.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                      >
                        {t('businessEdit.viewOnMap')}
                      </a>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={gettingLocation}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-blue-300 text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    {gettingLocation ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('businessEdit.getting')}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                        </svg>
                        {t('businessEdit.useMyLocation')}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenGoogleMaps}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-blue-300 text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {t('businessEdit.findOnMaps')}
                  </button>
                </div>

                {/* Help Text */}
                <div className="bg-blue-100/50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs text-blue-800 leading-relaxed">
                    <strong>{t('businessEdit.tipTitle')}</strong> {t('businessEdit.tipText')}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Social Media */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('businessEdit.socialMediaLabel')}</h3>
            <div className="space-y-3">
              {/* Google */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Google</div>
                    <div className="text-sm text-gray-500">
                      {business.socialAccounts?.google?.connected 
                        ? `${t('businessEdit.connected')} • ${business.socialAccounts.google.handle || business.socialAccounts.google.url}` 
                        : t('businessEdit.notConnectedYet')}
                    </div>
                  </div>
                </div>
                {business.socialAccounts?.google?.connected ? (
                  <Button variant="outline" onClick={handleDisconnectGoogle} size="sm">
                    {t('common.disconnect')}
                  </Button>
                ) : (
                  <Button onClick={handleConnectGoogle} size="sm">
                    {t('common.connect')}
                  </Button>
                )}
              </div>

              {/* Facebook */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Facebook</div>
                    <div className="text-sm text-gray-500">
                      {business.socialAccounts?.facebook?.connected 
                        ? `${t('businessEdit.connected')} • ${business.socialAccounts.facebook.handle || business.socialAccounts.facebook.url}` 
                        : t('businessEdit.notConnectedYet')}
                    </div>
                  </div>
                </div>
                {business.socialAccounts?.facebook?.connected ? (
                  <Button variant="outline" onClick={handleDisconnectFacebook} size="sm">
                    {t('common.disconnect')}
                  </Button>
                ) : (
                  <Button onClick={handleConnectFacebook} size="sm">
                    {t('common.connect')}
                  </Button>
                )}
              </div>

              {/* Instagram */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Instagram</div>
                    <div className="text-sm text-gray-500">
                      {business.socialAccounts?.instagram?.connected 
                        ? `${t('businessEdit.connected')} • ${business.socialAccounts.instagram.handle}` 
                        : t('businessEdit.notConnectedYet')}
                    </div>
                  </div>
                </div>
                {business.socialAccounts?.instagram?.connected ? (
                  <Button variant="outline" onClick={handleDisconnectInstagram} size="sm">
                    {t('common.disconnect')}
                  </Button>
                ) : (
                  <Button onClick={handleConnectInstagram} size="sm">
                    {t('common.connect')}
                  </Button>
                )}
              </div>

              {/* TikTok */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">TikTok</div>
                    <div className="text-sm text-gray-500">
                      {business.socialAccounts?.tiktok?.connected 
                        ? `${t('businessEdit.connected')} • ${business.socialAccounts.tiktok.handle}` 
                        : t('businessEdit.notConnectedYet')}
                    </div>
                  </div>
                </div>
                {business.socialAccounts?.tiktok?.connected ? (
                  <Button variant="outline" onClick={handleDisconnectTikTok} size="sm">
                    {t('common.disconnect')}
                  </Button>
                ) : (
                  <Button onClick={handleConnectTikTok} size="sm">
                    {t('common.connect')}
                  </Button>
                )}
              </div>

              {/* LinkedIn */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">LinkedIn</div>
                    <div className="text-sm text-gray-500">
                      {business.socialAccounts?.linkedin?.connected 
                        ? `${t('businessEdit.connected')} • ${business.socialAccounts.linkedin.handle || business.socialAccounts.linkedin.url}` 
                        : t('businessEdit.notConnectedYet')}
                    </div>
                  </div>
                </div>
                {business.socialAccounts?.linkedin?.connected ? (
                  <Button variant="outline" onClick={handleDisconnectLinkedIn} size="sm">
                    {t('common.disconnect')}
                  </Button>
                ) : (
                  <Button onClick={handleConnectLinkedIn} size="sm">
                    {t('common.connect')}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Business Details */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('businessEdit.businessDetails')}</h3>
            <div className="space-y-4">
              <Input 
                label={t('businessEdit.yearFoundedLabel')} 
                type="number"
                value={formData.yearFounded} 
                onChange={e => setFormData({...formData, yearFounded: e.target.value})} 
                placeholder={t('businessEdit.yearFoundedPlaceholder')}
              />
              
              <Input 
                label={t('businessEdit.teamSizeLabel')} 
                type="number"
                value={formData.teamSize} 
                onChange={e => setFormData({...formData, teamSize: e.target.value})} 
                placeholder={t('businessEdit.teamSizePlaceholder')}
              />

              <Select 
                label={t('businessEdit.responseTimeLabel')} 
                value={formData.responseTime} 
                onChange={e => setFormData({...formData, responseTime: e.target.value})}
              >
                <option value="Within 1 hour">{t('businessEdit.responseTime.within1Hour')}</option>
                <option value="Within 2 hours">{t('businessEdit.responseTime.within2Hours')}</option>
                <option value="Within 24 hours">{t('businessEdit.responseTime.within24Hours')}</option>
                <option value="Within 2 days">{t('businessEdit.responseTime.within2Days')}</option>
                <option value="Within a week">{t('businessEdit.responseTime.withinAWeek')}</option>
              </Select>
            </div>
          </Card>

          {/* Vibe Tags */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('businessEdit.vibeTagsTitle')}</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input 
                  value={newVibeTag} 
                  onChange={e => setNewVibeTag(e.target.value)}
                  placeholder={t('businessEdit.vibeTagPlaceholder')}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddVibeTag())}
                />
                <Button onClick={handleAddVibeTag} variant="secondary">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.vibeTags.map((tag, idx) => (
                  <div 
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold"
                  >
                    <span>{tag}</span>
                    <button onClick={() => handleRemoveVibeTag(tag)}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Languages */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('businessEdit.languagesTitle')}</h3>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map(lang => (
                <button
                  key={lang}
                  onClick={() => handleToggleLanguage(lang)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-colors ${
                    formData.languages.includes(lang)
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </Card>

          {/* Collaboration Offers */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('businessEdit.offersTitle')}</h3>
            <div className="space-y-2">
              {OFFER_OPTIONS.map(offer => (
                <label 
                  key={offer}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: formData.offers.includes(offer) ? '#7209B7' : '#E5E7EB' }}
                >
                  <input
                    type="checkbox"
                    checked={formData.offers.includes(offer)}
                    onChange={() => handleToggleOffer(offer)}
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-900">{offer}</span>
                </label>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Save Button */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('common.saving')}</span>
              </>
            ) : (
              <span>{t('settings.saveChanges')}</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

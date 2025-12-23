import React from 'react';
import { User } from '../../types';
import { Globe, Instagram, Calendar, Users, MapPin, Phone, Mail, ExternalLink, AlertCircle } from 'lucide-react';

// Social Media Icons (inline SVGs for brand accuracy)
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg className="w-5 h-5 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

interface BusinessInfoPanelProps {
  business: User;
  onConnectInstagram?: () => void;
  onDisconnectInstagram?: () => void;
  onConnectGoogle?: () => void;
  onDisconnectGoogle?: () => void;
  onSyncGoogle?: () => void;
  onConnectFacebook?: () => void;
  onDisconnectFacebook?: () => void;
  onConnectTikTok?: () => void;
  onDisconnectTikTok?: () => void;
  onConnectLinkedIn?: () => void;
  onDisconnectLinkedIn?: () => void;
  isOwner?: boolean;
}

interface InfoRowProps {
  icon: React.FC<any>;
  label: string;
  value?: string;
  href?: string;
  type?: 'link' | 'text';
  onAdd?: () => void;
}

interface InstagramRowProps {
  username?: string;
  connected?: boolean;
  expired?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

const InstagramRow: React.FC<InstagramRowProps> = ({ username, connected, expired, onConnect, onDisconnect }) => {
  // Connected state
  if (connected && username) {
    return (
      <div className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center">
              <Instagram className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs text-[#8F8FA3] font-medium">Instagram</div>
              <a
                href={`https://instagram.com/${username.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 mt-1 rounded-full bg-white border border-pink-200 hover:border-pink-300 hover:bg-pink-50 text-sm font-semibold text-pink-700 transition-all group"
              >
                <span>{username.startsWith('@') ? username : `@${username}`}</span>
                <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
          {onDisconnect && (
            <button
              onClick={onDisconnect}
              className="text-xs text-gray-500 hover:text-red-500 transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>
        <div className="text-[10px] text-gray-500 ml-13">
          Connected via Instagram • {expired ? 'Reconnect needed' : 'Active'}
        </div>
      </div>
    );
  }

  // Expired/Error state
  if (expired) {
    return (
      <div className="p-3 bg-red-50 rounded-xl border border-red-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-red-600 font-medium">Instagram connection expired</div>
              <div className="text-[10px] text-red-500 mt-0.5">Please reconnect to keep your profile up to date</div>
            </div>
          </div>
          {onConnect && (
            <button
              onClick={onConnect}
              className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>
    );
  }

  // Not connected state
  return (
    <div className="p-3 hover:bg-gray-50 rounded-xl border border-dashed border-gray-200 hover:border-purple-300 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center">
            <Instagram className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#8F8FA3] font-medium">Instagram</div>
            <div className="text-sm text-gray-400 italic">Not connected yet</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Let creators see your official Instagram profile</div>
          </div>
        </div>
        {onConnect && (
          <button
            onClick={onConnect}
            className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
};

const InfoRow: React.FC<InfoRowProps> = ({ icon: Icon, label, value, href, type = 'text', onAdd }) => {
  const hasValue = value && value.trim() !== '';
  
  if (type === 'link' && hasValue && href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between p-3 hover:bg-purple-50 rounded-xl transition-all group cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-[#8F8FA3] font-medium">{label}</div>
            <div className="text-sm font-semibold text-[#1E0E62] group-hover:text-purple-600">{value}</div>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-[#8F8FA3] group-hover:text-purple-600" />
      </a>
    );
  }

  if (hasValue) {
    return (
      <div className="flex items-center gap-3 p-3">
        <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-[#8F8FA3] font-medium">{label}</div>
          <div className="text-sm font-semibold text-[#1E0E62]">{value}</div>
        </div>
      </div>
    );
  }

  // Empty state
  return (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-[#8F8FA3] font-medium">{label}</div>
          <div className="text-sm text-gray-400 italic">Not added yet</div>
        </div>
      </div>
      <button className="text-xs text-purple-600 font-semibold hover:text-purple-700 px-3 py-1 hover:bg-purple-50 rounded-lg transition-colors">
        Add
      </button>
    </div>
  );
};

// Social Account Row Component with Connect/Disconnect buttons
interface SocialAccountRowProps {
  platform: 'google' | 'facebook' | 'instagram' | 'tiktok' | 'linkedin';
  connected?: boolean;
  handle?: string;
  url?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSync?: () => void;
}

const SocialAccountRow: React.FC<SocialAccountRowProps> = ({ 
  platform, 
  connected, 
  handle, 
  url,
  onConnect,
  onDisconnect,
  onSync
}) => {
  const getIcon = () => {
    switch (platform) {
      case 'google':
        return <GoogleIcon />;
      case 'facebook':
        return <FacebookIcon />;
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-500" />;
      case 'tiktok':
        return <TikTokIcon />;
      case 'linkedin':
        return <LinkedInIcon />;
    }
  };

  const getDisplayUrl = () => {
    if (url) return url;
    if (!handle) return '';
    
    switch (platform) {
      case 'instagram':
        return `https://instagram.com/${handle.replace('@', '')}`;
      case 'tiktok':
        return `https://www.tiktok.com/@${handle.replace('@', '')}`;
      case 'linkedin':
        return `https://www.linkedin.com/in/${handle}`;
      case 'facebook':
        return `https://www.facebook.com/${handle}`;
      default:
        return '';
    }
  };

  const getBgColor = () => {
    switch (platform) {
      case 'google':
        return 'bg-white';
      case 'facebook':
        return 'bg-[#1877F2]';
      case 'instagram':
        return 'bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500';
      case 'tiktok':
        return 'bg-black';
      case 'linkedin':
        return 'bg-[#0A66C2]';
    }
  };

  const displayUrl = getDisplayUrl();
  const displayText = handle || url || '';

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-full ${getBgColor()} ${platform === 'google' ? 'shadow-sm' : ''} flex items-center justify-center flex-shrink-0`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 capitalize">{platform}</div>
          {connected ? (
            <div className="text-sm text-gray-600 truncate">
              {displayText || 'Connected'}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Not connected yet</div>
          )}
        </div>
      </div>
      {connected ? (
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {onSync && platform === 'google' && (
            <button
              onClick={onSync}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sync Business
            </button>
          )}
          {onDisconnect && (
            <button
              onClick={onDisconnect}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>
      ) : (
        onConnect && (
          <button
            onClick={onConnect}
            className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors flex-shrink-0 ml-2"
          >
            Connect
          </button>
        )
      )}
    </div>
  );
};

export const BusinessInfoPanel: React.FC<BusinessInfoPanelProps> = ({ 
  business, 
  onConnectInstagram, 
  onDisconnectInstagram,
  onConnectGoogle,
  onDisconnectGoogle,
  onSyncGoogle,
  onConnectFacebook,
  onDisconnectFacebook,
  onConnectTikTok,
  onDisconnectTikTok,
  onConnectLinkedIn,
  onDisconnectLinkedIn,
  isOwner = false
}) => {
  console.log('[BusinessInfoPanel] Social accounts data:', {
    google: business.socialAccounts?.google,
    facebook: business.socialAccounts?.facebook,
    instagram: business.socialAccounts?.instagram,
    tiktok: business.socialAccounts?.tiktok,
    linkedin: business.socialAccounts?.linkedin
  });
  const infoItems = [];

  // Website
  if (business.socialLinks?.website) {
    infoItems.push({
      icon: Globe,
      label: 'Website',
      value: business.socialLinks.website,
      href: business.socialLinks.website,
      type: 'link' as const
    });
  }

  // Founded Year
  if (business.yearFounded) {
    infoItems.push({
      icon: Calendar,
      label: 'Founded',
      value: business.yearFounded.toString(),
      type: 'text' as const
    });
  }

  // Team Size
  if (business.teamSize) {
    infoItems.push({
      icon: Users,
      label: 'Team Size',
      value: `${business.teamSize} people`,
      type: 'text' as const
    });
  }

  // Address
  if (business.address?.street && business.address?.city) {
    const mapsUrl = business.geo 
      ? `https://www.google.com/maps/search/?api=1&query=${business.geo.latitude},${business.geo.longitude}`
      : business.address.googleMapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.address.street}, ${business.address.city}`)}`;
    
    infoItems.push({
      icon: MapPin,
      label: 'Address',
      value: `${business.address.street}, ${business.address.city}`,
      href: mapsUrl,
      type: 'link' as const
    });
  } else if (business.geo) {
    // Show location even if address is not set, if we have geo coordinates
    infoItems.push({
      icon: MapPin,
      label: 'Location',
      value: business.location || `${business.geo.latitude.toFixed(4)}, ${business.geo.longitude.toFixed(4)}`,
      href: `https://www.google.com/maps/search/?api=1&query=${business.geo.latitude},${business.geo.longitude}`,
      type: 'link' as const
    });
  }

  // Phone
  if (business.phone) {
    const fullPhone = `${business.countryCode || '+49'} ${business.phone}`;
    infoItems.push({
      icon: Phone,
      label: 'Phone',
      value: fullPhone,
      href: `tel:${business.countryCode || '+49'}${business.phone}`,
      type: 'link' as const
    });
  }

  // Email
  if (business.contactEmail) {
    infoItems.push({
      icon: Mail,
      label: 'Email',
      value: business.contactEmail,
      href: `mailto:${business.contactEmail}`,
      type: 'link' as const
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
      <h2 className="text-xl font-clash font-bold text-[#1E0E62] mb-4">Contact & Social Media</h2>
      
      <div className="grid grid-cols-1 gap-3">
        {/* Social Media Accounts Section - Always show at top */}
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Social Media</h3>
          <div className="grid grid-cols-1 gap-3">
            <SocialAccountRow
              platform="google"
              connected={business.socialAccounts?.google?.connected}
              handle={business.socialAccounts?.google?.handle}
              url={business.socialAccounts?.google?.url}
              onConnect={onConnectGoogle}
              onDisconnect={onDisconnectGoogle}
              onSync={onSyncGoogle}
            />
            
            <SocialAccountRow
              platform="facebook"
              connected={business.socialAccounts?.facebook?.connected}
              handle={business.socialAccounts?.facebook?.handle}
              url={business.socialAccounts?.facebook?.url}
              onConnect={onConnectFacebook}
              onDisconnect={onDisconnectFacebook}
            />
            
            <SocialAccountRow
              platform="instagram"
              connected={business.socialAccounts?.instagram?.connected}
              handle={business.socialAccounts?.instagram?.handle}
              url={business.socialAccounts?.instagram?.url}
              onConnect={onConnectInstagram}
              onDisconnect={onDisconnectInstagram}
            />
            
            <SocialAccountRow
              platform="tiktok"
              connected={business.socialAccounts?.tiktok?.connected}
              handle={business.socialAccounts?.tiktok?.handle}
              url={business.socialAccounts?.tiktok?.url}
              onConnect={onConnectTikTok}
              onDisconnect={onDisconnectTikTok}
            />
            
            <SocialAccountRow
              platform="linkedin"
              connected={business.socialAccounts?.linkedin?.connected}
              handle={business.socialAccounts?.linkedin?.handle}
              url={business.socialAccounts?.linkedin?.url}
              onConnect={onConnectLinkedIn}
              onDisconnect={onDisconnectLinkedIn}
            />
          </div>
        </div>

        {/* Divider */}
        {infoItems.length > 0 && (
          <div className="border-t border-gray-100 my-2"></div>
        )}

        {/* Other contact info fields */}
        {infoItems.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 gap-2">
              {infoItems.map((item, idx) => (
                <InfoRow key={idx} {...item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

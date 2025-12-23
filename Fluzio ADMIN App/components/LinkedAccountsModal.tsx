import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, SocialConnection } from '../types';
import { 
  X, 
  Instagram,
  Facebook,
  Linkedin,
  Globe,
  Check,
  Link as LinkIcon,
  Loader2,
  AlertCircle,
  ExternalLink,
  Unlink,
  Zap,
  Mail
} from 'lucide-react';
import { InstagramConnector } from './InstagramConnector';

interface LinkedAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateSocialLinks: (links: User['socialLinks']) => void;
}

export const LinkedAccountsModal: React.FC<LinkedAccountsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateSocialLinks
}) => {
  const { t } = useTranslation();
  const [connecting, setConnecting] = useState<{[key: string]: boolean}>({});
  const [localLinks, setLocalLinks] = useState(user.socialLinks || {});

  if (!isOpen) return null;

  const handleConnect = async (platform: 'instagram' | 'facebook' | 'linkedin' | 'google') => {
    setConnecting({ ...connecting, [platform]: true });
    
    // Simulate OAuth flow
    setTimeout(() => {
      const platformName = t(`linkedAccounts.platforms.${platform}.name`);
      const field = platform === 'google' ? t('linkedAccounts.fields.email') : t('linkedAccounts.fields.username');
      const hint = platform === 'google' ? '' : t('linkedAccounts.prompts.hintNoAt');
      const promptMsg = t('linkedAccounts.prompts.enterUsername', { platform: platformName, field, hint });
      const username = prompt(promptMsg);
      
      if (username) {
        const newConnection: SocialConnection = {
          connected: true,
          username: platform === 'google' ? username : `@${username.replace('@', '')}`,
          lastSync: new Date().toISOString()
        };

        const updatedLinks = {
          ...localLinks,
          [platform]: newConnection
        };
        
        setLocalLinks(updatedLinks);
        onUpdateSocialLinks(updatedLinks);
      }
      
      setConnecting({ ...connecting, [platform]: false });
    }, 1500);
  };

  const handleDisconnect = (platform: 'instagram' | 'facebook' | 'linkedin' | 'google') => {
    const platformName = t(`linkedAccounts.platforms.${platform}.name`);
    if (confirm(t('linkedAccounts.prompts.disconnectConfirm', { platform: platformName }))) {
      const updatedLinks = {
        ...localLinks,
        [platform]: { connected: false }
      };
      
      setLocalLinks(updatedLinks);
      onUpdateSocialLinks(updatedLinks);
    }
  };

  const handleUpdateWebsite = () => {
    const website = prompt(t('linkedAccounts.prompts.websitePrompt'), localLinks.website || '');
    
    if (website !== null) {
      const updatedLinks = {
        ...localLinks,
        website: website
      };
      
      setLocalLinks(updatedLinks);
      onUpdateSocialLinks(updatedLinks);
    }
  };

  const getConnectionData = (platform: 'instagram' | 'facebook' | 'linkedin' | 'google') => {
    const link = localLinks[platform];
    if (typeof link === 'string') {
      // Handle legacy string format
      return {
        connected: !!link,
        username: platform === 'google' ? link : (link.startsWith('@') ? link : `@${link}`),
        url: platform === 'instagram' 
          ? `https://instagram.com/${link.replace('@', '')}` 
          : platform === 'facebook'
          ? `https://facebook.com/${link.replace('@', '')}`
          : platform === 'linkedin'
          ? `https://linkedin.com/in/${link.replace('@', '')}`
          : `mailto:${link}`
      };
    } else if (link && typeof link === 'object') {
      // Handle SocialConnection format
      return {
        connected: link.connected,
        username: link.username,
        url: link.username
          ? (platform === 'instagram' 
              ? `https://instagram.com/${link.username.replace('@', '')}` 
              : platform === 'facebook'
              ? `https://facebook.com/${link.username.replace('@', '')}`
              : platform === 'linkedin'
              ? `https://linkedin.com/in/${link.username.replace('@', '')}`
              : `mailto:${link.username}`)
          : undefined
      };
    }
    return { connected: false, username: undefined, url: undefined };
  };

  const platforms = [
    {
      id: 'instagram',
      name: t('linkedAccounts.platforms.instagram.name'),
      icon: Instagram,
      color: 'from-purple-500 via-pink-500 to-orange-500',
      bgColor: 'bg-gradient-to-tr from-purple-50 to-pink-50',
      ...getConnectionData('instagram'),
      description: t('linkedAccounts.platforms.instagram.description')
    },
    {
      id: 'facebook',
      name: t('linkedAccounts.platforms.facebook.name'),
      icon: Facebook,
      color: 'from-blue-600 to-blue-700',
      bgColor: 'bg-blue-50',
      ...getConnectionData('facebook'),
      description: t('linkedAccounts.platforms.facebook.description')
    },
    {
      id: 'linkedin',
      name: t('linkedAccounts.platforms.linkedin.name'),
      icon: Linkedin,
      color: 'from-blue-700 to-blue-800',
      bgColor: 'bg-blue-50',
      ...getConnectionData('linkedin'),
      description: t('linkedAccounts.platforms.linkedin.description')
    },
    {
      id: 'google',
      name: t('linkedAccounts.platforms.google.name'),
      icon: Mail,
      color: 'from-red-500 to-yellow-500',
      bgColor: 'bg-gradient-to-tr from-red-50 to-yellow-50',
      ...getConnectionData('google'),
      description: t('linkedAccounts.platforms.google.description')
    }
  ];

  const connectedCount = platforms.filter(p => p.connected).length;

  return (
    <div className="fixed inset-0 z-[130] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-bold text-2xl text-[#1E0E62]">{t('linkedAccounts.title')}</h2>
              <p className="text-sm text-gray-600 mt-1">{t('linkedAccounts.subtitle')}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-purple-200">
              <LinkIcon className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-bold text-purple-900">
                {t('linkedAccounts.stats', { connected: connectedCount, total: platforms.length })}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Info Banner */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-blue-900 mb-1">{t('linkedAccounts.infoTitle')}</h4>
              <p className="text-xs text-blue-700">
                {t('linkedAccounts.infoBody')}
              </p>
            </div>
          </div>

          {/* Social Platforms */}
          <div className="space-y-4 mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('linkedAccounts.socialMedia')}</h3>
            
            {/* Instagram OAuth Integration */}
            <InstagramConnector user={user} />
            
            {/* Other platforms (Facebook, LinkedIn, Google) */}
            {platforms.filter(p => p.id !== 'instagram').map((platform) => (
              <div 
                key={platform.id}
                className={`rounded-xl border-2 p-4 transition-all ${
                  platform.connected 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-white hover:border-purple-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platform.color} flex items-center justify-center shrink-0`}>
                      <platform.icon className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-sm text-[#1E0E62]">{platform.name}</h4>
                        {platform.connected && (
                          <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" />
                            <span className="text-xs font-bold">{t('linkedAccounts.connectedBadge')}</span>
                          </div>
                        )}
                      </div>
                      
                      {platform.connected ? (
                        <div>
                          <a 
                            href={platform.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 mb-1"
                          >
                            {platform.username}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <p className="text-xs text-gray-500">
                            {t('linkedAccounts.lastSynced')} {(() => {
                              const link = localLinks[platform.id as keyof typeof localLinks];
                              if (link && typeof link === 'object' && 'lastSync' in link && link.lastSync) {
                                return new Date(link.lastSync).toLocaleDateString();
                              }
                              return t('linkedAccounts.recently');
                            })()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-600">{platform.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    {platform.connected ? (
                      <button
                        onClick={() => handleDisconnect(platform.id as any)}
                        className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
                      >
                        <Unlink className="w-4 h-4" />
                        {t('linkedAccounts.disconnect')}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(platform.id as any)}
                        disabled={connecting[platform.id]}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {connecting[platform.id] ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t('linkedAccounts.connecting')}
                          </>
                        ) : (
                          <>
                            <LinkIcon className="w-4 h-4" />
                            {t('linkedAccounts.connect')}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Website */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('linkedAccounts.websiteSection')}</h3>
            
            <div className="rounded-xl border-2 border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6 text-gray-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-[#1E0E62] mb-1">{t('linkedAccounts.personalWebsite')}</h4>
                    {localLinks.website ? (
                      <a 
                        href={localLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 break-all"
                      >
                        {localLinks.website}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <p className="text-xs text-gray-600">{t('linkedAccounts.addWebsiteDescription')}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleUpdateWebsite}
                  className="px-4 py-2 rounded-lg bg-white border-2 border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors"
                >
                  {localLinks.website ? t('common.edit') : t('linkedAccounts.add')}
                </button>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
            <h4 className="font-bold text-sm text-purple-900 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {t('linkedAccounts.creatorBenefits')}
            </h4>
            <ul className="space-y-1 text-xs text-purple-700">
              <li>• {t('linkedAccounts.benefits.benefit1')}</li>
              <li>• {t('linkedAccounts.benefits.benefit2')}</li>
              <li>• {t('linkedAccounts.benefits.benefit3')}</li>
              <li>• {t('linkedAccounts.benefits.benefit4')}</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white font-bold text-sm hover:shadow-lg transition-all"
          >
            {t('common.done')}
          </button>
        </div>
      </div>
    </div>
  );
};

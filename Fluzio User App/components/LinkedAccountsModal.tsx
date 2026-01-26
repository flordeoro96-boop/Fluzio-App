import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';
import { 
  X, 
  Globe,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

interface LinkedAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const LinkedAccountsModal: React.FC<LinkedAccountsModalProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const { t } = useTranslation();
  const [website, setWebsite] = useState(user.socialLinks?.website || '');

  if (!isOpen) return null;

  const handleSave = () => {
    // Note: Website updates would normally be saved to backend
    // For now, just close the modal
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-2xl text-[#1E0E62]">{t('linkedAccounts.title', 'Linked Accounts')}</h2>
              <p className="text-sm text-gray-600 mt-1">{t('linkedAccounts.subtitle', 'Connect your online presence')}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Info Banner */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-blue-900 mb-1">Native Platform</h4>
              <p className="text-xs text-blue-700">
                Beevvy uses its own native feed system. Share your content directly on the platform to reach businesses and customers.
              </p>
            </div>
          </div>

          {/* Website */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Website</h3>
            
            <div className="rounded-xl border-2 border-gray-200 bg-white p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <Globe className="w-6 h-6 text-gray-600" />
                </div>
                
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-[#1E0E62] mb-2">Your Website</h4>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {website && (
                    <a 
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 mt-2"
                    >
                      {website}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleSave}
            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white font-bold text-sm hover:shadow-lg transition-all"
          >
            {t('common.done', 'Done')}
          </button>
        </div>
      </div>
    </div>
  );
};

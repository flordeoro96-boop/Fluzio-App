
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Common';
import { Lock, Bell, Clock, HelpCircle } from 'lucide-react';

interface PendingApprovalScreenProps {
  onEnableNotifications: () => void;
  onBackToLogin: () => void;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({ onEnableNotifications, onBackToLogin }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[#1E0E62] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#FFB86C] rounded-full filter blur-[80px] opacity-10"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#00E5FF] rounded-full filter blur-[80px] opacity-10"></div>

        <div className="relative z-10 animate-in fade-in zoom-in duration-700">
            <div className="w-24 h-24 bg-gradient-to-br from-[#FFB86C] to-[#FFA000] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-[#FFB86C]/30 rotate-3">
                <Clock className="w-10 h-10 text-[#1E0E62]" />
            </div>

            <h1 className="text-4xl font-clash font-bold text-white mb-4">{t('auth.applicationUnderReview')}</h1>
            <p className="text-gray-300 font-medium text-lg max-w-sm mx-auto mb-8 leading-relaxed">
                {t('auth.reviewMessage')}
            </p>

            <div className="max-w-xs mx-auto space-y-4">
                <Button 
                    onClick={onEnableNotifications}
                    className="w-full bg-white text-[#1E0E62] hover:bg-gray-100 border-none h-14 text-lg"
                >
                    <Bell className="w-5 h-5 mr-2" /> {t('settings.enableNotifications')}
                </Button>

                <Button 
                    variant="outline"
                    onClick={() => window.location.href = 'mailto:support@beevvy.com'}
                    className="w-full border-white/20 text-white hover:bg-white/10 h-12"
                >
                    <HelpCircle className="w-4 h-4 mr-2" /> {t('settings.contactSupport')}
                </Button>
                
                <button 
                    onClick={onBackToLogin}
                    className="text-gray-400 font-bold text-sm hover:text-white transition-colors mt-4 block"
                >
                    {t('auth.backToLogin')}
                </button>
            </div>
        </div>
    </div>
  );
};
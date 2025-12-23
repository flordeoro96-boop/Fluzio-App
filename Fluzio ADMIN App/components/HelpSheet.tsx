
import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Lightbulb } from 'lucide-react';

export interface HelpStep {
    icon?: any;
    title: string;
    text: string;
}

interface HelpSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    heroIcon: any;
    steps: HelpStep[];
    proTip?: string;
}

export const HelpSheet: React.FC<HelpSheetProps> = ({
    isOpen,
    onClose,
    title,
    heroIcon: HeroIcon,
    steps,
    proTip
}) => {
    const { t } = useTranslation();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-[#1E0E62]/40 backdrop-blur-sm transition-opacity animate-in fade-in"
                onClick={onClose}
            />

            {/* Sheet Content */}
            <div className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 border border-white/50">
                
                {/* Header */}
                <div className="bg-gray-50 p-6 flex justify-between items-start border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#FFB86C] via-[#00E5FF] to-[#6C4BFF] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#00E5FF]/20">
                            <HeroIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-[#8F8FA3] uppercase tracking-wider">{t('common.howItWorks')}</div>
                            <h2 className="font-clash font-bold text-xl text-[#1E0E62]">{title}</h2>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Steps */}
                <div className="p-6 space-y-6">
                    {steps.map((step, index) => (
                        <div key={index} className="flex gap-4">
                             <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-sm border border-indigo-100 shadow-sm">
                                 {index + 1}
                             </div>
                             <div>
                                 <h4 className="font-bold text-[#1E0E62] text-sm mb-1">{step.title}</h4>
                                 <p className="text-sm text-[#8F8FA3] font-medium leading-snug">{step.text}</p>
                             </div>
                        </div>
                    ))}
                </div>

                {/* Pro Tip */}
                {proTip && (
                    <div className="mx-6 mb-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100 flex gap-3 shadow-sm">
                        <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">{t('common.proTip')}</div>
                            <p className="text-sm text-[#1E0E62] font-medium italic">"{proTip}"</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

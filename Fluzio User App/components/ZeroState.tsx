
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Common';
import { LucideIcon } from 'lucide-react';

interface ZeroStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export const ZeroState: React.FC<ZeroStateProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 animate-in fade-in zoom-in-95 duration-500 w-full">
      {/* Icon with Glow */}
      <div className="relative mb-8 group cursor-default">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#FFB86C] via-[#00E5FF] to-[#6C4BFF] rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
        <div className="relative w-24 h-24 bg-white rounded-[32px] flex items-center justify-center shadow-[0_10px_40px_rgba(114,9,183,0.15)] border border-white">
           <div className="bg-gradient-to-br from-[#FFB86C] via-[#00E5FF] to-[#6C4BFF] text-transparent bg-clip-text">
              <Icon className="w-12 h-12 text-[#00E5FF]" />
           </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto space-y-3 mb-8">
        <h3 className="font-clash font-bold text-2xl text-[#1E0E62] leading-tight">
          {title}
        </h3>
        <p className="text-[#8F8FA3] font-medium leading-relaxed text-sm max-w-[80%] mx-auto">
          {description}
        </p>
      </div>

      {/* Action */}
      <Button 
        variant="gradient" 
        onClick={onAction}
        className="px-8 py-4 text-base shadow-xl shadow-[#00E5FF]/20 hover:shadow-[#00E5FF]/40 hover:-translate-y-1"
      >
        {actionLabel}
      </Button>
    </div>
  );
};

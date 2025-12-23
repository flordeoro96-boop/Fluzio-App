
import React from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';
import { Card, Button } from './Common';
import { Wallet, CreditCard, Star, Euro, Users, TrendingUp, ArrowUpRight, X } from 'lucide-react';

interface CreatorWalletScreenProps {
  user: User;
  onClose?: () => void;
  onSpendPoints: () => void;
  onCashOut: () => void;
  mode?: 'modal' | 'screen';
}

export const CreatorWalletScreen: React.FC<CreatorWalletScreenProps> = ({ 
  user, 
  onClose, 
  onSpendPoints, 
  onCashOut,
  mode = 'modal' 
}) => {
  const wallet = user.creatorWallet || {
    pointsBalance: user.points,
    cashBalance: 0,
    lifetimeEarnings: 0,
    networkStats: { recruitedCount: 0, networkRevenue: 0 },
    level: { current: 'Newbie', next: 'Ambassador', progress: 10, xpNeeded: 100 }
  };

  const isModal = mode === 'modal';
  
  // Container styles based on mode
  const containerClasses = isModal 
    ? "fixed inset-0 z-[70] bg-[#F8F9FE] flex flex-col animate-in slide-in-from-bottom duration-300"
    : "flex flex-col h-full bg-[#F8F9FE] pb-24 overflow-hidden"; // pb-24 for bottom nav space

  const headerRoundedClass = isModal ? "rounded-b-[32px]" : "rounded-b-[40px]";

  return (
    <div className={containerClasses}>
      {/* Header (Custom Gradient) */}
      <div className={`relative bg-gradient-to-br from-[#FFB86C] via-[#00E5FF] to-[#6C4BFF] pb-12 ${headerRoundedClass} shadow-xl shadow-[#00E5FF]/20 shrink-0`}>
         <div className="h-16 flex items-center justify-between px-6">
             <h2 className="font-clash font-bold text-xl text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-white/90" />
                My Wallet
             </h2>
             {isModal && onClose && (
                 <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-colors text-white">
                    <X className="w-5 h-5" />
                 </button>
             )}
         </div>

         {/* Hero Content: Status Card */}
         <div className="px-6 mt-4">
             <div className="flex items-center gap-4 mb-6">
                 <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-white/20 p-0.5">
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-[#FFB86C] text-[#1E0E62] text-[10px] font-black px-2 py-0.5 rounded-full border border-white shadow-sm">
                        LVL {user.level}
                    </div>
                 </div>
                 <div className="flex-1">
                     <div className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">Current Rank</div>
                     <h1 className="text-3xl font-clash font-bold text-white leading-none mb-2">{wallet.level.current}</h1>
                 </div>
             </div>

             {/* Gamification Progress */}
             <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                 <div className="flex justify-between text-xs font-bold text-white/90 mb-2">
                     <span>Progress to {wallet.level.next}</span>
                     <span>{wallet.level.xpNeeded} XP needed</span>
                 </div>
                 <div className="w-full bg-white/30 rounded-full h-3 overflow-hidden">
                     <div 
                        className="h-full bg-[#06D6A0] rounded-full shadow-[0_0_10px_#06D6A0]"
                        style={{ width: `${wallet.level.progress}%` }}
                     ></div>
                 </div>
             </div>
         </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 -mt-8 no-scrollbar">
         
         {/* Section B: The Split Bank */}
         <div className="grid grid-cols-2 gap-4 mb-6">
             {/* Points Card */}
             <Card className="p-5 flex flex-col justify-between min-h-[160px] relative overflow-hidden group active:scale-[0.98] transition-transform">
                 <div className="absolute -right-4 -top-4 bg-yellow-50 w-24 h-24 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                 <div className="relative z-10">
                     <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mb-3">
                         <Star className="w-5 h-5 fill-current" />
                     </div>
                     <div className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1">Redeemable</div>
                     <div className="text-2xl font-clash font-bold text-[#1E0E62]">{wallet.pointsBalance.toLocaleString()}</div>
                 </div>
                 <Button 
                    size="sm" 
                    variant="ghost" 
                    className="mt-auto p-0 h-auto justify-start text-yellow-600 hover:bg-transparent font-bold text-xs"
                    onClick={onSpendPoints}
                 >
                    Shop Rewards <ArrowUpRight className="w-3 h-3 ml-1" />
                 </Button>
             </Card>

             {/* Cash Card */}
             <Card className="p-5 flex flex-col justify-between min-h-[160px] relative overflow-hidden group active:scale-[0.98] transition-transform border-green-100">
                 <div className="absolute -right-4 -top-4 bg-green-50 w-24 h-24 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                 <div className="relative z-10">
                     <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3">
                         <Euro className="w-5 h-5" />
                     </div>
                     <div className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1">Commission</div>
                     <div className="text-2xl font-clash font-bold text-[#1E0E62]">€{wallet.cashBalance.toFixed(2)}</div>
                 </div>
                 <Button 
                    size="sm" 
                    variant="ghost" 
                    className="mt-auto p-0 h-auto justify-start text-green-600 hover:bg-transparent font-bold text-xs"
                    onClick={onCashOut}
                 >
                    Cash Out <ArrowUpRight className="w-3 h-3 ml-1" />
                 </Button>
             </Card>
         </div>

         {/* Section C: Network Impact */}
         <div className="mb-6">
             <h3 className="font-bold text-[#1E0E62] text-lg mb-4 px-1 flex items-center gap-2">
                 <Users className="w-5 h-5 text-[#00E5FF]" />
                 Your Tribe Impact
             </h3>
             
             <Card className="bg-white overflow-hidden border border-gray-100">
                 <div className="p-6 relative">
                     {/* Decorative Line connecting dots */}
                     <div className="absolute left-[29px] top-10 bottom-10 w-0.5 bg-gray-100"></div>

                     <div className="space-y-6 relative z-10">
                         {/* Step 1: Recruitment */}
                         <div className="flex gap-4">
                             <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 border-4 border-white shadow-sm">
                                 <Users className="w-3.5 h-3.5" />
                             </div>
                             <div>
                                 <div className="text-2xl font-bold text-[#1E0E62] leading-none mb-1">{wallet.networkStats.recruitedCount}</div>
                                 <div className="text-sm text-gray-500 font-medium">Fans recruited to your network</div>
                             </div>
                         </div>

                         {/* Step 2: Spending */}
                         <div className="flex gap-4">
                             <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 border-4 border-white shadow-sm">
                                 <CreditCard className="w-3.5 h-3.5" />
                             </div>
                             <div>
                                 <div className="text-2xl font-bold text-[#1E0E62] leading-none mb-1">€{wallet.networkStats.networkRevenue}</div>
                                 <div className="text-sm text-gray-500 font-medium">Spent at local brands by them</div>
                             </div>
                         </div>

                         {/* Step 3: Earnings */}
                         <div className="flex gap-4">
                             <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 border-4 border-white shadow-sm">
                                 <TrendingUp className="w-3.5 h-3.5" />
                             </div>
                             <div>
                                 <div className="text-2xl font-bold text-green-600 leading-none mb-1">10%</div>
                                 <div className="text-sm text-gray-500 font-medium">Commission you earned (€{(wallet.networkStats.networkRevenue * 0.10).toFixed(2)})</div>
                             </div>
                         </div>
                     </div>
                 </div>
                 
                 <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
                     <p className="text-xs text-gray-400 font-medium">
                         Lifetime Earnings: <span className="text-gray-900 font-bold">€{wallet.lifetimeEarnings.toFixed(2)}</span>
                     </p>
                 </div>
             </Card>
         </div>
         
         {/* CTA */}
         <div className="pb-6">
            <Button className="w-full py-4 shadow-xl shadow-[#00E5FF]/20" onClick={() => alert("Invite Flow Triggered")}>
                Invite Friends & Earn 10%
            </Button>
         </div>

      </div>
    </div>
  );
};

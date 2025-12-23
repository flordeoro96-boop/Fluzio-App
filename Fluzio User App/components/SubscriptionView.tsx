import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, SubscriptionLevel } from '../types';
import { store } from '../services/mockStore';
import { api } from '../services/apiService';
import { useAuth } from '../services/AuthContext';
import { Card, Button, Badge } from './Common';
import { Check, X, CreditCard, Download, Zap, Crown, ShieldCheck } from 'lucide-react';

interface SubscriptionViewProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({ isOpen, onClose, user }) => {
  const [changingPlan, setChangingPlan] = useState(false);
  const { refreshUserProfile, userProfile } = useAuth();
  
  if (!isOpen) return null;

  const usage = store.getSubscriptionUsage(user.id);
  const invoices = store.getBillingHistory(user.id);
  
  // Get the current subscription level from userProfile
  const currentSubscription = userProfile?.subscriptionLevel || user.subscriptionLevel;
  
  const isFreeTier = currentSubscription === SubscriptionLevel.FREE || currentSubscription === SubscriptionLevel.SILVER;
  const progressPercentage = usage.matchLimit > 0 ? (usage.matchesUsed / usage.matchLimit) * 100 : 100;
  
  const handleChangePlan = async (newLevel: SubscriptionLevel) => {
    setChangingPlan(true);
    
    try {
      // Update subscription in Firestore
      const result = await api.updateUser(user.id, {
        subscriptionLevel: newLevel
      });
      
      if (result.success) {
        // Also update localStorage for immediate reflection
        store.updateUserSubscription(user.id, newLevel);
        
        // Refresh user profile from Firestore
        await refreshUserProfile();
        
        // Reload page to reflect changes everywhere
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        alert('Failed to update subscription: ' + (result.error || 'Unknown error'));
        setChangingPlan(false);
      }
    } catch (error) {
      console.error('[SubscriptionView] Error updating subscription:', error);
      alert('Failed to update subscription. Please try again.');
      setChangingPlan(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white">
         <h2 className="font-bold text-xl text-gray-900 flex items-center gap-2">
           <CreditCard className="w-5 h-5 text-blue-600" />
           My Subscription
         </h2>
         <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
           <X className="w-6 h-6 text-gray-500" />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* 1. Current Plan Card */}
          <Card className="p-6 overflow-hidden relative">
             <div className="absolute top-0 right-0 p-6 opacity-10">
                {isFreeTier ? <Zap className="w-32 h-32" /> : <Crown className="w-32 h-32" />}
             </div>

             <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <div className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Current Plan</div>
                      <h3 className="text-3xl font-bold text-gray-900">
                        {currentSubscription === SubscriptionLevel.FREE && 'Free Plan'}
                        {currentSubscription === SubscriptionLevel.SILVER && 'Silver Level'}
                        {currentSubscription === SubscriptionLevel.GOLD && 'Gold Growth'}
                        {currentSubscription === SubscriptionLevel.PLATINUM && 'Platinum Elite'}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                         <Badge 
                           text={isFreeTier ? 'Free Tier' : 'Active'} 
                           color={isFreeTier ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-700'} 
                         />
                         {!isFreeTier && <span className="text-sm text-gray-500">Renews on {usage.renewalDate} (€{usage.monthlyPrice}/mo)</span>}
                      </div>
                   </div>
                   {isFreeTier && (
                     <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{usage.matchesUsed}/{usage.matchLimit}</div>
                        <div className="text-xs text-gray-500">Matches Used</div>
                     </div>
                   )}
                </div>

                {/* Usage Meter (Only for Free/Limited) */}
                {isFreeTier && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm font-medium mb-2">
                       <span>Monthly Match Limit</span>
                       <span className={usage.matchesUsed >= usage.matchLimit ? 'text-red-500' : 'text-blue-600'}>
                         {usage.matchLimit - usage.matchesUsed} remaining
                       </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                       <div 
                         className={`h-full rounded-full transition-all duration-500 ${usage.matchesUsed >= usage.matchLimit ? 'bg-red-500' : 'bg-blue-600'}`} 
                         style={{ width: `${progressPercentage}%` }}
                       />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      You've used {usage.matchesUsed} out of {usage.matchLimit} AI strategic matches this month. Upgrade for unlimited access.
                    </p>
                  </div>
                )}
             </div>
          </Card>

          {/* 2. Upgrade / Compare View */}
          <div>
             <h3 className="font-bold text-lg text-gray-900 mb-4">Plan Comparison</h3>
             <p className="text-sm text-gray-500 mb-4">Switch between plans anytime - currently free during beta! 🎉</p>
             <div className="grid md:grid-cols-3 gap-4">
                {/* Free Plan */}
                <Card className={`p-6 border-2 ${currentSubscription === SubscriptionLevel.FREE ? 'border-blue-500 bg-white ring-4 ring-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                   {currentSubscription === SubscriptionLevel.FREE && (
                     <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                        ACTIVE
                     </div>
                   )}
                   <h4 className="text-xl font-bold text-gray-900 mb-2">Free</h4>
                   <p className="text-gray-500 text-sm mb-6 h-10">Try out the platform</p>
                   
                   <div className="text-3xl font-bold text-gray-900 mb-6">€0 <span className="text-base font-normal text-gray-500">/mo</span></div>

                   <ul className="space-y-3 mb-8">
                      <li className="flex items-start gap-3 text-sm text-gray-700">
                         <Check className="w-5 h-5 text-blue-500 shrink-0" /> 5 participants per mission
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-700">
                         <Check className="w-5 h-5 text-blue-500 shrink-0" /> Basic missions
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-700">
                         <Check className="w-5 h-5 text-blue-500 shrink-0" /> Community support
                      </li>
                   </ul>

                   {currentSubscription === SubscriptionLevel.FREE ? (
                     <Button variant="outline" disabled className="w-full">Current Plan</Button>
                   ) : (
                     <Button 
                       variant="outline" 
                       className="w-full" 
                       onClick={() => handleChangePlan(SubscriptionLevel.FREE)}
                       disabled={changingPlan}
                     >
                       {changingPlan ? 'Switching...' : 'Switch to Free'}
                     </Button>
                   )}
                </Card>

                {/* Silver Plan */}
                <Card className={`p-6 border-2 ${currentSubscription === SubscriptionLevel.SILVER ? 'border-blue-500 bg-white ring-4 ring-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                   {currentSubscription === SubscriptionLevel.SILVER && (
                     <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                        ACTIVE
                     </div>
                   )}
                   <h4 className="text-xl font-bold text-gray-900 mb-2">Silver</h4>
                   <p className="text-gray-500 text-sm mb-6 h-10">For small businesses</p>
                   
                   <div className="text-3xl font-bold text-gray-900 mb-6">€19 <span className="text-base font-normal text-gray-500">/mo</span></div>

                   <ul className="space-y-3 mb-8">
                      <li className="flex items-start gap-3 text-sm text-gray-700">
                         <Check className="w-5 h-5 text-blue-500 shrink-0" /> 10 participants per mission
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-700">
                         <Check className="w-5 h-5 text-blue-500 shrink-0" /> AI mission ideas
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-700">
                         <Check className="w-5 h-5 text-blue-500 shrink-0" /> Basic analytics
                      </li>
                   </ul>

                   {currentSubscription === SubscriptionLevel.SILVER ? (
                     <Button variant="outline" disabled className="w-full">Current Plan</Button>
                   ) : (
                     <Button 
                       className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                       onClick={() => handleChangePlan(SubscriptionLevel.SILVER)}
                       disabled={changingPlan}
                     >
                       {changingPlan ? 'Switching...' : 'Switch to Silver'}
                     </Button>
                   )}
                </Card>

                {/* Gold Plan */}
                <Card className={`p-6 border-2 ${currentSubscription === SubscriptionLevel.GOLD ? 'border-amber-500 bg-white ring-4 ring-amber-50' : 'border-amber-200 bg-amber-50/30'}`}>
                   {currentSubscription === SubscriptionLevel.GOLD && (
                     <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                        ACTIVE
                     </div>
                   )}
                   <h4 className="text-xl font-bold text-gray-900 mb-2">Gold</h4>
                   <p className="text-gray-500 text-sm mb-6 h-10">For growing businesses</p>
                   
                   <div className="text-3xl font-bold text-gray-900 mb-6">€49 <span className="text-base font-normal text-gray-500">/mo</span></div>

                   <ul className="space-y-3 mb-8">
                      <li className="flex items-start gap-3 text-sm text-gray-900 font-medium">
                         <Zap className="w-5 h-5 text-amber-500 shrink-0" /> 50 participants per mission
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-900 font-medium">
                         <Zap className="w-5 h-5 text-amber-500 shrink-0" /> Advanced AI features
                      </li>
                      <li className="flex items-start gap-3 text-sm text-gray-900">
                         <Check className="w-5 h-5 text-blue-500 shrink-0" /> Priority support
                      </li>
                   </ul>

                   {currentSubscription === SubscriptionLevel.GOLD ? (
                      <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white" disabled>Current Plan</Button>
                   ) : (
                      <Button 
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:shadow-lg hover:scale-[1.02] transition-all"
                        onClick={() => handleChangePlan(SubscriptionLevel.GOLD)}
                        disabled={changingPlan}
                      >
                        {changingPlan ? 'Switching...' : 'Switch to Gold'}
                      </Button>
                   )}
                </Card>
             </div>
             
             {/* Platinum Plan - Full Width */}
             <Card className={`p-6 border-2 mt-4 ${currentSubscription === SubscriptionLevel.PLATINUM ? 'border-purple-500 bg-white ring-4 ring-purple-50' : 'border-purple-200 bg-purple-50/30'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {currentSubscription === SubscriptionLevel.PLATINUM && (
                      <div className="inline-block bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-lg mb-2">
                         ACTIVE
                      </div>
                    )}
                    <h4 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Crown className="w-6 h-6 text-purple-500" />
                      Platinum
                    </h4>
                    <p className="text-gray-500 text-sm mb-4">Maximum reach and premium features</p>
                    
                    <div className="text-4xl font-bold text-gray-900 mb-4">€99 <span className="text-base font-normal text-gray-500">/mo</span></div>

                    <ul className="grid md:grid-cols-2 gap-3">
                       <li className="flex items-start gap-3 text-sm text-gray-900 font-medium">
                          <Crown className="w-5 h-5 text-purple-500 shrink-0" /> 100 participants per mission
                       </li>
                       <li className="flex items-start gap-3 text-sm text-gray-900 font-medium">
                          <Crown className="w-5 h-5 text-purple-500 shrink-0" /> Unlimited AI generations
                       </li>
                       <li className="flex items-start gap-3 text-sm text-gray-900">
                          <ShieldCheck className="w-5 h-5 text-purple-500 shrink-0" /> Dedicated account manager
                       </li>
                       <li className="flex items-start gap-3 text-sm text-gray-900">
                          <Zap className="w-5 h-5 text-purple-500 shrink-0" /> Advanced analytics & insights
                       </li>
                    </ul>
                  </div>
                  
                  <div className="ml-6">
                    {currentSubscription === SubscriptionLevel.PLATINUM ? (
                       <Button className="bg-gray-900 hover:bg-gray-800 text-white px-8" disabled>Current Plan</Button>
                    ) : (
                       <Button 
                         className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:scale-[1.02] transition-all px-8"
                         onClick={() => handleChangePlan(SubscriptionLevel.PLATINUM)}
                         disabled={changingPlan}
                       >
                         {changingPlan ? 'Switching...' : 'Switch to Platinum'}
                       </Button>
                    )}
                  </div>
                </div>
             </Card>
          </div>

          {/* 3. Billing History */}
          <div>
             <h3 className="font-bold text-lg text-gray-900 mb-4">Billing History</h3>
             <Card className="overflow-hidden">
                <table className="w-full text-sm text-left">
                   <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                      <tr>
                         <th className="py-3 px-4 font-medium">Date</th>
                         <th className="py-3 px-4 font-medium">Plan</th>
                         <th className="py-3 px-4 font-medium">Amount</th>
                         <th className="py-3 px-4 font-medium">Status</th>
                         <th className="py-3 px-4 font-medium text-right">Invoice</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {invoices.map((inv) => (
                         <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 text-gray-900">{inv.date}</td>
                            <td className="py-3 px-4 text-gray-600">{inv.plan}</td>
                            <td className="py-3 px-4 text-gray-900 font-medium">€{inv.amount.toFixed(2)}</td>
                            <td className="py-3 px-4">
                               <Badge text={inv.status} color="bg-green-100 text-green-700" />
                            </td>
                            <td className="py-3 px-4 text-right">
                               <button className="text-gray-400 hover:text-blue-600 transition-colors">
                                  <Download className="w-4 h-4 inline" />
                               </button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

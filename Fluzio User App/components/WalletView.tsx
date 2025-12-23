
import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, TransactionType, UserRole } from '../types';
import { store } from '../services/mockStore';
import { Card, Button, Badge } from './Common';
import { Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, ShoppingBag, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CreatorWalletScreen } from './CreatorWalletScreen';

interface WalletViewProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSpend: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({ isOpen, onClose, user, onSpend }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  // If user is a MEMBER, show the Gamified Creator Wallet
  if (user.role === UserRole.MEMBER) {
      return (
          <CreatorWalletScreen 
            user={user} 
            onClose={onClose} 
            onSpendPoints={onSpend} 
            onCashOut={() => alert("Cash out feature coming soon!")} 
          />
      );
  }

  // Default Business Wallet View
  const transactions = store.getWalletTransactions(user.id);

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white">
         <h2 className="font-bold text-xl text-gray-900 flex items-center gap-2">
           <Wallet className="w-5 h-5 text-blue-600" />
           {t('business.wallet')}
         </h2>
         <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
           <X className="w-6 h-6 text-gray-500" />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-lg mx-auto space-y-6">
          
          {/* Balance Card */}
          <Card className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl shadow-slate-300">
             <div className="text-center">
                <div className="text-slate-300 text-sm font-medium uppercase tracking-widest mb-2">{t('rewards.currentBalance')}</div>
                <div className="text-5xl font-extrabold text-white mb-2">{user.points} {t('rewards.credits')}</div>
                <div className="inline-flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-xs text-slate-300 border border-white/10">
                    <span>≈ €{user.points} Value</span>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 mt-8">
                <Button 
                    className="bg-blue-600 hover:bg-blue-500 text-white border-none w-full" 
                    onClick={() => alert("Top Up functionality would integrate with Stripe here.")}
                >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {t('rewards.topUp')}
                </Button>
                <Button 
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 w-full backdrop-blur-sm"
                    onClick={onSpend}
                >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    {t('rewards.spend')}
                </Button>
             </div>
          </Card>

          {/* Transaction Ledger */}
          <div>
             <h3 className="font-bold text-lg text-gray-900 mb-4">{t('rewards.transactionHistory')}</h3>
             <Card className="overflow-hidden divide-y divide-gray-100">
                {transactions.length > 0 ? (
                    transactions.map(t => (
                        <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                    t.type === TransactionType.CREDIT ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                }`}>
                                    {t.type === TransactionType.CREDIT ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 text-sm">{t.description}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <span>{formatDistanceToNow(new Date(t.date), { addSuffix: true })}</span>
                                        <span>•</span>
                                        <span className="capitalize">{t.category}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={`font-bold text-sm ${
                                t.type === TransactionType.CREDIT ? 'text-green-600' : 'text-gray-900'
                            }`}>
                                {t.type === TransactionType.CREDIT ? '+' : '-'}{t.amount} {t.currency === 'EUR' ? '€' : 'pts'}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-gray-400 text-sm">{t('rewards.noTransactions')}</div>
                )}
             </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

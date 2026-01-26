import React, { useState, useEffect } from 'react';
import { X, Crown, Check, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { doc, getDoc, updateDoc, serverTimestamp } from '../services/firestoreCompat';
import { db } from '../services/apiService';

interface ManageSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Subscription {
  plan: 'free' | 'premium' | 'pro';
  status: 'active' | 'cancelled' | 'expired';
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
  paymentMethod?: string;
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      'Basic missions',
      'Standard rewards',
      'Community meetups',
      'Basic analytics',
      'Email support'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    popular: true,
    features: [
      'All Free features',
      'Priority missions',
      'Exclusive rewards',
      'Advanced analytics',
      'Priority support',
      'Ad-free experience',
      '2x reward points'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    features: [
      'All Premium features',
      'VIP missions',
      'Premium meetups',
      'Custom analytics',
      '24/7 support',
      'Early feature access',
      '3x reward points',
      'Personal account manager'
    ]
  }
];

const ManageSubscriptionModal: React.FC<ManageSubscriptionModalProps> = ({ isOpen, onClose }) => {
  const { user: currentUser } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [actionType, setActionType] = useState<'upgrade' | 'downgrade' | 'cancel' | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadSubscription();
    }
  }, [isOpen, currentUser]);

  const loadSubscription = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      if (userData?.subscription) {
        setSubscription({
          plan: userData.subscription.plan || 'free',
          status: userData.subscription.status || 'active',
          startDate: userData.subscription.startDate?.toDate() || new Date(),
          endDate: userData.subscription.endDate?.toDate(),
          autoRenew: userData.subscription.autoRenew !== false,
          paymentMethod: userData.subscription.paymentMethod
        });
        setSelectedPlan(userData.subscription.plan || 'free');
      } else {
        setSubscription({
          plan: 'free',
          status: 'active',
          startDate: new Date(),
          autoRenew: false
        });
        setSelectedPlan('free');
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = (planId: string) => {
    if (!subscription || planId === subscription.plan) return;

    setSelectedPlan(planId);
    const planIndex = PLANS.findIndex(p => p.id === planId);
    const currentPlanIndex = PLANS.findIndex(p => p.id === subscription.plan);

    if (planIndex > currentPlanIndex) {
      setActionType('upgrade');
    } else {
      setActionType('downgrade');
    }
    setShowConfirmation(true);
  };

  const handleCancelSubscription = () => {
    setActionType('cancel');
    setShowConfirmation(true);
  };

  const confirmAction = async () => {
    if (!currentUser || !actionType) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);

      if (actionType === 'cancel') {
        await updateDoc(userRef, {
          'subscription.status': 'cancelled',
          'subscription.autoRenew': false,
          'subscription.cancelledAt': serverTimestamp()
        });

        if (subscription) {
          setSubscription({
            ...subscription,
            status: 'cancelled',
            autoRenew: false
          });
        }
      } else {
        // In production, this would integrate with Stripe/payment processor
        await updateDoc(userRef, {
          'subscription.plan': selectedPlan,
          'subscription.status': 'active',
          'subscription.startDate': serverTimestamp(),
          'subscription.autoRenew': true,
          'subscription.updatedAt': serverTimestamp()
        });

        if (subscription) {
          setSubscription({
            ...subscription,
            plan: selectedPlan as 'free' | 'premium' | 'pro',
            status: 'active',
            autoRenew: true
          });
        }
      }

      setShowConfirmation(false);
      setActionType(null);
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[130] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-zoom-in-95">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Manage Subscription</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading subscription...</p>
          </div>
        ) : (
          <>
            {/* Current Subscription */}
            {subscription && subscription.plan !== 'free' && (
              <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-b">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Current Plan
                </h3>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-bold text-xl capitalize">{subscription.plan}</p>
                      <p className="text-sm text-gray-600">
                        Status: <span className={`font-semibold ${subscription.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                          {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">
                        ${PLANS.find(p => p.id === subscription.plan)?.price}/mo
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Started: {subscription.startDate.toLocaleDateString()}
                    </div>
                    {subscription.paymentMethod && (
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-4 h-4" />
                        {subscription.paymentMethod}
                      </div>
                    )}
                  </div>
                  {subscription.status === 'active' && subscription.autoRenew && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                      <Check className="w-4 h-4" />
                      Auto-renew enabled
                    </div>
                  )}
                  {subscription.status === 'cancelled' && subscription.endDate && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-orange-600">
                      <AlertCircle className="w-4 h-4" />
                      Access until {subscription.endDate.toLocaleDateString()}
                    </div>
                  )}
                </div>
                {subscription.status === 'active' && (subscription.plan === 'premium' || subscription.plan === 'pro') && (
                  <button
                    onClick={handleCancelSubscription}
                    className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Cancel Subscription
                  </button>
                )}
              </div>
            )}

            {/* Available Plans */}
            <div className="p-6">
              <h3 className="font-semibold text-lg mb-4">Available Plans</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative rounded-xl p-6 border-2 transition ${
                      subscription?.plan === plan.id
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    } ${plan.popular ? 'ring-2 ring-purple-400' : ''}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                          POPULAR
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-4">
                      <h4 className="text-xl font-bold mb-2">{plan.name}</h4>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold">${plan.price}</span>
                        {plan.price > 0 && <span className="text-gray-600">/month</span>}
                      </div>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {subscription?.plan === plan.id ? (
                      <div className="bg-purple-600 text-white rounded-lg py-2 text-center font-semibold">
                        Current Plan
                      </div>
                    ) : (
                      <button
                        onClick={() => handlePlanChange(plan.id)}
                        disabled={subscription?.status === 'cancelled'}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg py-2 font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {plan.id === 'free' ? 'Downgrade' : subscription?.plan === 'free' ? 'Upgrade' : 'Change Plan'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[140] p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 animate-zoom-in-95">
              <h3 className="text-xl font-bold mb-3">
                {actionType === 'cancel' ? 'Cancel Subscription?' : `${actionType === 'upgrade' ? 'Upgrade' : 'Change'} Plan?`}
              </h3>
              <p className="text-gray-600 mb-6">
                {actionType === 'cancel'
                  ? 'Your subscription will remain active until the end of your billing period.'
                  : `You're about to ${actionType} to the ${PLANS.find(p => p.id === selectedPlan)?.name} plan.`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setActionType(null);
                    setSelectedPlan(subscription?.plan || 'free');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold transition ${
                    actionType === 'cancel'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageSubscriptionModal;

/**
 * Points Marketplace Component
 * Interface for businesses to spend points on premium features and services
 */

import React, { useState, useEffect } from 'react';
import {
  getMarketplaceProducts,
  purchaseProduct,
  getActivePurchases,
  convertPointsToCredits,
  getPointsAnalytics,
  getPointsTransactions
} from '../services/pointsMarketplaceService';
import {
  PointsProduct,
  PointsPurchase,
  PointsTransaction,
  PointsProductCategory,
  POINTS_CONVERSION_RATES
} from '../types/pointsMarketplace';
import {
  Coins,
  ShoppingBag,
  TrendingUp,
  Zap,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  DollarSign,
  History
} from 'lucide-react';

interface PointsMarketplaceProps {
  businessId: string;
  businessName: string;
  currentPoints: number;
  onPointsChange?: () => void;
}

export const PointsMarketplace: React.FC<PointsMarketplaceProps> = ({
  businessId,
  businessName,
  currentPoints,
  onPointsChange
}) => {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'my-purchases' | 'analytics'>('marketplace');
  const [products, setProducts] = useState<PointsProduct[]>([]);
  const [purchases, setPurchases] = useState<PointsPurchase[]>([]);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<PointsProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [conversionAmount, setConversionAmount] = useState('');

  useEffect(() => {
    loadData();
  }, [businessId]);

  const loadData = async () => {
    const productsData = getMarketplaceProducts();
    setProducts(productsData);

    const purchasesData = await getActivePurchases(businessId);
    setPurchases(purchasesData);

    const analyticsData = await getPointsAnalytics(businessId);
    setAnalytics(analyticsData);

    const transactionsData = await getPointsTransactions(businessId, 20);
    setTransactions(transactionsData);
  };

  const handlePurchase = async (product: PointsProduct) => {
    if (currentPoints < product.pointsCost) {
      alert(`Insufficient points. You have ${currentPoints}, need ${product.pointsCost}`);
      return;
    }

    if (!confirm(`Purchase "${product.name}" for ${product.pointsCost} points?`)) {
      return;
    }

    setLoading(true);
    const result = await purchaseProduct(businessId, businessName, product.id);
    
    if (result.success) {
      alert(`✅ Successfully purchased ${product.name}!`);
      await loadData();
      if (onPointsChange) onPointsChange();
    } else {
      alert(`❌ ${result.error}`);
    }
    
    setLoading(false);
    setSelectedProduct(null);
  };

  const handleConversion = async () => {
    const amount = parseInt(conversionAmount);
    
    if (isNaN(amount) || amount < POINTS_CONVERSION_RATES.MINIMUM_CONVERSION) {
      alert(`Minimum conversion is ${POINTS_CONVERSION_RATES.MINIMUM_CONVERSION} points`);
      return;
    }

    if (amount > currentPoints) {
      alert(`Insufficient points. You have ${currentPoints}`);
      return;
    }

    const creditAmount = amount / POINTS_CONVERSION_RATES.POINTS_TO_USD;
    
    if (!confirm(`Convert ${amount} points to $${creditAmount.toFixed(2)} subscription credits?`)) {
      return;
    }

    setLoading(true);
    const result = await convertPointsToCredits(businessId, businessName, amount);
    
    if (result.success) {
      alert(`✅ Converted ${amount} points to $${result.creditAmount?.toFixed(2)} credits!`);
      setShowConversionModal(false);
      setConversionAmount('');
      await loadData();
      if (onPointsChange) onPointsChange();
    } else {
      alert(`❌ ${result.error}`);
    }
    
    setLoading(false);
  };

  const getCategoryIcon = (category: PointsProductCategory) => {
    switch (category) {
      case PointsProductCategory.VISIBILITY:
        return '🚀';
      case PointsProductCategory.PREMIUM_FEATURES:
        return '⭐';
      case PointsProductCategory.ANALYTICS:
        return '📊';
      case PointsProductCategory.MISSION_BOOST:
        return '🎯';
      case PointsProductCategory.SUBSCRIPTION_CREDIT:
        return '💰';
      case PointsProductCategory.B2B_SERVICES:
        return '🤝';
      default:
        return '🛍️';
    }
  };

  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, PointsProduct[]>);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with Points Balance */}
      <div className="bg-gradient-to-r from-[#6C4BFF] to-[#00E5FF] rounded-2xl md:rounded-3xl p-4 md:p-8 text-white mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">Points Marketplace</h1>
            <p className="text-white/80 text-sm md:text-base">Spend your points on premium features and benefits</p>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <div className="text-xs md:text-sm text-white/80 mb-1">Your Balance</div>
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6 md:w-8 md:h-8" />
              <span className="text-2xl md:text-4xl font-bold">{currentPoints.toLocaleString()}</span>
            </div>
            <button
              onClick={() => setShowConversionModal(true)}
              className="mt-2 md:mt-3 text-xs md:text-sm bg-white/20 hover:bg-white/30 px-3 md:px-4 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              💱 Convert to Credits
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 md:gap-2 mb-6 border-b border-gray-200 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`px-3 md:px-6 py-2 md:py-3 font-semibold transition-colors text-sm md:text-base whitespace-nowrap flex-shrink-0 ${
            activeTab === 'marketplace'
              ? 'text-[#6C4BFF] border-b-2 border-[#6C4BFF]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 inline mr-1 md:mr-2" />
          <span className="hidden sm:inline">Marketplace</span>
          <span className="sm:hidden">Shop</span>
        </button>
        <button
          onClick={() => setActiveTab('my-purchases')}
          className={`px-3 md:px-6 py-2 md:py-3 font-semibold transition-colors text-sm md:text-base whitespace-nowrap flex-shrink-0 ${
            activeTab === 'my-purchases'
              ? 'text-[#6C4BFF] border-b-2 border-[#6C4BFF]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckCircle className="w-4 h-4 md:w-5 md:h-5 inline mr-1 md:mr-2" />
          <span className="hidden sm:inline">My Purchases ({purchases.length})</span>
          <span className="sm:hidden">Mine ({purchases.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3 md:px-6 py-2 md:py-3 font-semibold transition-colors text-sm md:text-base whitespace-nowrap flex-shrink-0 ${
            activeTab === 'analytics'
              ? 'text-[#6C4BFF] border-b-2 border-[#6C4BFF]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <TrendingUp className="w-4 h-4 md:w-5 md:h-5 inline mr-1 md:mr-2" />
          Analytics
        </button>
      </div>

      {/* Marketplace Tab */}
      {activeTab === 'marketplace' && (
        <div className="space-y-6 md:space-y-8">
          {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
            <div key={category}>
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                <span className="text-xl md:text-2xl">{getCategoryIcon(category as PointsProductCategory)}</span>
                <span className="text-sm md:text-base">{category.replace(/_/g, ' ')}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {categoryProducts.map(product => (
                  <div
                    key={product.id}
                    className={`bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border-2 transition-all hover:shadow-lg ${
                      product.popular
                        ? 'border-[#00E5FF] relative'
                        : 'border-gray-200 hover:border-[#6C4BFF]'
                    }`}
                  >
                    {product.popular && (
                      <div className="absolute -top-2 md:-top-3 left-3 md:left-4 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white text-[10px] md:text-xs font-bold px-2 md:px-3 py-0.5 md:py-1 rounded-full">
                        ⭐ POPULAR
                      </div>
                    )}
                    
                    <div className="text-3xl md:text-4xl mb-2 md:mb-3">{product.icon}</div>
                    <h3 className="text-base md:text-lg font-bold text-gray-800 mb-1 md:mb-2">{product.name}</h3>
                    <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">{product.description}</p>
                    
                    <div className="mb-4">
                      <div className="text-sm text-gray-500 mb-2">Benefits:</div>
                      <ul className="space-y-1">
                        {product.benefits.slice(0, 3).map((benefit, idx) => (
                          <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-gray-100">
                      <div>
                        <div className="flex items-center gap-1 text-lg md:text-xl font-bold text-[#6C4BFF]">
                          <Coins className="w-4 h-4 md:w-5 md:h-5" />
                          {product.pointsCost}
                        </div>
                        {product.duration && (
                          <div className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {product.duration}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handlePurchase(product)}
                        disabled={loading || currentPoints < product.pointsCost}
                        className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-semibold text-xs md:text-sm transition-all whitespace-nowrap ${
                          currentPoints < product.pointsCost
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white hover:shadow-lg'
                        }`}
                      >
                        {currentPoints < product.pointsCost ? 'Need More' : 'Purchase'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Purchases Tab */}
      {activeTab === 'my-purchases' && (
        <div className="space-y-3 md:space-y-4">
          {purchases.length === 0 ? (
            <div className="text-center py-12 md:py-16 bg-gray-50 rounded-2xl">
              <ShoppingBag className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
              <h3 className="text-base md:text-lg font-semibold text-gray-600 mb-2">No purchases yet</h3>
              <p className="text-sm md:text-base text-gray-500 mb-4 md:mb-6 px-4">Start spending points to unlock premium features!</p>
              <button
                onClick={() => setActiveTab('marketplace')}
                className="bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold hover:shadow-lg transition-all text-sm md:text-base"
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            purchases.map(purchase => (
              <div key={purchase.id} className="bg-white rounded-xl p-4 md:p-6 border border-gray-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 mb-1 text-sm md:text-base truncate">{purchase.productName}</h3>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Coins className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                        {purchase.pointsSpent} pts
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                        {purchase.purchasedAt.toLocaleDateString()}
                      </span>
                      {purchase.expiresAt && (
                        <span className="flex items-center gap-1 text-[10px] md:text-xs">
                          Exp: {purchase.expiresAt.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-bold whitespace-nowrap flex-shrink-0 ${
                    purchase.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {purchase.status}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-4 md:space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3 opacity-80" />
              <div className="text-2xl md:text-3xl font-bold mb-1">{analytics.totalEarned.toLocaleString()}</div>
              <div className="text-xs md:text-sm opacity-90">Total Earned</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
              <ShoppingBag className="w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3 opacity-80" />
              <div className="text-2xl md:text-3xl font-bold mb-1">{analytics.totalSpent.toLocaleString()}</div>
              <div className="text-xs md:text-sm opacity-90">Total Spent</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
              <DollarSign className="w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3 opacity-80" />
              <div className="text-2xl md:text-3xl font-bold mb-1">{analytics.totalConverted.toLocaleString()}</div>
              <div className="text-xs md:text-sm opacity-90">Converted to Credits</div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm md:text-base">
                <History className="w-4 h-4 md:w-5 md:h-5" />
                Recent Transactions
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <div className="px-4 md:px-6 py-6 md:py-8 text-center text-gray-500 text-sm md:text-base">
                  No transactions yet
                </div>
              ) : (
                transactions.map(txn => (
                  <div key={txn.id} className="px-4 md:px-6 py-3 md:py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 text-sm md:text-base truncate">{txn.description}</div>
                        <div className="text-[10px] md:text-xs text-gray-500 mt-1">
                          {txn.timestamp.toLocaleString()}
                        </div>
                      </div>
                      <div className={`text-base md:text-lg font-bold whitespace-nowrap ${
                        txn.type === 'EARN' ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {txn.type === 'EARN' ? '+' : ''}{txn.amount}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conversion Modal */}
      {showConversionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Convert Points to Credits</h2>
            <p className="text-gray-600 mb-6">
              Exchange your points for subscription credits that can be applied to any subscription plan.
            </p>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="text-sm text-gray-600 mb-2">Conversion Rate</div>
              <div className="text-lg font-bold text-gray-800">
                {POINTS_CONVERSION_RATES.POINTS_TO_USD} points = $1.00 USD
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Min: {POINTS_CONVERSION_RATES.MINIMUM_CONVERSION} points | 
                Max per month: {POINTS_CONVERSION_RATES.MAXIMUM_MONTHLY_CONVERSION} points
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Points Amount
              </label>
              <input
                type="number"
                value={conversionAmount}
                onChange={(e) => setConversionAmount(e.target.value)}
                placeholder={`Min ${POINTS_CONVERSION_RATES.MINIMUM_CONVERSION}`}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6C4BFF] focus:border-transparent"
              />
              {conversionAmount && !isNaN(parseInt(conversionAmount)) && (
                <div className="mt-2 text-sm text-gray-600">
                  = ${(parseInt(conversionAmount) / POINTS_CONVERSION_RATES.POINTS_TO_USD).toFixed(2)} credits
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConversionModal(false);
                  setConversionAmount('');
                }}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConversion}
                disabled={loading || !conversionAmount}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Converting...' : 'Convert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsMarketplace;

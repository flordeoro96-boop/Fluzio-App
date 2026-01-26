import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Users, AlertCircle, DollarSign, Zap } from 'lucide-react';
import { 
  calculateCustomerCLV, 
  getRetentionAlerts, 
  segmentCustomers,
  CustomerProfile,
  RetentionAlert 
} from '../services/customerLifetimeValueService';
import { getPricingSummary } from '../services/dynamicPricingService';

interface BusinessIntelligenceWidgetProps {
  businessId: string;
}

/**
 * Business Intelligence Dashboard Widget
 * Shows key metrics, CLV insights, and pricing recommendations
 * Simple drop-in component for business dashboards
 */
export const BusinessIntelligenceWidget: React.FC<BusinessIntelligenceWidgetProps> = ({
  businessId
}) => {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<RetentionAlert[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [pricingSummary, setPricingSummary] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'pricing'>('overview');

  useEffect(() => {
    loadIntelligence();
  }, [businessId]);

  const loadIntelligence = async () => {
    try {
      setLoading(true);
      
      // Load retention alerts
      const alertsData = await getRetentionAlerts(businessId);
      setAlerts(alertsData.filter(a => a.urgency === 'CRITICAL' || a.urgency === 'HIGH').slice(0, 5));
      
      // Load customer segments
      const segmentsData = await segmentCustomers(businessId);
      setSegments(segmentsData);
      
      // Load pricing summary
      const pricingData = await getPricingSummary(businessId);
      setPricingSummary(pricingData);
      
    } catch (error) {
      console.error('[Business Intelligence] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Loading insights...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-bold text-gray-900">Smart Insights</h3>
        </div>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
          AI-Powered
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'overview'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'customers'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Customers
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'pricing'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pricing
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Alerts</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
              <p className="text-xs text-gray-600">Need attention</p>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">Segments</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{segments.length}</p>
              <p className="text-xs text-gray-600">Customer groups</p>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">Champions</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {segments.find(s => s.segment === 'Champions')?.count || 0}
              </p>
              <p className="text-xs text-gray-600">High-value</p>
            </div>
          </div>

          {/* Top Alerts */}
          {alerts.length > 0 && (
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Urgent Actions
              </h4>
              <div className="space-y-2">
                {alerts.slice(0, 3).map((alert, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {alert.userName} ({alert.tier})
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{alert.issue}</p>
                      <p className="text-xs text-purple-600 font-medium mt-1">
                        → {alert.suggestedAction}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      alert.urgency === 'CRITICAL' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {alert.urgency}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Customer Segments</h4>
          {segments.map((segment, index) => (
            <div key={index} className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-gray-900">{segment.segment}</h5>
                <span className="text-sm font-bold text-purple-600">
                  {segment.count} customers
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Avg CLV: <span className="font-semibold">{Math.round(segment.avgLifetimeValue)}</span>
              </p>
              <div className="space-y-1">
                <p className="text-xs text-gray-700 font-medium">Suggested Actions:</p>
                {segment.suggestedActions.slice(0, 2).map((action: string, i: number) => (
                  <p key={i} className="text-xs text-gray-600">• {action}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pricing Tab */}
      {activeTab === 'pricing' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-gray-900">Mission Pricing Insights</h4>
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {pricingSummary}
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={loadIntelligence}
        className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
      >
        Refresh Insights
      </button>
    </div>
  );
};

export default BusinessIntelligenceWidget;

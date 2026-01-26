/**
 * ShopifyConnectionCard Component
 * 
 * Easy one-click Shopify store connection for businesses.
 * Simply enter store URL to connect.
 */

import React, { useState } from 'react';
import { ShoppingBag, ExternalLink, Check, AlertCircle, X } from 'lucide-react';
import { api } from '../services/AuthContext';

interface ShopifyConnectionCardProps {
  businessId: string;
  currentShopify?: {
    connected: boolean;
    storeUrl?: string;
    storeName?: string;
    connectedAt?: string;
    trackingEnabled?: boolean;
  };
  onUpdate?: () => void;
}

export const ShopifyConnectionCard: React.FC<ShopifyConnectionCardProps> = ({
  businessId,
  currentShopify,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [storeUrl, setStoreUrl] = useState(currentShopify?.storeUrl || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = currentShopify?.connected || false;

  const validateShopifyUrl = (url: string): { valid: boolean; cleanUrl: string; storeName: string } => {
    let cleanUrl = url.trim().toLowerCase();
    
    // Remove protocol if present
    cleanUrl = cleanUrl.replace(/^https?:\/\//, '');
    
    // Remove trailing slash
    cleanUrl = cleanUrl.replace(/\/$/, '');
    
    // Check if it's a valid Shopify URL
    const shopifyPattern = /^([a-z0-9-]+)(\.myshopify\.com)?$/;
    const match = cleanUrl.match(shopifyPattern);
    
    if (!match) {
      return { valid: false, cleanUrl: '', storeName: '' };
    }
    
    const storeName = match[1];
    const finalUrl = `${storeName}.myshopify.com`;
    
    return { valid: true, cleanUrl: finalUrl, storeName };
  };

  const handleConnect = async () => {
    setError(null);
    
    if (!storeUrl) {
      setError('Please enter your Shopify store URL');
      return;
    }

    const validation = validateShopifyUrl(storeUrl);
    
    if (!validation.valid) {
      setError('Invalid Shopify URL. Enter your store name or full URL (e.g., mystore.myshopify.com)');
      return;
    }

    setSaving(true);
    try {
      await api.updateUser(businessId, {
        shopify: {
          connected: true,
          storeUrl: validation.cleanUrl,
          storeName: validation.storeName,
          connectedAt: new Date().toISOString(),
          trackingEnabled: true
        }
      });

      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error connecting Shopify:', err);
      setError('Failed to connect Shopify. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect your Shopify store? Visit tracking missions will stop working.')) {
      return;
    }

    setSaving(true);
    try {
      await api.updateUser(businessId, {
        shopify: {
          connected: false,
          storeUrl: '',
          storeName: '',
          trackingEnabled: false
        }
      });

      setStoreUrl('');
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error disconnecting Shopify:', err);
      setError('Failed to disconnect. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTracking = async () => {
    setSaving(true);
    try {
      await api.updateUser(businessId, {
        shopify: {
          ...currentShopify,
          trackingEnabled: !currentShopify?.trackingEnabled
        }
      });

      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error toggling tracking:', err);
      setError('Failed to update tracking settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            isConnected ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            <ShoppingBag className={`w-6 h-6 ${
              isConnected ? 'text-green-600' : 'text-gray-400'
            }`} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Shopify Store</h3>
            <p className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Not connected'}
            </p>
          </div>
        </div>
        
        {isConnected && (
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Check className="w-3 h-3" />
            Connected
          </div>
        )}
      </div>

      {/* Connected State */}
      {isConnected && !isEditing && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Store URL</span>
              <a
                href={`https://${currentShopify?.storeUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
              >
                Visit Store
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-gray-900 font-mono text-sm">
              {currentShopify?.storeUrl}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Connected {new Date(currentShopify?.connectedAt || '').toLocaleDateString()}
            </p>
          </div>

          {/* Tracking Toggle */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 text-sm">Visit Tracking</p>
              <p className="text-xs text-gray-600">Allow Fluzio to track store visits from missions</p>
            </div>
            <button
              onClick={handleToggleTracking}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                currentShopify?.trackingEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  currentShopify?.trackingEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
            >
              Change Store
            </button>
            <button
              onClick={handleDisconnect}
              disabled={saving}
              className="flex-1 py-2 px-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      {/* Disconnected or Editing State */}
      {(!isConnected || isEditing) && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shopify Store URL
            </label>
            <input
              type="text"
              value={storeUrl}
              onChange={(e) => {
                setStoreUrl(e.target.value);
                setError(null);
              }}
              placeholder="mystore.myshopify.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter your store name or full Shopify URL
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">How it works:</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Create "Visit Store" missions in Fluzio</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Customers click and visit your Shopify store</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Track visits and earn engagement analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Reward customers with points for browsing</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isEditing && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  setStoreUrl(currentShopify?.storeUrl || '');
                  setError(null);
                }}
                className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleConnect}
              disabled={saving || !storeUrl}
              className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Connecting...
                </span>
              ) : (
                'Connect Shopify Store'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

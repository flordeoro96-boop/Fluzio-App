import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/AuthContext';
import { Check, X, Sparkles } from 'lucide-react';

interface PreferencesManagerProps {
  user: User;
  onSave: () => void;
}

// Customer reward interests - what they want to GET
const CUSTOMER_REWARD_INTERESTS = [
  { id: 'free_food', label: 'Free Food & Drinks', icon: '🍔', desc: 'Meals, snacks, coffee' },
  { id: 'discounts', label: 'Discounts & Deals', icon: '🏷️', desc: 'Coupons and special offers' },
  { id: 'fashion', label: 'Fashion & Clothing', icon: '👕', desc: 'Clothes, shoes, accessories' },
  { id: 'beauty', label: 'Beauty Products', icon: '💄', desc: 'Makeup, skincare, haircare' },
  { id: 'jewelry', label: 'Jewelry & Accessories', icon: '💎', desc: 'Rings, necklaces, watches' },
  { id: 'tech', label: 'Tech & Gadgets', icon: '📱', desc: 'Electronics, accessories' },
  { id: 'fitness', label: 'Fitness & Wellness', icon: '🏋️', desc: 'Gym passes, supplements' },
  { id: 'home', label: 'Home & Lifestyle', icon: '🏠', desc: 'Decor, furniture, tools' },
  { id: 'pet', label: 'Pet Products', icon: '🐾', desc: 'Pet food, toys, supplies' },
  { id: 'experiences', label: 'Experiences', icon: '🎟️', desc: 'Events, classes, activities' },
  { id: 'gift_cards', label: 'Gift Cards', icon: '🎁', desc: 'Store credit and vouchers' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', desc: 'Movies, games, books' }
];

// Business goals - what they want to ACHIEVE
const BUSINESS_GOALS = [
  { id: 'more_followers', label: 'More Social Followers', icon: '📈', desc: 'Grow Instagram, TikTok, Twitter' },
  { id: 'foot_traffic', label: 'Foot Traffic', icon: '🚶', desc: 'More customers visiting location' },
  { id: 'online_sales', label: 'Online Sales', icon: '🛒', desc: 'Increase e-commerce revenue' },
  { id: 'brand_awareness', label: 'Brand Awareness', icon: '📢', desc: 'Get known in the community' },
  { id: 'reviews', label: 'Reviews & Ratings', icon: '⭐', desc: 'Build trust and credibility' },
  { id: 'ugc', label: 'User Content', icon: '📸', desc: 'Photos, videos, testimonials' },
  { id: 'email_list', label: 'Email Subscribers', icon: '📧', desc: 'Build marketing list' },
  { id: 'events', label: 'Event Attendance', icon: '🎉', desc: 'Fill workshops and meetups' },
  { id: 'loyalty', label: 'Customer Loyalty', icon: '💝', desc: 'Repeat customers' },
  { id: 'partnerships', label: 'Collaborations', icon: '🤝', desc: 'Work with creators' },
  { id: 'product_testing', label: 'Product Feedback', icon: '🧪', desc: 'Test new products' },
  { id: 'local_buzz', label: 'Local Buzz', icon: '🔥', desc: 'Word-of-mouth marketing' }
];

export const PreferencesManager: React.FC<PreferencesManagerProps> = ({ user, onSave }) => {
  const isCustomer = user.role !== 'BUSINESS';
  const interests = isCustomer ? CUSTOMER_REWARD_INTERESTS : BUSINESS_GOALS;
  
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load existing preferences from user.vibe or user.vibeTags
    const existing = user.vibeTags || user.vibe || [];
    setSelectedItems(Array.isArray(existing) ? existing : []);
  }, [user]);

  const toggleItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateUser(user.id, {
        vibeTags: selectedItems,
        vibe: selectedItems
      });
      onSave();
      alert('✅ Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('❌ Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#1E0E62]">
            {isCustomer ? 'What Rewards Do You Want?' : 'What Are Your Goals?'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {isCustomer 
              ? 'This helps us show you missions and rewards you\'ll love'
              : 'This helps us match you with the right customers and creators'
            }
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || selectedItems.length < 3}
          className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${
            selectedItems.length >= 3
              ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving...' : 'Save Changes'}
          {selectedItems.length >= 3 && <Check className="w-4 h-4" />}
        </button>
      </div>

      {selectedItems.length < 3 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              Select at least 3 {isCustomer ? 'interests' : 'goals'}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              You currently have {selectedItems.length} selected. Need {3 - selectedItems.length} more.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {interests.map(item => {
          const isSelected = selectedItems.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`p-4 rounded-xl border-2 transition-all text-left relative ${
                isSelected
                  ? isCustomer
                    ? 'border-[#00E5FF] bg-gradient-to-br from-pink-50 to-purple-50 shadow-md'
                    : 'border-[#6C4BFF] bg-gradient-to-br from-purple-50 to-indigo-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {isSelected && (
                <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                  isCustomer ? 'bg-[#00E5FF]' : 'bg-[#6C4BFF]'
                }`}>
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="text-3xl mb-2">{item.icon}</div>
              <div className={`text-sm font-bold mb-1 ${isSelected ? (isCustomer ? 'text-[#00E5FF]' : 'text-[#6C4BFF]') : 'text-[#1E0E62]'}`}>
                {item.label}
              </div>
              <div className="text-xs text-gray-500">{item.desc}</div>
            </button>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-bold text-blue-900 mb-2">💡 How This Helps You:</h4>
        <ul className="text-xs text-blue-800 space-y-1.5 ml-4 list-disc">
          {isCustomer ? (
            <>
              <li>We'll prioritize missions that reward you with what you actually want</li>
              <li>Get personalized notifications about relevant rewards</li>
              <li>Better matches with businesses offering your favorite products</li>
            </>
          ) : (
            <>
              <li>We'll match you with customers interested in what you offer</li>
              <li>Mission templates tailored to your specific goals</li>
              <li>Analytics focused on metrics you care about</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

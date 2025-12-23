/**
 * Creator Context Bar
 * Subtle persistent context showing creator roles and city
 * Reinforces "This feed is made for me"
 */

import React from 'react';
import { User } from '../types';
import { MapPin, Briefcase } from 'lucide-react';

interface CreatorContextBarProps {
  user: User;
}

export const CreatorContextBar: React.FC<CreatorContextBarProps> = ({ user }) => {
  const roles = user.creator?.roles || [];
  const city = user.creator?.city || user.currentCity || 'Unknown';

  if (roles.length === 0) return null;

  // Format role names (capitalize, remove underscores)
  const formatRole = (role: string) => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl px-4 py-2.5 mb-4 border border-purple-100/50">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {/* Roles */}
        <div className="flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-purple-600" />
          <span className="text-gray-600 font-medium">
            {roles.map(formatRole).join(' · ')}
          </span>
        </div>
        
        {/* Divider */}
        <div className="w-px h-4 bg-purple-200" />
        
        {/* City */}
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-purple-600" />
          <span className="text-gray-600 font-medium">
            {city}
          </span>
        </div>
      </div>
    </div>
  );
};

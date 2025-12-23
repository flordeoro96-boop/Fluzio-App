/**
 * Verified Badge Component
 * Display verified badge on business profiles
 */

import React from 'react';
import { Award, Shield, CheckCircle } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  verifiedAt?: Date;
  businessName?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'md',
  showLabel = false,
  verifiedAt,
  businessName
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const containerClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`inline-flex items-center gap-2 ${containerClasses[size]}`}>
      <div 
        className="relative group cursor-pointer"
        title={`Verified Business${businessName ? ': ' + businessName : ''}`}
      >
        {/* Badge Icon */}
        <div className={`${sizeClasses[size]} relative`}>
          <Shield className="w-full h-full text-blue-600 fill-blue-100" />
          <CheckCircle className="w-1/2 h-1/2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          <div className="font-semibold mb-1">✓ Verified Business</div>
          {businessName && (
            <div className="text-gray-300 mb-1">{businessName}</div>
          )}
          {verifiedAt && (
            <div className="text-gray-400">
              Since {new Date(verifiedAt).toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
              })}
            </div>
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
        </div>
      </div>

      {/* Label */}
      {showLabel && (
        <span className="font-semibold text-blue-600">
          Verified
        </span>
      )}
    </div>
  );
};

// Animated version for special occasions (e.g., just approved)
export const AnimatedVerifiedBadge: React.FC<VerifiedBadgeProps> = (props) => {
  return (
    <div className="inline-flex items-center gap-2">
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 animate-ping">
          <Shield className="w-full h-full text-blue-400 opacity-50" />
        </div>
        
        {/* Main badge */}
        <VerifiedBadge {...props} />
      </div>

      {props.showLabel && (
        <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
          Verified ✨
        </span>
      )}
    </div>
  );
};

export default VerifiedBadge;

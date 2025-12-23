import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-gray-200';
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Pre-built skeleton patterns
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-xl p-4 border border-gray-100 ${className}`}>
    <div className="flex items-start gap-3 mb-3">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
      </div>
    </div>
    <Skeleton variant="rounded" className="w-full h-32 mb-3" />
    <div className="flex gap-2">
      <Skeleton variant="rounded" className="flex-1 h-8" />
      <Skeleton variant="rounded" className="flex-1 h-8" />
    </div>
  </div>
);

export const SkeletonMissionCard: React.FC = () => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
    <div className="flex items-start gap-3 mb-3">
      <Skeleton variant="circular" width={56} height={56} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-2/3 h-5" />
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-3/4" />
      </div>
    </div>
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <Skeleton variant="rounded" className="w-16 h-6" />
        <Skeleton variant="rounded" className="w-20 h-6" />
      </div>
      <Skeleton variant="rounded" className="w-24 h-8" />
    </div>
  </div>
);

export const SkeletonBusinessCard: React.FC = () => (
  <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
    <Skeleton variant="rectangular" className="w-full h-40" />
    <div className="p-4 space-y-3">
      <Skeleton variant="text" className="w-3/4 h-6" />
      <Skeleton variant="text" className="w-full" />
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" width={20} height={20} />
        <Skeleton variant="text" className="w-32" />
      </div>
      <div className="flex gap-2">
        <Skeleton variant="rounded" className="flex-1 h-9" />
        <Skeleton variant="rounded" className="flex-1 h-9" />
      </div>
    </div>
  </div>
);

export const SkeletonList: React.FC<{ count?: number; type?: 'mission' | 'business' | 'card' }> = ({ 
  count = 3, 
  type = 'card' 
}) => {
  const SkeletonComponent = 
    type === 'mission' ? SkeletonMissionCard :
    type === 'business' ? SkeletonBusinessCard :
    SkeletonCard;

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
};

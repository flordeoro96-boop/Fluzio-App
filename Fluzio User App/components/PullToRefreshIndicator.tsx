import { Loader2 } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  threshold: number;
  isRefreshing: boolean;
}

export const PullToRefreshIndicator = ({
  pullDistance,
  threshold,
  isRefreshing
}: PullToRefreshIndicatorProps) => {
  const progress = Math.min(pullDistance / threshold, 1);
  const opacity = Math.min(progress * 1.5, 1);
  const scale = 0.5 + (progress * 0.5);

  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-50"
      style={{
        transform: `translateY(${pullDistance}px)`,
        transition: isRefreshing ? 'transform 0.3s ease-out' : 'none'
      }}
    >
      <div
        className="bg-white rounded-full shadow-lg p-2 flex items-center justify-center"
        style={{
          opacity,
          transform: `scale(${scale})`,
          transition: 'opacity 0.2s, transform 0.2s'
        }}
      >
        <Loader2
          className={`w-6 h-6 text-purple-600 ${isRefreshing ? 'animate-spin' : ''}`}
          style={{
            transform: isRefreshing ? 'none' : `rotate(${progress * 360}deg)`,
            transition: isRefreshing ? 'none' : 'transform 0.1s'
          }}
        />
      </div>
    </div>
  );
};

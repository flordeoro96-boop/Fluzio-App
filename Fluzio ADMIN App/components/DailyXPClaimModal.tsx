import React, { useState, useEffect } from 'react';
import { Flame, Zap, Trophy, Star, Sparkles, X } from 'lucide-react';

interface DailyXPClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaim: () => Promise<{
    success: boolean;
    streak?: number;
    pointsAwarded?: number;
    breakdown?: {
      basePoints: number;
      streakBonus: number;
      milestoneBonus: number;
    };
    milestoneReached?: boolean;
    alreadyClaimed?: boolean;
    message?: string;
  }>;
  currentStreak: number;
  canClaim: boolean;
}

export const DailyXPClaimModal: React.FC<DailyXPClaimModalProps> = ({
  isOpen,
  onClose,
  onClaim,
  currentStreak,
  canClaim
}) => {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(0);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [milestoneReached, setMilestoneReached] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setClaimed(false);
      setXpAwarded(0);
      setBreakdown(null);
      setMilestoneReached(false);
      setShowConfetti(false);
    }
  }, [isOpen]);

  const handleClaim = async () => {
    if (claiming || !canClaim) return;
    
    setClaiming(true);
    try {
      const result = await onClaim();
      
      if (result.success) {
        setXpAwarded(result.pointsAwarded || 0);
        setBreakdown(result.breakdown);
        setMilestoneReached(result.milestoneReached || false);
        setClaimed(true);
        setShowConfetti(true);
        
        // Auto close after 3 seconds
        setTimeout(() => {
          onClose();
          // Refresh page to show updated points
          window.location.reload();
        }, 3000);
      } else if (result.alreadyClaimed) {
        onClose();
      }
    } catch (error) {
      console.error('Error claiming XP:', error);
    } finally {
      setClaiming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Confetti Animation */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '-10px',
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </div>
              ))}
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Content */}
          <div className="p-8 text-center text-white relative z-10">
            {!claimed ? (
              <>
                {/* Streak Fire Icon */}
                <div className="mb-6 relative inline-block">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
                  <div className="relative bg-white/20 backdrop-blur-sm rounded-full p-6 inline-block">
                    <Flame className="w-20 h-20 text-orange-300 animate-bounce" />
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-4xl font-black mb-2">
                  {currentStreak} Day Streak! 🔥
                </h2>
                <p className="text-xl text-white/90 mb-8">
                  Keep the momentum going!
                </p>

                {/* Preview Points */}
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Zap className="w-8 h-8 text-yellow-300" />
                    <span className="text-5xl font-black">
                      {10 + Math.min(currentStreak, 30)}
                    </span>
                    <span className="text-2xl text-white/80">XP</span>
                  </div>
                  <p className="text-sm text-white/70">
                    Base: 10 XP + Streak Bonus: {Math.min(currentStreak, 30)} XP
                  </p>
                </div>

                {/* Claim Button */}
                <button
                  onClick={handleClaim}
                  disabled={claiming || !canClaim}
                  className={`w-full py-5 rounded-2xl font-black text-xl transition-all transform ${
                    canClaim && !claiming
                      ? 'bg-white text-purple-600 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
                      : 'bg-white/30 text-white/60 cursor-not-allowed'
                  }`}
                >
                  {claiming ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Claiming...
                    </span>
                  ) : canClaim ? (
                    'CLAIM YOUR XP!'
                  ) : (
                    'Already Claimed Today'
                  )}
                </button>

                {/* Next Milestone */}
                {currentStreak < 100 && (
                  <div className="mt-6 text-sm text-white/70">
                    Next milestone at {Math.ceil((currentStreak + 1) / 7) * 7} days! 🎯
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Success Animation */}
                <div className="mb-6 relative inline-block">
                  <div className="absolute inset-0 bg-yellow-300/40 rounded-full blur-3xl animate-pulse"></div>
                  <div className="relative bg-white/20 backdrop-blur-sm rounded-full p-6 inline-block animate-bounce">
                    <Trophy className="w-20 h-20 text-yellow-300" />
                  </div>
                </div>

                {/* Success Title */}
                <h2 className="text-4xl font-black mb-2 animate-pulse">
                  {milestoneReached ? '🎉 MILESTONE!' : 'AMAZING!'}
                </h2>
                <p className="text-2xl text-white/90 mb-8">
                  You earned {xpAwarded} XP!
                </p>

                {/* Breakdown */}
                {breakdown && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Base XP:</span>
                      <span className="font-bold text-xl">+{breakdown.basePoints}</span>
                    </div>
                    {breakdown.streakBonus > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-white/80 flex items-center gap-2">
                          <Flame className="w-4 h-4 text-orange-300" />
                          Streak Bonus:
                        </span>
                        <span className="font-bold text-xl text-orange-300">+{breakdown.streakBonus}</span>
                      </div>
                    )}
                    {breakdown.milestoneBonus > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-white/80 flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-300" />
                          Milestone Bonus:
                        </span>
                        <span className="font-bold text-xl text-yellow-300">+{breakdown.milestoneBonus}</span>
                      </div>
                    )}
                    <div className="border-t border-white/30 pt-3 flex justify-between items-center">
                      <span className="font-bold text-lg">Total:</span>
                      <span className="font-black text-2xl text-yellow-300">{xpAwarded} XP</span>
                    </div>
                  </div>
                )}

                {/* Encouragement */}
                <p className="text-lg text-white/90">
                  Come back tomorrow to keep your streak alive! 💪
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confetti Animation Styles */}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </>
  );
};

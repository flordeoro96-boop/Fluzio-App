import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, TrendingUp, Users, Award, BarChart3, Zap, MousePointerClick, CheckCircle2, Gift, Target, Rocket } from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { doc, updateDoc } from '../services/firestoreCompat';
import { db } from '../services/apiService';

interface TourStep {
  title: string;
  subtitle?: string;
  description: string;
  icon: React.ReactNode;
  interactiveDemo?: React.ReactNode;
  quickWins?: string[];
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

// Interactive Demo Components (defined before use in tourSteps)
const MissionDemoCard = () => (
  <div className="bg-white rounded-xl p-4 border-2 border-[#00E5FF]/30 shadow-lg hover:shadow-xl transition-all cursor-pointer group">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
        <Award className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-gray-900 text-sm">⭐ Write a Review</h4>
        <p className="text-xs text-gray-500">Auto-complete • 100 points</p>
      </div>
      <div className="group-hover:scale-110 transition-transform">
        <div className="w-12 h-7 bg-[#00E5FF] rounded-full p-1 flex items-center justify-end">
          <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
        </div>
      </div>
    </div>
    <div className="text-xs text-gray-600 flex items-center gap-1">
      <CheckCircle2 className="w-3 h-3 text-green-500" />
      <span>3 customers completed today</span>
    </div>
  </div>
);

const AnalyticsDemoCard = () => (
  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border-2 border-purple-200">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-semibold text-purple-600 uppercase">Today's Activity</span>
      <TrendingUp className="w-4 h-4 text-green-500" />
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Mission Completions</span>
        <span className="text-lg font-bold text-purple-600">12</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">New Reviews</span>
        <span className="text-lg font-bold text-blue-600">5</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" style={{width: '68%'}} />
      </div>
      <p className="text-xs text-gray-500 text-center">68% to next level 🎯</p>
    </div>
  </div>
);

const CustomerCardDemo = () => (
  <div className="bg-white rounded-xl p-3 border-2 border-gray-200 hover:border-[#00E5FF] transition-all cursor-pointer">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
        JD
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-sm text-gray-900">Jane Doe</h4>
        <p className="text-xs text-gray-500">Completed 8 missions • 850 pts</p>
      </div>
      <div className="text-right">
        <div className="text-xs font-bold text-green-600">VIP</div>
        <div className="text-xs text-gray-400">Level 3</div>
      </div>
    </div>
  </div>
);

const tourSteps: TourStep[] = [
  {
    title: "Hey there! Welcome to Beevvy 👋",
    subtitle: "Let's grow your business together",
    description: "Think of Beevvy as your customer engagement superpower. We help you turn one-time visitors into loyal fans who keep coming back (and bringing their friends!).",
    icon: <Sparkles className="w-12 h-12 text-[#00E5FF]" />,
    quickWins: [
      "💰 Get more customers through gamified missions",
      "⭐ Build authentic reviews & social proof",
      "📊 Track what actually works with real-time data",
      "🎁 Reward loyalty without breaking the bank"
    ]
  },
  {
    title: "Your Dashboard = Your Command Center 📊",
    subtitle: "Everything important, in one place",
    description: "This is where the magic happens! See exactly what's working: which missions customers love, your latest reviews, and how close you are to leveling up.",
    icon: <BarChart3 className="w-12 h-12 text-purple-500" />,
    interactiveDemo: <AnalyticsDemoCard />,
    quickWins: [
      "See live customer activity as it happens",
      "Track mission performance in real-time",
      "Get AI insights from your reviews",
      "Monitor your growth progress"
    ]
  },
  {
    title: "Missions: Your Secret Weapon 🎯",
    subtitle: "Choose from 13 proven templates",
    description: "Missions are simple challenges that reward customers for helping your business grow. Want more reviews? More foot traffic? More social buzz? There's a mission for that!",
    icon: <Award className="w-12 h-12 text-yellow-500" />,
    interactiveDemo: <MissionDemoCard />,
    quickWins: [
      "⭐ Get Reviews - Build your reputation (100-150 pts)",
      "📍 Drive Visits - Fill your location (50 pts)",
      "💗 Grow Following - Expand your reach (50 pts)",
      "💰 Boost Sales - Increase purchases (200-500 pts)"
    ]
  },
  {
    title: "Everything Happens Inside Beevvy 🏠",
    subtitle: "No Instagram required!",
    description: "Here's the best part: customers complete everything right in our app. No more \"follow us on Instagram\" or external links. Everything auto-verifies instantly!",
    icon: <Zap className="w-12 h-12 text-blue-500" />,
    quickWins: [
      "✅ Follow Business → Instant verification",
      "✅ Write Review → Auto-approves after check-in",
      "✅ Share Photo → Posts to Beevvy feed",
      "✅ Check-In → GPS or QR code verified",
      "💡 No more chasing customers for proof!"
    ]
  },
  {
    title: "Know Your Customers Like Never Before 👥",
    subtitle: "Turn data into dollars",
    description: "See everyone who engages with your business. Track their journey, identify your VIPs, and reward your best customers before they go to a competitor.",
    icon: <Users className="w-12 h-12 text-pink-500" />,
    interactiveDemo: <CustomerCardDemo />,
    quickWins: [
      "Track each customer's lifetime value",
      "Spot your super fans and VIP customers",
      "Send targeted rewards to specific groups",
      "See what makes customers come back"
    ]
  },
  {
    title: "Rewards: Keep 'Em Coming Back 🎁",
    subtitle: "Digital or physical, you choose",
    description: "Customers earn points from missions and spend them on your rewards. Think discounts, freebies, or exclusive perks. You control everything: what rewards, how many points, and how many you have.",
    icon: <Gift className="w-12 h-12 text-green-500" />,
    quickWins: [
      "Offer: 500 points = $5 off next purchase",
      "Offer: 1000 points = Free appetizer",
      "Offer: 2000 points = VIP early access",
      "QR code prevents fraud at redemption"
    ]
  },
  {
    title: "Level Up & Unlock More Power 🚀",
    subtitle: "The more you engage, the more you unlock",
    description: "As customers complete your missions, YOU earn XP and level up! Higher levels = better features, advanced analytics, and more visibility on Beevvy.",
    icon: <Rocket className="w-12 h-12 text-orange-500" />,
    quickWins: [
      "🥉 Levels 1-5: Get started with basic missions",
      "🥈 Levels 6-10: Unlock advanced analytics & custom missions",
      "🥇 Levels 11+: Premium features & priority support",
      "Every mission completion = more XP for you!"
    ]
  },
  {
    title: "Ready to Start? Let's Do This! 🎊",
    subtitle: "Your first steps to success",
    description: "You're all set! Start with a simple mission, create your first reward, and watch the customers roll in. Need help? This tour is always available in Settings → Replay Tour.",
    icon: <Target className="w-12 h-12 text-[#00E5FF]" />,
    quickWins: [
      "✨ Try this: Activate 'Follow Business' mission",
      "🎁 Then create: '500 points = 10% off' reward",
      "📢 Share: Tell customers about your Beevvy rewards",
      "📊 Watch: Real-time updates in your dashboard"
    ]
  }
];

interface BusinessOnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BusinessOnboardingTour: React.FC<BusinessOnboardingTourProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const { user } = useAuth();

  const handleNext = () => {
    setHasInteracted(true);
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    // Mark tour as completed in Firestore
    if (user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          'onboarding.tourCompleted': true,
          'onboarding.tourCompletedAt': new Date().toISOString(),
          'onboarding.stepsCompleted': tourSteps.length
        });
      } catch (error) {
        console.error('Error marking tour as completed:', error);
      }
    }
    onClose();
  };

  const handleSkip = async () => {
    // Mark as skipped but allow replay
    if (user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          'onboarding.tourCompleted': true,
          'onboarding.tourSkipped': true,
          'onboarding.tourSkippedAt': new Date().toISOString(),
          'onboarding.stepsViewed': currentStep + 1
        });
      } catch (error) {
        console.error('Error marking tour as skipped:', error);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header with Gradient */}
        <div className="relative bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] p-6 text-white overflow-hidden">
          {/* Animated background circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-all z-10 group"
            aria-label="Close tour"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
          </button>

          {/* Progress Bar */}
          <div className="relative mb-6">
            <div className="flex gap-1">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    index <= currentStep ? 'bg-white shadow-lg' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
            <div className="mt-2 text-xs text-white/80 flex items-center justify-between">
              <span>Step {currentStep + 1} of {tourSteps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>

          {/* Icon and Title */}
          <div className="relative flex items-start gap-4 mb-2">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shrink-0 animate-in zoom-in duration-500">
              {step.icon}
            </div>
            <div className="flex-1 pt-2">
              <h2 className="text-2xl font-bold mb-1 animate-in slide-in-from-left duration-500">{step.title}</h2>
              {step.subtitle && (
                <p className="text-sm text-white/90 animate-in slide-in-from-left duration-500 delay-100">
                  {step.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 animate-in fade-in slide-in-from-bottom duration-500">
          {/* Main Description */}
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            {step.description}
          </p>

          {/* Interactive Demo */}
          {step.interactiveDemo && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <MousePointerClick className="w-4 h-4 text-[#00E5FF]" />
                <h3 className="font-bold text-gray-900 text-sm">Try it out (demo):</h3>
              </div>
              <div className="animate-in zoom-in duration-500 delay-200">
                {step.interactiveDemo}
              </div>
            </div>
          )}

          {/* Quick Wins */}
          {step.quickWins && step.quickWins.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-[#00E5FF]" />
                {currentStep === tourSteps.length - 1 ? 'Your Action Plan:' : 'Key Benefits:'}
              </h3>
              <div className="space-y-2">
                {step.quickWins.map((win, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 hover:border-blue-300 transition-all cursor-default group animate-in slide-in-from-left duration-500"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed flex-1">{win}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Encouraging Message */}
          {!hasInteracted && currentStep === 0 && (
            <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl animate-bounce">
              <p className="text-sm text-yellow-800 text-center font-medium">
                👆 Click "Next" to continue your journey!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors hover:underline"
            >
              {isLastStep ? 'Skip for now' : 'Skip tour'}
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-5 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:border-gray-400 hover:bg-gray-100 transition-all flex items-center gap-2 hover:scale-105"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}

              {!isLastStep ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 animate-pulse"
                >
                  <Rocket className="w-4 h-4" />
                  Let's Go!
                </button>
              )}
            </div>
          </div>

          {/* Progress indicator text */}
          <p className="text-xs text-gray-500 text-center">
            {isLastStep 
              ? "🎉 You're ready to succeed with Beevvy!" 
              : `${tourSteps.length - currentStep - 1} more ${tourSteps.length - currentStep - 1 === 1 ? 'step' : 'steps'} to go`
            }
          </p>
        </div>
      </div>
    </div>
  );
};

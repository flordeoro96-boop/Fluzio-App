import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Sparkles, Users, Briefcase, MapPin, MessageCircle, Trophy, Zap, Star, Gift, Calendar, Heart, Target, UserCircle } from 'lucide-react';
import { User } from '../types';

interface OnboardingModalProps {
  user: User;
  onComplete: () => void;
}

interface OnboardingSlide {
  icon: React.ReactNode;
  title: string;
  description: string;
  features?: string[];
  gradient: string;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ user, onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  // Determine user type and get appropriate slides
  const getOnboardingSlides = (): OnboardingSlide[] => {
    const isCreator = user.accountType === 'creator';
    const isBusiness = user.accountType === 'business' && !user.isAspiringBusiness;
    const isAspiringBusiness = user.role === 'BUSINESS' && user.isAspiringBusiness;
    const isCustomer = !user.accountType || user.role === 'MEMBER';

    if (isCreator) {
      return [
        {
          icon: <Sparkles className="w-16 h-16 text-white" />,
          title: "Welcome to Beevvy, Creator!",
          description: "Transform your creative talents into income by collaborating with businesses",
          gradient: "from-purple-500 to-pink-500",
        },
        {
          icon: <Briefcase className="w-16 h-16 text-white" />,
          title: "Find Opportunities",
          description: "Browse paid collaboration projects from businesses looking for creators like you",
          features: [
            "View project details and budgets upfront",
            "See transparent commission fees (12% or 8% with Creator Plus)",
            "Apply to projects that match your skills"
          ],
          gradient: "from-blue-500 to-cyan-500",
        },
        {
          icon: <Zap className="w-16 h-16 text-white" />,
          title: "Creator Plus Benefits",
          description: "Upgrade to Creator Plus for exclusive advantages",
          features: [
            "Reduced commission: 12% → 8% (save 33%)",
            "Priority matching with AI-powered recommendations",
            "Early access to new opportunities",
            "Advanced insights and faster payouts"
          ],
          gradient: "from-purple-600 to-pink-600",
        },
        {
          icon: <Users className="w-16 h-16 text-white" />,
          title: "Build Your Portfolio",
          description: "Showcase your work and connect with the creator community",
          features: [
            "Upload portfolio samples",
            "Set your skills and rates",
            "Chat with businesses and other creators",
            "Join project teams and grow your network"
          ],
          gradient: "from-indigo-500 to-purple-500",
        },
        {
          icon: <Trophy className="w-16 h-16 text-white" />,
          title: "You're All Set! 🎉",
          description: "Complete your profile and start applying to opportunities today",
          gradient: "from-green-500 to-emerald-500",
        }
      ];
    }

    if (isBusiness) {
      return [
        {
          icon: <Sparkles className="w-16 h-16 text-white" />,
          title: "Welcome to Beevvy, Business!",
          description: "Connect with talented creators and grow your business through authentic collaborations",
          gradient: "from-blue-500 to-indigo-500",
        },
        {
          icon: <Users className="w-16 h-16 text-white" />,
          title: "Hire Talented Creators",
          description: "Post collaboration projects and find the perfect creators for your brand",
          features: [
            "Create project opportunities with clear budgets",
            "Receive applications from skilled creators",
            "Review portfolios and chat before hiring",
            "Build your own creator team"
          ],
          gradient: "from-purple-500 to-pink-500",
        },
        {
          icon: <Gift className="w-16 h-16 text-white" />,
          title: "Engage Customers",
          description: "Create missions and rewards to bring customers to your business",
          features: [
            "Set up check-in missions with rewards",
            "Offer exclusive deals and promotions",
            "Track customer engagement",
            "Build loyalty with points and rewards"
          ],
          gradient: "from-orange-500 to-red-500",
        },
        {
          icon: <MessageCircle className="w-16 h-16 text-white" />,
          title: "Community & Network",
          description: "Connect with creators, customers, and other businesses",
          features: [
            "Chat with applicants and team members",
            "Join the business community",
            "Share updates and events",
            "Grow your local presence"
          ],
          gradient: "from-cyan-500 to-blue-500",
        },
        {
          icon: <Trophy className="w-16 h-16 text-white" />,
          title: "Let's Grow Together! 🎉",
          description: "Complete your business profile and start creating opportunities",
          gradient: "from-green-500 to-emerald-500",
        }
      ];
    }

    if (isAspiringBusiness) {
      return [
        {
          icon: <Sparkles className="w-16 h-16 text-white" />,
          title: "Welcome, Future Business Owner!",
          description: "You're planning to open a business. Beevvy is here to help you prepare!",
          gradient: "from-amber-500 to-orange-500",
        },
        {
          icon: <Star className="w-16 h-16 text-white" />,
          title: "Plan & Prepare",
          description: "Use Beevvy to research and plan your future business",
          features: [
            "Explore what other businesses are doing",
            "Learn about creator collaborations",
            "Connect with the business community",
            "Get inspired for your launch"
          ],
          gradient: "from-purple-500 to-indigo-500",
        },
        {
          icon: <Heart className="w-16 h-16 text-white" />,
          title: "Limited Access",
          description: "As an aspiring business, you have viewing access while you plan",
          features: [
            "Your profile is private (not shown to customers)",
            "You can browse and learn",
            "When ready, update your profile to launch!",
            "Contact support if you need help"
          ],
          gradient: "from-blue-500 to-cyan-500",
        },
        {
          icon: <Trophy className="w-16 h-16 text-white" />,
          title: "Good Luck! 🎉",
          description: "We can't wait to see your business come to life",
          gradient: "from-green-500 to-emerald-500",
        }
      ];
    }

    // Customer/Member
    return [
      {
        icon: <Sparkles className="w-16 h-16 text-white" />,
        title: "Welcome to Beevvy!",
        description: "Discover amazing local businesses and earn rewards while you explore",
        gradient: "from-blue-500 to-purple-500",
      },
      {
        icon: <MapPin className="w-16 h-16 text-white" />,
        title: "Discover Businesses",
        description: "Find and explore businesses near you",
        features: [
          "Browse on map or list view",
          "Filter by category and distance",
          "See photos, reviews, and details",
          "Save your favorites"
        ],
        gradient: "from-green-500 to-teal-500",
      },
      {
        icon: <Gift className="w-16 h-16 text-white" />,
        title: "Complete Missions",
        description: "Earn points and rewards by completing fun missions",
        features: [
          "Check in at businesses",
          "Complete social media challenges",
          "Attend events and meetups",
          "Redeem points for rewards"
        ],
        gradient: "from-orange-500 to-pink-500",
      },
      {
        icon: <Users className="w-16 h-16 text-white" />,
        title: "Join the Community",
        description: "Connect with others and share experiences",
        features: [
          "Chat with businesses",
          "Bring friends and earn bonuses",
          "Join events and activities",
          "Build your daily streak"
        ],
        gradient: "from-purple-500 to-indigo-500",
      },
      {
        icon: <Trophy className="w-16 h-16 text-white" />,
        title: "Start Exploring! 🎉",
        description: "Here's 100 bonus points to get you started!",
        gradient: "from-cyan-500 to-blue-500",
      }
    ];
  };

  const slides = getOnboardingSlides();
  const isLastSlide = currentSlide === slides.length - 1;
  const currentSlideData = slides[currentSlide];

  const handleNext = () => {
    if (isLastSlide) {
      setShowCelebration(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="absolute inset-0 flex items-center justify-center z-10 animate-fade-in">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-4xl font-bold text-white mb-2">Welcome to Beevvy!</h2>
            <p className="text-xl text-white/90">+100 Points Bonus</p>
          </div>
        </div>
      )}

      <div className={`bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-in ${showCelebration ? 'opacity-20' : ''}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${currentSlideData.gradient} flex items-center justify-center`}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Getting Started</span>
          </div>
          
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {/* Icon */}
          <div className={`w-24 h-24 rounded-3xl bg-gradient-to-r ${currentSlideData.gradient} flex items-center justify-center mb-6 mx-auto shadow-lg`}>
            {currentSlideData.icon}
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            {currentSlideData.title}
          </h2>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-6 text-center leading-relaxed">
            {currentSlideData.description}
          </p>

          {/* Features */}
          {currentSlideData.features && (
            <div className="space-y-3 bg-gray-50 rounded-2xl p-6 mb-6">
              {currentSlideData.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${currentSlideData.gradient} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-gray-700 leading-relaxed">{feature}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'w-8 bg-gradient-to-r ' + currentSlideData.gradient
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentSlide === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                currentSlide === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {!isLastSlide && (
              <button
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Skip
              </button>
            )}

            <button
              onClick={handleNext}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all shadow-lg hover:shadow-xl bg-gradient-to-r ${currentSlideData.gradient}`}
            >
              {isLastSlide ? (
                <>
                  Get Started
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default OnboardingModal;

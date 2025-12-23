import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Gift, Target, MapPin, Users, Star, Zap } from 'lucide-react';
import { Button } from './Common';
import { Confetti } from './SkeletonLoader';
import { User } from '../types';
import { db } from '../services/AuthContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  image?: string;
  video?: string;
  highlightElement?: string; // CSS selector for element to highlight
  position?: 'center' | 'top' | 'bottom';
}

interface OnboardingFlowProps {
  user: User;
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ user, onComplete, onSkip }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [completed, setCompleted] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: `👋 ${t('onboarding.welcome')}`,
      description: t('onboarding.welcomeDesc'),
      icon: <Gift className="w-12 h-12 text-[#00E5FF]" />,
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop',
      position: 'center'
    },
    {
      id: 'missions',
      title: `🎯 ${t('onboarding.completeMissions')}`,
      description: t('onboarding.completeMissionsDesc'),
      icon: <Target className="w-12 h-12 text-[#00E5FF]" />,
      image: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=600&h=400&fit=crop',
      position: 'center'
    },
    {
      id: 'explore',
      title: `🗺️ ${t('onboarding.exploreNearby')}`,
      description: t('onboarding.exploreNearbyDesc'),
      icon: <MapPin className="w-12 h-12 text-[#00E5FF]" />,
      highlightElement: '[data-onboarding="explore-tab"]',
      position: 'bottom'
    },
    {
      id: 'meetups',
      title: `🤝 ${t('onboarding.joinMeetups')}`,
      description: t('onboarding.joinMeetupsDesc'),
      icon: <Users className="w-12 h-12 text-[#00E5FF]" />,
      highlightElement: '[data-onboarding="meetups-tab"]',
      position: 'bottom'
    },
    {
      id: 'rewards',
      title: `🎁 ${t('onboarding.redeemRewards')}`,
      description: t('onboarding.redeemRewardsDesc'),
      icon: <Star className="w-12 h-12 text-[#00E5FF]" />,
      highlightElement: '[data-onboarding="rewards-tab"]',
      position: 'bottom'
    },
    {
      id: 'bonus',
      title: `✨ ${t('onboarding.welcomeBonus')}`,
      description: t('onboarding.welcomeBonusDesc'),
      icon: <Zap className="w-12 h-12 text-yellow-500 fill-yellow-500" />,
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop',
      position: 'center'
    }
  ];

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  useEffect(() => {
    // Highlight element if specified
    if (step.highlightElement) {
      const element = document.querySelector(step.highlightElement);
      if (element) {
        element.classList.add('onboarding-highlight');
        return () => {
          element.classList.remove('onboarding-highlight');
        };
      }
    }
  }, [step.highlightElement]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setCompleted(true);
    setShowConfetti(true);

    try {
      // Award welcome bonus
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        points: increment(100),
        onboardingCompleted: true,
        onboardingCompletedAt: new Date()
      });

      // Wait for confetti animation
      setTimeout(() => {
        onComplete();
      }, 3000);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      onComplete();
    }
  };

  const handleSkipAll = () => {
    if (confirm(t('onboarding.skipConfirm'))) {
      onSkip();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        {/* Spotlight effect for highlighted elements */}
        {step.highlightElement && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
        )}

        {/* Main onboarding card */}
        <div 
          className={`relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 ${
            step.position === 'top' ? 'self-start mt-20' :
            step.position === 'bottom' ? 'self-end mb-24' :
            'self-center'
          }`}
        >
          {/* Skip button */}
          {!completed && (
            <button
              onClick={handleSkipAll}
              className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-semibold text-gray-700 transition-all"
            >
              {t('common.skip')} {t('onboarding.tutorial')}
            </button>
          )}

          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100">
            <div 
              className="h-full bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Image/Video section */}
          {step.image && (
            <div className="relative h-48 bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF] overflow-hidden">
              <img
                src={step.image}
                alt={step.title}
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            </div>
          )}

          {step.video && (
            <div className="relative h-64 bg-black">
              <video
                src={step.video}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6 pb-8">
            {/* Icon */}
            <div className="mb-4 flex justify-center">
              {step.icon}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">
              {step.title}
            </h2>

            {/* Description */}
            <p className="text-center text-gray-600 mb-6 leading-relaxed">
              {step.description}
            </p>

            {/* Completion message */}
            {completed && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl">
                <div className="flex items-center justify-center gap-2 text-green-700 font-bold mb-1">
                  <Check className="w-5 h-5" />
                  Onboarding Complete!
                </div>
                <p className="text-sm text-green-600 text-center">
                  +100 points added to your account
                </p>
              </div>
            )}

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {steps.map((s, index) => (
                <div
                  key={s.id}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep 
                      ? 'w-8 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF]'
                      : index < currentStep
                      ? 'w-2 bg-[#00E5FF]'
                      : 'w-2 bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            {!completed && (
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <Button
                    variant="secondary"
                    onClick={handleBack}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={handleNext}
                  className={`${currentStep === 0 ? 'w-full' : 'flex-1'} flex items-center justify-center gap-2`}
                >
                  {isLastStep ? (
                    <>
                      <Check className="w-4 h-4" />
                      Claim Bonus & Start
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confetti celebration */}
      {showConfetti && <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />}

      {/* CSS for highlighting elements */}
      <style>{`
        @keyframes pulse-border {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(247, 37, 133, 0.7);
          }
          50% {
            box-shadow: 0 0 0 12px rgba(247, 37, 133, 0);
          }
        }

        .onboarding-highlight {
          position: relative;
          z-index: 10000;
          animation: pulse-border 2s infinite;
          border-radius: 12px;
        }

        .onboarding-highlight::before {
          content: '';
          position: absolute;
          inset: -4px;
          background: linear-gradient(to right, #00E5FF, #6C4BFF);
          border-radius: 14px;
          z-index: -1;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  );
};

// Onboarding completion modal for returning users
export const OnboardingCompletionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
}> = ({ isOpen, onClose, onRestart }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tutorial</h2>
          <p className="text-gray-600">
            Would you like to see the tutorial again?
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="primary"
            onClick={onRestart}
            className="w-full"
          >
            Restart Tutorial
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

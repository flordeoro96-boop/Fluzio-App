import React, { useState } from 'react';
import { OnboardingState } from '../types';
import { TrendingUp, Users, DollarSign, Calendar, Target, Zap, Handshake, Globe, ChevronRight, Sparkles } from 'lucide-react';

interface BusinessMaturityAssessmentProps {
  formData: OnboardingState;
  onUpdate: (field: keyof OnboardingState, value: any) => void;
  onComplete: () => void;
  onBack: () => void;
}

export const BusinessMaturityAssessment: React.FC<BusinessMaturityAssessmentProps> = ({
  formData,
  onUpdate,
  onComplete,
  onBack
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const questions = [
    {
      id: 'businessStage',
      title: 'How would you describe the current stage of your business?',
      icon: TrendingUp,
      options: [
        { value: 'validating', label: 'I am validating my idea', emoji: '💡' },
        { value: 'early_customers', label: 'I have early customers', emoji: '🌱' },
        { value: 'operating', label: 'My business is operating consistently', emoji: '⚙️' },
        { value: 'growing', label: 'We are growing and expanding', emoji: '📈' },
        { value: 'established', label: 'We are an established leader in our market', emoji: '🏆' },
        { value: 'leader', label: 'We are a recognized market leader', emoji: '👑' }
      ]
    },
    {
      id: 'businessAge',
      title: 'How long have you been operating?',
      icon: Calendar,
      options: [
        { value: 'not_launched', label: 'Not launched yet', emoji: '🚀' },
        { value: 'under_6m', label: 'Under 6 months', emoji: '🌟' },
        { value: '6_24m', label: '6–24 months', emoji: '📅' },
        { value: '2_5y', label: '2–5 years', emoji: '⏳' },
        { value: '5plus', label: '5+ years', emoji: '🎯' }
      ]
    },
    {
      id: 'customerBase',
      title: 'What best describes your customer/client base?',
      icon: Users,
      options: [
        { value: 'none', label: 'I do not have customers yet', emoji: '🔍' },
        { value: 'small', label: 'A small early community', emoji: '👥' },
        { value: 'steady', label: 'A steady stream of clients', emoji: '📊' },
        { value: 'hundreds', label: 'Hundreds of regular customers', emoji: '🎪' },
        { value: 'large', label: 'A large and established customer base', emoji: '🌐' }
      ]
    },
    {
      id: 'monthlyRevenue',
      title: 'Which growth milestone have you reached so far?',
      icon: DollarSign,
      subtitle: "Don't worry, no one will see your answers",
      options: [
        { value: 'none', label: "I haven't started earning yet", emoji: '🌱' },
        { value: '1_1k', label: "I've earned my first €1–1,000/month", emoji: '💚' },
        { value: '1k_10k', label: "I've reached €1,000–10,000/month", emoji: '💙' },
        { value: '10k_50k', label: "I've scaled to €10,000–50,000/month", emoji: '💜' },
        { value: '50k_200k', label: "I've passed €50,000/month", emoji: '🔥' },
        { value: '200k_plus', label: 'I am above €200,000/month', emoji: '💎' }
      ]
    },
    {
      id: 'teamSize',
      title: 'What is the size of your team?',
      icon: Users,
      options: [
        { value: 'solo', label: 'Just me', emoji: '👤' },
        { value: '2_3', label: '2–3 people', emoji: '👥' },
        { value: '4_10', label: '4–10 people', emoji: '👨‍👩‍👧‍👦' },
        { value: '11_20', label: '11–20 people', emoji: '👫👫' },
        { value: '20_plus', label: 'More than 20 people', emoji: '🏢' }
      ]
    },
    {
      id: 'onlinePresence',
      title: 'How far along are you in building your online audience?',
      icon: Globe,
      options: [
        { value: 'none', label: "I haven't started yet", emoji: '🌐' },
        { value: 'building', label: 'I am building my first 1,000 followers', emoji: '📱' },
        { value: 'small', label: 'I have a small but engaged audience', emoji: '💬' },
        { value: 'strong', label: 'I have a strong presence across platforms', emoji: '⭐' },
        { value: 'large', label: 'I have a large, established audience', emoji: '🌟' }
      ]
    },
    {
      id: 'mainGoal',
      title: 'What is your main goal for the next 3 months?',
      icon: Target,
      options: [
        { value: 'followers', label: 'Get more followers', emoji: '📈' },
        { value: 'clients', label: 'Attract more clients', emoji: '🎯' },
        { value: 'collaborate', label: 'Collaborate with businesses', emoji: '🤝' },
        { value: 'events', label: 'Host events', emoji: '🎉' },
        { value: 'international', label: 'Expand internationally', emoji: '🌍' },
        { value: 'branding', label: 'Improve my branding', emoji: '✨' }
      ]
    },
    {
      id: 'growthSpeed',
      title: 'How fast do you want to grow?',
      icon: Zap,
      options: [
        { value: 'slow', label: 'Slowly and sustainably', emoji: '🌿' },
        { value: 'steady', label: 'Steadily', emoji: '📊' },
        { value: 'fast', label: 'As fast as possible', emoji: '🚀' },
        { value: 'explosive', label: 'I want explosive growth', emoji: '💥' }
      ]
    },
    {
      id: 'willingToCollaborate',
      title: 'Are you willing to collaborate with other businesses?',
      icon: Handshake,
      options: [
        { value: 'yes', label: 'Yes, absolutely!', emoji: '🤝' },
        { value: 'selective', label: 'Only with certain businesses', emoji: '🎯' },
        { value: 'no', label: 'Not at this time', emoji: '🚫' }
      ]
    }
  ];

  const currentQ = questions[currentQuestion];
  const Icon = currentQ.icon;
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (value: string) => {
    // Update the current answer
    onUpdate(currentQ.id as keyof OnboardingState, value);
    
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      // Last question - calculate level with ALL answers including this one
      setTimeout(() => {
        // Build complete assessment data
        const completeData = {
          ...formData,
          [currentQ.id]: value  // Include the final answer
        };
        const level = calculateBusinessLevel(completeData);
        console.log('[BusinessMaturityAssessment] Calculated level:', level, 'from data:', completeData);
        
        // Update level first
        onUpdate('calculatedLevel' as any, level);
        
        // Wait for state to update before calling complete
        setTimeout(() => {
          onComplete();
        }, 100);
      }, 300);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm font-bold text-purple-600">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {currentQ.title}
              </h2>
              {currentQ.subtitle && (
                <p className="text-sm text-gray-500 mt-1">{currentQ.subtitle}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {currentQ.options.map((option, index) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className="w-full text-left p-4 rounded-2xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 group"
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animation: 'slideIn 0.3s ease-out forwards',
                  opacity: 0
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="text-lg font-medium text-gray-900 group-hover:text-purple-700">
                    {option.label}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto group-hover:text-purple-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>

          {/* Back Button */}
          <button
            onClick={handlePrevious}
            className="mt-6 text-gray-600 hover:text-gray-900 font-medium text-sm"
          >
            ← Back
          </button>
        </div>

        {/* Microcopy */}
        <p className="text-center text-sm text-gray-500 mt-6">
          🔒 Your answers are private and help us personalize your experience
        </p>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// Calculate business level based on maturity assessment
function calculateBusinessLevel(data: OnboardingState): 'FREE' | 'SILVER' | 'GOLD' | 'PLATINUM' {
  let score = 0;
  
  // Business Stage (0-6 points)
  const stageScores: Record<string, number> = {
    'validating': 1,
    'early_customers': 2,
    'operating': 3,
    'growing': 4,
    'established': 5,
    'leader': 6
  };
  score += stageScores[(data as any).businessStage || 'validating'] || 0;
  
  // Business Age (0-5 points)
  const ageScores: Record<string, number> = {
    'not_launched': 0,
    'under_6m': 1,
    '6_24m': 2,
    '2_5y': 4,
    '5plus': 5
  };
  score += ageScores[(data as any).businessAge || 'not_launched'] || 0;
  
  // Customer Base (0-5 points)
  const customerScores: Record<string, number> = {
    'none': 0,
    'small': 1,
    'steady': 3,
    'hundreds': 4,
    'large': 5
  };
  score += customerScores[(data as any).customerBase || 'none'] || 0;
  
  // Monthly Revenue (0-6 points)
  const revenueScores: Record<string, number> = {
    'none': 0,
    '1_1k': 1,
    '1k_10k': 2,
    '10k_50k': 4,
    '50k_200k': 5,
    '200k_plus': 6
  };
  score += revenueScores[(data as any).monthlyRevenue || 'none'] || 0;
  
  // Team Size (0-5 points)
  const teamScores: Record<string, number> = {
    'solo': 0,
    '2_3': 1,
    '4_10': 3,
    '11_20': 4,
    '20_plus': 5
  };
  score += teamScores[(data as any).teamSize || 'solo'] || 0;
  
  // Online Presence (0-4 points)
  const presenceScores: Record<string, number> = {
    'none': 0,
    'building': 1,
    'small': 2,
    'strong': 3,
    'large': 4
  };
  score += presenceScores[(data as any).onlinePresence || 'none'] || 0;
  
  // Total possible: 31 points
  // Apply special rules
  
  // If business age < 6 months → max SILVER
  if ((data as any).businessAge === 'not_launched' || (data as any).businessAge === 'under_6m') {
    if (score >= 8) return 'SILVER';
    return 'FREE';
  }
  
  // If revenue > €50k → min GOLD
  if ((data as any).monthlyRevenue === '50k_200k' || (data as any).monthlyRevenue === '200k_plus') {
    return 'PLATINUM';
  }
  
  // If team > 20 → PLATINUM
  if ((data as any).teamSize === '20_plus') {
    return 'PLATINUM';
  }
  
  // Standard scoring
  if (score >= 24) return 'PLATINUM';  // 77%+
  if (score >= 16) return 'GOLD';      // 52%+
  if (score >= 8) return 'SILVER';     // 26%+
  return 'FREE';                       // < 26%
}

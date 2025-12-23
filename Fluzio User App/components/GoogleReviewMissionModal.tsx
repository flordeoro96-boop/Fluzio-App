import React, { useState, useEffect } from 'react';
import { Modal, Button } from './Common';
import { ExternalLink, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { createGoogleReviewMission, getReviewStatus } from '../services/googleReviewService';

interface GoogleReviewMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: {
    id: string;
    title: string;
    businessId: string;
    businessName: string;
    reward: { points: number };
  };
  userId: string;
}

export const GoogleReviewMissionModal: React.FC<GoogleReviewMissionModalProps> = ({
  isOpen,
  onClose,
  mission,
  userId
}) => {
  const [loading, setLoading] = useState(false);
  const [reviewLink, setReviewLink] = useState<string | null>(null);
  const [participationId, setParticipationId] = useState<string | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'CHECKING' | 'VERIFIED' | 'NEEDS_PROOF' | 'ERROR'>('IDLE');
  const [statusMessage, setStatusMessage] = useState('');
  const [instructions, setInstructions] = useState<any>(null);

  const handleStartMission = async () => {
    setLoading(true);
    try {
      const result = await createGoogleReviewMission(
        mission.businessId,
        userId,
        mission.id
      );

      if (result.success) {
        setReviewLink(result.reviewLink!);
        setInstructions(result.instructions);
        setParticipationId(result.participationId!);
        setStatus('CHECKING');
        
        // Open Google review page in new tab
        window.open(result.reviewLink, '_blank');
        
        // Start polling for status updates
        startStatusPolling(result.participationId!);
      } else {
        setStatus('ERROR');
        const errorMsg = result.error || 'Failed to start mission';
        setStatusMessage(errorMsg);
        
        // If it's a configuration error, suggest falling back to manual submission
        if (errorMsg.includes('Place ID not configured') || errorMsg.includes('not connected')) {
          setStatusMessage(errorMsg + '\n\nYou can still complete this mission by uploading a screenshot of your review.');
        }
      }
    } catch (error) {
      console.error('Error starting review mission:', error);
      setStatus('ERROR');
      const errorMsg = error instanceof Error ? error.message : 'An error occurred';
      setStatusMessage(errorMsg + '\n\nYou can still apply to this mission manually by clicking "Apply to Mission" button.');
    } finally {
      setLoading(false);
    }
  };

  const startStatusPolling = (participationId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 15 minutes (30 * 30 seconds)

    const pollInterval = setInterval(async () => {
      attempts++;
      
      const statusResult = await getReviewStatus(participationId);
      setStatusMessage(statusResult.message);

      if (statusResult.status === 'COMPLETED') {
        setStatus('VERIFIED');
        clearInterval(pollInterval);
      } else if (statusResult.status === 'NEEDS_PROOF') {
        setStatus('NEEDS_PROOF');
        clearInterval(pollInterval);
      } else if (attempts >= maxAttempts) {
        setStatus('NEEDS_PROOF');
        setStatusMessage('Please upload a screenshot of your review');
        clearInterval(pollInterval);
      }
    }, 30000); // Check every 30 seconds
  };

  const renderContent = () => {
    if (status === 'IDLE') {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-[#1E0E62] mb-2">
              Leave a Google Review
            </h3>
            <p className="text-[#8F8FA3]">
              Share your experience with {mission.businessName}
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#FFB86C]/10 to-[#00E5FF]/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#1E0E62] font-semibold">Reward</span>
              <span className="text-2xl font-bold text-[#00E5FF]">
                {mission.reward.points} points
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-[#1E0E62] flex items-center gap-2">
              <span className="text-xl">✨</span>
              How it works:
            </h4>
            
            <div className="space-y-3">
              {[
                { icon: '📝', text: 'Click button to open Google' },
                { icon: '⭐', text: 'Rate your experience (1-5 stars)' },
                { icon: '✍️', text: 'Write what you liked' },
                { icon: '✅', text: 'Submit - Points awarded automatically!' }
              ].map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-2xl">{step.icon}</span>
                  <span className="text-[#1E0E62] pt-1">{step.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-700">
              <strong>💡 Pro Tip:</strong> No screenshots needed! We'll automatically 
              verify your review and award points within 2 minutes.
            </p>
          </div>

          <Button 
            onClick={handleStartMission}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#FFB86C] to-[#00E5FF] text-white font-bold py-4 text-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              'Starting...'
            ) : (
              <>
                Write Review on Google
                <ExternalLink className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      );
    }

    if (status === 'CHECKING') {
      return (
        <div className="space-y-6 text-center py-8">
          <div className="flex justify-center">
            <div className="relative">
              <Clock className="w-16 h-16 text-[#00E5FF] animate-pulse" />
              <div className="absolute inset-0 bg-[#00E5FF]/20 rounded-full animate-ping"></div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-[#1E0E62] mb-2">
              Checking for your review...
            </h3>
            <p className="text-[#8F8FA3]">{statusMessage}</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl">
            <p className="text-sm text-blue-700">
              We're automatically checking Google for your review. 
              This usually takes 1-2 minutes.
            </p>
          </div>

          <div className="space-y-2 text-left">
            <p className="text-xs text-[#8F8FA3] font-medium">Did you submit your review?</p>
            <ul className="text-xs text-[#8F8FA3] space-y-1 pl-4">
              <li>✓ Made sure you're signed in to Google</li>
              <li>✓ Wrote at least a few words</li>
              <li>✓ Clicked "Post" or "Publish"</li>
            </ul>
          </div>

          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full"
          >
            Close (checking continues in background)
          </Button>
        </div>
      );
    }

    if (status === 'VERIFIED') {
      return (
        <div className="space-y-6 text-center py-8">
          <div className="flex justify-center">
            <div className="relative">
              <CheckCircle className="w-20 h-20 text-green-500" />
              <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
            </div>
          </div>

          <div>
            <h3 className="text-3xl font-bold text-[#1E0E62] mb-2">
              🎉 Review Verified!
            </h3>
            <p className="text-lg text-[#8F8FA3] mb-4">
              Your review has been verified
            </p>
            <div className="inline-block bg-gradient-to-r from-[#FFB86C] to-[#00E5FF] text-white px-8 py-3 rounded-full font-bold text-2xl">
              +{mission.reward.points} points
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-xl">
            <p className="text-sm text-green-700">
              ✅ Points have been added to your wallet!
            </p>
          </div>

          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-[#FFB86C] to-[#00E5FF] text-white"
          >
            Awesome!
          </Button>
        </div>
      );
    }

    if (status === 'NEEDS_PROOF') {
      return (
        <div className="space-y-6 text-center py-8">
          <div className="flex justify-center">
            <AlertCircle className="w-16 h-16 text-yellow-500" />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-[#1E0E62] mb-2">
              Manual Verification Needed
            </h3>
            <p className="text-[#8F8FA3]">{statusMessage}</p>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded text-left">
            <p className="text-sm text-yellow-700">
              We couldn't automatically find your review. This can happen if:
            </p>
            <ul className="text-xs text-yellow-600 mt-2 space-y-1 pl-4">
              <li>• Your review hasn't appeared on Google yet (can take a few minutes)</li>
              <li>• You used a different Google account</li>
              <li>• Your review settings are private</li>
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-[#1E0E62] font-medium">
              Please upload a screenshot of your review to continue:
            </p>
            <Button
              onClick={() => {
                // Navigate to proof submission
                onClose();
                // You would trigger proof upload modal here
              }}
              className="w-full"
            >
              Upload Screenshot
            </Button>
          </div>

          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full"
          >
            I'll do it later
          </Button>
        </div>
      );
    }

    // ERROR state
    return (
      <div className="space-y-6 text-center py-8">
        <div className="flex justify-center">
          <AlertCircle className="w-16 h-16 text-red-500" />
        </div>

        <div>
          <h3 className="text-2xl font-bold text-[#1E0E62] mb-2">
            Oops! Something went wrong
          </h3>
          <p className="text-[#8F8FA3] whitespace-pre-line">{statusMessage}</p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => {
              setStatus('IDLE');
              setStatusMessage('');
            }}
            className="w-full"
          >
            Try Again
          </Button>
          
          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full"
          >
            Use Manual Application
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      {renderContent()}
    </Modal>
  );
};

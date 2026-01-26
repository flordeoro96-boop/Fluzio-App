
import React, { useState, useEffect } from 'react';
import { Mission, User, MissionStatus } from '../types';
import { store } from '../services/mockStore';
import { getParticipation, applyToMission } from '../src/services/participationService';
import { Button } from './Common';
import { X, MapPin, UploadCloud, CheckCircle2, Loader2, Sparkles, QrCode, Lock, Camera, Users, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { calculateDistance, useGeolocation } from '../hooks/useLocation';
import { useTranslation } from 'react-i18next';
import { GoogleReviewMissionModal } from './GoogleReviewMissionModal';
import { AppointmentBookingModal } from './AppointmentBookingModal';
import { QRScanner } from './QRScanner';
import { 
  initiateReferral, 
  completeFriendScan, 
  getActiveSession,
  BringAFriendSession 
} from '../services/bringAFriendService';
import { 
  createAppointmentRequest,
  AppointmentType 
} from '../services/appointmentBookingService';

interface MissionDetailScreenProps {
  mission: Mission;
  user: User;
  onClose: () => void;
  onApply?: () => void;
  isApplying?: boolean;
  onFindCollaborator?: () => void;
}

export const MissionDetailScreen: React.FC<MissionDetailScreenProps> = ({ mission, user, onClose, onApply, isApplying, onFindCollaborator }) => {
  const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'UPLOADING' | 'ANALYZING' | 'SUCCESS'>('IDLE');
  const [distance, setDistance] = useState<number | null>(null);
  const [existingParticipation, setExistingParticipation] = useState<any>(null);
  const [showGoogleReviewModal, setShowGoogleReviewModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [bringAFriendSession, setBringAFriendSession] = useState<BringAFriendSession | null>(null);
  const [userRole, setUserRole] = useState<'REFERRER' | 'FRIEND' | null>(null);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const { location } = useGeolocation();
  
  // Check if this is a Google Review mission
  const isGoogleReviewMission = mission.title?.toLowerCase().includes('google review');
  
  // Check if this is a Bring a Friend mission
  const isBringAFriendMission = mission.title?.toLowerCase().includes('bring a friend') || 
                                 mission.missionTemplateId === 'BRING_A_FRIEND';
  
  // Check if this is an Appointment/Consultation mission
  const isAppointmentMission = mission.title?.toLowerCase().includes('consultation') ||
                               mission.title?.toLowerCase().includes('appointment') ||
                               mission.missionTemplateId === 'CONSULTATION_REQUEST';
  
  // Check if user has already participated
  useEffect(() => {
    const checkParticipation = async () => {
      const participation = await getParticipation(mission.id, user.id);
      setExistingParticipation(participation);
      if (participation && participation.status !== 'PENDING') {
        setStatus('SUCCESS');
      }
    };
    checkParticipation();
  }, [mission.id, user.id]);

  // Check for active Bring a Friend session
  useEffect(() => {
    if (isBringAFriendMission) {
      const checkSession = async () => {
        const session = await getActiveSession(user.id, mission.businessId);
        if (session) {
          setBringAFriendSession(session);
          setUserRole('REFERRER');
        }
      };
      checkSession();
    }
  }, [isBringAFriendMission, user.id, mission.businessId]);

  // Calculate Distance for GPS triggers
  useEffect(() => {
      if (location && mission.geo) {
          const dist = calculateDistance(location, mission.geo);
          setDistance(dist);
      }
  }, [location, mission.geo]);

  const handleManualSubmit = async () => {
      // 1. Simulate Upload
      setStatus('UPLOADING');
      await new Promise(r => setTimeout(r, 1500));
      processSubmission();
  };

  const handleScanSubmit = () => {
      // Open QR scanner camera
      setShowQRScanner(true);
  };

  const handleQRScanned = async (qrData: string) => {
      console.log('[MissionDetailScreen] QR Code scanned:', qrData);
      
      try {
        // Parse QR data
        const data = JSON.parse(qrData);
        
        // Verify it's a Beevvy check-in QR
        if (data.type !== 'BEEVVY_CHECK_IN') {
          alert('Invalid QR code. Please scan the Beevvy check-in code at the business location.');
          return;
        }
        
        // Verify business ID matches
        if (data.businessId !== mission.businessId) {
          alert('This QR code is for a different business. Please scan the correct QR code.');
          return;
        }
        
        // Handle Bring a Friend mission
        if (isBringAFriendMission) {
          setStatus('ANALYZING');
          await handleBringAFriendScan();
          return;
        }
        
        // Regular check-in: QR verified, process submission
        setStatus('ANALYZING');
        await new Promise(r => setTimeout(r, 1500));
        processSubmission();
        
      } catch (error) {
        console.error('[MissionDetailScreen] Error parsing QR data:', error);
        alert('Invalid QR code format. Please scan the Beevvy check-in code.');
      }
  };

  const handleBringAFriendScan = async () => {
    try {
      // Check if there's an active session where user is referrer
      if (bringAFriendSession && userRole === 'REFERRER') {
        // User already initiated, show waiting message
        alert(`You've already scanned! Share this QR code with your friend. They have ${Math.ceil((30 - ((Date.now() - bringAFriendSession.referrerScanTime.toDate().getTime()) / 60000)))} minutes left to scan.`);
        setStatus('IDLE');
        return;
      }

      // Check if user might be a friend joining an existing session
      // We need to ask: are you the referrer or the friend?
      const role = window.confirm('Are you the one bringing a friend? Click OK if yes, Cancel if you are the friend being brought.');

      if (role) {
        // User is REFERRER - initiate new session
        setUserRole('REFERRER');
        const result = await initiateReferral(
          mission.id,
          mission.businessId,
          mission.businessName || 'Business',
          user.id,
          mission.reward?.points || 200
        );

        if (result.success) {
          setStatus('SUCCESS');
          const session = await getActiveSession(user.id, mission.businessId);
          setBringAFriendSession(session);
          alert('✅ You scanned successfully! Now have your friend scan the same QR code within 30 minutes. You\'ll both earn points!');
        } else {
          alert(result.error || 'Failed to initiate referral');
          setStatus('IDLE');
        }
      } else {
        // User is FRIEND - need to find which session to join
        // For simplicity, we'll search for recent sessions at this business
        setUserRole('FRIEND');
        
        // In a real implementation, you might show a list of pending sessions
        // or use a session ID from the QR code. For now, we'll just try to complete
        // We need the session ID - this should ideally be encoded in the QR or selected by user
        const sessionId = window.prompt('Enter the session code shown on your friend\'s screen (for demo):');
        
        if (!sessionId) {
          alert('Session code required');
          setStatus('IDLE');
          return;
        }

        const result = await completeFriendScan(sessionId, user.id);

        if (result.success) {
          setStatus('SUCCESS');
          alert('🎉 Success! You and your friend will both receive points in 3 days after verification.');
        } else {
          alert(result.error || 'Failed to complete referral');
          setStatus('IDLE');
        }
      }
    } catch (error) {
      console.error('[MissionDetailScreen] Error handling Bring a Friend scan:', error);
      alert('An error occurred. Please try again.');
      setStatus('IDLE');
    }
  };

  const handleAppointmentSubmit = () => {
    // Open appointment booking form
    setShowAppointmentForm(true);
  };

  const handleGPSSubmit = () => {
     // Distance check logic
     if (distance && distance > 100) {
         // Fallback for demo: if location is mocked far away, we simulate failure or just warn
         alert(`You are ${Math.round(distance)}m away! You need to be within 100m to check in.`);
         return;
     }
     processSubmission();
  };

  const processSubmission = async () => {
      // 2. Simulate AI Analysis (if needed)
      setStatus('ANALYZING');
      await new Promise(r => setTimeout(r, 2000));

      // 3. Submit to participationService
      console.log('[MissionDetailScreen] Submitting mission application');
      const result = await applyToMission(mission.id, user.id, mission.businessId);
      
      if (result.success) {
        console.log('[MissionDetailScreen] Mission application successful');
        setStatus('SUCCESS');
      } else {
        console.error('[MissionDetailScreen] Mission application failed:', result.error);
        alert('Failed to apply: ' + (result.error || 'Unknown error'));
        setStatus('IDLE');
      }
  };

  // Determine Action Button based on Trigger Type
  const renderActionButton = () => {
      if (status === 'UPLOADING') {
          return (
            <Button disabled className="w-full py-4 bg-gray-100 text-gray-500 border-none">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Uploading...
            </Button>
          );
      }

      if (status === 'ANALYZING') {
          return (
            <div className="w-full py-4 bg-[#1E0E62] text-white rounded-full flex items-center justify-center gap-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                <Sparkles className="w-5 h-5 text-[#FFB86C] animate-pulse" /> 
                <span className="font-bold">Verifying...</span>
            </div>
          );
      }

      if (status === 'SUCCESS') {
         // Special success message for Bring a Friend
         if (isBringAFriendMission && bringAFriendSession) {
           return (
            <div className="w-full space-y-3">
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl flex items-center gap-3 animate-in zoom-in">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-purple-800">Waiting for Friend</div>
                  <div className="text-xs text-purple-600">Share this QR code with your friend</div>
                </div>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600 shrink-0" />
                <div className="text-xs text-yellow-700">
                  Session Code: <span className="font-mono font-bold">{bringAFriendSession.id.substring(0, 8).toUpperCase()}</span>
                  <br />Time remaining: 30 minutes
                </div>
              </div>
            </div>
           );
         }
         
         return (
            <div className="w-full p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 animate-in zoom-in">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                    <div className="font-bold text-green-800">Proof Submitted!</div>
                    <div className="text-xs text-green-600">Points added to your wallet.</div>
                </div>
            </div>
         );
      }

      // Special UI for Appointment/Consultation mission
      if (isAppointmentMission) {
        return (
          <div className="space-y-3">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-blue-900">Book an Appointment</span>
              </div>
              <div className="text-xs text-blue-700 space-y-1">
                <div>• Request a consultation or appointment</div>
                <div>• Business will confirm your booking</div>
                <div>• Earn {mission.reward?.points || 200} points after completion</div>
                <div>• Rewards unlock 3 days after your appointment</div>
              </div>
            </div>
            <div className="text-center text-xs text-gray-500 mb-2">
              Fill out your preferred appointment details
            </div>
            <Button 
              className="w-full py-4 text-lg shadow-xl shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
              onClick={handleAppointmentSubmit}
            >
              <Clock className="w-5 h-5 mr-2" /> Schedule Appointment
            </Button>
          </div>
        );
      }

      // Special UI for Bring a Friend mission
      if (isBringAFriendMission) {
        return (
          <div className="space-y-3">
            <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="font-bold text-purple-900">Bring a Friend Mission</span>
              </div>
              <div className="text-xs text-purple-700 space-y-1">
                <div>• Both you and your friend scan the same QR code</div>
                <div>• Your friend must be a first-time visitor</div>
                <div>• Both earn {mission.reward?.points || 200} points</div>
                <div>• Rewards unlock in 3 days after verification</div>
              </div>
            </div>
            <div className="text-center text-xs text-gray-500 mb-2">
              {bringAFriendSession ? 'Have your friend scan now!' : 'Scan the QR code at the business'}
            </div>
            <Button 
              className="w-full py-4 text-lg shadow-xl shadow-purple-500/20 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
              onClick={handleScanSubmit}
            >
              <Users className="w-5 h-5 mr-2" /> Scan QR Code
            </Button>
          </div>
        );
      }

      // Trigger Logic
      if (mission.triggerType === 'QR_SCAN') {
          if (status === 'SCANNING') {
             return (
                 <div className="w-full aspect-video bg-black rounded-2xl relative overflow-hidden flex flex-col items-center justify-center border-2 border-[#00E5FF]">
                     <div className="absolute top-0 left-0 w-full h-1 bg-[#00E5FF] shadow-[0_0_20px_rgba(247,37,133,0.8)] animate-[scan_2s_linear_infinite]"></div>
                     <Camera className="w-12 h-12 text-white/50 mb-2" />
                     <div className="text-white text-sm font-bold z-10">Scanning QR Code...</div>
                 </div>
             );
          }
          return (
             <div className="space-y-2">
                 <div className="text-center text-xs text-gray-500 mb-2">Scan the Beevvy stand at the counter to unlock.</div>
                 <Button 
                    className="w-full py-4 text-lg shadow-xl shadow-[#00E5FF]/20 bg-black text-white hover:bg-gray-900"
                    onClick={handleScanSubmit}
                 >
                    <QrCode className="w-5 h-5 mr-2" /> Open Scanner
                 </Button>
             </div>
          );
      }

      if (mission.triggerType === 'GPS_PROXIMITY') {
          const isNearby = distance !== null && distance < 100;
          const distanceText = distance ? `${Math.round(distance)}m` : 'calculating...';
          
          return (
             <Button 
                className={`w-full py-4 text-lg shadow-xl transition-all ${isNearby ? 'shadow-[#00E5FF]/20' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
                onClick={handleGPSSubmit}
                disabled={!isNearby}
             >
                {isNearby ? (
                    <><MapPin className="w-5 h-5 mr-2" /> 📍 Check In Now</>
                ) : (
                    <><Lock className="w-4 h-4 mr-2" /> Get closer: {distanceText}</>
                )}
             </Button>
          );
      }

      // Default: Manual (or Google Review special flow)
      if (isGoogleReviewMission) {
        return (
          <Button 
              className="w-full py-4 text-lg shadow-xl shadow-[#00E5FF]/20 bg-gradient-to-r from-[#FFB86C] to-[#00E5FF] text-white border-none"
              onClick={() => setShowGoogleReviewModal(true)}
          >
              <span className="flex items-center justify-center gap-2">
                ⭐ Write Review on Google
              </span>
          </Button>
        );
      }
      
      return (
        <Button 
            className="w-full py-4 text-lg shadow-xl shadow-[#00E5FF]/20"
            onClick={onApply || handleManualSubmit}
            disabled={isApplying}
        >
            {isApplying ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Applying...</>
            ) : (
                <><UploadCloud className="w-5 h-5 mr-2" /> Apply to Mission</>
            )}
        </Button>
      );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
        
        {/* --- Header Image with Parallax Effect --- */}
        <div className="relative h-72 shrink-0">
            <img 
                src={mission.image || 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7'} 
                alt="Mission" 
                className="w-full h-full object-cover"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1E0E62] via-transparent to-black/30"></div>
            
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
                <div className="bg-black/30 backdrop-blur-md rounded-full px-3 py-1 text-white text-xs font-bold border border-white/20">
                    {formatDistanceToNow(new Date(mission.createdAt))} left
                </div>
                <button 
                    onClick={onClose} 
                    className="w-10 h-10 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Title & Points Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-[#1E0E62] to-transparent">
                <div className="flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <img src={mission.businessLogo} className="w-6 h-6 rounded-full border border-white" />
                             <span className="text-white/80 text-sm font-bold">{mission.businessName}</span>
                        </div>
                        <h1 className="text-2xl font-clash font-bold text-white leading-tight max-w-xs">{mission.title}</h1>
                    </div>
                    <div className="bg-gradient-to-br from-[#FFB86C] via-[#00E5FF] to-[#6C4BFF] px-4 py-2 rounded-2xl text-white font-bold text-lg shadow-lg shadow-[#00E5FF]/40 border border-white/20 transform rotate-3">
                        +{mission.reward.points} pts
                    </div>
                </div>
            </div>
        </div>

        {/* --- Content Body --- */}
        <div className="flex-1 overflow-y-auto bg-white relative -mt-4 rounded-t-[32px] z-10 p-6 space-y-6">
            
            {/* Trigger Warning / Info */}
            {mission.triggerType === 'QR_SCAN' && (
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                        <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-blue-900 text-sm">On-Site Required</div>
                        <div className="text-xs text-blue-700">Scan QR code to unlock.</div>
                    </div>
                </div>
            )}

            {mission.triggerType === 'GPS_PROXIMITY' && (
                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-purple-900 text-sm">GPS Check-in</div>
                        <div className="text-xs text-purple-700">You must be within 100m of the store.</div>
                    </div>
                </div>
            )}

            {/* Description */}
            <section>
                <h3 className="text-sm font-bold text-[#8F8FA3] uppercase tracking-wider mb-2">The Mission</h3>
                <p className="text-[#1E0E62] font-medium leading-relaxed">
                    {mission.description}
                </p>
                <div className="flex items-center gap-2 mt-3 text-sm text-[#1E0E62]">
                    <MapPin className="w-4 h-4 text-[#00E5FF]" />
                    <span className="font-bold">{mission.location || 'Online'}</span>
                    {distance && <span className="text-gray-400 text-xs">({Math.round(distance)}m away)</span>}
                </div>
            </section>

            {/* Requirements List */}
            <section className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <h3 className="text-sm font-bold text-[#8F8FA3] uppercase tracking-wider mb-3">Requirements</h3>
                <ul className="space-y-3">
                    {mission.requirements.map((req, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-[#1E0E62] font-medium">
                            <div className="w-5 h-5 rounded-full bg-[#1E0E62] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                {i + 1}
                            </div>
                            {req}
                        </li>
                    ))}
                </ul>
            </section>
        </div>

        {/* --- Sticky Action Footer --- */}
        <div className="p-4 bg-white border-t border-gray-100 safe-pb shadow-[0_-10px_40px_rgba(0,0,0,0.05)] space-y-3">
            {renderActionButton()}
            
            {/* Find Collaborator CTA */}
            {onFindCollaborator && (
              <button
                onClick={onFindCollaborator}
                className="w-full py-3 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-xl font-semibold hover:from-purple-100 hover:to-pink-100 transition-all border border-purple-200 flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                Find a Collaborator
              </button>
            )}
        </div>
        
        {/* Appointment Booking Modal */}
        {isAppointmentMission && (
          <AppointmentBookingModal
            isOpen={showAppointmentForm}
            onClose={() => {
              setShowAppointmentForm(false);
              // Refresh participation status after modal closes
              const checkParticipation = async () => {
                const participation = await getParticipation(mission.id, user.id);
                setExistingParticipation(participation);
                if (participation && participation.status !== 'PENDING') {
                  setStatus('SUCCESS');
                }
              };
              checkParticipation();
            }}
            mission={{
              id: mission.id,
              title: mission.title,
              businessId: mission.businessId,
              businessName: mission.businessName || 'Business',
              reward: mission.reward
            }}
            user={{
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone
            }}
          />
        )}
        
        {/* Google Review Modal */}
        {isGoogleReviewMission && (
          <GoogleReviewMissionModal
            isOpen={showGoogleReviewModal}
            onClose={() => {
              setShowGoogleReviewModal(false);
              // Refresh participation status after modal closes
              const checkParticipation = async () => {
                const participation = await getParticipation(mission.id, user.id);
                setExistingParticipation(participation);
                if (participation && participation.status !== 'PENDING') {
                  setStatus('SUCCESS');
                }
              };
              checkParticipation();
            }}
            mission={{
              id: mission.id,
              title: mission.title,
              businessId: mission.businessId,
              businessName: mission.businessName || 'Business',
              reward: mission.reward
            }}
            userId={user.id}
          />
        )}
        
        {/* QR Scanner */}
        <QRScanner
          isOpen={showQRScanner}
          onClose={() => setShowQRScanner(false)}
          onScan={handleQRScanned}
        />
    </div>
  );
};

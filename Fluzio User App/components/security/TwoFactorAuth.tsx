import React, { useState } from 'react';
import { Shield, Smartphone, Key, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react';

interface TwoFactorAuthProps {
  userId: string;
  userEmail: string;
  onClose: () => void;
}

export const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({
  userId,
  userEmail,
  onClose
}) => {
  const [step, setStep] = useState<'check' | 'setup' | 'verify' | 'enabled'>('check');
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [copied, setCopied] = useState(false);

  // Check if 2FA is already enabled
  React.useEffect(() => {
    checkTwoFactorStatus();
  }, [userId]);

  const checkTwoFactorStatus = async () => {
    setLoading(true);
    try {
      // TODO: Check Firestore for 2FA status
      // const userDoc = await getDoc(doc(db, 'users', userId));
      // const twoFactorEnabled = userDoc.data()?.twoFactorEnabled || false;
      const twoFactorEnabled = false; // Mock for now
      
      setIsEnabled(twoFactorEnabled);
      setStep(twoFactorEnabled ? 'enabled' : 'check');
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    setLoading(true);
    try {
      // TODO: Call Cloud Function to generate QR code and secret
      // const response = await fetch('/api/generate2FASecret', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ userId, email: userEmail })
      // });
      // const data = await response.json();
      
      // Mock data for now
      const mockSecret = 'JBSWY3DPEHPK3PXP';
      const mockQrCode = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=otpauth://totp/Fluzio:${encodeURIComponent(userEmail)}?secret=${mockSecret}&issuer=Fluzio`;
      
      setSecret(mockSecret);
      setQrCode(mockQrCode);
      setStep('setup');
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      alert('Failed to set up 2FA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      alert('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    try {
      // TODO: Verify the code with Cloud Function
      // const response = await fetch('/api/verify2FACode', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ userId, code: verificationCode, secret })
      // });
      // const data = await response.json();
      
      // Mock verification (always succeeds for demo)
      const isValid = true;
      
      if (isValid) {
        // Generate backup codes
        const codes = generateBackupCodes();
        setBackupCodes(codes);
        
        // TODO: Save to Firestore
        // await updateDoc(doc(db, 'users', userId), {
        //   twoFactorEnabled: true,
        //   twoFactorSecret: secret,
        //   backupCodes: codes.map(code => ({ code, used: false }))
        // });
        
        setIsEnabled(true);
        setStep('verify');
      } else {
        alert('Invalid code. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      alert('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm('Are you sure you want to disable Two-Factor Authentication? This will make your account less secure.')) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Disable 2FA in Firestore
      // await updateDoc(doc(db, 'users', userId), {
      //   twoFactorEnabled: false,
      //   twoFactorSecret: null,
      //   backupCodes: []
      // });
      
      setIsEnabled(false);
      setStep('check');
      alert('Two-Factor Authentication has been disabled.');
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      alert('Failed to disable 2FA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateBackupCodes = (): string[] => {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBackupCodes = () => {
    const text = `Fluzio Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\nEmail: ${userEmail}\n\n${backupCodes.join('\n')}\n\nKeep these codes in a safe place. Each code can only be used once.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fluzio-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && step === 'check') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00E5FF] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1E0E62]">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-600">Add an extra layer of security</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Check Status */}
        {step === 'check' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">2FA is currently disabled</p>
                  <p>Protect your account by enabling Two-Factor Authentication. You'll need your phone to sign in.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-[#00E5FF] mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-[#1E0E62] mb-1">Use an authenticator app</h3>
                  <p className="text-sm text-gray-600">Download Google Authenticator, Authy, or similar app on your phone.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Key className="w-5 h-5 text-[#00E5FF] mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-[#1E0E62] mb-1">Backup codes</h3>
                  <p className="text-sm text-gray-600">Get 10 backup codes in case you lose access to your phone.</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSetup}
              className="w-full bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
            >
              Enable Two-Factor Authentication
            </button>
          </div>
        )}

        {/* Setup - Scan QR Code */}
        {step === 'setup' && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Scan this QR code with your authenticator app</p>
              
              {qrCode && (
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
              )}

              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Or enter this code manually:</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="px-4 py-2 bg-gray-100 rounded-lg font-mono text-sm">
                    {secret}
                  </code>
                  <button
                    onClick={copySecret}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> After scanning the QR code, enter the 6-digit code from your app to verify.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent text-center text-2xl font-mono tracking-widest"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('check')}
                className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={verificationCode.length !== 6 || loading}
                className="flex-1 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          </div>
        )}

        {/* Verification Success - Show Backup Codes */}
        {step === 'verify' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-[#1E0E62] mb-2">2FA Enabled Successfully!</h3>
              <p className="text-gray-600">Save these backup codes in a safe place</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 bg-white rounded-lg font-mono text-sm text-center border border-gray-200"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800">
                <strong>Important:</strong> Each backup code can only be used once. Store them securely - you won't be able to see them again!
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadBackupCodes}
                className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors"
              >
                Download Codes
              </button>
              <button
                onClick={() => {
                  setStep('enabled');
                  onClose();
                }}
                className="flex-1 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
              >
                I've Saved Them
              </button>
            </div>
          </div>
        )}

        {/* Already Enabled */}
        {step === 'enabled' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-[#1E0E62] mb-2">2FA is Active</h3>
              <p className="text-gray-600">Your account is protected with Two-Factor Authentication</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">Enhanced Security Active</p>
                  <p>You'll be asked for a code from your authenticator app when signing in from a new device.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  // TODO: Show regenerate backup codes flow
                  alert('Regenerate backup codes feature coming soon');
                }}
                className="w-full px-6 py-3 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors text-left flex items-center justify-between"
              >
                <span>Regenerate Backup Codes</span>
                <Key className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={handleDisable}
                disabled={loading}
                className="w-full px-6 py-3 border border-red-200 rounded-xl font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Disabling...' : 'Disable 2FA'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Shield, Smartphone, Clock, MapPin, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/AuthContext';
import { TwoFactorAuth } from './security/TwoFactorAuth';
import { SecurityDashboard } from './security/SecurityDashboard';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LoginHistory {
  timestamp: Date;
  device: string;
  location: string;
  ipAddress: string;
}

interface TrustedDevice {
  id: string;
  name: string;
  addedDate: Date;
  lastUsed: Date;
  deviceType: string;
}

const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({ isOpen, onClose }) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadSecuritySettings();
    }
  }, [isOpen, currentUser]);

  const loadSecuritySettings = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      setTwoFactorEnabled(userData?.security?.twoFactorEnabled || false);

      // Load login history
      const history = userData?.security?.loginHistory || [];
      setLoginHistory(
        history.map((entry: any) => ({
          timestamp: entry.timestamp?.toDate() || new Date(),
          device: entry.device || 'Unknown Device',
          location: entry.location || 'Unknown Location',
          ipAddress: entry.ipAddress || 'Unknown IP'
        }))
      );

      // Load trusted devices
      const devices = userData?.security?.trustedDevices || [];
      setTrustedDevices(
        devices.map((device: any) => ({
          id: device.id,
          name: device.name,
          addedDate: device.addedDate?.toDate() || new Date(),
          lastUsed: device.lastUsed?.toDate() || new Date(),
          deviceType: device.deviceType
        }))
      );
    } catch (error) {
      console.error('Error loading security settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!currentUser) return;

    try {
      // In production, this would:
      // 1. Generate TOTP secret
      // 2. Show QR code for authenticator app
      // 3. Verify code before enabling
      
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        'security.twoFactorEnabled': true,
        'security.twoFactorEnabledAt': serverTimestamp()
      });

      setTwoFactorEnabled(true);
      setShowSetup2FA(false);
      setVerificationCode('');
    } catch (error) {
      console.error('Error enabling 2FA:', error);
    }
  };

  const handleDisable2FA = async () => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        'security.twoFactorEnabled': false,
        'security.twoFactorDisabledAt': serverTimestamp()
      });

      setTwoFactorEnabled(false);
    } catch (error) {
      console.error('Error disabling 2FA:', error);
    }
  };

  const handleRemoveTrustedDevice = async (deviceId: string) => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const updatedDevices = trustedDevices.filter(d => d.id !== deviceId);
      
      await updateDoc(userRef, {
        'security.trustedDevices': updatedDevices
      });

      setTrustedDevices(updatedDevices);
    } catch (error) {
      console.error('Error removing device:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[130] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-zoom-in-95">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Security Settings</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading security settings...</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Security Dashboard Button */}
            <div className="bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] rounded-xl p-6 text-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5" />
                    Security Dashboard
                  </h3>
                  <p className="text-sm text-white/90">
                    Monitor your account security, view login history, and track failed attempts
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSecurityDashboard(true)}
                className="w-full bg-white text-[#00E5FF] rounded-lg py-3 font-bold hover:shadow-lg transition"
              >
                View Security Dashboard
              </button>
            </div>

            {/* Two-Factor Authentication */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-600" />
                    Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${twoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                  {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>

              {!twoFactorEnabled ? (
                <button
                  onClick={() => setShow2FAModal(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg py-3 font-semibold hover:shadow-lg transition"
                >
                  Enable Two-Factor Authentication
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => setShow2FAModal(true)}
                    className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 transition"
                  >
                    Manage 2FA Settings
                  </button>
                  <button
                    onClick={handleDisable2FA}
                    className="w-full bg-red-600 text-white rounded-lg py-3 font-semibold hover:bg-red-700 transition"
                  >
                    Disable Two-Factor Authentication
                  </button>
                </div>
              )}
            </div>

            {/* Login History */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-purple-600" />
                Recent Login Activity
              </h3>
              <div className="space-y-3">
                {loginHistory.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">No login history available</p>
                ) : (
                  loginHistory.slice(0, 5).map((entry, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 flex items-start gap-4">
                      <Smartphone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold">{entry.device}</p>
                          <p className="text-sm text-gray-600">{entry.timestamp.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {entry.location}
                          </span>
                          <span>IP: {entry.ipAddress}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Trusted Devices */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                <Smartphone className="w-5 h-5 text-purple-600" />
                Trusted Devices
              </h3>
              <div className="space-y-3">
                {trustedDevices.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">No trusted devices</p>
                ) : (
                  trustedDevices.map((device) => (
                    <div key={device.id} className="bg-white rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{device.name}</p>
                        <p className="text-sm text-gray-600">
                          {device.deviceType} • Added {device.addedDate.toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Last used: {device.lastUsed.toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveTrustedDevice(device.id)}
                        className="text-red-600 hover:text-red-700 font-semibold text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2FA Setup Modal */}
        {showSetup2FA && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[140] p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 animate-zoom-in-95">
              <h3 className="text-xl font-bold mb-4">Enable Two-Factor Authentication</h3>
              
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  1. Download an authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  2. Scan this QR code with your app:
                </p>
                <div className="bg-white rounded-lg p-4 flex items-center justify-center">
                  {/* Placeholder QR code */}
                  <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500 text-sm">QR Code</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Or enter this code manually:
                </p>
                <div className="bg-white rounded-lg p-3 mt-2 flex items-center justify-between">
                  <code className="font-mono text-sm">
                    {showCode ? 'ABCD-EFGH-IJKL-MNOP' : '••••••••••••••••'}
                  </code>
                  <button
                    onClick={() => setShowCode(!showCode)}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter verification code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSetup2FA(false);
                    setVerificationCode('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEnable2FA}
                  disabled={verificationCode.length !== 6}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enable
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2FA Modal */}
      {show2FAModal && currentUser && (
        <TwoFactorAuth
          userId={currentUser.uid}
          userEmail={currentUser.email || ''}
          onClose={() => {
            setShow2FAModal(false);
            loadSecuritySettings();
          }}
        />
      )}

      {/* Security Dashboard */}
      {showSecurityDashboard && currentUser && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold text-[#1E0E62]">Security Dashboard</h2>
            <button
              onClick={() => setShowSecurityDashboard(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <SecurityDashboard
            userId={currentUser.uid}
            onEnable2FA={() => {
              setShowSecurityDashboard(false);
              setShow2FAModal(true);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default SecuritySettingsModal;

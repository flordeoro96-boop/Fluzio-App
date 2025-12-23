import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, Smartphone, Globe } from 'lucide-react';

interface SecurityLog {
  id: string;
  type: 'LOGIN' | 'FAILED_LOGIN' | 'PASSWORD_CHANGE' | '2FA_ENABLED' | '2FA_DISABLED' | 'DEVICE_NEW';
  timestamp: Date;
  ipAddress: string;
  location: string;
  device: string;
  success: boolean;
}

interface SecurityDashboardProps {
  userId: string;
  onEnable2FA: () => void;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  userId,
  onEnable2FA
}) => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [stats, setStats] = useState({
    totalLogins: 0,
    failedAttempts: 0,
    activeSessions: 1,
    twoFactorEnabled: false,
    lastPasswordChange: new Date(),
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, [userId]);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      // TODO: Fetch from Firestore
      // Mock data for now
      const mockLogs: SecurityLog[] = [
        {
          id: '1',
          type: 'LOGIN',
          timestamp: new Date('2025-12-05T10:30:00'),
          ipAddress: '192.168.1.1',
          location: 'Berlin, Germany',
          device: 'Chrome on Windows',
          success: true,
        },
        {
          id: '2',
          type: 'FAILED_LOGIN',
          timestamp: new Date('2025-12-04T18:45:00'),
          ipAddress: '203.45.67.89',
          location: 'Unknown',
          device: 'Chrome on Android',
          success: false,
        },
        {
          id: '3',
          type: 'LOGIN',
          timestamp: new Date('2025-12-04T09:15:00'),
          ipAddress: '192.168.1.1',
          location: 'Berlin, Germany',
          device: 'Safari on iPhone',
          success: true,
        },
      ];

      setLogs(mockLogs);
      setStats({
        totalLogins: 127,
        failedAttempts: 3,
        activeSessions: 1,
        twoFactorEnabled: false,
        lastPasswordChange: new Date('2025-11-01'),
      });
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLogIcon = (type: SecurityLog['type']) => {
    switch (type) {
      case 'LOGIN':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'FAILED_LOGIN':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'PASSWORD_CHANGE':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case '2FA_ENABLED':
        return <Shield className="w-4 h-4 text-green-600" />;
      case '2FA_DISABLED':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'DEVICE_NEW':
        return <Smartphone className="w-4 h-4 text-purple-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getLogColor = (type: SecurityLog['type']) => {
    switch (type) {
      case 'LOGIN':
        return 'bg-green-50 border-green-200';
      case 'FAILED_LOGIN':
        return 'bg-red-50 border-red-200';
      case 'PASSWORD_CHANGE':
      case '2FA_ENABLED':
        return 'bg-blue-50 border-blue-200';
      case '2FA_DISABLED':
        return 'bg-orange-50 border-orange-200';
      case 'DEVICE_NEW':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getLogLabel = (type: SecurityLog['type']) => {
    switch (type) {
      case 'LOGIN':
        return 'Successful Login';
      case 'FAILED_LOGIN':
        return 'Failed Login Attempt';
      case 'PASSWORD_CHANGE':
        return 'Password Changed';
      case '2FA_ENABLED':
        return '2FA Enabled';
      case '2FA_DISABLED':
        return '2FA Disabled';
      case 'DEVICE_NEW':
        return 'New Device Detected';
      default:
        return 'Unknown Event';
    }
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00E5FF] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1E0E62]">Security Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your account security and activity</p>
        </div>

        {/* Security Score */}
        <div className="bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold mb-1">Security Score</h2>
              <p className="text-white/80 text-sm">Your account security rating</p>
            </div>
            <Shield className="w-12 h-12 text-white/50" />
          </div>
          
          <div className="flex items-end gap-2 mb-2">
            <div className="text-5xl font-bold">
              {stats.twoFactorEnabled ? '85' : '60'}
            </div>
            <div className="text-2xl font-bold text-white/70 mb-2">/100</div>
          </div>

          <div className="w-full bg-white/20 rounded-full h-2 mb-4">
            <div
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${stats.twoFactorEnabled ? '85%' : '60%'}` }}
            ></div>
          </div>

          {!stats.twoFactorEnabled && (
            <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-medium">Enable 2FA to improve your score</span>
              </div>
              <button
                onClick={onEnable2FA}
                className="px-4 py-2 bg-white text-[#00E5FF] rounded-lg font-bold text-sm hover:shadow-lg transition-all"
              >
                Enable
              </button>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">Total Logins</div>
            <div className="text-2xl font-bold text-[#1E0E62]">{stats.totalLogins}</div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">Failed Attempts</div>
            <div className="text-2xl font-bold text-red-600">{stats.failedAttempts}</div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">Active Sessions</div>
            <div className="text-2xl font-bold text-green-600">{stats.activeSessions}</div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">2FA Status</div>
            <div className={`text-sm font-bold ${stats.twoFactorEnabled ? 'text-green-600' : 'text-gray-400'}`}>
              {stats.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </div>

        {/* Security Recommendations */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-bold text-lg text-[#1E0E62] mb-4">Security Recommendations</h3>
          
          <div className="space-y-3">
            {!stats.twoFactorEnabled && (
              <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-bold text-orange-900 mb-1">Enable Two-Factor Authentication</h4>
                  <p className="text-sm text-orange-700">Add an extra layer of security to your account</p>
                </div>
                <button
                  onClick={onEnable2FA}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg font-bold text-sm hover:bg-orange-700 transition-colors whitespace-nowrap"
                >
                  Enable Now
                </button>
              </div>
            )}

            {stats.failedAttempts > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-bold text-red-900 mb-1">Failed Login Attempts Detected</h4>
                  <p className="text-sm text-red-700">
                    {stats.failedAttempts} failed login attempt{stats.failedAttempts > 1 ? 's' : ''} in the last 7 days
                  </p>
                </div>
              </div>
            )}

            {new Date().getTime() - stats.lastPasswordChange.getTime() > 90 * 24 * 60 * 60 * 1000 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-bold text-blue-900 mb-1">Update Your Password</h4>
                  <p className="text-sm text-blue-700">
                    Last changed {Math.floor((new Date().getTime() - stats.lastPasswordChange.getTime()) / (24 * 60 * 60 * 1000))} days ago
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-lg text-[#1E0E62] mb-4">Recent Activity</h3>
          
          <div className="space-y-3">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No recent activity</p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 border rounded-xl ${getLogColor(log.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getLogIcon(log.type)}</div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-bold text-[#1E0E62]">{getLogLabel(log.type)}</h4>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatRelativeTime(log.timestamp)}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5" />
                          <span className="truncate">{log.ipAddress} • {log.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-3.5 h-3.5" />
                          <span className="truncate">{log.device}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

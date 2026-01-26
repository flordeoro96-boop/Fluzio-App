/**
 * Code Validation Widget for Online Rewards
 * 
 * Allows businesses to manually validate alphanumeric codes
 * - Input field for code entry
 * - Server-side validation
 * - One-time use enforcement
 * - Audit trail logging
 */

import React, { useState } from 'react';
import {
  validateAlphanumericCode,
  verifyOnlineConnection,
  isValidCodeFormat
} from '../services/rewardValidationService';
import { CustomerRedemption } from '../types/rewards';
// import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiLock } from 'react-icons/fi'; // TODO: Install package

interface CodeValidationWidgetProps {
  businessId: string;
  staffId?: string;
  staffName?: string;
  onValidationSuccess?: (redemption: CustomerRedemption) => void;
  onValidationError?: (error: string) => void;
}

export const CodeValidationWidget: React.FC<CodeValidationWidgetProps> = ({
  businessId,
  staffId,
  staffName,
  onValidationSuccess,
  onValidationError
}) => {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    redemption?: CustomerRedemption;
  } | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [processing, setProcessing] = useState(false);

  const handleValidate = async () => {
    // Clear previous results
    setResult(null);

    // Validate input
    if (!code.trim()) {
      setResult({
        type: 'error',
        message: 'Please enter a redemption code'
      });
      return;
    }

    setProcessing(true);

    try {
      // Check internet connection
      const online = await verifyOnlineConnection();
      setIsOnline(online);

      if (!online) {
        setResult({
          type: 'error',
          message: '❌ No internet connection. Please connect to validate codes.'
        });
        onValidationError?.('No internet connection');
        setProcessing(false);
        return;
      }

      // Validate code format (client-side check)
      if (!isValidCodeFormat(code, 'ALPHANUMERIC')) {
        setResult({
          type: 'warning',
          message: '⚠️ Code format looks incorrect. Proceeding with validation...'
        });
      }

      // Get device metadata for fraud detection
      const metadata = {
        ipAddress: await getIPAddress(),
        deviceId: getDeviceId()
      };

      console.log('[CodeValidation] Validating code:', code);

      // Validate with backend
      const validationResult = await validateAlphanumericCode(
        code,
        businessId,
        staffId || 'ONLINE_SYSTEM',
        metadata
      );

      if (validationResult.valid) {
        setResult({
          type: 'success',
          message: `✅ ${validationResult.message}`,
          redemption: validationResult.redemption
        });
        onValidationSuccess?.(validationResult.redemption!);

        // Clear input and show success for 5 seconds
        setCode('');
        setTimeout(() => {
          setResult(null);
        }, 5000);
      } else {
        setResult({
          type: 'error',
          message: `❌ ${validationResult.message}`,
          redemption: validationResult.redemption
        });
        onValidationError?.(validationResult.error || 'Validation failed');
      }
    } catch (error) {
      console.error('[CodeValidation] Error:', error);
      setResult({
        type: 'error',
        message: '❌ Validation failed. Please check the code and try again.'
      });
      onValidationError?.(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setProcessing(false);
    }
  };

  // Get device IP address (for fraud detection)
  const getIPAddress = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  // Get device fingerprint (for fraud detection)
  const getDeviceId = (): string => {
    let deviceId = localStorage.getItem('beevvy_device_id');
    
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('beevvy_device_id', deviceId);
    }
    
    return deviceId;
  };

  // Format code as user types (add dashes for readability)
  const handleCodeChange = (value: string) => {
    // Remove non-alphanumeric characters
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    
    // Format with dashes (XXXX-XXXX-XXXX)
    let formatted = '';
    for (let i = 0; i < cleaned.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += '-';
      }
      formatted += cleaned[i];
    }
    
    setCode(formatted);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !processing) {
      handleValidate();
    }
  };

  return (
    <div className="code-validation-widget bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-blue-600">🔒</span>
          Validate Redemption Code
        </h2>
        {staffName && (
          <p className="text-sm text-gray-600 mt-1">
            Validated by: {staffName}
          </p>
        )}
      </div>

      {/* Online Status Warning */}
      {!isOnline && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <span className="flex-shrink-0">⚠️</span>
          <span className="text-sm">
            No internet connection. Validation requires an active internet connection.
          </span>
        </div>
      )}

      {/* Code Input Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter Redemption Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="XXXX-XXXX-XXXX"
            maxLength={14} // 12 chars + 2 dashes
            disabled={processing || !isOnline}
            className={`w-full px-4 py-3 border-2 rounded-lg text-center text-lg font-mono tracking-wider uppercase transition-colors ${
              processing || !isOnline
                ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                : 'bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
            }`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: XXXX-XXXX-XXXX (dashes optional)
          </p>
        </div>

        {/* Validate Button */}
        <button
          onClick={handleValidate}
          disabled={processing || !isOnline || !code.trim()}
          className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
            processing || !isOnline || !code.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Validating...
            </>
          ) : (
            <>
              <span>🔒</span>
              Validate Code
            </>
          )}
        </button>
      </div>

      {/* Validation Result */}
      {result && (
        <div className={`mt-4 p-4 rounded-lg border-2 ${
          result.type === 'success'
            ? 'bg-green-50 border-green-500'
            : result.type === 'warning'
            ? 'bg-yellow-50 border-yellow-500'
            : 'bg-red-50 border-red-500'
        }`}>
          <div className="flex items-start gap-3">
            {result.type === 'success' ? (
              <span className="text-green-600 flex-shrink-0 mt-1 text-2xl">✓</span>
            ) : (
              <span className={`flex-shrink-0 mt-1 text-2xl ${
                result.type === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }`}>✗</span>
            )}
            
            <div className="flex-1">
              <p className={`font-semibold ${
                result.type === 'success'
                  ? 'text-green-800'
                  : result.type === 'warning'
                  ? 'text-yellow-800'
                  : 'text-red-800'
              }`}>
                {result.message}
              </p>
              
              {/* Show redemption details on success */}
              {result.redemption && result.type === 'success' && (
                <div className="mt-3 pt-3 border-t border-green-200 space-y-1 text-sm">
                  <p><strong>Reward:</strong> {result.redemption.reward?.title}</p>
                  <p><strong>Customer:</strong> {result.redemption.userName}</p>
                  <p><strong>Points Spent:</strong> {result.redemption.pointsSpent}</p>
                  <p className="text-xs text-green-700 mt-2">
                    Validated at {new Date().toLocaleTimeString()}
                  </p>
                </div>
              )}
              
              {/* Show redemption details if already used */}
              {result.redemption && result.type === 'error' && result.redemption.validatedAt && (
                <div className="mt-2 text-sm text-red-700">
                  <p>Already validated on {new Date(result.redemption.validatedAt).toLocaleDateString()}</p>
                  {result.redemption.validatedBy && (
                    <p>By: {result.redemption.validatedBy}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">How to Use:</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Customer shows you their redemption code</li>
          <li>Enter the code exactly as shown (dashes optional)</li>
          <li>Click "Validate Code" to verify and redeem</li>
          <li>Each code can only be used ONCE</li>
          <li>Requires active internet connection</li>
        </ol>
        
        <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-900">
          <strong>Security Note:</strong> All validations are logged with timestamp, staff ID, and device information for audit purposes.
        </div>
      </div>
    </div>
  );
};

export default CodeValidationWidget;

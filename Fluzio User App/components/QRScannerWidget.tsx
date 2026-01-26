/**
 * QR Scanner Widget for Business Staff
 * 
 * Allows business staff to scan customer QR codes and validate rewards
 * - Camera access via browser API
 * - Real-time QR detection
 * - One-time use validation (prevents reuse)
 * - Offline abuse prevention (requires network)
 */

import React, { useState, useRef, useEffect } from 'react';
// import { QrReader } from 'react-qr-reader'; // TODO: Install package
import {
  validateQRCode,
  verifyOnlineConnection,
  isValidCodeFormat
} from '../services/rewardValidationService';
import { CustomerRedemption } from '../types/rewards';
// import { FiCamera, FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi'; // TODO: Install package

interface QRScannerWidgetProps {
  businessId: string;
  staffId: string;
  staffName: string;
  onValidationSuccess?: (redemption: CustomerRedemption) => void;
  onValidationError?: (error: string) => void;
}

export const QRScannerWidget: React.FC<QRScannerWidgetProps> = ({
  businessId,
  staffId,
  staffName,
  onValidationSuccess,
  onValidationError
}) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    redemption?: CustomerRedemption;
  } | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [processing, setProcessing] = useState(false);
  const lastScannedRef = useRef<string>('');

  // Check internet connection on mount
  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    const online = await verifyOnlineConnection();
    setIsOnline(online);
  };

  const handleScan = async (data: string | null) => {
    if (!data || processing) return;

    // Prevent duplicate scans
    if (data === lastScannedRef.current) {
      return;
    }

    lastScannedRef.current = data;
    setProcessing(true);

    try {
      // Check if device is online (prevent offline abuse)
      if (!isOnline) {
        setResult({
          type: 'error',
          message: '❌ No internet connection. Please connect to validate rewards.'
        });
        onValidationError?.('No internet connection');
        setProcessing(false);
        return;
      }

      // Validate QR code format
      if (!isValidCodeFormat(data, 'QR')) {
        setResult({
          type: 'error',
          message: '❌ Invalid QR code format. This is not a valid Beevvy reward code.'
        });
        onValidationError?.('Invalid QR code format');
        setProcessing(false);
        return;
      }

      // Get device metadata for fraud detection
      const metadata = {
        ipAddress: await getIPAddress(),
        deviceId: getDeviceId()
      };

      console.log('[QRScanner] Validating code:', data);

      // Validate with backend
      const validationResult = await validateQRCode(
        data,
        businessId,
        staffId,
        metadata
      );

      if (validationResult.valid) {
        setResult({
          type: 'success',
          message: `✅ ${validationResult.message}`,
          redemption: validationResult.redemption
        });
        onValidationSuccess?.(validationResult.redemption!);

        // Auto-clear success message after 5 seconds
        setTimeout(() => {
          setResult(null);
          lastScannedRef.current = '';
        }, 5000);
      } else {
        setResult({
          type: 'error',
          message: `❌ ${validationResult.message}`,
          redemption: validationResult.redemption
        });
        onValidationError?.(validationResult.error || 'Validation failed');

        // Clear error after 8 seconds
        setTimeout(() => {
          setResult(null);
          lastScannedRef.current = '';
        }, 8000);
      }
    } catch (error) {
      console.error('[QRScanner] Error:', error);
      setResult({
        type: 'error',
        message: '❌ Validation failed. Please try again or contact support.'
      });
      onValidationError?.(error instanceof Error ? error.message : 'Unknown error');

      setTimeout(() => {
        setResult(null);
        lastScannedRef.current = '';
      }, 8000);
    } finally {
      setProcessing(false);
    }
  };

  const handleError = (error: any) => {
    console.error('[QRScanner] Camera error:', error);
    setResult({
      type: 'error',
      message: '❌ Camera access denied. Please enable camera permissions in your browser settings.'
    });
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

  return (
    <div className="qr-scanner-widget bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-blue-600">📷</span>
          Scan Reward QR Code
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Validated by: {staffName}
        </p>
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

      {/* Scanner Section */}
      {!scanning ? (
        <div className="text-center py-8">
          <button
            onClick={() => setScanning(true)}
            disabled={!isOnline}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 mx-auto transition-colors ${
              isOnline
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <span>📷</span>
            Start Scanning
          </button>
          <p className="text-sm text-gray-500 mt-3">
            Point your camera at the customer's QR code
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* QR Reader */}
          <div className="qr-reader-container rounded-lg overflow-hidden border-2 border-gray-300">
            {/* <QrReader
              onResult={(result: any, error: any) => {
                if (result) {
                  handleScan(result?.text);
                }
                if (error) {
                  handleError(error);
                }
              }}
              constraints={{ facingMode: selectedCamera }}
              containerStyle={{ width: '100%' }}
            /> */}
            <div className="bg-gray-100 p-8 text-center rounded-lg">
              <p className="text-gray-600">QR Scanner requires react-qr-reader package</p>
            </div>
          </div>

          {/* Processing Indicator */}
          {processing && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="bg-white p-4 rounded-lg shadow-xl">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                <p className="text-sm text-gray-700 mt-2 font-medium">
                  Validating...
                </p>
              </div>
            </div>
          )}

          {/* Stop Button */}
          <button
            onClick={() => {
              setScanning(false);
              setResult(null);
              lastScannedRef.current = '';
            }}
            className="mt-4 w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Stop Scanning
          </button>
        </div>
      )}

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
          <li>Click "Start Scanning" to activate the camera</li>
          <li>Point your camera at the customer's QR code</li>
          <li>The system will automatically validate the reward</li>
          <li>Each code can only be used ONCE</li>
          <li>Requires active internet connection</li>
        </ol>
      </div>
    </div>
  );
};

export default QRScannerWidget;

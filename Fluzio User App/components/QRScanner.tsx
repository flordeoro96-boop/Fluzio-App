import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, AlertCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ isOpen, onClose, onScan }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Stop scanner when modal closes
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
      return;
    }

    // Start scanner
    startScanner();

    return () => {
      // Cleanup on unmount
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setError(null);
      
      // Initialize Html5Qrcode scanner
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      const config = {
        fps: 10, // Scans per second
        qrbox: { width: 250, height: 250 }, // Scanning box size
        aspectRatio: 1.0,
        videoConstraints: {
          facingMode: 'environment', // Use back camera
          advanced: [
            { width: { min: 1280, ideal: 1920, max: 3840 } },
            { height: { min: 720, ideal: 1080, max: 2160 } },
            { focusMode: 'continuous' }
          ]
        }
      };

      await scanner.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          console.log('[QRScanner] ✅ QR Code detected:', decodedText);
          
          // Stop scanner
          scanner.stop().then(() => {
            onScan(decodedText);
            onClose();
          }).catch(console.error);
        },
        (errorMessage) => {
          // Silent error - scanning continuously
        }
      );

      setScanning(true);
    } catch (err) {
      console.error('[QRScanner] Scanner error:', err);
      setError('Camera access denied. Please enable camera permissions in your browser settings.');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (scannerRef.current) {
        const decodedText = await scannerRef.current.scanFile(file, true);
        console.log('[QRScanner] ✅ QR Code detected from file:', decodedText);
        
        // Stop scanner
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        
        onScan(decodedText);
        onClose();
      }
    } catch (err) {
      console.error('[QRScanner] Error scanning file:', err);
      alert('No QR code found in the image. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-white">
          <div className="font-bold text-lg">Scan QR Code</div>
          <div className="text-xs text-white/70">Position the QR code within the frame</div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scanner View */}
      <div className="flex-1 flex items-center justify-center relative">
        {error ? (
          <div className="text-center px-6 max-w-sm">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <div className="text-white font-bold mb-2">Camera Access Required</div>
            <div className="text-white/70 text-sm mb-4">{error}</div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* QR Scanner container */}
            <div id="qr-reader" className="w-full max-w-md mx-auto"></div>

            {/* Camera icon indicator */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
              <Camera className="w-4 h-4 text-[#00E5FF] animate-pulse" />
              <span className="text-white text-sm font-medium">Scanning for QR code...</span>
            </div>
            
            {/* Native Camera Button */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-[#00E5FF] text-black rounded-full font-bold hover:bg-[#00D4E8] transition-colors shadow-lg"
              >
                Use Phone Camera
              </button>
              <p className="text-white/70 text-xs">Better quality option</p>
            </div>
            
            {/* Instructions */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 text-center max-w-xs px-4">
              <p className="text-white text-xs bg-black/50 backdrop-blur-md px-3 py-2 rounded-lg">
                Point your camera at the QR code displayed at the business
              </p>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(256px);
          }
          100% {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

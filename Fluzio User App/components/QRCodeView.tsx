import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';
import { X, Download, Printer, Package } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface QRCodeViewProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({ isOpen, onClose, user }) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const downloadCanvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useTranslation();
  
  // Generate QR data
  const qrData = JSON.stringify({
    type: 'FLUZIO_CHECK_IN',
    businessId: user.id,
    businessName: user.name,
    timestamp: Date.now()
  });

  const handleDownload = () => {
    try {
      // Use the hidden download canvas (without logo to avoid CORS issues)
      const canvas = downloadCanvasRef.current;
      if (!canvas) {
        console.error('[QRCodeView] Download canvas not found');
        alert('Error: QR code canvas not ready. Please wait a moment and try again.');
        return;
      }
      
      console.log('[QRCodeView] Starting download...');
      
      // Convert canvas to high-quality PNG
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('[QRCodeView] Failed to create blob from canvas');
          alert('Error: Failed to generate QR code image. Please try again.');
          return;
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = `${user.name.replace(/\s+/g, '-')}-fluzio-qr.png`;
        link.download = fileName;
        document.body.appendChild(link); // Required for Firefox
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('[QRCodeView] ✅ Download initiated:', fileName);
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('[QRCodeView] Download error:', error);
      alert(`Error downloading QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };
  
  const handleOrderEngraved = () => {
    // TODO: Implement order flow for professionally engraved QR codes
    alert('🎨 Professional Engraving Service\n\nWe can engrave your QR code on:\n• Acrylic signs\n• Metal plaques\n• Wood panels\n• Window decals\n\nContact support@fluzio.com to order!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-[32px] max-w-lg w-full p-8 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 relative" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
        
        {/* Hidden canvas for download (no logo to avoid CORS issues) */}
        <div style={{ position: 'absolute', left: '-9999px' }}>
          <QRCodeCanvas
            value={qrData}
            size={512}
            level="H"
            includeMargin={true}
            ref={downloadCanvasRef}
          />
        </div>
        
        {/* QR Code Display */}
        <div className="bg-gradient-to-br from-[#00E5FF]/10 to-[#6C4BFF]/10 rounded-3xl p-8 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg mx-auto w-fit" ref={qrRef}>
            <QRCodeCanvas
              value={qrData}
              size={320}
              level="H" // High error correction for logo overlay
              includeMargin={true}
              imageSettings={{
                src: user.avatarUrl || user.photoUrl || '',
                height: 64,
                width: 64,
                excavate: true, // Cut out background behind logo
              }}
              style={{
                borderRadius: '12px',
              }}
            />
          </div>
          <div className="text-center mt-4">
            <div className="font-bold text-[#1E0E62] text-lg">{user.name}</div>
            <div className="text-xs text-[#8F8FA3] mt-1">{t('checkinQr.scanHint')}</div>
            <div className="text-xs text-blue-600 font-medium mt-2">✨ High Quality • Print Ready</div>
            <div className="text-xs text-gray-400 mt-1">(Downloaded QR will not include logo due to browser security)</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-bold hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              <Download className="w-5 h-5" />
              {t('checkinQr.download')}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg"
            >
              <Printer className="w-5 h-5" />
              {t('checkinQr.print')}
            </button>
          </div>
          
          {/* Professional Engraving Option */}
          <button
            onClick={handleOrderEngraved}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg border-2 border-purple-400"
          >
            <Package className="w-5 h-5" />
            Order Professional Engraving
          </button>
          <p className="text-xs text-center text-gray-500">
            Get a professionally engraved QR code sign for your store (Acrylic, Metal, or Wood)
          </p>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';
import { generateBusinessQRCode } from '../services/checkInService';
import { X, Download, Printer } from 'lucide-react';

interface QRCodeViewProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({ isOpen, onClose, user }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen && user) {
      const qrUrl = generateBusinessQRCode(user.id, user.name);
      setQrCodeUrl(qrUrl);
    }
  }, [isOpen, user]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${user.name}-qr-code.png`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] max-w-lg w-full p-8 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-clash font-bold text-2xl text-[#1E0E62]">{t('checkinQr.title')}</h2>
            <p className="text-sm text-[#8F8FA3] mt-1">{t('checkinQr.displayHint')}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* QR Code */}
        <div className="bg-gradient-to-br from-[#F72585]/10 to-[#7209B7]/10 rounded-3xl p-8 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg mx-auto w-fit">
            <img 
              src={qrCodeUrl} 
              alt={t('checkinQr.alt')}
              className="w-64 h-64 mx-auto"
            />
          </div>
          <div className="text-center mt-4">
            <div className="font-bold text-[#1E0E62] text-lg">{user.name}</div>
            <div className="text-xs text-[#8F8FA3] mt-1">{t('checkinQr.scanHint')}</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-2xl p-4 mb-6">
          <div className="text-xs font-bold text-blue-900 mb-2">{t('checkinQr.howItWorks')}</div>
          <ol className="text-xs text-blue-800 space-y-1">
            <li>1. {t('checkinQr.step1')}</li>
            <li>2. {t('checkinQr.step2')}</li>
            <li>3. {t('checkinQr.step3')}</li>
            <li>4. {t('checkinQr.step4')}</li>
          </ol>
        </div>

        {/* Action Buttons */}
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
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#F72585] to-[#7209B7] text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg"
          >
            <Printer className="w-5 h-5" />
            {t('checkinQr.print')}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sendEmailVerification } from '../services/authCompat';
import { auth } from '../services/AuthContext';
import { Mail, X, CheckCircle } from 'lucide-react';

interface EmailVerificationBannerProps {
  onDismiss?: () => void;
}

export const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({ onDismiss }) => {
  const { t } = useTranslation();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!auth.currentUser) return;

    setSending(true);
    setError(null);

    try {
      await sendEmailVerification(auth.currentUser);
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        setError(t('auth.tooManyRequests'));
      } else {
        setError(t('auth.emailSendFailed'));
      }
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-green-50 border-b border-green-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-800 font-medium flex-1">
            {t('auth.verificationSent')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        <Mail className="w-5 h-5 text-yellow-600 shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-yellow-800 font-medium">
            {t('auth.verifyEmailPrompt')}
          </p>
          {error && (
            <p className="text-xs text-red-600 mt-1">{error}</p>
          )}
        </div>
        <button
          onClick={handleResend}
          disabled={sending}
          className="text-sm font-bold text-yellow-800 hover:text-yellow-900 underline disabled:opacity-50"
        >
          {sending ? t('common.sending') : t('auth.resendEmail')}
        </button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-yellow-600 hover:text-yellow-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

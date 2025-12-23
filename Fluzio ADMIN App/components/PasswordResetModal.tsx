import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Input } from './Common';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/AuthContext';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError(t('auth.enterEmail'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError(t('auth.noAccountFound'));
      } else if (err.code === 'auth/invalid-email') {
        setError(t('auth.invalidEmail'));
      } else if (err.code === 'auth/too-many-requests') {
        setError(t('auth.tooManyRequests'));
      } else {
        setError(t('auth.resetFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError(null);
    setSent(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('auth.resetPassword')}>
      {sent ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-[#1E0E62] mb-2">{t('auth.checkEmail')}</h3>
          <p className="text-[#8F8FA3] mb-6">
            {t('auth.resetLinkSent')} <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            {t('auth.resetLinkExpires')}
          </p>
          <Button onClick={handleClose} className="w-full">
            {t('common.gotIt')}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center mb-4">
            <div className="w-12 h-12 bg-[#00E5FF]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-[#00E5FF]" />
            </div>
            <p className="text-[#8F8FA3] text-sm">
              {t('auth.resetInstructions')}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <Input
            type="email"
            label={t('auth.email')}
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoFocus
          />

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-full border-2 border-gray-200 text-[#1E0E62] font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <Button
              type="submit"
              isLoading={loading}
              disabled={loading}
              className="flex-1"
            >
              {t('auth.sendResetLink')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

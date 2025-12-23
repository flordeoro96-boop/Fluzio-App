import React, { useState } from 'react';
import { X, Mail, MessageCircle, Send, CheckCircle, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

type SupportCategory = 'account' | 'technical' | 'billing' | 'feature' | 'other';

export const ContactSupportModal: React.FC<ContactSupportModalProps> = ({
  isOpen,
  onClose,
  userEmail = '',
  userName = ''
}) => {
  const { t } = useTranslation();
  const [category, setCategory] = useState<SupportCategory>('technical');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(userEmail);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const categories: { value: SupportCategory; label: string; description: string }[] = [
    { value: 'account', label: 'Account Issues', description: 'Login, profile, settings' },
    { value: 'technical', label: 'Technical Problem', description: 'Bugs, errors, crashes' },
    { value: 'billing', label: 'Billing & Payments', description: 'Subscriptions, refunds' },
    { value: 'feature', label: 'Feature Request', description: 'Suggest new features' },
    { value: 'other', label: 'Other', description: 'General inquiries' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Replace with actual API call to support system
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In production, send to support ticketing system or email service
      const supportData = {
        name: userName,
        email,
        category,
        subject,
        message,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };

      console.log('Support ticket:', supportData);
      
      // Could integrate with:
      // - Zendesk API
      // - Intercom
      // - SendGrid for email
      // - Firebase Cloud Functions to send email

      setSuccess(true);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setSubject('');
        setMessage('');
        setCategory('technical');
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1000);
      }, 2000);
    } catch (error) {
      console.error('Failed to submit support ticket:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-[#1E0E62]">Contact Support</h2>
              <p className="text-sm text-gray-500">We'll get back to you within 24 hours</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-[#1E0E62] mb-2">Message Sent!</h3>
            <p className="text-gray-600">
              Our support team will review your message and respond within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-semibold text-[#1E0E62] mb-3">
                What can we help you with?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      category === cat.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-[#1E0E62]">{cat.label}</div>
                    <div className="text-sm text-gray-500 mt-1">{cat.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
                Your Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="Brief description of your issue"
                required
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-semibold text-[#1E0E62] mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                placeholder="Please provide as much detail as possible..."
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Minimum 20 characters ({message.length}/20)
              </p>
            </div>

            {/* Quick Links */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">Before you send...</p>
              <p className="text-sm text-blue-700">
                Check our{' '}
                <a href="#" className="underline font-semibold">Help Center</a>
                {' '}for instant answers to common questions.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading || message.length < 20}
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

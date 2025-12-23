import React, { useState, useEffect } from 'react';
import { X, Send, Briefcase, DollarSign, Calendar, Image, Link as LinkIcon, Plus, Trash2, Crown, AlertCircle } from 'lucide-react';
import { Button, Input, TextArea } from './Common';
import { submitProjectApplication } from '../services/projectService';
import { useAuth } from '../services/AuthContext';
import { getUserFeatures, calculateNetPayment } from '../services/creatorPlusService';
import { CreatorPlusModal } from './CreatorPlusModal';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  role: {
    id: string;
    title: string;
    budget: number;
    description?: string;
  };
  onSuccess?: () => void;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  role,
  onSuccess
}) => {
  const { userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    coverLetter: '',
    proposedRate: role.budget,
    startDate: '',
    endDate: '',
    portfolioSamples: [] as string[]
  });
  const [newPortfolioLink, setNewPortfolioLink] = useState('');
  const [commissionRate, setCommissionRate] = useState(0.12);
  const [netPayment, setNetPayment] = useState({ gross: 0, commission: 0, net: 0, rate: 0.12 });
  const [showCreatorPlus, setShowCreatorPlus] = useState(false);

  useEffect(() => {
    if (userProfile) {
      loadCommissionRate();
    }
  }, [userProfile]);

  useEffect(() => {
    calculatePayment();
  }, [formData.proposedRate, commissionRate]);

  const loadCommissionRate = async () => {
    if (!userProfile) return;
    const features = await getUserFeatures(userProfile.uid);
    setCommissionRate(features.commissionRate);
  };

  const calculatePayment = async () => {
    if (!userProfile) return;
    const payment = await calculateNetPayment(userProfile.uid, formData.proposedRate);
    setNetPayment(payment);
  };

  const handleSubmit = async () => {
    if (!userProfile) return;

    if (!formData.coverLetter.trim()) {
      alert('Please write a cover letter');
      return;
    }

    if (!formData.startDate) {
      alert('Please select your availability start date');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitProjectApplication({
        projectId,
        creatorId: userProfile.uid,
        creatorName: userProfile.name || 'Creator',
        creatorEmail: userProfile.email || '',
        creatorAvatar: userProfile.photoUrl,
        roleId: role.id,
        roleName: role.title,
        coverLetter: formData.coverLetter,
        proposedRate: formData.proposedRate,
        portfolioSamples: formData.portfolioSamples,
        availability: {
          startDate: formData.startDate,
          endDate: formData.endDate
        },
        appliedAt: new Date().toISOString()
      });

      if (result.success) {
        alert('Application submitted successfully! The business will review your application.');
        onSuccess?.();
        onClose();
      } else {
        alert(result.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-clash font-bold text-[#1E0E62]">Apply for Role</h2>
            <p className="text-sm text-[#8F8FA3] mt-1">{projectTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Role Info */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-5 h-5 text-[#6C4BFF]" />
              <h3 className="font-bold text-[#1E0E62]">{role.title}</h3>
            </div>
            {role.description && (
              <p className="text-sm text-[#8F8FA3] mb-2">{role.description}</p>
            )}
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-semibold text-[#1E0E62]">
                Budget: €{role.budget}
              </span>
            </div>
          </div>

          {/* Cover Letter */}
          <div>
            <label className="block text-sm font-bold text-[#1E0E62] mb-2">
              Cover Letter *
            </label>
            <TextArea
              value={formData.coverLetter}
              onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
              placeholder="Tell the business why you're the perfect fit for this role. Highlight relevant experience and what you can bring to the project..."
              rows={6}
              className="w-full"
            />
            <p className="text-xs text-[#8F8FA3] mt-1">
              {formData.coverLetter.length}/500 characters
            </p>
          </div>

          {/* Proposed Rate */}
          <div>
            <label className="block text-sm font-bold text-[#1E0E62] mb-2">
              Your Rate (Optional)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="number"
                value={formData.proposedRate}
                onChange={(e) => setFormData({ ...formData, proposedRate: Number(e.target.value) })}
                placeholder="Your proposed rate"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-[#8F8FA3] mt-1">
              Suggested budget: €{role.budget}. You can propose a different rate.
            </p>
          </div>

          {/* Availability */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#1E0E62] mb-2">
                Available From *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-[#1E0E62] mb-2">
                Available Until (Optional)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="pl-10"
                  min={formData.startDate}
                />
              </div>
            </div>
          </div>

          {/* Portfolio Samples */}
          <div>
            <label className="block text-sm font-bold text-[#1E0E62] mb-2">
              Portfolio Samples (Optional)
            </label>
            <p className="text-xs text-[#8F8FA3] mb-3">
              Add links to your best work relevant to this role (Instagram posts, YouTube videos, articles, etc.)
            </p>
            
            {/* Portfolio Links List */}
            {formData.portfolioSamples.length > 0 && (
              <div className="space-y-2 mb-3">
                {formData.portfolioSamples.map((link, index) => (
                  <div key={index} className="flex items-center gap-2 bg-purple-50 rounded-lg p-3">
                    <LinkIcon className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <a 
                      href={link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-purple-700 hover:underline flex-1 truncate"
                    >
                      {link}
                    </a>
                    <button
                      onClick={() => setFormData({
                        ...formData,
                        portfolioSamples: formData.portfolioSamples.filter((_, i) => i !== index)
                      })}
                      className="p-1 hover:bg-purple-100 rounded transition-colors text-purple-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Link Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={newPortfolioLink}
                  onChange={(e) => setNewPortfolioLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-gray-200 focus:border-purple-500 outline-none text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newPortfolioLink.trim()) {
                        setFormData({
                          ...formData,
                          portfolioSamples: [...formData.portfolioSamples, newPortfolioLink.trim()]
                        });
                        setNewPortfolioLink('');
                      }
                    }
                  }}
                />
              </div>
              <button
                onClick={() => {
                  if (newPortfolioLink.trim()) {
                    setFormData({
                      ...formData,
                      portfolioSamples: [...formData.portfolioSamples, newPortfolioLink.trim()]
                    });
                    setNewPortfolioLink('');
                  }
                }}
                disabled={!newPortfolioLink.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.coverLetter.trim() || !formData.startDate}
            variant="gradient"
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Application
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Creator Plus Modal */}
      {userProfile && (
        <CreatorPlusModal
          isOpen={showCreatorPlus}
          onClose={() => setShowCreatorPlus(false)}
          user={userProfile as any}
          onSubscribed={() => {
            setShowCreatorPlus(false);
            loadCommissionRate();
          }}
        />
      )}
    </div>
  );
};

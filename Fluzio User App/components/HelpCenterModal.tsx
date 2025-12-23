import React, { useState } from 'react';
import { X, HelpCircle, Search, ChevronRight, Book, MessageCircle, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactSupport?: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({
  isOpen,
  onClose,
  onContactSupport
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Topics', icon: Book },
    { id: 'account', label: 'Account', icon: FileText },
    { id: 'missions', label: 'Missions', icon: FileText },
    { id: 'rewards', label: 'Rewards', icon: FileText },
    { id: 'technical', label: 'Technical', icon: FileText }
  ];

  const faqs: FAQItem[] = [
    // Account & Profile
    {
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'Go to Settings > Security > Change Password. Enter your current password, then create a new password (minimum 8 characters). If you forgot your password, use "Forgot Password" on the login screen to receive a reset link via email.'
    },
    {
      category: 'account',
      question: 'How do I delete my account?',
      answer: 'Navigate to Settings > Account > Delete Account. WARNING: This is permanent and cannot be undone. You\'ll lose all your points, rewards, mission history, and profile data.'
    },
    {
      category: 'account',
      question: 'How do I change my profile picture?',
      answer: 'Tap your profile photo → Edit Profile → Tap the camera icon → Select new photo from gallery or take new photo → Tap "Save Changes". Recommended size: 512×512px.'
    },
    {
      category: 'account',
      question: 'Can I have multiple accounts?',
      answer: 'No. Each person is allowed only one account. Creating multiple accounts violates our Terms of Service and may result in permanent suspension of all accounts.'
    },
    {
      category: 'account',
      question: 'How do I connect my Instagram account?',
      answer: 'Go to Settings > Linked Accounts > Instagram. Tap "Connect Instagram" and login to your Instagram account. We only access basic profile info and public posts to verify mission completion. We NEVER post without your permission.'
    },

    // Missions & Points
    {
      category: 'missions',
      question: 'How do I apply for a mission?',
      answer: 'Browse missions in the Home or Explore tab. Tap on a mission card to view details. Read requirements carefully, then tap "Apply Now". The mission will appear in "My Missions" → "Active" tab where you can complete and submit it.'
    },
    {
      category: 'missions',
      question: 'How long does mission approval take?',
      answer: 'Most businesses review submissions within 24-48 hours. Some may take up to 5 days. You\'ll receive a notification when your submission is reviewed. Check "My Missions" → "In Review" for status.'
    },
    {
      category: 'missions',
      question: 'What happens if my submission is rejected?',
      answer: 'You\'ll receive a notification with the specific reason for rejection (e.g., "Missing required hashtag"). Read the reason carefully, fix the issue, and resubmit if the mission allows it. No points are deducted for rejections.'
    },
    {
      category: 'missions',
      question: 'Do points expire?',
      answer: 'No! Your points stay in your wallet forever. There are no expiration dates. However, some rewards may have expiration dates after redemption.'
    },
    {
      category: 'missions',
      question: 'What are daily streaks?',
      answer: 'Login every day to build your streak. Earn 10 points daily, plus bonus points at milestones: Day 7 (60 pts), Day 30 (275 pts), Day 100 (1,055 pts). Your streak resets if you miss a day.'
    },
    {
      category: 'missions',
      question: 'How many missions can I do at once?',
      answer: 'Unlimited! You can apply for and complete as many missions as you want simultaneously. Just make sure you can meet all the deadlines.'
    },
    {
      category: 'missions',
      question: 'Can I cancel a mission after applying?',
      answer: 'Yes, but only before submitting proof. Go to My Missions → Active → Select mission → Cancel Application. After submitting proof, you cannot cancel.'
    },
    {
      category: 'missions',
      question: 'What\'s the fastest way to earn points?',
      answer: '1) Daily Login (10 pts/day + streak bonuses), 2) Complete social media missions (100-500 pts), 3) Complete your profile (50 pts bonus), 4) Connect Instagram (25 pts), 5) Refer friends (100 pts per referral).'
    },

    // Rewards & Redemptions
    {
      category: 'rewards',
      question: 'How do I redeem my points for rewards?',
      answer: 'Go to Wallet → Browse Rewards. Select a reward you want, check the points cost and terms. Tap "Redeem Now" to confirm. You\'ll receive a QR code or redemption code to show at the business.'
    },
    {
      category: 'rewards',
      question: 'Do rewards expire?',
      answer: 'It depends on the business. Most rewards expire 30 days after redemption. Always check the reward details before redeeming. The expiration date will be shown on your redemption code.'
    },
    {
      category: 'rewards',
      question: 'Can I get a refund on a redeemed reward?',
      answer: 'Generally no, unless the business is closed/unavailable or there was a technical error. Contact support within 7 days if you have issues with a reward.'
    },
    {
      category: 'rewards',
      question: 'The business won\'t accept my reward. What should I do?',
      answer: '1) Show the QR code clearly, 2) Verify the reward hasn\'t expired, 3) Ask to speak with a manager, 4) Contact Fluzio support with your redemption code if the issue continues.'
    },
    {
      category: 'rewards',
      question: 'Can I use multiple rewards at once?',
      answer: 'It depends on the business\'s terms and conditions. Check each reward\'s description. Most businesses allow one reward per transaction or visit.'
    },

    // Technical Support
    {
      category: 'technical',
      question: 'The app is running slowly. What should I do?',
      answer: 'Try these steps: 1) Close and reopen the app, 2) Clear browser cache (Settings → Privacy), 3) Try a different browser (Chrome, Safari, Firefox), 4) Check internet connection, 5) Restart your device. Contact support if issues persist.'
    },
    {
      category: 'technical',
      question: 'I\'m not receiving notifications',
      answer: 'Check: 1) App settings: Settings → Notifications → Enable all types, 2) Device/browser notification permissions, 3) "Do Not Disturb" is off, 4) Try re-logging into the app, 5) Clear cache and refresh.'
    },
    {
      category: 'technical',
      question: 'Pictures won\'t upload',
      answer: 'Check: 1) File size (max 10 MB), 2) Format (JPG, PNG, HEIC supported), 3) Internet connection, 4) Try a different photo, 5) Compress large images using a photo editor.'
    },
    {
      category: 'technical',
      question: 'Location services not working',
      answer: 'Enable location: 1) Device Settings → Location → On, 2) Browser permissions for Fluzio, 3) Turn GPS on, 4) Refresh the app, 5) Manually set location in Settings if automatic detection fails.'
    },
    {
      category: 'technical',
      question: 'My points balance is incorrect',
      answer: 'Check: 1) Transaction History for all activity, 2) Pending points (missions in review), 3) Refunds from cancelled missions, 4) Refresh the app. Contact support with specific transaction details if the issue persists.'
    },
    {
      category: 'technical',
      question: 'Instagram won\'t connect',
      answer: 'Try: 1) Clear browser cache and cookies, 2) Use a different browser, 3) Ensure Instagram account is public (not private), 4) Check Instagram isn\'t down, 5) Disconnect and reconnect in Settings → Linked Accounts.'
    },

    // Social Media
    {
      category: 'account',
      question: 'What information does Fluzio access from Instagram?',
      answer: 'We only access: 1) Basic profile info (username, profile photo), 2) Public posts (to verify missions). We NEVER: Post on your behalf, access DMs, store passwords, or access private information. You can disconnect anytime.'
    },
    {
      category: 'missions',
      question: 'Can I complete missions with a private Instagram account?',
      answer: 'Most missions require public accounts so businesses can verify your posts. You may need to temporarily make your account public or skip Instagram missions. Check each mission\'s requirements.'
    },
    {
      category: 'missions',
      question: 'What if I don\'t have many Instagram followers?',
      answer: 'Many missions have low or no minimum follower requirements! Start with those, build your points and streak, then work up to higher-paying missions that require larger audiences.'
    },
    {
      category: 'missions',
      question: 'Can I delete my post after getting approved?',
      answer: 'No! This violates mission terms. Businesses may report you, leading to points deduction or account suspension. Posts should stay up for at least 30 days unless otherwise stated in mission requirements.'
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-[130] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white px-6 py-6 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-2xl">Help Center</h2>
                <p className="text-white/80 text-sm">Find answers to common questions</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white rounded-lg text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-white/50"
              placeholder="Search for help..."
            />
          </div>
        </div>

        {/* Categories */}
        <div className="px-6 py-4 border-b border-gray-200 shrink-0 overflow-x-auto">
          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  selectedCategory === cat.id
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="flex-1 overflow-y-auto">
          {filteredFAQs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6">
              <HelpCircle className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-[#1E0E62] mb-2">No results found</h3>
              <p className="text-gray-600 text-center max-w-sm">
                Try different keywords or browse by category
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredFAQs.map((faq, index) => (
                <div key={index} className="px-6 py-4">
                  <button
                    onClick={() => setExpandedId(expandedId === index ? null : index)}
                    className="w-full flex items-start justify-between gap-4 text-left group"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#1E0E62] group-hover:text-purple-600 transition-colors">
                        {faq.question}
                      </h3>
                      <span className="text-xs text-purple-600 font-medium uppercase mt-1 inline-block">
                        {categories.find(c => c.id === faq.category)?.label}
                      </span>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                      expandedId === index ? 'rotate-90' : ''
                    }`} />
                  </button>
                  {expandedId === index && (
                    <div className="mt-3 text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-lg p-4 animate-in slide-in-from-top duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-[#1E0E62]">Still need help?</p>
              <p className="text-sm text-gray-600">Our support team is here for you</p>
            </div>
            <button
              onClick={() => {
                onContactSupport?.();
                onClose();
              }}
              className="px-6 py-3 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

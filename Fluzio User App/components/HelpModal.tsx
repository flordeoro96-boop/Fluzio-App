import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  HelpCircle,
  MessageCircle,
  Mail,
  Book,
  Video,
  FileText,
  Search,
  ChevronRight,
  ExternalLink,
  Phone,
  Clock,
  CheckCircle
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!isOpen) return null;

  const faqs = [
    {
      category: 'Getting Started',
      icon: Book,
      questions: [
        {
          q: 'How do I complete my first mission?',
          a: 'Navigate to the Missions tab, browse available missions, and tap on one that interests you. Read the requirements carefully, then tap "Accept Mission" to get started. Follow the instructions and submit your proof when complete.'
        },
        {
          q: 'What are Beevvy credits and how do I earn them?',
          a: 'Beevvy credits are points you earn by completing missions, checking in at locations, and engaging with the community. You can redeem credits for rewards, upgrade your subscription, or unlock premium features.'
        },
        {
          q: 'How do I upgrade my subscription?',
          a: 'Go to Settings → Account → Subscription, or tap on your tier badge in the sidebar. Choose from Free, Silver, Gold, or Platinum plans. Higher tiers unlock more missions, better rewards, and creator features.'
        }
      ]
    },
    {
      category: 'Missions & Rewards',
      icon: CheckCircle,
      questions: [
        {
          q: 'Why was my mission submission rejected?',
          a: 'Submissions may be rejected if they don\'t meet the mission requirements, such as incorrect location, poor photo quality, or missing required elements. Check the rejection reason and resubmit with corrections.'
        },
        {
          q: 'How long does it take for missions to be approved?',
          a: 'Most missions are reviewed within 24-48 hours. Premium subscribers (Gold and Platinum) receive priority review and faster approval times.'
        },
        {
          q: 'Can I complete the same mission multiple times?',
          a: 'Most missions are one-time only per user. Some recurring missions may be completed multiple times as specified in the mission details.'
        }
      ]
    },
    {
      category: 'Creator Mode',
      icon: Video,
      questions: [
        {
          q: 'What is Creator Mode?',
          a: 'Creator Mode is available for Gold and Platinum subscribers. It allows you to showcase your skills, build a portfolio, and receive collaboration requests from businesses for paid partnerships.'
        },
        {
          q: 'How do I get collaboration requests?',
          a: 'Connect your social media accounts, add your skills and portfolio items, and complete missions to build your reputation. Businesses can then find and contact you for collaborations.'
        },
        {
          q: 'What should I include in my portfolio?',
          a: 'Add your best content showcasing your skills - photos, videos, previous collaborations, and examples of your work. High-quality, relevant content increases your chances of getting hired.'
        }
      ]
    },
    {
      category: 'Account & Privacy',
      icon: FileText,
      questions: [
        {
          q: 'How do I change my email or password?',
          a: 'Go to Settings → Account → Security to update your password. Email changes require verification to ensure account security.'
        },
        {
          q: 'Can I control who sees my profile?',
          a: 'Yes! Go to Settings → Privacy → Profile Visibility to choose between Public (everyone), Connections Only, or Private (only you).'
        },
        {
          q: 'How do I delete my account?',
          a: 'Go to Settings → Danger Zone → Delete Account. This action is permanent and cannot be undone. All your data will be permanently deleted.'
        }
      ]
    }
  ];

  const contactOptions = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team',
      action: 'Start Chat',
      available: true
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'support@beevvy.com',
      action: 'Send Email',
      available: true
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Premium members only',
      action: 'Call Now',
      available: false
    }
  ];

  const resources = [
    {
      icon: Book,
      title: 'User Guide',
      description: 'Complete documentation',
      link: '#'
    },
    {
      icon: Video,
      title: 'Video Tutorials',
      description: 'Learn with step-by-step videos',
      link: '#'
    },
    {
      icon: FileText,
      title: 'Terms & Privacy',
      description: 'Legal information',
      link: '#'
    }
  ];

  const filteredFaqs = selectedCategory
    ? faqs.filter(cat => cat.category === selectedCategory)
    : faqs;

  return (
    <div className="fixed inset-0 z-[130] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-2xl text-[#1E0E62] flex items-center gap-2">
                <HelpCircle className="w-7 h-7" />
                Help Center
              </h2>
              <p className="text-sm text-gray-600 mt-1">Find answers and get support</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            
            {/* Left Column - Categories */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    !selectedCategory 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  All Topics
                </button>
                {faqs.map((cat) => (
                  <button
                    key={cat.category}
                    onClick={() => setSelectedCategory(cat.category)}
                    className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                      selectedCategory === cat.category 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <cat.icon className="w-4 h-4" />
                    {cat.category}
                  </button>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-3">Resources</h3>
                <div className="space-y-2">
                  {resources.map((resource, idx) => (
                    <a
                      key={idx}
                      href={resource.link}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <resource.icon className="w-4 h-4 text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-700 group-hover:text-purple-600">
                          {resource.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {resource.description}
                        </div>
                      </div>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - FAQs */}
            <div className="lg:col-span-2 space-y-6">
              {filteredFaqs.map((category) => (
                <div key={category.category}>
                  <h3 className="text-lg font-bold text-[#1E0E62] mb-4 flex items-center gap-2">
                    <category.icon className="w-5 h-5 text-purple-600" />
                    {category.category}
                  </h3>
                  <div className="space-y-3">
                    {category.questions.map((faq, idx) => (
                      <details key={idx} className="group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                        <summary className="px-4 py-3 cursor-pointer flex items-center justify-between font-medium text-sm text-gray-700 hover:text-purple-600 transition-colors">
                          <span>{faq.q}</span>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" />
                        </summary>
                        <div className="px-4 py-3 border-t border-gray-200 bg-white text-sm text-gray-600 leading-relaxed">
                          {faq.a}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              ))}

              {/* Contact Support */}
              <div className="mt-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <h3 className="text-lg font-bold text-[#1E0E62] mb-2">Still need help?</h3>
                <p className="text-sm text-gray-600 mb-4">Our support team is here for you</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {contactOptions.map((option, idx) => (
                    <button
                      key={idx}
                      disabled={!option.available}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        option.available
                          ? 'border-purple-200 bg-white hover:border-purple-400 hover:shadow-md cursor-pointer'
                          : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <option.icon className={`w-6 h-6 mb-2 ${option.available ? 'text-purple-600' : 'text-gray-400'}`} />
                      <div className="font-bold text-sm text-[#1E0E62] mb-1">{option.title}</div>
                      <div className="text-xs text-gray-600 mb-2">{option.description}</div>
                      {option.available && (
                        <div className="text-xs font-bold text-purple-600">{option.action} →</div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Average response time: <strong>2-4 hours</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
          <p className="text-xs text-gray-600">
            Beevvy Help Center • Version 1.0.0 • Updated November 2025
          </p>
        </div>
      </div>
    </div>
  );
};

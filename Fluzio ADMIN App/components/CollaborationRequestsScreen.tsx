import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';
import { Card, Button, Badge } from './Common';
import { 
  ArrowLeft, Building2, Calendar, DollarSign, MapPin, 
  Check, X, MessageCircle, ExternalLink, Clock, Star,
  TrendingUp, Users, Package, Camera, Filter
} from 'lucide-react';
import { api } from '../services/apiService';
import { useAuth } from '../services/AuthContext';

interface CollaborationRequestsScreenProps {
  user: User;
  onBack: () => void;
  onOpenChat?: (businessId: string) => void;
}

interface CollaborationRequest {
  id: string;
  businessId: string;
  businessName: string;
  businessLogo?: string;
  businessCategory: string;
  title: string;
  description: string;
  compensation: {
    type: 'PAID' | 'BARTER' | 'EXPOSURE' | 'HYBRID';
    amount?: number;
    details: string;
  };
  deliverables: string[];
  timeline: string;
  location?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';
  createdAt: string;
  expiresAt?: string;
  requiredSkills?: string[];
  estimatedReach?: number;
}

const MOCK_REQUESTS: CollaborationRequest[] = [
  {
    id: 'collab-1',
    businessId: 'biz-1',
    businessName: 'Bean & Brew Café',
    businessLogo: 'https://i.pravatar.cc/150?img=60',
    businessCategory: 'GASTRONOMY',
    title: 'Instagram Reel Series - New Menu Launch',
    description: 'We\'re launching our winter menu and looking for a local food creator to produce 3 Instagram Reels showcasing our new drinks and desserts. Must have experience with food photography and short-form video.',
    compensation: {
      type: 'HYBRID',
      amount: 300,
      details: '€300 + Free products during shoots'
    },
    deliverables: [
      '3 Instagram Reels (15-30 seconds each)',
      '6 high-quality photos for our social media',
      'Usage rights for 6 months'
    ],
    timeline: '2 weeks',
    location: 'Berlin Mitte',
    status: 'PENDING',
    createdAt: '2024-01-15T10:00:00Z',
    expiresAt: '2024-02-15T23:59:59Z',
    requiredSkills: ['Photography', 'Video Editing', 'Social Media Management'],
    estimatedReach: 15000
  },
  {
    id: 'collab-2',
    businessId: 'biz-2',
    businessName: 'FitZone Studio',
    businessLogo: 'https://i.pravatar.cc/150?img=61',
    businessCategory: 'FITNESS',
    title: 'Fitness Challenge TikTok Campaign',
    description: '30-day fitness challenge content series. Looking for a fitness creator to document their journey at our gym and create daily TikTok content.',
    compensation: {
      type: 'BARTER',
      details: '3-month premium membership + personal training sessions'
    },
    deliverables: [
      '30 TikTok videos (one per day)',
      '5 Instagram Stories per week',
      'Final transformation post'
    ],
    timeline: '1 month',
    location: 'Berlin Prenzlauer Berg',
    status: 'PENDING',
    createdAt: '2024-01-14T14:30:00Z',
    requiredSkills: ['Video Production', 'Fitness'],
    estimatedReach: 8000
  },
  {
    id: 'collab-3',
    businessId: 'biz-3',
    businessName: 'StyleHub Boutique',
    businessLogo: 'https://i.pravatar.cc/150?img=62',
    businessCategory: 'RETAIL',
    title: 'Spring Collection Lookbook',
    description: 'Collaborate on creating a lookbook for our Spring 2024 collection. Need a fashion creator with strong styling and photography skills.',
    compensation: {
      type: 'PAID',
      amount: 500,
      details: '€500 + Keep one outfit from the collection'
    },
    deliverables: [
      '10 styled outfit photos',
      '2 YouTube Shorts',
      'Blog post featuring the collection'
    ],
    timeline: '3 weeks',
    location: 'Berlin Charlottenburg',
    status: 'ACCEPTED',
    createdAt: '2024-01-10T09:00:00Z',
    requiredSkills: ['Photography', 'Fashion', 'Blogging'],
    estimatedReach: 25000
  }
];

export const CollaborationRequestsScreen: React.FC<CollaborationRequestsScreenProps> = ({ 
  user, 
  onBack,
  onOpenChat 
}) => {
  const { userProfile } = useAuth();
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED'>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<CollaborationRequest | null>(null);
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    // TODO: Load actual collaboration requests from Firestore
    // For now, use mock data
    setRequests(MOCK_REQUESTS);
  }, [user.id]);

  const handleAcceptRequest = async (requestId: string) => {
    setIsResponding(true);
    try {
      // TODO: API call to accept collaboration
      // await api.acceptCollaboration(requestId);
      
      setRequests(requests.map(req =>
        req.id === requestId ? { ...req, status: 'ACCEPTED' } : req
      ));
      
      alert('Collaboration accepted! The business will be notified.');
    } catch (error) {
      console.error('Failed to accept collaboration:', error);
      alert('Failed to accept. Please try again.');
    } finally {
      setIsResponding(false);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    const confirmed = confirm('Decline this collaboration request?');
    if (!confirmed) return;

    setIsResponding(true);
    try {
      // TODO: API call to decline collaboration
      // await api.declineCollaboration(requestId);
      
      setRequests(requests.map(req =>
        req.id === requestId ? { ...req, status: 'DECLINED' } : req
      ));
      
      alert('Request declined.');
    } catch (error) {
      console.error('Failed to decline collaboration:', error);
      alert('Failed to decline. Please try again.');
    } finally {
      setIsResponding(false);
    }
  };

  const getCompensationBadge = (type: string) => {
    switch (type) {
      case 'PAID': return { color: 'bg-green-100 text-green-700', icon: DollarSign };
      case 'BARTER': return { color: 'bg-blue-100 text-blue-700', icon: Package };
      case 'EXPOSURE': return { color: 'bg-purple-100 text-purple-700', icon: TrendingUp };
      case 'HYBRID': return { color: 'bg-orange-100 text-orange-700', icon: Star };
      default: return { color: 'bg-gray-100 text-gray-700', icon: DollarSign };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return { color: 'bg-yellow-100 text-yellow-700', label: 'Pending' };
      case 'ACCEPTED': return { color: 'bg-green-100 text-green-700', label: 'Accepted' };
      case 'DECLINED': return { color: 'bg-red-100 text-red-700', label: 'Declined' };
      case 'COMPLETED': return { color: 'bg-blue-100 text-blue-700', label: 'Completed' };
      default: return { color: 'bg-gray-100 text-gray-700', label: status };
    }
  };

  const filteredRequests = filter === 'ALL' 
    ? requests 
    : requests.filter(req => req.status === filter);

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="fixed inset-0 bg-[#F8F9FE] z-50 overflow-y-auto pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-clash font-bold text-[#1E0E62]">Collaboration Requests</h1>
                <p className="text-sm text-[#8F8FA3] font-medium">
                  {pendingCount} pending request{pendingCount !== 1 ? 's' : ''} • {filteredRequests.length} total
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(['ALL', 'PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED'] as const).map(status => {
              const count = status === 'ALL' ? requests.length : requests.filter(r => r.status === status).length;
              return (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                    filter === status
                      ? 'bg-[#7209B7] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Empty State */}
        {filteredRequests.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#1E0E62] mb-2">
              {filter === 'ALL' ? 'No Collaboration Requests Yet' : `No ${filter.toLowerCase()} requests`}
            </h2>
            <p className="text-[#8F8FA3] max-w-md mx-auto">
              {filter === 'ALL' 
                ? 'Build your portfolio and complete missions to get discovered by businesses!'
                : `You don't have any ${filter.toLowerCase()} collaboration requests.`
              }
            </p>
          </div>
        )}

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.map(request => {
            const compensationBadge = getCompensationBadge(request.compensation.type);
            const statusBadge = getStatusBadge(request.status);
            const CompensationIcon = compensationBadge.icon;

            return (
              <Card key={request.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Business Logo */}
                      <img
                        src={request.businessLogo || 'https://via.placeholder.com/60'}
                        alt={request.businessName}
                        className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md"
                      />
                      
                      {/* Business Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-[#1E0E62] text-lg">{request.title}</h3>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusBadge.color}`}>
                            {statusBadge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-[#8F8FA3]">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {request.businessName}
                          </div>
                          {request.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {request.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Compensation Badge */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${compensationBadge.color}`}>
                      <CompensationIcon className="w-4 h-4" />
                      <div>
                        <div className="text-xs font-bold">{request.compensation.type}</div>
                        {request.compensation.amount && (
                          <div className="text-lg font-bold">€{request.compensation.amount}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[#8F8FA3] mb-4">{request.description}</p>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <div className="text-xs text-[#8F8FA3] mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Timeline
                      </div>
                      <div className="font-bold text-[#1E0E62]">{request.timeline}</div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-[#8F8FA3] mb-1 flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Deliverables
                      </div>
                      <div className="font-bold text-[#1E0E62]">{request.deliverables.length} items</div>
                    </div>

                    {request.estimatedReach && (
                      <div>
                        <div className="text-xs text-[#8F8FA3] mb-1 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Est. Reach
                        </div>
                        <div className="font-bold text-[#1E0E62]">{request.estimatedReach.toLocaleString()}</div>
                      </div>
                    )}

                    <div>
                      <div className="text-xs text-[#8F8FA3] mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Received
                      </div>
                      <div className="font-bold text-[#1E0E62]">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Required Skills */}
                  {request.requiredSkills && request.requiredSkills.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-[#8F8FA3] mb-2">Required Skills</div>
                      <div className="flex flex-wrap gap-2">
                        {request.requiredSkills.map(skill => (
                          <span key={skill} className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-xs font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deliverables List */}
                  <div className="mb-4">
                    <div className="text-xs text-[#8F8FA3] mb-2">What You'll Deliver</div>
                    <ul className="space-y-1">
                      {request.deliverables.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-[#1E0E62]">
                          <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    {request.status === 'PENDING' && (
                      <>
                        <Button
                          onClick={() => handleDeclineRequest(request.id)}
                          variant="outline"
                          className="flex-1 flex items-center justify-center gap-2"
                          disabled={isResponding}
                        >
                          <X className="w-4 h-4" />
                          Decline
                        </Button>
                        <Button
                          onClick={() => handleAcceptRequest(request.id)}
                          variant="gradient"
                          className="flex-1 flex items-center justify-center gap-2"
                          disabled={isResponding}
                          isLoading={isResponding}
                        >
                          <Check className="w-4 h-4" />
                          Accept & Chat
                        </Button>
                      </>
                    )}

                    {request.status === 'ACCEPTED' && (
                      <>
                        <Button
                          onClick={() => setSelectedRequest(request)}
                          variant="outline"
                          className="flex-1 flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Details
                        </Button>
                        <Button
                          onClick={() => onOpenChat && onOpenChat(request.businessId)}
                          variant="gradient"
                          className="flex-1 flex items-center justify-center gap-2"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Chat with Business
                        </Button>
                      </>
                    )}

                    {(request.status === 'DECLINED' || request.status === 'COMPLETED') && (
                      <Button
                        onClick={() => setSelectedRequest(request)}
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

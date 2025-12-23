import React, { useState, useEffect } from 'react';
import {
  Users, Search, Filter, Download, Mail, Tag, TrendingUp,
  Award, Clock, MapPin, Phone, Calendar, Star, Gift, Target,
  ChevronDown, X, Edit, Trash2, Plus, MessageSquare
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Customer {
  userId: string;
  userName: string;
  userAvatar: string;
  email?: string;
  phone?: string;
  level: number;
  points: number;
  totalMissionsCompleted: number;
  totalRewardsRedeemed: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
  firstVisit: Date;
  lastVisit: Date;
  visitCount: number;
  tags: string[];
  notes?: string;
  segment: 'VIP' | 'Regular' | 'New' | 'At-Risk' | 'Inactive';
}

interface CustomerCRMProps {
  businessId: string;
  businessName: string;
}

export const CustomerCRM: React.FC<CustomerCRMProps> = ({
  businessId,
  businessName
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'points' | 'lastVisit' | 'missions'>('lastVisit');

  useEffect(() => {
    loadCustomers();
  }, [businessId]);

  useEffect(() => {
    filterCustomers();
  }, [searchQuery, selectedSegment, sortBy, customers]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      // TODO: Fetch real data from Firestore
      // Mock data for now
      const mockCustomers: Customer[] = [
        {
          userId: '1',
          userName: 'Sarah Miller',
          userAvatar: 'https://ui-avatars.com/api/?name=Sarah+Miller&background=F72585&color=fff',
          email: 'sarah@example.com',
          phone: '+49 123 456789',
          level: 2,
          points: 5420,
          totalMissionsCompleted: 23,
          totalRewardsRedeemed: 8,
          totalPointsEarned: 12500,
          totalPointsSpent: 7080,
          firstVisit: new Date('2024-01-15'),
          lastVisit: new Date('2025-12-04'),
          visitCount: 45,
          tags: ['VIP', 'Loyal'],
          segment: 'VIP',
        },
        {
          userId: '2',
          userName: 'John Doe',
          userAvatar: 'https://ui-avatars.com/api/?name=John+Doe&background=7209B7&color=fff',
          email: 'john@example.com',
          level: 1,
          points: 2100,
          totalMissionsCompleted: 12,
          totalRewardsRedeemed: 3,
          totalPointsEarned: 5500,
          totalPointsSpent: 3400,
          firstVisit: new Date('2024-06-20'),
          lastVisit: new Date('2025-12-03'),
          visitCount: 18,
          tags: ['Regular'],
          segment: 'Regular',
        },
        {
          userId: '3',
          userName: 'Emma Schmidt',
          userAvatar: 'https://ui-avatars.com/api/?name=Emma+Schmidt&background=560BAD&color=fff',
          level: 1,
          points: 850,
          totalMissionsCompleted: 3,
          totalRewardsRedeemed: 1,
          totalPointsEarned: 1500,
          totalPointsSpent: 650,
          firstVisit: new Date('2025-11-28'),
          lastVisit: new Date('2025-11-30'),
          visitCount: 3,
          tags: ['New'],
          segment: 'New',
        },
      ];
      setCustomers(mockCustomers);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((c) =>
        c.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Segment filter
    if (selectedSegment !== 'all') {
      filtered = filtered.filter((c) => c.segment === selectedSegment);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.userName.localeCompare(b.userName);
        case 'points':
          return b.points - a.points;
        case 'lastVisit':
          return b.lastVisit.getTime() - a.lastVisit.getTime();
        case 'missions':
          return b.totalMissionsCompleted - a.totalMissionsCompleted;
        default:
          return 0;
      }
    });

    setFilteredCustomers(filtered);
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'VIP':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'Regular':
        return 'bg-blue-100 text-blue-700';
      case 'New':
        return 'bg-green-100 text-green-700';
      case 'At-Risk':
        return 'bg-orange-100 text-orange-700';
      case 'Inactive':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    const csv = 'User ID,Name,Email,Level,Points,Missions,Rewards,Last Visit\n';
    filteredCustomers.forEach((c) => {
      // Add CSV rows
    });
    alert('Export functionality coming soon!');
  };

  const handleSendMessage = (customer: Customer) => {
    // TODO: Open messaging modal
    alert(`Send message to ${customer.userName}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#F72585] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1E0E62]">Customer CRM</h1>
            <p className="text-gray-600 mt-1">{filteredCustomers.length} customers</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">Total Customers</div>
            <div className="text-2xl font-bold text-[#1E0E62]">{customers.length}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">VIP Customers</div>
            <div className="text-2xl font-bold text-yellow-600">
              {customers.filter((c) => c.segment === 'VIP').length}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">New This Month</div>
            <div className="text-2xl font-bold text-green-600">
              {customers.filter((c) => c.segment === 'New').length}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-600 mb-1">At Risk</div>
            <div className="text-2xl font-bold text-orange-600">
              {customers.filter((c) => c.segment === 'At-Risk').length}
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F72585] focus:border-transparent"
              />
            </div>

            {/* Segment Filter */}
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F72585] focus:border-transparent bg-white"
            >
              <option value="all">All Segments</option>
              <option value="VIP">VIP</option>
              <option value="Regular">Regular</option>
              <option value="New">New</option>
              <option value="At-Risk">At Risk</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F72585] focus:border-transparent bg-white"
            >
              <option value="lastVisit">Last Visit</option>
              <option value="name">Name</option>
              <option value="points">Points</option>
              <option value="missions">Missions</option>
            </select>
          </div>
        </div>

        {/* Customer List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">No customers found</h3>
              <p className="text-gray-500">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.userId}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <img
                      src={customer.userAvatar}
                      alt={customer.userName}
                      className="w-12 h-12 rounded-full flex-shrink-0"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-[#1E0E62] truncate">
                          {customer.userName}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getSegmentColor(customer.segment)}`}>
                          {customer.segment}
                        </span>
                        {customer.level === 2 && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>

                      {customer.email && (
                        <p className="text-sm text-gray-600 mb-2">{customer.email}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          {customer.points} pts
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          {customer.totalMissionsCompleted} missions
                        </div>
                        <div className="flex items-center gap-1">
                          <Gift className="w-4 h-4" />
                          {customer.totalRewardsRedeemed} rewards
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Last visit {formatDistanceToNow(customer.lastVisit, { addSuffix: true })}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendMessage(customer);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Send message"
                      >
                        <MessageSquare className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <img
                  src={selectedCustomer.userAvatar}
                  alt={selectedCustomer.userName}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h2 className="text-2xl font-bold text-[#1E0E62]">
                    {selectedCustomer.userName}
                  </h2>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold mt-1 ${getSegmentColor(selectedCustomer.segment)}`}>
                    {selectedCustomer.segment}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div>
                <h3 className="font-bold text-lg text-[#1E0E62] mb-3">Contact Information</h3>
                <div className="space-y-2">
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      {selectedCustomer.email}
                    </div>
                  )}
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      {selectedCustomer.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div>
                <h3 className="font-bold text-lg text-[#1E0E62] mb-3">Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-50 rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-1">Current Points</div>
                    <div className="text-2xl font-bold text-[#1E0E62]">
                      {selectedCustomer.points}
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-1">Level</div>
                    <div className="text-2xl font-bold text-[#1E0E62]">
                      {selectedCustomer.level}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-1">Missions Completed</div>
                    <div className="text-2xl font-bold text-[#1E0E62]">
                      {selectedCustomer.totalMissionsCompleted}
                    </div>
                  </div>
                  <div className="bg-pink-50 rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-1">Rewards Redeemed</div>
                    <div className="text-2xl font-bold text-[#1E0E62]">
                      {selectedCustomer.totalRewardsRedeemed}
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Points Earned</div>
                    <div className="text-2xl font-bold text-[#1E0E62]">
                      {selectedCustomer.totalPointsEarned.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4">
                    <div className="text-sm text-gray-600 mb-1">Total Points Spent</div>
                    <div className="text-2xl font-bold text-[#1E0E62]">
                      {selectedCustomer.totalPointsSpent.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Visit History */}
              <div>
                <h3 className="font-bold text-lg text-[#1E0E62] mb-3">Visit History</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-600">First Visit</span>
                    <span className="font-medium text-[#1E0E62]">
                      {selectedCustomer.firstVisit.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-600">Last Visit</span>
                    <span className="font-medium text-[#1E0E62]">
                      {formatDistanceToNow(selectedCustomer.lastVisit, { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-600">Total Visits</span>
                    <span className="font-medium text-[#1E0E62]">
                      {selectedCustomer.visitCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleSendMessage(selectedCustomer)}
                  className="flex-1 bg-gradient-to-r from-[#F72585] to-[#7209B7] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Users, Search, Filter, Download, Mail, Tag, TrendingUp,
  Award, Clock, MapPin, Phone, Calendar, Star, Gift, Target,
  ChevronDown, X, Edit, Trash2, Plus, MessageSquare
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { db } from '../../services/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'points' | 'lastVisit' | 'missions'>('lastVisit');

  // Debounce search query
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    loadCustomers();
  }, [businessId]);

  useEffect(() => {
    filterCustomers();
  }, [debouncedSearchQuery, selectedSegment, sortBy, customers]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      // Fetch all participations for this business's missions
      const participationsQuery = query(
        collection(db, 'participations'),
        where('businessId', '==', businessId)
      );
      const participationsSnap = await getDocs(participationsQuery);
      
      // Fetch all redemptions for this business's rewards
      const redemptionsQuery = query(
        collection(db, 'redemptions'),
        where('businessId', '==', businessId)
      );
      const redemptionsSnap = await getDocs(redemptionsQuery);
      
      // Aggregate customer data
      const customerMap = new Map<string, any>();
      
      // Process participations
      participationsSnap.forEach((doc) => {
        const participation = doc.data();
        const userId = participation.userId;
        
        if (!customerMap.has(userId)) {
          customerMap.set(userId, {
            userId,
            userName: participation.userName || 'Unknown User',
            userAvatar: participation.userAvatar || `https://ui-avatars.com/api/?name=${participation.userName || 'User'}&background=F72585&color=fff`,
            email: participation.userEmail,
            totalMissionsCompleted: 0,
            totalPointsEarned: 0,
            totalRewardsRedeemed: 0,
            totalPointsSpent: 0,
            firstVisit: participation.submittedAt,
            lastVisit: participation.submittedAt,
            visitCount: 0,
            participationDates: []
          });
        }
        
        const customer = customerMap.get(userId);
        
        // Update mission stats
        if (participation.status === 'APPROVED') {
          customer.totalMissionsCompleted++;
          customer.totalPointsEarned += participation.pointsAwarded || 0;
        }
        
        // Update visit tracking
        const visitDate = participation.submittedAt?.toDate?.() || new Date(participation.submittedAt);
        customer.participationDates.push(visitDate);
        customer.visitCount++;
        
        if (visitDate < customer.firstVisit) {
          customer.firstVisit = visitDate;
        }
        if (visitDate > customer.lastVisit) {
          customer.lastVisit = visitDate;
        }
      });
      
      // Process redemptions
      redemptionsSnap.forEach((doc) => {
        const redemption = doc.data();
        const userId = redemption.userId;
        
        if (!customerMap.has(userId)) {
          customerMap.set(userId, {
            userId,
            userName: redemption.userName || 'Unknown User',
            userAvatar: redemption.userAvatar || `https://ui-avatars.com/api/?name=${redemption.userName || 'User'}&background=F72585&color=fff`,
            email: redemption.userEmail,
            totalMissionsCompleted: 0,
            totalPointsEarned: 0,
            totalRewardsRedeemed: 0,
            totalPointsSpent: 0,
            firstVisit: redemption.redeemedAt,
            lastVisit: redemption.redeemedAt,
            visitCount: 0,
            participationDates: []
          });
        }
        
        const customer = customerMap.get(userId);
        customer.totalRewardsRedeemed++;
        customer.totalPointsSpent += redemption.pointsCost || 0;
        
        const redeemDate = redemption.redeemedAt?.toDate?.() || new Date(redemption.redeemedAt);
        customer.participationDates.push(redeemDate);
        
        if (redeemDate < customer.firstVisit) {
          customer.firstVisit = redeemDate;
        }
        if (redeemDate > customer.lastVisit) {
          customer.lastVisit = redeemDate;
        }
      });
      
      // Fetch full user data for each customer
      const userIds = Array.from(customerMap.keys());
      const customersData: Customer[] = [];
      
      for (const userId of userIds) {
        try {
          const userQuery = query(
            collection(db, 'users'),
            where('firebaseUid', '==', userId)
          );
          const userSnap = await getDocs(userQuery);
          
          if (!userSnap.empty) {
            const userData = userSnap.docs[0].data();
            const customerBase = customerMap.get(userId);
            
            // Auto-segment customers
            let segment: 'VIP' | 'Regular' | 'New' | 'At-Risk' | 'Inactive' = 'Regular';
            const daysSinceLastVisit = Math.floor((Date.now() - customerBase.lastVisit.getTime()) / (1000 * 60 * 60 * 24));
            const daysSinceFirstVisit = Math.floor((Date.now() - customerBase.firstVisit.getTime()) / (1000 * 60 * 60 * 24));
            
            if (customerBase.totalPointsEarned >= 5000 || customerBase.totalMissionsCompleted >= 15) {
              segment = 'VIP';
            } else if (daysSinceFirstVisit <= 30) {
              segment = 'New';
            } else if (daysSinceLastVisit > 60) {
              segment = 'Inactive';
            } else if (daysSinceLastVisit > 30 && customerBase.visitCount < 5) {
              segment = 'At-Risk';
            }
            
            customersData.push({
              userId,
              userName: userData.name || customerBase.userName,
              userAvatar: userData.avatarUrl || customerBase.userAvatar,
              email: userData.email || customerBase.email,
              phone: userData.phone,
              level: userData.level || 1,
              points: userData.points || 0,
              totalMissionsCompleted: customerBase.totalMissionsCompleted,
              totalRewardsRedeemed: customerBase.totalRewardsRedeemed,
              totalPointsEarned: customerBase.totalPointsEarned,
              totalPointsSpent: customerBase.totalPointsSpent,
              firstVisit: customerBase.firstVisit,
              lastVisit: customerBase.lastVisit,
              visitCount: customerBase.visitCount,
              tags: segment === 'VIP' ? ['VIP', 'Loyal'] : segment === 'New' ? ['New'] : [segment],
              segment
            });
          }
        } catch (error) {
          console.error(`Failed to fetch user data for ${userId}:`, error);
        }
      }
      
      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to load customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    // Search filter (using debounced query)
    if (debouncedSearchQuery) {
      filtered = filtered.filter((c) =>
        c.userName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
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
    // Create CSV content
    let csv = 'User ID,Name,Email,Phone,Level,Points,Missions Completed,Rewards Redeemed,Points Earned,Points Spent,First Visit,Last Visit,Visit Count,Segment\n';
    
    filteredCustomers.forEach((c) => {
      const row = [
        c.userId,
        `"${c.userName}"`,
        c.email || 'N/A',
        c.phone || 'N/A',
        c.level,
        c.points,
        c.totalMissionsCompleted,
        c.totalRewardsRedeemed,
        c.totalPointsEarned,
        c.totalPointsSpent,
        c.firstVisit.toLocaleDateString(),
        c.lastVisit.toLocaleDateString(),
        c.visitCount,
        c.segment
      ].join(',');
      csv += row + '\n';
    });
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${businessName}-customers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSendMessage = (customer: Customer) => {
    // TODO: Open messaging modal
    alert(`Send message to ${customer.userName}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00E5FF] border-t-transparent"></div>
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
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent"
              />
            </div>

            {/* Segment Filter */}
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent bg-white"
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
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent bg-white"
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
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF] rounded-full mb-4">
                <Users className="w-10 h-10 text-white" />
              </div>
              {customers.length === 0 ? (
                <>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No customers yet</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Customers will appear here once they complete missions or redeem rewards from your business.
                    Start creating missions to attract your first customers!
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Target className="w-4 h-4 text-[#00E5FF]" />
                    <span className="text-sm text-gray-600">Create missions to engage customers</span>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No matching customers</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery ? `No customers found matching "${searchQuery}"` : `No ${selectedSegment} customers found`}
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSegment('all');
                    }}
                    className="px-4 py-2 bg-[#00E5FF] text-white rounded-xl hover:bg-[#D61F6F] transition-colors"
                  >
                    Clear Filters
                  </button>
                </>
              )}
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
                  className="flex-1 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
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

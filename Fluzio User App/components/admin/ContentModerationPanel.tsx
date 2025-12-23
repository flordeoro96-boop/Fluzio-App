import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, Flag, Eye, EyeOff, Trash2, CheckCircle, 
  XCircle, MessageSquare, Image, FileText, Search, Filter
} from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../services/AuthContext';

interface FlaggedContent {
  id: string;
  type: 'mission' | 'comment' | 'review' | 'message' | 'profile';
  contentId: string;
  reportedBy: string;
  reporterName: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Date;
  content?: any;
}

export const ContentModerationPanel: React.FC = () => {
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([]);
  const [filteredContent, setFilteredContent] = useState<FlaggedContent[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'mission' | 'comment' | 'review'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewed'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlaggedContent();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [flaggedContent, filterType, filterStatus, searchTerm]);

  const loadFlaggedContent = async () => {
    setLoading(true);
    try {
      // In a real app, you'd have a 'reports' or 'flagged_content' collection
      // For now, we'll create mock data structure
      const reportsRef = collection(db, 'content_reports');
      const snapshot = await getDocs(reportsRef);
      
      const content = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      })) as FlaggedContent[];

      setFlaggedContent(content);
    } catch (error) {
      console.error('Failed to load flagged content:', error);
      // If collection doesn't exist yet, show empty state
      setFlaggedContent([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...flaggedContent];

    if (filterType !== 'all') {
      filtered = filtered.filter(c => c.type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => c.status === filterStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.reporterName?.toLowerCase().includes(term) ||
        c.reason?.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term)
      );
    }

    setFilteredContent(filtered);
  };

  const handleReview = async (reportId: string, action: 'approve' | 'dismiss') => {
    try {
      const reportRef = doc(db, 'content_reports', reportId);
      await updateDoc(reportRef, {
        status: action === 'approve' ? 'reviewed' : 'dismissed',
        reviewedAt: Timestamp.now(),
        action
      });

      await loadFlaggedContent();
      alert(`Report ${action === 'approve' ? 'approved' : 'dismissed'} successfully`);
    } catch (error) {
      console.error('Failed to review report:', error);
      alert('Failed to process report');
    }
  };

  const handleDeleteContent = async (reportId: string, contentId: string, contentType: string) => {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete the actual content
      const collectionName = contentType === 'mission' ? 'missions' : 
                           contentType === 'comment' ? 'comments' :
                           contentType === 'review' ? 'reviews' : 'messages';
      
      const contentRef = doc(db, collectionName, contentId);
      await deleteDoc(contentRef);

      // Update report status
      const reportRef = doc(db, 'content_reports', reportId);
      await updateDoc(reportRef, {
        status: 'resolved',
        action: 'deleted',
        resolvedAt: Timestamp.now()
      });

      await loadFlaggedContent();
      alert('Content deleted successfully');
    } catch (error) {
      console.error('Failed to delete content:', error);
      alert('Failed to delete content');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mission': return <FileText className="w-5 h-5" />;
      case 'comment': return <MessageSquare className="w-5 h-5" />;
      case 'review': return <MessageSquare className="w-5 h-5" />;
      case 'message': return <MessageSquare className="w-5 h-5" />;
      case 'profile': return <Image className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'mission': return 'from-blue-500 to-cyan-500';
      case 'comment': return 'from-purple-500 to-pink-500';
      case 'review': return 'from-yellow-500 to-orange-500';
      case 'message': return 'from-green-500 to-teal-500';
      case 'profile': return 'from-red-500 to-pink-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">Pending</span>;
      case 'reviewed':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">Reviewed</span>;
      case 'resolved':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Resolved</span>;
      case 'dismissed':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">Dismissed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Content Moderation</h2>
        <p className="text-sm text-gray-600 mt-1">
          {filteredContent.length} flagged item{filteredContent.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">All Types</option>
            <option value="mission">Missions</option>
            <option value="comment">Comments</option>
            <option value="review">Reviews</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </div>
      </div>

      {/* Flagged Content List */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          Loading flagged content...
        </div>
      ) : filteredContent.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All Clear!</h3>
          <p className="text-gray-600">No flagged content to review at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContent.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getTypeColor(item.type)} flex items-center justify-center text-white flex-shrink-0`}>
                  {getTypeIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-semibold text-gray-900 capitalize">
                          {item.type} Report
                        </span>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Reported by <span className="font-medium">{item.reporterName}</span> •{' '}
                        {item.createdAt.toLocaleDateString()} at {item.createdAt.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  {/* Report Details */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2 mb-2">
                      <Flag className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-gray-900 mb-1">
                          Reason: {item.reason}
                        </div>
                        <div className="text-sm text-gray-600">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {item.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => alert('View full content - coming soon')}
                        className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Content
                      </button>
                      <button
                        onClick={() => handleReview(item.id, 'dismiss')}
                        className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleDeleteContent(item.id, item.contentId, item.type)}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Content
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Total Reports</div>
          <div className="text-2xl font-bold text-gray-900">{flaggedContent.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {flaggedContent.filter(c => c.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Resolved</div>
          <div className="text-2xl font-bold text-green-600">
            {flaggedContent.filter(c => c.status === 'resolved').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Dismissed</div>
          <div className="text-2xl font-bold text-gray-600">
            {flaggedContent.filter(c => c.status === 'dismissed').length}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, UserX, AlertCircle, Loader, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from '../services/firestoreCompat';
import { db } from '../services/apiService';

interface BlockedUser {
  id: string;
  name: string;
  photoUrl?: string;
  blockedAt: string;
}

interface BlockedUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export const BlockedUsersModal: React.FC<BlockedUsersModalProps> = ({
  isOpen,
  onClose,
  currentUserId
}) => {
  const { t } = useTranslation();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadBlockedUsers();
    }
  }, [isOpen, currentUserId]);

  const loadBlockedUsers = async () => {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUserId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const blockedIds = data.blockedUsers || [];
        
        // Load details for each blocked user
        const usersPromises = blockedIds.map(async (blockedId: string) => {
          const blockedUserDoc = await getDoc(doc(db, 'users', blockedId));
          if (blockedUserDoc.exists()) {
            const userData = blockedUserDoc.data();
            return {
              id: blockedId,
              name: userData.name || 'Unknown User',
              photoUrl: userData.photoUrl || userData.avatarUrl,
              blockedAt: userData.blockedAt || new Date().toISOString()
            };
          }
          return null;
        });

        const users = (await Promise.all(usersPromises)).filter(Boolean) as BlockedUser[];
        setBlockedUsers(users);
      }
    } catch (error) {
      console.error('Failed to load blocked users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId: string) => {
    if (!confirm('Are you sure you want to unblock this user?')) {
      return;
    }

    setUnblocking(userId);
    try {
      await updateDoc(doc(db, 'users', currentUserId), {
        blockedUsers: arrayRemove(userId)
      });

      setBlockedUsers(blockedUsers.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Failed to unblock user:', error);
      alert('Failed to unblock user. Please try again.');
    } finally {
      setUnblocking(null);
    }
  };

  const filteredUsers = blockedUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <UserX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-[#1E0E62]">Blocked Users</h2>
              <p className="text-sm text-gray-500">
                {blockedUsers.length} {blockedUsers.length === 1 ? 'user' : 'users'} blocked
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        {blockedUsers.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-200 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="Search blocked users..."
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader className="w-12 h-12 text-purple-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading blocked users...</p>
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <UserX className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-[#1E0E62] mb-2">No Blocked Users</h3>
              <p className="text-gray-600 text-center max-w-sm">
                When you block someone, they won't be able to see your profile or contact you.
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-gray-600">No users match your search</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <div 
                  key={user.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <img
                      src={user.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7209B7&color=fff`}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-[#1E0E62] truncate">{user.name}</h3>
                      <p className="text-sm text-gray-500">
                        Blocked {new Date(user.blockedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnblock(user.id)}
                    disabled={unblocking === user.id}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-semibold hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                  >
                    {unblocking === user.id ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Unblocking...
                      </>
                    ) : (
                      'Unblock'
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Footer */}
        {blockedUsers.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 shrink-0">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold text-[#1E0E62] mb-1">About Blocking</p>
                <p>
                  Blocked users can't see your profile, send you messages, or interact with your content.
                  They won't be notified when you block or unblock them.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

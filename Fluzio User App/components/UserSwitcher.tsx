import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { store } from '../services/mockStore';
import { User, UserRole } from '../types';
import { Card, Button, Modal, Badge } from './Common';
import { Users, Building2, User as UserIcon, Check } from 'lucide-react';

interface UserSwitcherProps {
  currentUser: User;
  onUserChange: (user: User) => void;
}

export const UserSwitcher: React.FC<UserSwitcherProps> = ({ currentUser, onUserChange }) => {
  const [showModal, setShowModal] = useState(false);
  const allUsers = store.getAllUsers();
  const businessUsers = allUsers.filter(u => u.role === UserRole.BUSINESS);
  const memberUsers = allUsers.filter(u => u.role === UserRole.MEMBER);

  const handleUserSwitch = (user: User) => {
    onUserChange(user);
    setShowModal(false);
    window.location.reload(); // Reload to reset all state
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all text-sm"
      >
        <img 
          src={currentUser.avatarUrl} 
          alt={currentUser.name}
          className="w-6 h-6 rounded-full object-cover"
        />
        <span className="font-medium text-gray-700">{currentUser.name}</span>
        <Badge 
          text={currentUser.role === UserRole.BUSINESS ? 'Business' : 'Member'} 
          color={currentUser.role === UserRole.BUSINESS ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}
        />
      </button>

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title="Switch User (Dev Mode)"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Switch between users to test different features and perspectives
          </p>

          {/* Business Users */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-purple-600" />
              <h4 className="font-bold text-gray-900 text-sm">Business Accounts</h4>
            </div>
            <div className="space-y-2">
              {businessUsers.map(user => (
                <Card
                  key={user.id}
                  className={`p-3 cursor-pointer hover:border-purple-300 transition-all ${
                    currentUser.id === user.id ? 'border-purple-400 bg-purple-50' : ''
                  }`}
                  onClick={() => handleUserSwitch(user)}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                        {currentUser.id === user.id && (
                          <Check className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.location}</p>
                    </div>
                    <Badge 
                      text={user.subscriptionLevel} 
                      color="bg-purple-100 text-purple-700"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Member Users */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <UserIcon className="w-4 h-4 text-blue-600" />
              <h4 className="font-bold text-gray-900 text-sm">Creator Accounts</h4>
            </div>
            <div className="space-y-2">
              {memberUsers.map(user => (
                <Card
                  key={user.id}
                  className={`p-3 cursor-pointer hover:border-blue-300 transition-all ${
                    currentUser.id === user.id ? 'border-blue-400 bg-blue-50' : ''
                  }`}
                  onClick={() => handleUserSwitch(user)}
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                        {currentUser.id === user.id && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{user.location}</p>
                    </div>
                    <Badge 
                      text={`Level ${user.level}`} 
                      color="bg-blue-100 text-blue-700"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

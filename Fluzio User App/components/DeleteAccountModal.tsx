import React, { useState } from 'react';
import { X, AlertTriangle, Check } from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from '../services/authCompat';
import { doc, deleteDoc, collection, query, where, getDocs } from '../services/firestoreCompat';
import { ref, listAll, deleteObject, storage } from '../services/storageCompat';
import { db } from '../services/apiService';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose }) => {
  const { user: currentUser, signOut } = useAuth();
  const [step, setStep] = useState<'warning' | 'confirm' | 'password' | 'deleting' | 'success'>(
    'warning'
  );
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [deleteProgress, setDeleteProgress] = useState('');

  const resetState = () => {
    setStep('warning');
    setPassword('');
    setConfirmText('');
    setError('');
    setDeleteProgress('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const deleteUserData = async () => {
    if (!currentUser) return;

    try {
      setStep('deleting');

      // Delete user document
      setDeleteProgress('Deleting user profile...');
      await deleteDoc(doc(db, 'users', currentUser.uid));

      // Delete user's missions
      setDeleteProgress('Removing mission applications...');
      const missionsQuery = query(
        collection(db, 'missionApplications'),
        where('userId', '==', currentUser.uid)
      );
      const missionDocs = await getDocs(missionsQuery);
      await Promise.all(missionDocs.docs.map(doc => deleteDoc(doc.ref)));

      // Delete user's conversations
      setDeleteProgress('Deleting conversations...');
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', currentUser.uid)
      );
      const conversationDocs = await getDocs(conversationsQuery);
      await Promise.all(conversationDocs.docs.map(doc => deleteDoc(doc.ref)));

      // Delete user's meetups
      setDeleteProgress('Removing meetup registrations...');
      const meetupsQuery = query(
        collection(db, 'meetups'),
        where('participants', 'array-contains', currentUser.uid)
      );
      const meetupDocs = await getDocs(meetupsQuery);
      await Promise.all(meetupDocs.docs.map(doc => deleteDoc(doc.ref)));

      // Delete storage files
      setDeleteProgress('Deleting uploaded files...');
      const userStorageRef = ref(storage, `users/${currentUser.uid}`);
      try {
        const fileList = await listAll(userStorageRef);
        await Promise.all(fileList.items.map(item => deleteObject(item)));
      } catch (error) {
        console.log('No storage files to delete or error accessing storage');
      }

      // Delete auth account
      setDeleteProgress('Deleting account...');
      await deleteUser(currentUser);

      setStep('success');
      setTimeout(() => {
        signOut();
      }, 2000);
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setError(error.message || 'Failed to delete account. Please try again.');
      setStep('password');
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser?.email) return;

    setError('');

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);

      // Proceed with deletion
      await deleteUserData();
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Authentication failed. Please try again.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[130] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full animate-zoom-in-95">
        {step === 'warning' && (
          <>
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Delete Account</h2>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-lg transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  This action cannot be undone
                </h3>
                <p className="text-red-800 text-sm">
                  Deleting your account will permanently remove all your data including:
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold">Profile & Personal Information</p>
                    <p className="text-sm text-gray-600">Your profile, settings, and preferences</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold">Mission History</p>
                    <p className="text-sm text-gray-600">All completed and active missions</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold">Points & Rewards</p>
                    <p className="text-sm text-gray-600">All earned points and redeemed rewards</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold">Conversations</p>
                    <p className="text-sm text-gray-600">All messages and chat history</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold">Meetups & Events</p>
                    <p className="text-sm text-gray-600">Event registrations and history</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold">Uploaded Files</p>
                    <p className="text-sm text-gray-600">Photos, videos, and documents</p>
                  </div>
                </li>
              </ul>

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                >
                  Continue
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-2xl font-bold">Confirm Deletion</h2>
              <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-lg transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                To confirm, please type <span className="font-bold">DELETE</span> in the box below:
              </p>

              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-6"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('warning')}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('password')}
                  disabled={confirmText !== 'DELETE'}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'password' && (
          <>
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-2xl font-bold">Enter Password</h2>
              <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-lg transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Please enter your password to confirm account deletion:
              </p>

              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-2"
              />

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={!password}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'deleting' && (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
            <h3 className="text-xl font-bold mb-2">Deleting Account...</h3>
            <p className="text-gray-600">{deleteProgress}</p>
          </div>
        )}

        {step === 'success' && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Account Deleted</h3>
            <p className="text-gray-600">Your account has been permanently deleted.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeleteAccountModal;

/**
 * Customer Portfolio View
 * Displays customer's journey, visited places, photos, achievements
 */

import React, { useState, useEffect } from 'react';
import {
  MapPin, Camera, Award, Calendar, TrendingUp, Heart,
  Star, Gift, Users, Clock, Flame, Target, Medal, Trophy,
  Image as ImageIcon, Plus, X, ExternalLink, Navigation,
  Bookmark, CheckCircle, DollarSign
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from '../services/firestoreCompat';
import { db } from '../services/apiService';
import { getUserVisits } from '../services/shopifyVisitService';

interface VisitedPlace {
  id: string;
  businessId: string;
  businessName: string;
  businessCategory: string;
  businessPhoto?: string;
  visitDate: Date;
  pointsEarned: number;
  missionsCompleted: number;
  photos: string[];
  rating?: number;
  review?: string;
}

interface PortfolioStats {
  totalVisits: number;
  uniquePlaces: number;
  totalPoints: number;
  totalMissions: number;
  favoriteCategory: string;
  longestStreak: number;
  currentStreak: number;
  citiesVisited: number;
  photosShared: number;
  reviewsWritten: number;
}

interface CustomerPortfolioViewProps {
  userId: string;
  isOwner: boolean;
}

export const CustomerPortfolioView: React.FC<CustomerPortfolioViewProps> = ({
  userId,
  isOwner
}) => {
  const [loading, setLoading] = useState(true);
  const [visitedPlaces, setVisitedPlaces] = useState<VisitedPlace[]>([]);
  const [stats, setStats] = useState<PortfolioStats>({
    totalVisits: 0,
    uniquePlaces: 0,
    totalPoints: 0,
    totalMissions: 0,
    favoriteCategory: 'Cafe',
    longestStreak: 0,
    currentStreak: 0,
    citiesVisited: 1,
    photosShared: 0,
    reviewsWritten: 0
  });
  const [selectedView, setSelectedView] = useState<'grid' | 'timeline' | 'map'>('grid');
  const [selectedPlace, setSelectedPlace] = useState<VisitedPlace | null>(null);

  useEffect(() => {
    loadPortfolio();
  }, [userId]);

  const loadPortfolio = async () => {
    setLoading(true);
    try {
      // Get user's participations
      const participationsQuery = query(
        collection(db, 'participations'),
        where('userId', '==', userId),
        where('status', '==', 'APPROVED'),
        orderBy('completedAt', 'desc'),
        limit(100)
      );
      const participationsSnap = await getDocs(participationsQuery);

      // Get user's visits
      const visits = await getUserVisits(userId);

      // Group by business
      const businessMap = new Map<string, VisitedPlace>();
      
      participationsSnap.forEach(doc => {
        const data = doc.data();
        const businessId = data.businessId;
        
        if (!businessMap.has(businessId)) {
          businessMap.set(businessId, {
            id: doc.id,
            businessId,
            businessName: data.businessName || 'Unknown',
            businessCategory: data.businessCategory || 'Other',
            businessPhoto: data.businessPhoto,
            visitDate: data.completedAt?.toDate() || new Date(data.completedAt),
            pointsEarned: 0,
            missionsCompleted: 0,
            photos: [],
            rating: data.rating,
            review: data.review
          });
        }

        const place = businessMap.get(businessId)!;
        place.missionsCompleted++;
        place.pointsEarned += data.pointsAwarded || 0;
        
        if (data.proofPhoto) {
          place.photos.push(data.proofPhoto);
        }
      });

      visits.forEach(visit => {
        if (visit.verified && visit.businessId) {
          if (!businessMap.has(visit.businessId)) {
            businessMap.set(visit.businessId, {
              id: visit.id,
              businessId: visit.businessId,
              businessName: visit.businessName,
              businessCategory: 'Store',
              visitDate: new Date(visit.timestamp),
              pointsEarned: visit.pointsAwarded,
              missionsCompleted: 0,
              photos: []
            });
          } else {
            const place = businessMap.get(visit.businessId)!;
            place.pointsEarned += visit.pointsAwarded;
          }
        }
      });

      const placesArray = Array.from(businessMap.values())
        .sort((a, b) => b.visitDate.getTime() - a.visitDate.getTime());

      setVisitedPlaces(placesArray);

      // Calculate stats
      const totalPoints = placesArray.reduce((sum, p) => sum + p.pointsEarned, 0);
      const totalMissions = placesArray.reduce((sum, p) => sum + p.missionsCompleted, 0);
      const categoryCounts: Record<string, number> = {};
      placesArray.forEach(p => {
        categoryCounts[p.businessCategory] = (categoryCounts[p.businessCategory] || 0) + 1;
      });
      const favoriteCategory = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Cafe';

      const allPhotos = placesArray.flatMap(p => p.photos);
      const reviewsWritten = placesArray.filter(p => p.review).length;

      setStats({
        totalVisits: placesArray.length,
        uniquePlaces: placesArray.length,
        totalPoints,
        totalMissions,
        favoriteCategory,
        longestStreak: 0, // TODO: Calculate from dates
        currentStreak: 0,
        citiesVisited: 1, // TODO: Extract from business locations
        photosShared: allPhotos.length,
        reviewsWritten
      });

    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00E5FF] border-t-transparent mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading portfolio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <StatCard icon={MapPin} label="Places" value={stats.uniquePlaces} color="blue" />
        <StatCard icon={Award} label="Missions" value={stats.totalMissions} color="purple" />
        <StatCard icon={Star} label="Points" value={stats.totalPoints.toLocaleString()} color="yellow" />
        <StatCard icon={Flame} label="Streak" value={`${stats.currentStreak}d`} color="orange" />
        <StatCard icon={Camera} label="Photos" value={stats.photosShared} color="cyan" />
        <StatCard icon={Heart} label="Reviews" value={stats.reviewsWritten} color="pink" />
      </div>

      {/* Achievements Banner */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold mb-1">Portfolio Highlights</h3>
            <p className="text-white/90 text-sm">
              {stats.totalVisits} visits • {stats.favoriteCategory} lover • {stats.citiesVisited} {stats.citiesVisited === 1 ? 'city' : 'cities'}
            </p>
          </div>
          <Trophy className="w-12 h-12 opacity-80" />
        </div>
      </div>

      {/* View Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">My Journey</h3>
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSelectedView('grid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'grid'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setSelectedView('timeline')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === 'timeline'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Content */}
      {visitedPlaces.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No visits yet</h3>
          <p className="text-gray-600 mb-6">Start exploring businesses and complete missions to build your portfolio!</p>
          <button className="px-6 py-3 bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] text-white rounded-full font-semibold hover:shadow-lg transition-all">
            Explore Now
          </button>
        </div>
      ) : selectedView === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visitedPlaces.map(place => (
            <PlaceCard
              key={place.id}
              place={place}
              onClick={() => setSelectedPlace(place)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {visitedPlaces.map((place, index) => (
            <TimelineItem
              key={place.id}
              place={place}
              isLast={index === visitedPlaces.length - 1}
              onClick={() => setSelectedPlace(place)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedPlace && (
        <PlaceDetailModal
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
        />
      )}
    </div>
  );
};

// Helper Components
const StatCard: React.FC<{
  icon: React.FC<any>;
  label: string;
  value: string | number;
  color: string;
}> = ({ icon: Icon, label, value, color }) => {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-500 bg-blue-50',
    purple: 'text-purple-500 bg-purple-50',
    yellow: 'text-yellow-500 bg-yellow-50',
    orange: 'text-orange-500 bg-orange-50',
    cyan: 'text-cyan-500 bg-cyan-50',
    pink: 'text-pink-500 bg-pink-50'
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100">
      <div className={`w-10 h-10 rounded-lg ${colorMap[color]} flex items-center justify-center mb-2`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
};

const PlaceCard: React.FC<{
  place: VisitedPlace;
  onClick: () => void;
}> = ({ place, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="relative h-40 bg-gradient-to-br from-blue-500 to-purple-500">
        {place.businessPhoto || place.photos[0] ? (
          <img
            src={place.businessPhoto || place.photos[0]}
            alt={place.businessName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-12 h-12 text-white/50" />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-white flex items-center gap-1">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          {place.pointsEarned}
        </div>
      </div>
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-[#00E5FF] transition-colors">
          {place.businessName}
        </h4>
        <p className="text-xs text-gray-500 mb-2">{place.businessCategory}</p>
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Award className="w-3 h-3" />
            {place.missionsCompleted} missions
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {place.visitDate.toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

const TimelineItem: React.FC<{
  place: VisitedPlace;
  isLast: boolean;
  onClick: () => void;
}> = ({ place, isLast, onClick }) => {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {place.pointsEarned}
        </div>
        {!isLast && <div className="w-0.5 h-full bg-gradient-to-b from-[#00E5FF] to-[#6C4BFF] opacity-20"></div>}
      </div>
      <div
        onClick={onClick}
        className="flex-1 bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all cursor-pointer mb-4"
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-semibold text-gray-900">{place.businessName}</h4>
            <p className="text-sm text-gray-500">{place.businessCategory}</p>
          </div>
          <span className="text-xs text-gray-400">{place.visitDate.toLocaleDateString()}</span>
        </div>
        {place.photos.length > 0 && (
          <div className="flex gap-2 mt-3">
            {place.photos.slice(0, 3).map((photo, i) => (
              <img
                key={i}
                src={photo}
                alt="Visit"
                className="w-16 h-16 rounded-lg object-cover"
              />
            ))}
            {place.photos.length > 3 && (
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                +{place.photos.length - 3}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Award className="w-4 h-4" />
            {place.missionsCompleted} missions
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            {place.pointsEarned} pts
          </span>
        </div>
      </div>
    </div>
  );
};

const PlaceDetailModal: React.FC<{
  place: VisitedPlace;
  onClose: () => void;
}> = ({ place, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-500">
          {place.businessPhoto || place.photos[0] ? (
            <img
              src={place.businessPhoto || place.photos[0]}
              alt={place.businessName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="w-16 h-16 text-white/50" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{place.businessName}</h2>
          <p className="text-gray-600 mb-4">{place.businessCategory}</p>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{place.pointsEarned}</div>
              <div className="text-xs text-gray-600">Points Earned</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{place.missionsCompleted}</div>
              <div className="text-xs text-gray-600">Missions</div>
            </div>
            <div className="text-center p-3 bg-cyan-50 rounded-lg">
              <div className="text-2xl font-bold text-cyan-600">{place.photos.length}</div>
              <div className="text-xs text-gray-600">Photos</div>
            </div>
          </div>

          {place.photos.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Photos</h3>
              <div className="grid grid-cols-3 gap-2">
                {place.photos.map((photo, i) => (
                  <img
                    key={i}
                    src={photo}
                    alt={`Visit ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          {place.review && (
            <div className="mt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Your Review</h3>
              <p className="text-gray-600 text-sm">{place.review}</p>
              {place.rating && (
                <div className="flex items-center gap-1 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < place.rating!
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 text-sm text-gray-500">
            Visited on {place.visitDate.toLocaleDateString()} at {place.visitDate.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

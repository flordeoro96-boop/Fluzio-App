/**
 * Creator Profile Screen
 * Editorial professional profile for any creator role
 * Portfolio-focused, minimal, intentional design
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MessageCircle,
  Plus,
  ChevronRight,
  MapPin,
  Clock,
  CheckCircle
} from 'lucide-react';
import { User } from '../../types';

interface CreatorProfileScreenProps {
  creatorId: string;
  user: User;
  onBack: () => void;
  onNavigate: (route: string) => void;
}

type ImageViewMode = 'portfolio' | 'personal';
type ContentSection = 'overview' | 'portfolio' | 'about' | 'experience' | 'tools';

interface CreatorProfile {
  id: string;
  name: string;
  role: string;
  city: string;
  country: string;
  avatarUrl: string;
  portfolioImages: string[];
  personalImages: string[];
  completedProjects: number;
  responseTime: string;
  availability: string;
  bio: string;
  specialties: string[];
  experience: Array<{
    project: string;
    year: string;
    description: string;
  }>;
  tools: string[];
  about: string;
  verified?: boolean;
}

export const CreatorProfileScreen: React.FC<CreatorProfileScreenProps> = ({
  creatorId,
  user,
  onBack,
  onNavigate
}) => {
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [imageView, setImageView] = useState<ImageViewMode>('portfolio');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeSection, setActiveSection] = useState<ContentSection>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCreatorProfile();
  }, [creatorId]);

  const loadCreatorProfile = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API call
      const mockProfile: CreatorProfile = {
        id: creatorId,
        name: 'Sarah Mitchell',
        role: 'Photographer',
        city: 'Munich',
        country: 'Germany',
        avatarUrl: 'https://i.pravatar.cc/400?img=47',
        portfolioImages: [
          'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800',
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800',
          'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800'
        ],
        personalImages: [
          'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800',
          'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800',
          'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800'
        ],
        completedProjects: 12,
        responseTime: 'Within 2 hours',
        availability: 'Available next week',
        bio: 'Editorial and commercial photographer specializing in portrait and lifestyle photography. Focused on natural light and authentic moments.',
        specialties: ['Portrait Photography', 'Lifestyle Content', 'Product Photography', 'Brand Campaigns'],
        experience: [
          {
            project: 'Fashion Week Munich Campaign',
            year: '2024',
            description: 'Lead photographer for runway and backstage coverage'
          },
          {
            project: 'Local Business Portrait Series',
            year: '2023',
            description: 'Documentary-style portraits of 50+ local entrepreneurs'
          },
          {
            project: 'Urban Lifestyle Magazine',
            year: '2023',
            description: 'Monthly contributor for lifestyle editorial content'
          }
        ],
        tools: ['Canon EOS R5', 'Sony A7 IV', 'Adobe Lightroom', 'Adobe Photoshop', 'Capture One'],
        about: 'I approach every project with a documentary mindset—capturing authentic moments rather than forcing poses. My work combines technical precision with emotional storytelling, always prioritizing the subject\'s comfort and natural expression.',
        verified: true
      };

      setCreator(mockProfile);
    } catch (error) {
      console.error('Error loading creator profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToProject = () => {
    // Navigate to project selection or create new project
    console.log('Add to project:', creatorId);
  };

  const handleMessage = () => {
    // Navigate to messaging
    console.log('Message creator:', creatorId);
  };

  const handleImageSwipe = (direction: 'left' | 'right') => {
    const images = imageView === 'portfolio' ? creator?.portfolioImages : creator?.personalImages;
    if (!images) return;

    if (direction === 'right' && currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else if (direction === 'left' && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  if (loading || !creator) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const currentImages = imageView === 'portfolio' ? creator.portfolioImages : creator.personalImages;

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Image Carousel Section */}
        <div className="relative">
          {/* Image Display */}
          <div className="relative w-full bg-gray-100" style={{ height: '500px' }}>
            <img
              src={currentImages[currentImageIndex]}
              alt={`${imageView} ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Navigation Arrows */}
            {currentImages.length > 1 && (
              <>
                {currentImageIndex > 0 && (
                  <button
                    onClick={() => handleImageSwipe('left')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-900 rotate-180" />
                  </button>
                )}
                {currentImageIndex < currentImages.length - 1 && (
                  <button
                    onClick={() => handleImageSwipe('right')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-900" />
                  </button>
                )}
              </>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 text-white text-sm rounded-full">
              {currentImageIndex + 1} / {currentImages.length}
            </div>
          </div>

          {/* Portfolio | Personal Toggle */}
          <div className="flex justify-center py-6 border-b border-gray-200">
            <div className="inline-flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => {
                  setImageView('portfolio');
                  setCurrentImageIndex(0);
                }}
                className={`px-8 py-2 rounded-md font-medium transition-all ${
                  imageView === 'portfolio'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Portfolio
              </button>
              <button
                onClick={() => {
                  setImageView('personal');
                  setCurrentImageIndex(0);
                }}
                className={`px-8 py-2 rounded-md font-medium transition-all ${
                  imageView === 'personal'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Personal
              </button>
            </div>
          </div>
        </div>

        {/* Identity Block */}
        <div className="px-6 py-8 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                {creator.name}
              </h1>
              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <span className="font-medium">{creator.role}</span>
                <span>·</span>
                <MapPin className="w-4 h-4" />
                <span>{creator.city}, {creator.country}</span>
              </div>
              
              {/* Professional Indicators */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  <span>{creator.completedProjects} completed Beevvy projects</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>Responds {creator.responseTime.toLowerCase()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  <span>{creator.availability}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="px-6 py-6 border-b border-gray-200 flex gap-4">
          <button
            onClick={handleAddToProject}
            className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add to project
          </button>
          <button
            onClick={handleMessage}
            className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Message
          </button>
        </div>

        {/* Content Sections - Tabs */}
        <div className="border-b border-gray-200">
          <div className="px-6 flex gap-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'portfolio', label: 'Portfolio Details' },
              { id: 'about', label: 'About' },
              { id: 'experience', label: 'Experience' },
              { id: 'tools', label: 'Tools & Skills' }
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as ContentSection)}
                className={`py-4 font-medium transition-colors relative ${
                  activeSection === section.id
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {section.label}
                {activeSection === section.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="px-6 py-8">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                  Professional Summary
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {creator.bio}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                  Key Specialties
                </h3>
                <div className="flex flex-wrap gap-2">
                  {creator.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Details Section */}
          {activeSection === 'portfolio' && imageView === 'portfolio' && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-6">
                Professional Work
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {creator.portfolioImages.map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      setImageView('portfolio');
                      setCurrentImageIndex(index);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <img
                      src={image}
                      alt={`Portfolio ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About / Personal Section */}
          {activeSection === 'about' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                  Working Style
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {creator.about}
                </p>
              </div>

              {imageView === 'personal' && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                    Behind the Scenes
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {creator.personalImages.map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                          setImageView('personal');
                          setCurrentImageIndex(index);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <img
                          src={image}
                          alt={`Personal ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Experience Section */}
          {activeSection === 'experience' && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-6">
                Past Collaborations
              </h3>
              <div className="space-y-6">
                {creator.experience.map((exp, index) => (
                  <div key={index} className="border-l-2 border-gray-200 pl-4">
                    <div className="flex items-baseline gap-3 mb-1">
                      <h4 className="font-semibold text-gray-900">{exp.project}</h4>
                      <span className="text-sm text-gray-500">{exp.year}</span>
                    </div>
                    <p className="text-gray-700">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tools & Skills Section */}
          {activeSection === 'tools' && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-6">
                Equipment & Software
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {creator.tools.map((tool, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 bg-gray-50 rounded-lg text-gray-700"
                  >
                    {tool}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Spacing */}
      <div className="h-20"></div>
    </div>
  );
};

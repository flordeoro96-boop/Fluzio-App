/**
 * Creator Profile View - Editorial Professional Dossier
 * Single-role profile for business evaluation
 */

import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Clock, Calendar, MessageCircle } from 'lucide-react';
import { User } from '../../types';

interface CreatorProfileViewProps {
  creator: any;
  onBack: () => void;
  onAddToProject: () => void;
  onMessage: () => void;
}

type ImageView = 'portfolio' | 'personal';
type ActiveTab = 'overview' | 'portfolio' | 'experience' | 'tools';

export const CreatorProfileView: React.FC<CreatorProfileViewProps> = ({
  creator,
  onBack,
  onAddToProject,
  onMessage
}) => {
  const [imageView, setImageView] = useState<ImageView>('portfolio');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get portfolio images from creator data
  const portfolioImages = creator.portfolio && creator.portfolio.length > 0
    ? creator.portfolio.map((item: any) => item.thumbnailUrl || item.mediaUrl).filter(Boolean)
    : [creator.avatar];

  const personalImages = [creator.avatar];

  const images = imageView === 'portfolio' ? portfolioImages : personalImages;

  const completedProjects = creator.completedCollaborations || creator.portfolio?.length || 0;
  const responseTime = creator.responseTime || '<24h';
  const availability = 'This month';

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header Image Carousel */}
      <div className="relative h-[60vh] bg-gray-100">
        <img
          src={images[currentImageIndex]}
          alt={creator.name}
          className="w-full h-full object-cover"
        />
        
        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full">
            <span className="text-white text-sm">
              {currentImageIndex + 1} / {images.length}
            </span>
          </div>
        )}

        {/* Swipe dots */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_: any, index: number) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex
                    ? 'bg-white'
                    : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Image View Toggle */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setImageView('portfolio')}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              imageView === 'portfolio'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Portfolio
          </button>
          <button
            onClick={() => setImageView('personal')}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              imageView === 'personal'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Personal
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-6">
        {/* Identity Block */}
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">{creator.name}</h1>
          <p className="text-lg text-gray-600 mb-4">
            {creator.role} · {creator.location}
          </p>

          {/* Professional Indicators */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-700">
              <CheckCircle className="w-5 h-5 text-gray-400" />
              <span className="text-sm">{completedProjects} completed Fluzio projects</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-sm">Typical response: {responseTime}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-sm">Availability: {availability}</span>
            </div>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="mb-8 space-y-3">
          <button
            onClick={onAddToProject}
            className="w-full bg-[#E8C468] hover:bg-[#d9b559] text-gray-900 font-medium py-4 rounded-lg transition-colors"
          >
            Add to project
          </button>
          <button
            onClick={onMessage}
            className="w-full flex items-center justify-center gap-2 py-3 text-gray-900 hover:text-gray-700 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="font-medium">Message</span>
          </button>
        </div>

        {/* Content Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6">
            {['overview', 'portfolio', 'experience', 'tools'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as ActiveTab)}
                className={`pb-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'tools' ? 'Tools & Setup' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="pb-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {creator.description || 'Swiss-based photographer specializing in outdoor lifestyle, adventure, and product photography. Working across Germany with several renowned brands.'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {(creator.creatorSkills && creator.creatorSkills.length > 0) ? (
                    creator.creatorSkills.slice(0, 5).map((skill: string) => (
                      <span
                        key={skill}
                        className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    ['Editorial', 'Lifestyle', 'Product'].map((specialty) => (
                      <span
                        key={specialty}
                        className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg"
                      >
                        {specialty}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div className="grid grid-cols-2 gap-4">
              {(creator.portfolio && creator.portfolio.length > 0) ? (
                creator.portfolio.map((item: any, index: number) => (
                  <div key={item.id || index} className="group cursor-pointer">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                      <img 
                        src={item.thumbnailUrl || item.mediaUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-1">{item.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-gray-500 text-sm">
                  No portfolio items yet
                </div>
              )}
            </div>
          )}

          {activeTab === 'experience' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Past Collaborations</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• Brand campaign photography for outdoor brands</li>
                  <li>• Editorial work for lifestyle magazines</li>
                  <li>• Product photography for e-commerce</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Equipment</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• Sony Alpha series cameras</li>
                  <li>• Professional lighting setup</li>
                  <li>• Mobile studio equipment</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2 mt-4">Software</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• Adobe Lightroom & Photoshop</li>
                  <li>• Capture One</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

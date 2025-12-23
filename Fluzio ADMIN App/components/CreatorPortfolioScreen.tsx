import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';
import { Card, Button, Input, TextArea, Modal } from './Common';
import { 
  Plus, X, ArrowLeft, Edit2, Trash2, ExternalLink,
  Image as ImageIcon, Video, Link2, Calendar, Eye
} from 'lucide-react';
import { api } from '../services/apiService';
import { useAuth } from '../services/AuthContext';

interface CreatorPortfolioScreenProps {
  user: User;
  onBack: () => void;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'LINK';
  mediaUrl: string;
  thumbnailUrl?: string;
  projectDate: string;
  tags: string[];
  metrics?: {
    views?: number;
    likes?: number;
    engagement?: string;
  };
}

const PORTFOLIO_TAGS = [
  'Instagram Post', 'TikTok Video', 'YouTube Video', 'Photography',
  'Video Production', 'Graphic Design', 'Brand Campaign', 'Product Review',
  'Tutorial', 'Vlog', 'Short Form', 'Long Form', 'Paid Partnership',
  'Organic Content', 'User Generated Content', 'Commercial Work'
];

export const CreatorPortfolioScreen: React.FC<CreatorPortfolioScreenProps> = ({ user, onBack }) => {
  const { userProfile, refreshUserProfile } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [viewingItem, setViewingItem] = useState<PortfolioItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mediaType: 'IMAGE' as PortfolioItem['mediaType'],
    mediaUrl: '',
    thumbnailUrl: '',
    projectDate: new Date().toISOString().split('T')[0],
    tags: [] as string[],
    metrics: {
      views: 0,
      likes: 0,
      engagement: ''
    }
  });

  useEffect(() => {
    // Load portfolio from user profile
    if (userProfile?.portfolio) {
      setPortfolio(userProfile.portfolio);
    }
  }, [userProfile]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      mediaType: 'IMAGE',
      mediaUrl: '',
      thumbnailUrl: '',
      projectDate: new Date().toISOString().split('T')[0],
      tags: [],
      metrics: { views: 0, likes: 0, engagement: '' }
    });
  };

  const handleAddItem = async () => {
    if (!formData.title.trim() || !formData.mediaUrl.trim()) {
      alert('Please fill in title and media URL');
      return;
    }

    const newItem: PortfolioItem = {
      id: `portfolio-${Date.now()}`,
      ...formData
    };

    const updatedPortfolio = [...portfolio, newItem];
    setPortfolio(updatedPortfolio);
    await savePortfolio(updatedPortfolio);
    
    resetForm();
    setIsAddingItem(false);
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    const updatedPortfolio = portfolio.map(item =>
      item.id === editingItem.id ? editingItem : item
    );
    setPortfolio(updatedPortfolio);
    await savePortfolio(updatedPortfolio);
    setEditingItem(null);
  };

  const handleDeleteItem = async (itemId: string) => {
    const confirmed = confirm('Delete this portfolio item? This cannot be undone.');
    if (!confirmed) return;

    const updatedPortfolio = portfolio.filter(item => item.id !== itemId);
    setPortfolio(updatedPortfolio);
    await savePortfolio(updatedPortfolio);
  };

  const savePortfolio = async (updatedPortfolio: PortfolioItem[]) => {
    setIsSaving(true);
    try {
      await api.updateUser(user.id, { portfolio: updatedPortfolio });
      await refreshUserProfile();
    } catch (error) {
      console.error('Failed to save portfolio:', error);
      alert('Failed to save portfolio. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return Video;
      case 'LINK': return Link2;
      default: return ImageIcon;
    }
  };

  return (
    <div className="fixed inset-0 bg-[#F8F9FE] z-50 overflow-y-auto pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-clash font-bold text-[#1E0E62]">My Portfolio</h1>
                <p className="text-sm text-[#8F8FA3] font-medium">
                  {portfolio.length} project{portfolio.length !== 1 ? 's' : ''} • Showcase your best work
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsAddingItem(true)}
              variant="gradient"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Project
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* Empty State */}
        {portfolio.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#1E0E62] mb-2">Build Your Portfolio</h2>
            <p className="text-[#8F8FA3] mb-6 max-w-md mx-auto">
              Showcase your best content and collaborations. Let businesses see what you can create!
            </p>
            <Button
              onClick={() => setIsAddingItem(true)}
              variant="gradient"
              className="inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add First Project
            </Button>
          </div>
        )}

        {/* Portfolio Grid */}
        {portfolio.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.map(item => {
              const MediaIconComponent = getMediaIcon(item.mediaType);
              
              return (
                <Card key={item.id} className="overflow-hidden group hover:shadow-xl transition-all">
                  {/* Thumbnail */}
                  <div className="relative aspect-square bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
                    {item.thumbnailUrl || item.mediaUrl ? (
                      <img 
                        src={item.thumbnailUrl || item.mediaUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MediaIconComponent className="w-16 h-16 text-purple-300" />
                      </div>
                    )}
                    
                    {/* Media Type Badge */}
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                      <MediaIconComponent className="w-3 h-3 text-white" />
                      <span className="text-xs font-bold text-white">{item.mediaType}</span>
                    </div>

                    {/* Quick Actions - Show on Hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setViewingItem(item)}
                        className="p-3 bg-white rounded-full hover:scale-110 transition-transform"
                      >
                        <Eye className="w-5 h-5 text-[#7209B7]" />
                      </button>
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-3 bg-white rounded-full hover:scale-110 transition-transform"
                      >
                        <Edit2 className="w-5 h-5 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-3 bg-white rounded-full hover:scale-110 transition-transform"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-[#1E0E62] mb-2 line-clamp-1">{item.title}</h3>
                    <p className="text-sm text-[#8F8FA3] mb-3 line-clamp-2">{item.description}</p>

                    {/* Tags */}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full font-medium">
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 2 && (
                          <span className="text-xs text-gray-400 px-2 py-1">+{item.tags.length - 2}</span>
                        )}
                      </div>
                    )}

                    {/* Metrics */}
                    {item.metrics && (item.metrics.views || item.metrics.likes) && (
                      <div className="flex items-center gap-4 text-xs text-[#8F8FA3] border-t border-gray-100 pt-3">
                        {item.metrics.views && (
                          <div>
                            <span className="font-bold text-[#1E0E62]">{item.metrics.views.toLocaleString()}</span> views
                          </div>
                        )}
                        {item.metrics.likes && (
                          <div>
                            <span className="font-bold text-[#1E0E62]">{item.metrics.likes.toLocaleString()}</span> likes
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isAddingItem || editingItem !== null}
        onClose={() => {
          setIsAddingItem(false);
          setEditingItem(null);
          resetForm();
        }}
        title={editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <Input
            label="Project Title"
            value={editingItem ? editingItem.title : formData.title}
            onChange={(e) => editingItem 
              ? setEditingItem({ ...editingItem, title: e.target.value })
              : setFormData({ ...formData, title: e.target.value })
            }
            placeholder="e.g., Summer Campaign for Brand X"
          />

          {/* Description */}
          <div>
            <label className="text-sm font-bold text-[#1E0E62] mb-2 block">Description</label>
            <TextArea
              value={editingItem ? editingItem.description : formData.description}
              onChange={(e) => editingItem
                ? setEditingItem({ ...editingItem, description: e.target.value })
                : setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the project, your role, and the results..."
              rows={4}
            />
          </div>

          {/* Media Type */}
          <div>
            <label className="text-sm font-bold text-[#1E0E62] mb-2 block">Media Type</label>
            <div className="grid grid-cols-3 gap-3">
              {(['IMAGE', 'VIDEO', 'LINK'] as const).map(type => {
                const Icon = getMediaIcon(type);
                const isSelected = editingItem ? editingItem.mediaType === type : formData.mediaType === type;
                
                return (
                  <button
                    key={type}
                    onClick={() => editingItem
                      ? setEditingItem({ ...editingItem, mediaType: type })
                      : setFormData({ ...formData, mediaType: type })
                    }
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-[#7209B7] bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2 text-[#7209B7]" />
                    <div className="text-xs font-bold text-[#1E0E62]">{type}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Media URL */}
          <Input
            label="Media URL"
            value={editingItem ? editingItem.mediaUrl : formData.mediaUrl}
            onChange={(e) => editingItem
              ? setEditingItem({ ...editingItem, mediaUrl: e.target.value })
              : setFormData({ ...formData, mediaUrl: e.target.value })
            }
            placeholder="https://..."
          />

          {/* Thumbnail URL (Optional) */}
          <Input
            label="Thumbnail URL (Optional)"
            value={editingItem ? editingItem.thumbnailUrl || '' : formData.thumbnailUrl}
            onChange={(e) => editingItem
              ? setEditingItem({ ...editingItem, thumbnailUrl: e.target.value })
              : setFormData({ ...formData, thumbnailUrl: e.target.value })
            }
            placeholder="https://... (for videos/links)"
          />

          {/* Project Date */}
          <Input
            label="Project Date"
            type="date"
            value={editingItem ? editingItem.projectDate.split('T')[0] : formData.projectDate}
            onChange={(e) => editingItem
              ? setEditingItem({ ...editingItem, projectDate: e.target.value })
              : setFormData({ ...formData, projectDate: e.target.value })
            }
          />

          {/* Tags */}
          <div>
            <label className="text-sm font-bold text-[#1E0E62] mb-2 block">Tags (Select up to 5)</label>
            <div className="flex flex-wrap gap-2">
              {PORTFOLIO_TAGS.map(tag => {
                const isSelected = editingItem 
                  ? editingItem.tags.includes(tag)
                  : formData.tags.includes(tag);
                
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      if (editingItem) {
                        const newTags = isSelected
                          ? editingItem.tags.filter(t => t !== tag)
                          : editingItem.tags.length < 5
                            ? [...editingItem.tags, tag]
                            : editingItem.tags;
                        setEditingItem({ ...editingItem, tags: newTags });
                      } else {
                        handleToggleTag(tag);
                      }
                    }}
                    disabled={!isSelected && (editingItem ? editingItem.tags.length >= 5 : formData.tags.length >= 5)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#7209B7] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Metrics (Optional) */}
          <div>
            <label className="text-sm font-bold text-[#1E0E62] mb-2 block">Performance Metrics (Optional)</label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Views"
                type="number"
                value={editingItem ? editingItem.metrics?.views || 0 : formData.metrics.views}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  if (editingItem) {
                    setEditingItem({
                      ...editingItem,
                      metrics: { ...editingItem.metrics, views: value }
                    });
                  } else {
                    setFormData({
                      ...formData,
                      metrics: { ...formData.metrics, views: value }
                    });
                  }
                }}
                placeholder="0"
              />
              <Input
                label="Likes"
                type="number"
                value={editingItem ? editingItem.metrics?.likes || 0 : formData.metrics.likes}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  if (editingItem) {
                    setEditingItem({
                      ...editingItem,
                      metrics: { ...editingItem.metrics, likes: value }
                    });
                  } else {
                    setFormData({
                      ...formData,
                      metrics: { ...formData.metrics, likes: value }
                    });
                  }
                }}
                placeholder="0"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 sticky bottom-0 bg-white pt-4 border-t border-gray-100">
            <Button
              onClick={() => {
                setIsAddingItem(false);
                setEditingItem(null);
                resetForm();
              }}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={editingItem ? handleUpdateItem : handleAddItem}
              disabled={isSaving}
              isLoading={isSaving}
              variant="gradient"
              className="flex-1"
            >
              {editingItem ? 'Save Changes' : 'Add to Portfolio'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      {viewingItem && (
        <Modal
          isOpen={true}
          onClose={() => setViewingItem(null)}
          title={viewingItem.title}
        >
          <div className="space-y-4">
            {/* Media Preview */}
            <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
              {viewingItem.mediaType === 'VIDEO' ? (
                <video src={viewingItem.mediaUrl} controls className="w-full h-full" />
              ) : viewingItem.mediaType === 'LINK' ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <Link2 className="w-16 h-16 text-gray-400 mb-4" />
                  <a
                    href={viewingItem.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#7209B7] font-bold hover:underline flex items-center gap-2"
                  >
                    View Project <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <img src={viewingItem.mediaUrl} alt={viewingItem.title} className="w-full h-full object-cover" />
              )}
            </div>

            {/* Description */}
            <p className="text-[#8F8FA3]">{viewingItem.description}</p>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <div className="text-xs text-[#8F8FA3] mb-1">Project Date</div>
                <div className="font-bold text-[#1E0E62]">
                  {new Date(viewingItem.projectDate).toLocaleDateString()}
                </div>
              </div>
              {viewingItem.metrics?.engagement && (
                <div>
                  <div className="text-xs text-[#8F8FA3] mb-1">Engagement</div>
                  <div className="font-bold text-[#1E0E62]">{viewingItem.metrics.engagement}</div>
                </div>
              )}
            </div>

            {/* Tags */}
            {viewingItem.tags.length > 0 && (
              <div>
                <div className="text-xs text-[#8F8FA3] mb-2">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {viewingItem.tags.map(tag => (
                    <span key={tag} className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

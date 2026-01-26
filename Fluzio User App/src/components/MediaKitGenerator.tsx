import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Edit, RefreshCw } from 'lucide-react';
import {
  gatherMediaKitData,
  generateMediaKitHTML,
  saveMediaKit,
  getCreatorMediaKits,
  type MediaKitData,
  type MediaKitTemplate,
  type SavedMediaKit,
} from '../services/mediaKitService';

interface MediaKitGeneratorProps {
  creatorId: string;
  creatorName: string;
}

const MediaKitGenerator: React.FC<MediaKitGeneratorProps> = ({ creatorId, creatorName }) => {
  const [mediaKitData, setMediaKitData] = useState<MediaKitData | null>(null);
  const [savedKits, setSavedKits] = useState<SavedMediaKit[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MediaKitTemplate>('professional');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewHTML, setPreviewHTML] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, kits] = await Promise.all([
        gatherMediaKitData(creatorId),
        getCreatorMediaKits(creatorId),
      ]);
      setMediaKitData(data);
      setSavedKits(kits);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!mediaKitData) return;

    setGenerating(true);
    try {
      const html = generateMediaKitHTML(mediaKitData, selectedTemplate);
      setPreviewHTML(html);
      setShowPreview(true);

      // Save to Firestore
      await saveMediaKit(creatorId, selectedTemplate, mediaKitData);
      await loadData();
    } catch (error) {
      console.error('Error generating media kit:', error);
      alert('Failed to generate media kit');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadHTML = () => {
    if (!previewHTML) return;

    const blob = new Blob([previewHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${creatorName.replace(/\s+/g, '_')}_MediaKit.html`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const templates: Array<{ id: MediaKitTemplate; name: string; description: string }> = [
    { id: 'professional', name: 'Professional', description: 'Clean and corporate design' },
    { id: 'creative', name: 'Creative', description: 'Bold and colorful layout' },
    { id: 'minimal', name: 'Minimal', description: 'Simple and elegant' },
    { id: 'modern', name: 'Modern', description: 'Contemporary gradient style' },
  ];

  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">Loading your data...</p>
      </div>
    );
  }

  if (showPreview && previewHTML) {
    return (
      <div className="media-kit-preview">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setShowPreview(false)}
            className="text-blue-600 hover:underline"
          >
            ← Back to Generator
          </button>
          <button
            onClick={handleDownloadHTML}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download HTML
          </button>
        </div>

        <div className="border rounded-lg overflow-hidden shadow-lg">
          <iframe
            srcDoc={previewHTML}
            style={{ width: '100%', height: '800px', border: 'none' }}
            title="Media Kit Preview"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="media-kit-generator">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column: Configuration */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Generate Your Media Kit</h2>

          {/* Template Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Choose Template</h3>
            <div className="grid grid-cols-2 gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedTemplate === template.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-bold text-lg mb-1">{template.name}</h4>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Data Summary */}
          {mediaKitData && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Your Data Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Profile Info</span>
                  <span className="font-medium">✓ Complete</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Skills</span>
                  <span className="font-medium">{mediaKitData.skills.length} skills</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Portfolio Items</span>
                  <span className="font-medium">{mediaKitData.portfolioItems.length} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Testimonials</span>
                  <span className="font-medium">{mediaKitData.testimonials.length} reviews</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Packages</span>
                  <span className="font-medium">{mediaKitData.packages.length} packages</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Projects</span>
                  <span className="font-medium">{mediaKitData.totalProjects}</span>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !mediaKitData}
            className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Generate Media Kit
              </>
            )}
          </button>
        </div>

        {/* Right Column: Saved Kits */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Saved Media Kits</h2>

          {savedKits.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No media kits yet</p>
              <p className="text-sm text-gray-400 mt-2">Generate your first media kit to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedKits.map((kit) => (
                <div key={kit.id} className="border rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg capitalize">{kit.templateId} Template</h3>
                      <p className="text-sm text-gray-500">
                        Created {kit.createdAt.toDate().toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Saved
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center text-sm mb-4">
                    <div>
                      <div className="font-bold text-lg">{kit.data.portfolioItems.length}</div>
                      <div className="text-gray-500">Portfolio</div>
                    </div>
                    <div>
                      <div className="font-bold text-lg">{kit.data.testimonials.length}</div>
                      <div className="text-gray-500">Reviews</div>
                    </div>
                    <div>
                      <div className="font-bold text-lg">{kit.data.packages.length}</div>
                      <div className="text-gray-500">Packages</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const html = generateMediaKitHTML(kit.data, kit.templateId as any);
                        setPreviewHTML(html);
                        setShowPreview(true);
                      }}
                      className="flex-1 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                    <button
                      onClick={() => {
                        const html = generateMediaKitHTML(kit.data, kit.templateId as any);
                        const blob = new Blob([html], { type: 'text/html' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${creatorName.replace(/\s+/g, '_')}_MediaKit_${kit.templateId}.html`;
                        a.click();
                        window.URL.revokeObjectURL(url);
                      }}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaKitGenerator;

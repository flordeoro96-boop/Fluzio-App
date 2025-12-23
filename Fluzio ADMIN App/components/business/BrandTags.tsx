import React from 'react';

interface BrandTagsProps {
  tags: string[];
  title?: string;
}

export const BrandTags: React.FC<BrandTagsProps> = ({ tags, title = "Vibe Tags" }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
      <h2 className="text-xl font-clash font-bold text-[#1E0E62] mb-4">{title}</h2>
      
      {tags && tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, idx) => (
            <span 
              key={idx}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold border border-indigo-100 hover:bg-indigo-100 transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[#8F8FA3] italic text-sm">No vibe tags yet. Add tags to describe your brand's personality!</p>
      )}
    </div>
  );
};

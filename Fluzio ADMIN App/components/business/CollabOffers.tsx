import React from 'react';
import { Gift, Camera, DollarSign, Ticket, MapPin, Package } from 'lucide-react';

interface CollabOffersProps {
  offers?: string[];
}

const offerIcons: Record<string, React.FC<any>> = {
  'Free product': Gift,
  'Free products': Gift,
  'Space for shooting': Camera,
  'Paid sponsorship': DollarSign,
  'Discount codes': Ticket,
  'Event space': MapPin,
  'Product samples': Package
};

const getIconForOffer = (offer: string) => {
  const key = Object.keys(offerIcons).find(k => 
    offer.toLowerCase().includes(k.toLowerCase())
  );
  return key ? offerIcons[key] : Gift;
};

export const CollabOffers: React.FC<CollabOffersProps> = ({ offers }) => {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-md p-6 mb-6 border border-purple-100">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎁</span>
        <h2 className="text-xl font-clash font-bold text-[#1E0E62]">Collaboration Perks</h2>
      </div>
      
      {offers && offers.length > 0 ? (
        <div className="space-y-3">
          {offers.map((offer, idx) => {
          const Icon = getIconForOffer(offer);
          return (
            <div 
              key={idx}
              className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-[#1E0E62]">{offer}</span>
            </div>
          );
        })}
        </div>
      ) : (
        <p className="text-[#8F8FA3] italic text-sm">No collaboration perks added yet. Click Edit to showcase what you offer creators!</p>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Heart, ShoppingBag, UtensilsCrossed, Coffee, Dumbbell, Dog, 
  Palette, Music, Laptop, Sparkles, Plane, Camera, Book, Shirt,
  Watch, Gem, Car, Home, Baby, Flower2, PartyPopper, Bike, 
  Trees, Film, Gamepad2, Pizza, IceCream, Martini, ArrowRight, Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CustomerInterestsScreenProps {
  onComplete: (interests: string[]) => void;
  onSkip?: () => void;
}

interface InterestOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

const INTEREST_OPTIONS: InterestOption[] = [
  { id: 'restaurants', label: 'Restaurants', icon: <UtensilsCrossed className="w-6 h-6" />, color: 'text-red-600', gradient: 'from-red-500 to-orange-500' },
  { id: 'cafes', label: 'Cafés & Coffee', icon: <Coffee className="w-6 h-6" />, color: 'text-amber-600', gradient: 'from-amber-500 to-yellow-500' },
  { id: 'fashion', label: 'Fashion & Clothing', icon: <Shirt className="w-6 h-6" />, color: 'text-purple-600', gradient: 'from-purple-500 to-pink-500' },
  { id: 'jewelry', label: 'Jewelry & Accessories', icon: <Gem className="w-6 h-6" />, color: 'text-pink-600', gradient: 'from-pink-500 to-rose-500' },
  { id: 'fitness', label: 'Fitness & Sports', icon: <Dumbbell className="w-6 h-6" />, color: 'text-green-600', gradient: 'from-green-500 to-emerald-500' },
  { id: 'beauty', label: 'Beauty & Wellness', icon: <Sparkles className="w-6 h-6" />, color: 'text-fuchsia-600', gradient: 'from-fuchsia-500 to-purple-500' },
  { id: 'pets', label: 'Pets & Animals', icon: <Dog className="w-6 h-6" />, color: 'text-orange-600', gradient: 'from-orange-500 to-amber-500' },
  { id: 'art', label: 'Art & Design', icon: <Palette className="w-6 h-6" />, color: 'text-indigo-600', gradient: 'from-indigo-500 to-purple-500' },
  { id: 'music', label: 'Music & Events', icon: <Music className="w-6 h-6" />, color: 'text-violet-600', gradient: 'from-violet-500 to-fuchsia-500' },
  { id: 'tech', label: 'Tech & Gadgets', icon: <Laptop className="w-6 h-6" />, color: 'text-blue-600', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'travel', label: 'Travel & Adventure', icon: <Plane className="w-6 h-6" />, color: 'text-sky-600', gradient: 'from-sky-500 to-blue-500' },
  { id: 'photography', label: 'Photography', icon: <Camera className="w-6 h-6" />, color: 'text-slate-600', gradient: 'from-slate-500 to-gray-500' },
  { id: 'books', label: 'Books & Literature', icon: <Book className="w-6 h-6" />, color: 'text-brown-600', gradient: 'from-amber-700 to-orange-700' },
  { id: 'watches', label: 'Watches & Luxury', icon: <Watch className="w-6 h-6" />, color: 'text-zinc-600', gradient: 'from-zinc-600 to-slate-600' },
  { id: 'automotive', label: 'Automotive', icon: <Car className="w-6 h-6" />, color: 'text-red-700', gradient: 'from-red-600 to-rose-600' },
  { id: 'home', label: 'Home & Decor', icon: <Home className="w-6 h-6" />, color: 'text-teal-600', gradient: 'from-teal-500 to-cyan-500' },
  { id: 'kids', label: 'Kids & Family', icon: <Baby className="w-6 h-6" />, color: 'text-pink-500', gradient: 'from-pink-400 to-rose-400' },
  { id: 'flowers', label: 'Flowers & Plants', icon: <Flower2 className="w-6 h-6" />, color: 'text-green-500', gradient: 'from-green-400 to-lime-400' },
  { id: 'events', label: 'Events & Parties', icon: <PartyPopper className="w-6 h-6" />, color: 'text-yellow-600', gradient: 'from-yellow-500 to-orange-400' },
  { id: 'cycling', label: 'Cycling & Biking', icon: <Bike className="w-6 h-6" />, color: 'text-lime-600', gradient: 'from-lime-500 to-green-500' },
  { id: 'nature', label: 'Nature & Outdoors', icon: <Trees className="w-6 h-6" />, color: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-500' },
  { id: 'cinema', label: 'Cinema & Film', icon: <Film className="w-6 h-6" />, color: 'text-purple-700', gradient: 'from-purple-600 to-indigo-600' },
  { id: 'gaming', label: 'Gaming', icon: <Gamepad2 className="w-6 h-6" />, color: 'text-indigo-500', gradient: 'from-indigo-400 to-blue-500' },
  { id: 'fastfood', label: 'Fast Food', icon: <Pizza className="w-6 h-6" />, color: 'text-orange-500', gradient: 'from-orange-400 to-red-400' },
  { id: 'desserts', label: 'Desserts & Sweets', icon: <IceCream className="w-6 h-6" />, color: 'text-pink-400', gradient: 'from-pink-300 to-fuchsia-400' },
  { id: 'nightlife', label: 'Nightlife & Bars', icon: <Martini className="w-6 h-6" />, color: 'text-violet-500', gradient: 'from-violet-400 to-purple-500' },
];

export const CustomerInterestsScreen: React.FC<CustomerInterestsScreenProps> = ({ 
  onComplete, 
  onSkip 
}) => {
  const { t } = useTranslation();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(interestId)) {
        return prev.filter(id => id !== interestId);
      }
      return [...prev, interestId];
    });
  };

  const handleContinue = () => {
    if (selectedInterests.length > 0) {
      onComplete(selectedInterests);
    }
  };

  const isSelected = (id: string) => selectedInterests.includes(id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FE] via-white to-[#F8F9FE] flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#00E5FF] to-[#6C4BFF] mb-4 shadow-lg">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#1E0E62] mb-3">
            What interests you?
          </h1>
          <p className="text-lg text-[#8F8FA3] max-w-2xl mx-auto">
            Choose what you love! We'll show you missions and businesses tailored to your passions. 
            <span className="block mt-1 text-sm text-[#00E5FF] font-semibold">
              Select at least 3 to get the best recommendations ✨
            </span>
          </p>
        </div>

        {/* Selected Count Indicator */}
        <div className="flex justify-center mb-6">
          <div className={`px-6 py-2 rounded-full transition-all duration-300 ${
            selectedInterests.length >= 3 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105' 
              : 'bg-white border-2 border-gray-200 text-gray-600'
          }`}>
            <span className="font-bold">{selectedInterests.length}</span> selected
            {selectedInterests.length >= 3 && (
              <Check className="w-4 h-4 inline ml-2" />
            )}
          </div>
        </div>

        {/* Interest Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          {INTEREST_OPTIONS.map((interest, index) => {
            const selected = isSelected(interest.id);
            const hovered = hoveredId === interest.id;
            
            return (
              <button
                key={interest.id}
                onClick={() => toggleInterest(interest.id)}
                onMouseEnter={() => setHoveredId(interest.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`
                  relative p-4 rounded-2xl border-2 transition-all duration-300 transform
                  ${selected 
                    ? 'border-transparent shadow-xl scale-105 -translate-y-1' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5'
                  }
                `}
                style={{
                  animationDelay: `${index * 30}ms`,
                  backgroundImage: selected ? `linear-gradient(135deg, var(--tw-gradient-stops))` : undefined,
                  // @ts-ignore
                  '--tw-gradient-from': selected ? `var(--${interest.gradient.split(' ')[0].replace('from-', '')})` : undefined,
                  '--tw-gradient-to': selected ? `var(--${interest.gradient.split(' ')[1].replace('to-', '')})` : undefined,
                }}
              >
                {/* Selection Check Mark */}
                {selected && (
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center animate-scale-in">
                    <Check className="w-4 h-4 text-green-600 font-bold" />
                  </div>
                )}

                {/* Icon */}
                <div className={`
                  flex items-center justify-center w-14 h-14 mx-auto mb-3 rounded-xl transition-all duration-300
                  ${selected 
                    ? 'bg-white/20 text-white' 
                    : `bg-gradient-to-br ${interest.gradient} text-white`
                  }
                  ${hovered && !selected ? 'scale-110' : ''}
                `}>
                  {interest.icon}
                </div>

                {/* Label */}
                <p className={`
                  text-xs font-semibold text-center transition-colors duration-300 leading-tight
                  ${selected ? 'text-white' : 'text-[#1E0E62]'}
                `}>
                  {interest.label}
                </p>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {onSkip && (
            <button
              onClick={onSkip}
              className="px-6 py-3 rounded-xl text-[#8F8FA3] hover:text-[#1E0E62] transition-colors font-medium"
            >
              Skip for now
            </button>
          )}
          
          <button
            onClick={handleContinue}
            disabled={selectedInterests.length === 0}
            className={`
              px-8 py-4 rounded-xl font-bold text-white transition-all duration-300 transform
              flex items-center gap-2 shadow-lg
              ${selectedInterests.length > 0
                ? 'bg-gradient-to-r from-[#00E5FF] to-[#6C4BFF] hover:shadow-2xl hover:scale-105 cursor-pointer'
                : 'bg-gray-300 cursor-not-allowed opacity-50'
              }
            `}
          >
            {selectedInterests.length >= 3 ? "Let's Go!" : 'Continue'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Helpful Tip */}
        {selectedInterests.length > 0 && selectedInterests.length < 3 && (
          <p className="text-center text-sm text-[#8F8FA3] mt-4 animate-fade-in">
            💡 Select {3 - selectedInterests.length} more to unlock personalized recommendations
          </p>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scale-in {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  );
};

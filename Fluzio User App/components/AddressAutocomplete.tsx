import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader } from 'lucide-react';

interface AddressAutocompleteProps {
  onAddressSelect: (address: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
    fullAddress: string;
  }) => void;
  initialValue?: string;
  placeholder?: string;
  label?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onAddressSelect,
  initialValue = '',
  placeholder = 'Start typing your address...',
  label = 'Address'
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load Google Places API if not already loaded
    if (!window.google?.maps?.places) {
      const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
      
      if (!apiKey || apiKey === 'YOUR_GOOGLE_PLACES_API_KEY_HERE') {
        console.warn('Google Places API key not configured. Address autocomplete will not work.');
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initAutocomplete;
      document.head.appendChild(script);
    } else {
      initAutocomplete();
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const initAutocomplete = () => {
    if (!inputRef.current) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      fields: ['address_components', 'formatted_address', 'geometry']
    });

    autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
  };

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.address_components) return;

    let street = '';
    let city = '';
    let zipCode = '';
    let country = '';

    place.address_components.forEach((component) => {
      const types = component.types;

      if (types.includes('street_number')) {
        street = component.long_name + ' ';
      }
      if (types.includes('route')) {
        street += component.long_name;
      }
      if (types.includes('locality') || types.includes('postal_town')) {
        city = component.long_name;
      }
      if (types.includes('postal_code')) {
        zipCode = component.long_name;
      }
      if (types.includes('country')) {
        country = component.long_name;
      }
    });

    setInputValue(place.formatted_address || '');

    onAddressSelect({
      street: street.trim(),
      city,
      zipCode,
      country,
      fullAddress: place.formatted_address || ''
    });
  };

  const handleUseCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocoding
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat: latitude, lng: longitude } },
        (results, status) => {
          if (status === 'OK' && results?.[0]) {
            setInputValue(results[0].formatted_address);
            
            // Parse address components
            let street = '';
            let city = '';
            let zipCode = '';
            let country = '';

            results[0].address_components.forEach((component) => {
              const types = component.types;
              if (types.includes('street_number')) street = component.long_name + ' ';
              if (types.includes('route')) street += component.long_name;
              if (types.includes('locality') || types.includes('postal_town')) city = component.long_name;
              if (types.includes('postal_code')) zipCode = component.long_name;
              if (types.includes('country')) country = component.long_name;
            });

            onAddressSelect({
              street: street.trim(),
              city,
              zipCode,
              country,
              fullAddress: results[0].formatted_address
            });
          }
        }
      );
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-bold text-[#1E0E62] mb-2">
          {label}
        </label>
      )}
      
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-focus-within:bg-purple-100 transition-colors">
          <MapPin className="w-5 h-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-[4.5rem] pr-4 py-4 rounded-2xl border-2 border-gray-200 bg-white focus:border-purple-500 focus:ring-0 outline-none font-medium text-[#1E0E62] placeholder:text-gray-400 transition-all"
        />

        {inputValue && (
          <button
            onClick={() => {
              setInputValue('');
              onAddressSelect({ street: '', city: '', zipCode: '', country: '', fullAddress: '' });
            }}
            className="absolute right-16 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 transition-colors"
          >
            ×
          </button>
        )}
      </div>

      <button
        onClick={handleUseCurrentLocation}
        disabled={isLoading}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Navigation className="w-4 h-4" />
        )}
        {isLoading ? 'Detecting location...' : 'Use my current location'}
      </button>

      <p className="text-xs text-[#8F8FA3] px-2 flex items-start gap-2">
        <span className="text-purple-500 shrink-0">💡</span>
        Start typing and select from suggestions for auto-filled address details
      </p>
    </div>
  );
};

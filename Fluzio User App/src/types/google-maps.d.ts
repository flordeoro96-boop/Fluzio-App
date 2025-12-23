// Google Maps TypeScript declarations
declare global {
  interface Window {
    google: typeof google;
  }

  namespace google.maps {
    namespace places {
      class Autocomplete {
        constructor(input: HTMLInputElement, opts?: AutocompleteOptions);
        addListener(eventName: string, handler: () => void): void;
        getPlace(): PlaceResult;
      }

      interface AutocompleteOptions {
        types?: string[];
        fields?: string[];
        componentRestrictions?: ComponentRestrictions;
      }

      interface PlaceResult {
        address_components?: AddressComponent[];
        formatted_address?: string;
        geometry?: Geometry;
      }

      interface AddressComponent {
        long_name: string;
        short_name: string;
        types: string[];
      }

      interface Geometry {
        location: LatLng;
      }

      interface ComponentRestrictions {
        country?: string | string[];
      }
    }

    class Geocoder {
      geocode(
        request: GeocoderRequest,
        callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void
      ): void;
    }

    interface GeocoderRequest {
      location?: LatLngLiteral;
      address?: string;
    }

    interface GeocoderResult {
      address_components: places.AddressComponent[];
      formatted_address: string;
      geometry: places.Geometry;
    }

    type GeocoderStatus = 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    namespace event {
      function clearInstanceListeners(instance: any): void;
    }
  }
}

export {};

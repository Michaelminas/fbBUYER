'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, placeDetails?: any) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

interface PlaceDetails {
  formatted_address: string;
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  postal_code?: string;
  country?: string;
  lat?: number;
  lng?: number;
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Enter your address",
  className = "",
  required = false,
  disabled = false
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [autocomplete, setAutocomplete] = useState<any>(null);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        // Try the main Google Maps API key first, fallback to Places key
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
        
        if (!apiKey) {
          console.warn('Google Places API key not found. Using basic text input.');
          return;
        }

        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();
        
        // Check if Places API is available
        if (!(window as any).google?.maps?.places?.Autocomplete) {
          throw new Error('Places API not available - check API key permissions');
        }
        
        setIsGoogleLoaded(true);
      } catch (error) {
        console.error('Error loading Google Maps API:', error);
        console.warn('Places API unavailable. Check that Places API and Maps JavaScript API are enabled for your API key.');
        // Component will work as basic text input
      }
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (isGoogleLoaded && inputRef.current && !autocomplete) {
      const autocompleteInstance = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'AU' }, // Restrict to Australia
        fields: [
          'formatted_address',
          'address_components',
          'geometry',
          'name',
          'place_id'
        ]
      });

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        
        if (place && place.formatted_address) {
          const placeDetails: PlaceDetails = {
            formatted_address: place.formatted_address,
            lat: place.geometry?.location?.lat(),
            lng: place.geometry?.location?.lng()
          };

          // Parse address components
          place.address_components?.forEach((component: any) => {
            const types = component.types;
            if (types.includes('street_number')) {
              placeDetails.street_number = component.long_name;
            } else if (types.includes('route')) {
              placeDetails.route = component.long_name;
            } else if (types.includes('locality')) {
              placeDetails.locality = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              placeDetails.administrative_area_level_1 = component.short_name;
            } else if (types.includes('postal_code')) {
              placeDetails.postal_code = component.long_name;
            } else if (types.includes('country')) {
              placeDetails.country = component.long_name;
            }
          });

          onChange(place.formatted_address, place);
        }
      });

      setAutocomplete(autocompleteInstance);
    }
  }, [isGoogleLoaded, autocomplete, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
        required={required}
        disabled={disabled}
      />
      
      {!isGoogleLoaded && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {!isGoogleLoaded && process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY && (
        <div className="mt-1 text-xs text-gray-500">
          💡 Enter your full address manually (autocomplete unavailable)
        </div>
      )}
      
      {!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY && (
        <div className="mt-1 text-xs text-gray-500">
          💡 Enter your full address manually
        </div>
      )}
    </div>
  );
}

// Utility function to extract suburb and postcode from place details
export function extractAddressDetails(place: any): {
  street: string;
  suburb: string;
  postcode: string;
  state: string;
  formattedAddress: string;
  latitude?: number;
  longitude?: number;
} {
  let street = '';
  let suburb = '';
  let postcode = '';
  let state = 'NSW'; // Default to NSW

  place.address_components?.forEach((component: any) => {
    const types = component.types;
    if (types.includes('street_number') || types.includes('route')) {
      street += (street ? ' ' : '') + component.long_name;
    } else if (types.includes('locality') || types.includes('sublocality_level_1')) {
      suburb = component.long_name;
    } else if (types.includes('postal_code')) {
      postcode = component.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      state = component.short_name;
    }
  });

  return {
    street: street.trim(),
    suburb,
    postcode,
    state,
    formattedAddress: place.formatted_address || '',
    latitude: place.geometry?.location?.lat(),
    longitude: place.geometry?.location?.lng()
  };
}
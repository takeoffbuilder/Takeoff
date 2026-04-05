import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

type AddressSelection = {
  street: string;
  city: string;
  state: string;
  zip: string;
  full: string;
};

type GoogleAddressComponentLike = {
  types?: string[];
  shortText?: string;
  longText?: string;
};

type GooglePlaceLike = {
  fetchFields: (args: { fields: string[] }) => Promise<void>;
  addressComponents?: GoogleAddressComponentLike[];
  formattedAddress?: string;
};

type GooglePlacePredictionLike = {
  placeId?: string;
  text?: { text?: string };
  mainText?: { text?: string };
  secondaryText?: { text?: string };
  toPlace: () => GooglePlaceLike;
};

type GoogleAutocompleteSuggestionLike = {
  placePrediction?: GooglePlacePredictionLike | null;
};

type GooglePlacesLibraryLike = {
  AutocompleteSessionToken: new () => unknown;
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (args: {
      input: string;
      sessionToken: unknown;
      includedRegionCodes: string[];
      language: string;
      region: string;
    }) => Promise<{
      suggestions?: GoogleAutocompleteSuggestionLike[];
    }>;
  };
};

type SuggestionItem = {
  id: string;
  label: string;
  prediction: GooglePlacePredictionLike;
};

const AddressAutocomplete = ({
  onSelect,
  value,
  onValueChange,
}: {
  onSelect: (address: AddressSelection) => void;
  value?: string;
  onValueChange?: (value: string) => void;
}) => {
  const [internalValue, setInternalValue] = useState(value ?? '');
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'OK' | 'ERROR'>(
    'IDLE'
  );
  const [data, setData] = useState<SuggestionItem[]>([]);

  const sessionTokenRef = useRef<unknown | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRequestIdRef = useRef(0);

  const inputValue = value ?? internalValue;

  const hasGooglePlaces = Boolean(
    typeof window !== 'undefined' &&
      window.google?.maps?.places?.AutocompleteSuggestion
  );

  useEffect(() => {
    setInternalValue(value ?? '');
  }, [value]);

  useEffect(() => {
    let cancelled = false;

    const initPlaces = async () => {
      if (typeof window === 'undefined' || !window.google?.maps) {
        return;
      }

      try {
        await window.google.maps.importLibrary('places');
        if (cancelled) return;

        const places = window.google.maps.places as GooglePlacesLibraryLike;
        sessionTokenRef.current = new places.AutocompleteSessionToken();

        setReady(true);
      } catch (err) {
        console.error(
          '[AddressAutocomplete] Failed to load places library',
          err
        );
        if (!cancelled) {
          setReady(false);
          setStatus('ERROR');
        }
      }
    };

    initPlaces();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !hasGooglePlaces) return;

    const query = inputValue.trim();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query) {
      setData([]);
      setStatus('IDLE');
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const requestId = activeRequestIdRef.current + 1;
      activeRequestIdRef.current = requestId;
      setStatus('LOADING');

      try {
        const places = window.google.maps.places as GooglePlacesLibraryLike;

        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new places.AutocompleteSessionToken();
        }

        const { suggestions } =
          await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: query,
            sessionToken: sessionTokenRef.current,
            includedRegionCodes: ['us'],
            language: 'en-US',
            region: 'us',
          });

        if (activeRequestIdRef.current !== requestId) return;

        const nextData = (suggestions || [])
          .map((suggestion) => {
            const prediction = suggestion.placePrediction;
            if (!prediction?.placeId) return null;

            return {
              id: prediction.placeId,
              label:
                prediction.text?.text ||
                [prediction.mainText?.text, prediction.secondaryText?.text]
                  .filter(Boolean)
                  .join(', '),
              prediction,
            } as SuggestionItem;
          })
          .filter((item): item is SuggestionItem => Boolean(item));

        setData(nextData);
        setStatus(nextData.length > 0 ? 'OK' : 'IDLE');
      } catch (err) {
        if (activeRequestIdRef.current !== requestId) return;
        console.error('[AddressAutocomplete] Suggestion lookup failed', err);
        setStatus('ERROR');
        setData([]);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [hasGooglePlaces, inputValue, ready]);

  const clearSuggestions = () => {
    setData([]);
    setStatus('IDLE');
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  const handleSelect = async (item: SuggestionItem) => {
    try {
      const place = item.prediction.toPlace();
      await place.fetchFields({
        fields: ['addressComponents', 'formattedAddress'],
      });

      const components = place.addressComponents || [];
      const get = (type: string, useShort = false) => {
        const comp = components.find((c) => c.types?.includes(type));
        if (!comp) return '';
        return useShort ? comp.shortText || '' : comp.longText || '';
      };

      const street = [get('street_number'), get('route')]
        .filter(Boolean)
        .join(' ');
      const city =
        get('locality') ||
        get('sublocality') ||
        get('administrative_area_level_2');
      const state = get('administrative_area_level_1', true);
      const zip = get('postal_code');
      const full = place.formattedAddress || item.label;

      setInternalValue(street || full);
      onValueChange?.(street || full);
      clearSuggestions();
      onSelect({
        street,
        city,
        state,
        zip,
        full,
      });

      const places = window.google.maps.places as GooglePlacesLibraryLike;
      sessionTokenRef.current = new places.AutocompleteSessionToken();
    } catch (err) {
      console.error(
        '[AddressAutocomplete] Failed to resolve selected place',
        err
      );
    }
  };

  return (
    <div>
      <Input
        value={inputValue}
        onChange={handleInput}
        disabled={!ready}
        placeholder="Enter your address"
        autoComplete="street-address"
        className="bg-brand-midnight/50 border-brand-sky-blue/30 text-brand-white focus:border-brand-sky-blue"
      />
      {status === 'OK' && data.length > 0 && (
        <ul className="bg-white border rounded shadow mt-1 max-h-64 overflow-auto">
          {data.map((item) => (
            <li
              key={item.id}
              onClick={() => handleSelect(item)}
              className="p-2 cursor-pointer hover:bg-gray-100"
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressAutocomplete;

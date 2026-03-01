import React from 'react';
import { Input } from '@/components/ui/input';
import usePlacesAutocomplete, { getGeocode } from 'use-places-autocomplete';

const AddressAutocomplete = ({
  onSelect,
  value,
  onValueChange,
}: {
  onSelect: (address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    full: string;
  }) => void;
  value?: string;
  onValueChange?: (value: string) => void;
}) => {
  const {
    ready,
    value: valueFromHook,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      /* Define search scope here if needed */
    },
    debounce: 300,
  });

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setValue(nextValue);
    onValueChange?.(nextValue);
  };

  const handleSelect = (address: string) => {
    getGeocode({ address }).then((results) => {
      if (!results[0]) return;
      const components = results[0].address_components;
      const get = (type: string, useShort = false) => {
        const comp = components.find((c: unknown) => {
          if (
            typeof c === 'object' &&
            c !== null &&
            Array.isArray((c as { types?: unknown }).types)
          ) {
            return (c as { types: string[] }).types.includes(type);
          }
          return false;
        });
        if (!comp) return '';
        return useShort
          ? (comp as { short_name: string }).short_name
          : (comp as { long_name: string }).long_name;
      };
      const street = [get('street_number'), get('route')]
        .filter(Boolean)
        .join(' ');
      const city =
        get('locality') ||
        get('sublocality') ||
        get('administrative_area_level_2');
      const state = get('administrative_area_level_1', true); // use short_name for state abbreviation
      const zip = get('postal_code');
      setValue(street, false);
      clearSuggestions();
      onSelect({
        street,
        city,
        state,
        zip,
        full: address,
      });
    });
  };

  return (
    <div>
      <Input
        value={value ?? valueFromHook}
        onChange={handleInput}
        disabled={!ready}
        placeholder="Enter your address"
        className="bg-brand-midnight/50 border-brand-sky-blue/30 text-brand-white focus:border-brand-sky-blue"
      />
      {status === 'OK' && (
        <ul className="bg-white border rounded shadow mt-1">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              onClick={() => handleSelect(description)}
              className="p-2 cursor-pointer hover:bg-gray-100"
            >
              {description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressAutocomplete;

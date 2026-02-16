// Utility to call Google Maps Geocoding API for address validation
// Returns null if not configured or on error
export async function verifyWithGoogleMaps({ street, street2, city, state, zipcode }: {
  street: string;
  street2?: string;
  city: string;
  state: string;
  zipcode: string;
}) {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!apiKey) return null;
  const address = encodeURIComponent(
    [street, street2, city, state, zipcode].filter(Boolean).join(', ')
  );
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey}`;
  try {
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) return null;
    const data = await resp.json();
    // Debug log: output the full Google API response
    console.log('[verifyWithGoogleMaps] Google API response:', JSON.stringify(data, null, 2));
    if (!Array.isArray(data.results) || data.results.length === 0) {
      return { deliverable: false };
    }
    const result = data.results[0];
    // Check for partial_match or other issues
    if (result.partial_match) {
      return { deliverable: false, error: 'Partial address match.' };
    }
    // Extract normalized address components
    const components = result.address_components;
    const get = (type: string) => {
      const comp = components.find((c: unknown) => {
        if (typeof c === 'object' && c !== null && Array.isArray((c as { types?: unknown }).types)) {
          return ((c as { types: string[] }).types).includes(type);
        }
        return false;
      });
      return comp && typeof comp === 'object' && comp !== null && 'long_name' in comp ? (comp as { long_name: string }).long_name : '';
    };
    return {
      deliverable: true,
      normalized: {
        street1: get('street_number') + ' ' + get('route'),
        city: get('locality') || get('sublocality') || get('administrative_area_level_2'),
        state: get('administrative_area_level_1'),
        zip5: get('postal_code'),
      },
      notes: undefined,
    };
  } catch {
    return null;
  }
}

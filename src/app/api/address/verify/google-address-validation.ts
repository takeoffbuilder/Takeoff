// Utility to call Google Address Validation API
// https://developers.google.com/maps/documentation/address-validation/

export async function verifyWithGoogleAddressValidation({ street, street2, city, state, zipcode }: {
  street: string;
  street2?: string;
  city: string;
  state: string;
  zipcode: string;
}) {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!apiKey) return { deliverable: false, error: 'Google API key not configured.' };

  // Build address payload
  const address = {
    address: {
      regionCode: 'US',
      locality: city,
      administrativeArea: state,
      postalCode: zipcode,
      addressLines: [street].concat(street2 ? [street2] : []),
    },
  };

  try {
    const resp = await fetch(
      `https://addressvalidation.googleapis.com/v1:validateAddress?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address),
      }
    );
    if (!resp.ok) return { deliverable: false, error: 'Google Address Validation API request failed.' };
    const data = await resp.json();
    // Debug log: output the full Google Address Validation API response
     
    console.log('[verifyWithGoogleAddressValidation] Google API response:', JSON.stringify(data, null, 2));

    // Check verdict
    if (data.verdict?.hasUnconfirmedComponents || !data.verdict?.addressComplete) {
      return { deliverable: false, error: 'Address not fully confirmed.' };
    }
    if (data.verdict?.hasInferredComponents) {
      // Accept, but warn
      return {
        deliverable: true,
        normalized: data.address?.formattedAddress,
        notes: 'Some address components were inferred.',
      };
    }
    return {
      deliverable: true,
      normalized: data.address?.formattedAddress,
      notes: undefined,
    };
  } catch {
    return { deliverable: false, error: 'Google Address Validation API error.' };
  }
}

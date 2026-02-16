// Utility to call SmartyStreets US Street Address API
// Returns null if not configured or on error
export async function verifyWithSmartyStreets({ street, street2, city, state, zipcode }: {
  street: string;
  street2?: string;
  city: string;
  state: string;
  zipcode: string;
}) {
  const authId = process.env.SMARTY_AUTH_ID;
  const authToken = process.env.SMARTY_AUTH_TOKEN;
  if (!authId || !authToken) return null;

  const params = new URLSearchParams({
    'street': street,
    ...(street2 ? { 'street2': street2 } : {}),
    'city': city,
    'state': state,
    'zipcode': zipcode,
    'candidates': '1',
  });

  const url = `https://us-street.api.smartystreets.com/street-address?${params.toString()}&auth-id=${authId}&auth-token=${authToken}`;

  try {
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) return { deliverable: false };
    const d = data[0];
    return {
      deliverable: d.analysis?.dpv_match_code === 'Y' || d.analysis?.dpv_match_code === 'S',
      normalized: {
        street1: d.delivery_line_1,
        street2: d.delivery_line_2 || '',
        city: d.components?.city_name,
        state: d.components?.state_abbreviation,
        zip5: d.components?.zipcode,
        zip4: d.components?.plus4_code,
      },
      dpv: {
        confirmation: d.analysis?.dpv_match_code,
        footnotes: d.analysis?.dpv_footnotes,
      },
      notes: d.analysis?.dpv_match_code === 'S' ? 'Address may require an apartment/unit/suite.' : undefined,
    };
  } catch {
    return null;
  }
}

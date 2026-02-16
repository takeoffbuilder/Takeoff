import { NextResponse } from 'next/server';
import { verifyWithSmartyStreets } from './smarty';
import { verifyWithGoogleMaps } from './google';
import { verifyWithGoogleAddressValidation } from './google-address-validation';

export async function POST(req: Request) {
  const configured = !!process.env.SMARTY_AUTH_ID && !!process.env.SMARTY_AUTH_TOKEN;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ configured, error: 'Invalid request body' }, { status: 400 });
  }
  const { streetAddress, city, state, zipCode } = (body as { streetAddress?: string; city?: string; state?: string; zipCode?: string }) || {};
  if (!streetAddress || !city || !state || !zipCode) {
    return NextResponse.json({ configured, error: 'Missing required address fields' }, { status: 400 });
  }
  // Try Google Address Validation API first
  const googleValidationResult = await verifyWithGoogleAddressValidation({
    street: streetAddress,
    city,
    state,
    zipcode: zipCode,
  });
  if (googleValidationResult && googleValidationResult.deliverable) {
    return NextResponse.json({ configured: !!process.env.GOOGLE_MAPS_SERVER_API_KEY, ...googleValidationResult });
  }
  // Fallback to Google Maps Geocoding
  const googleResult = await verifyWithGoogleMaps({
    street: streetAddress,
    city,
    state,
    zipcode: zipCode,
  });
  if (googleResult && googleResult.deliverable) {
    return NextResponse.json({ configured: !!process.env.GOOGLE_MAPS_SERVER_API_KEY, ...googleResult });
  }
  // Fallback to SmartyStreets if Google fails or not configured
  if (configured) {
    const smartyResult = await verifyWithSmartyStreets({
      street: streetAddress,
      city,
      state,
      zipcode: zipCode,
    });
    if (smartyResult) {
      return NextResponse.json({ configured, ...smartyResult });
    }
  }
  // If all fail
  return NextResponse.json({ configured: !!process.env.GOOGLE_MAPS_SERVER_API_KEY || configured, deliverable: false, error: 'Address verification failed or not deliverable.' }, { status: 200 });
}

export function GET() {
  return NextResponse.json({ configured: !!process.env.SMARTY_AUTH_ID && !!process.env.SMARTY_AUTH_TOKEN });
}

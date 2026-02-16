export type AddressInput = {
  streetAddress: string;
  address2?: string | null;
  city: string;
  state: string;
  zipCode: string;
};

export type AddressVerifyResult = {
  configured: boolean;
  deliverable?: boolean;
  normalized?: {
    street1: string;
    street2?: string | null;
    city: string;
    state: string;
    zip5: string;
    zip4?: string | null;
  };
  dpv?: {
    confirmation?: string | null; // Y, N, D, S
    footnotes?: string | null;
  };
  notes?: string;
  error?: string;
};

export const addressService = {
  async verify(input: AddressInput): Promise<AddressVerifyResult> {
    console.log('[addressService.verify] Input:', input);
    const resp = await fetch('/api/address/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    // API always returns 200 with a body indicating status, unless bad request
    const data = (await resp.json()) as AddressVerifyResult;
    console.log('[addressService.verify] API response:', data);
    return data;
  },
};

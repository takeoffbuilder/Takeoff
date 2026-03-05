import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/integrations/supabase/admin-client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId, email } = req.body;
  if (!userId || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const supabase = createAdminClient();
    // Check for existing Stripe customer ID in profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, first_name, last_name, full_name')
      .eq('id', userId)
      .single();
    if (profile && profile.stripe_customer_id) {
      // Existing Stripe customer found, return it
      return res.status(200).json({ customerId: profile.stripe_customer_id });
    }
    // Build name from personal info or profile
    let name = '';
    const { data: personalInfo } = await supabase
      .from('user_personal_info')
      .select('first_name, last_name')
      .eq('user_id', userId)
      .single();
    if (personalInfo && (personalInfo.first_name || personalInfo.last_name)) {
      name = `${personalInfo.first_name || ''} ${personalInfo.last_name || ''}`.trim();
    } else if (profile) {
      if (profile.first_name || profile.last_name) {
        name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
      } else if (profile.full_name) {
        name = profile.full_name;
      }
    }
    if (!name) {
      name = email;
    }
    // Create Stripe customer
    const customer = await stripe.customers.create({
      name,
      email,
      metadata: { user_id: userId }
    });
    // Store Stripe customer ID and full name in Supabase profiles
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customer.id, full_name: name })
      .eq('id', userId);
    return res.status(200).json({ customerId: customer.id });
  } catch (error) {
    console.error('Stripe customer creation error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

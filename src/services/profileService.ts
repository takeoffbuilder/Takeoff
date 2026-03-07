import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type UserPersonalInfo =
  Database['public']['Tables']['user_personal_info']['Row'];
type UserPersonalInfoInsert =
  Database['public']['Tables']['user_personal_info']['Insert'];

// Extend update type locally to allow new optional column 'address2' without regenerating types
type UserPersonalInfoUpdateExtended = Partial<UserPersonalInfo> & {
  address2?: string | null;
  middle_initial?: string | null;
  generation_code?: string | null;
};

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateProfile(
    userId: string,
    updates: ProfileUpdate
  ): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createProfile(
    userId: string,
    profileData: Partial<Profile>
  ): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ id: userId, ...profileData }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPersonalInfo(userId: string): Promise<UserPersonalInfo | null> {
    // First, query without .single() to handle multiple rows gracefully
    const { data, error } = await supabase
      .from('user_personal_info')
      .select('*')
      .eq('user_id', userId);

    // If there's an error (excluding not found), throw it
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching personal info:', error);
      return null;
    }

    // If no data, return null
    if (!data || data.length === 0) {
      return null;
    }

    // If multiple rows exist, return the first one and log a warning
    if (data.length > 1) {
      console.warn(
        `Multiple personal info records found for user ${userId}, returning the first one`
      );
    }

    return data[0];
  },

  async createPersonalInfo(
    personalData: UserPersonalInfoInsert
  ): Promise<UserPersonalInfo> {
    const optionalCols = ['address2', 'middle_initial', 'generation_code'];

    const attemptInsert = async (
      omitKeys: string[]
    ): Promise<UserPersonalInfo> => {
      const payload: UserPersonalInfoInsert = { ...personalData };
      for (const k of omitKeys) delete payload[k];
      const { data, error } = await supabase
        .from('user_personal_info')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data as UserPersonalInfo;
    };

    // Try insert, if unknown column error, iteratively drop optional columns and retry
    let omit: string[] = [];
    for (let i = 0; i < optionalCols.length + 1; i++) {
      try {
        return await attemptInsert(omit);
      } catch (err: unknown) {
        const e = err as { message?: string; code?: string };
        const msg = (e?.message || '').toLowerCase();
        if (e?.code === '42703' || optionalCols.some((c) => msg.includes(c))) {
          const offending = optionalCols.find(
            (c) => !omit.includes(c) && msg.includes(c)
          );
          if (offending) {
            omit = [...omit, offending];
            continue;
          }
        }
        throw err as Error;
      }
    }
    // Fallback (should not reach)
    return await attemptInsert(optionalCols);
  },

  async updatePersonalInfo(
    userId: string,
    updates: UserPersonalInfoUpdateExtended
  ): Promise<UserPersonalInfo> {
    const optionalCols = ['address2', 'middle_initial', 'generation_code'];

    const attemptUpdate = async (
      omitKeys: string[]
    ): Promise<UserPersonalInfo> => {
      const payload: Record<string, unknown> = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      for (const k of omitKeys) delete payload[k];
      const { data, error } = await supabase
        .from('user_personal_info')
        .update(payload)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data as UserPersonalInfo;
    };

    let omit: string[] = [];
    for (let i = 0; i < optionalCols.length + 1; i++) {
      try {
        return await attemptUpdate(omit);
      } catch (err: unknown) {
        const e = err as { message?: string; code?: string };
        const msg = (e?.message || '').toLowerCase();
        if (e?.code === '42703' || optionalCols.some((c) => msg.includes(c))) {
          const offending = optionalCols.find(
            (c) => !omit.includes(c) && msg.includes(c)
          );
          if (offending) {
            omit = [...omit, offending];
            continue;
          }
        }
        throw err as Error;
      }
    }
    // Final fallback attempt removing all optional columns
    return await attemptUpdate(optionalCols);
  },
};

import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/integrations/supabase/admin-client';
import type { Database } from '@/integrations/supabase/types';
import { AVAILABLE_COURSES } from '@/services/courseService'; // adjust as needed

type DownloadedCourse = Database['public']['Tables']['downloaded_courses']['Row'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Auth: require user session
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid auth token' });
    }
    const token = authHeader.replace('Bearer ', '');
    const supabase = createAdminClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    const userId = user.id;

    // Parse body (handle both parsed and raw JSON)
    let courseSlug: string | undefined;
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        courseSlug = parsed.courseSlug;
      } catch {
        return res.status(400).json({ error: 'Invalid request body' });
      }
    } else {
      courseSlug = req.body.courseSlug;
    }
    if (!courseSlug) {
      return res.status(400).json({ error: 'Missing courseSlug' });
    }
    const course = AVAILABLE_COURSES.find((c) => c.slug === courseSlug);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Enforce download limit
    const { data: accounts, error: accError } = await supabase
      .from('user_booster_accounts')
      .select('id, status, booster_plans(plan_name)')
      .eq('user_id', userId);
    if (accError) {
      return res.status(500).json({ error: 'Failed to load accounts' });
    }

    // Filter active accounts (do not assert as BoosterAccount[])
    const activeAccounts = (accounts ?? []).filter(
      (a) => a.status === 'active'
    );

    const planAllowance = (planName: string): number => {
      const name = planName.toLowerCase();
      if (name.includes('starter')) return 1;
      if (name.includes('power')) return 2;
      if (name.includes('max')) return 3;
      if (name.includes('blaster')) return 5;
      return 0;
    };

    const totalAllowance = activeAccounts.reduce((sum, a) => {
      const planName = a.booster_plans?.plan_name ?? '';
      return sum + planAllowance(planName);
    }, 0);

    // Count already downloaded
    const { data: downloads, error: dlError } = await supabase
      .from('downloaded_courses')
      .select('id, course_slug')
      .eq('user_id', userId);
    if (dlError) {
      return res.status(500).json({ error: 'Failed to load downloads' });
    }
    const downloadedSlugs = (downloads as DownloadedCourse[] | null)?.map((r) => r.course_slug) ?? [];
    if (downloadedSlugs.includes(courseSlug)) {
      return res.status(403).json({ error: 'Already downloaded this course' });
    }
    if (downloadedSlugs.length >= Math.min(totalAllowance, AVAILABLE_COURSES.length)) {
      return res.status(403).json({ error: 'Download limit reached' });
    }

    // Generate a signed download URL from Supabase Storage
     console.log('Generating signed URL:', course.filename);
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('course-pdfs')
      .createSignedUrl(course.filename, 60 * 5);
    console.log('Signed URL result:', signedUrlData, signedUrlError);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      return res.status(500).json({ error: 'Could not generate download URL' });
    }

    res.status(200).json({ url: signedUrlData.signedUrl, mode: 'signed', filename: course.filename });
  } catch (e) {
    console.error('Download URL error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}
import { NextResponse } from 'next/server';
import { supabase } from '@/integrations/supabase/client';

export async function POST(req: Request) {
  const body = await req.json();
  const { courseSlug } = body;
  if (!courseSlug) {
    return NextResponse.json({ error: 'Missing courseSlug' }, { status: 400 });
  }

  // Fetch the course from the DB
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('filename, slug')
    .eq('slug', courseSlug)
    .maybeSingle();
  if (courseError || !course) {
    // List all files for debug
    const { data: files } = await supabase.storage.from('course-pdfs').list('');
    return NextResponse.json({
      error: 'Invalid courseSlug or not found in DB',
      requestedSlug: courseSlug,
      foundCourse: course,
      availableFiles: files ? files.map(f => f.name) : null
    }, { status: 404 });
  }

  // Use correct bucket name 'course-pdfs' and file is at root
  const bucket = 'course-pdfs';
  const filePath = course.filename;

  // Generate a signed URL for the file
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(filePath, 60 * 10); // 10 min expiry
  if (error || !data?.signedUrl) {
    // List all files for debug
    const { data: files } = await supabase.storage.from(bucket).list('');
    return NextResponse.json({
      error: error?.message || 'Could not generate signed URL',
      requestedSlug: courseSlug,
      requestedFilename: course.filename,
      availableFiles: files ? files.map(f => f.name) : null
    }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl, mode: 'signed', filename: course.filename });
}

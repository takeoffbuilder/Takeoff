#!/usr/bin/env node
/* eslint-disable */
/*
 Quick uploader for course PDFs to Supabase Storage.

 Usage examples:
   node scripts/upload-course-pdfs.js --dir ./public/downloads --bucket course-pdfs --create-bucket
   node scripts/upload-course-pdfs.js --dir ./my-pdfs

 Env required (loads .env.local then .env):
   NEXT_PUBLIC_SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
   NEXT_PUBLIC_COURSE_PDFS_BUCKET (optional; can be overridden with --bucket)

 Behavior:
 - Uploads all files in --dir to the bucket root (filenames unchanged)
 - Creates the bucket if --create-bucket is passed (private by default)
 - Sets contentType to application/pdf when extension is .pdf
*/

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env from .env.local first, then .env
try {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
} catch {}
try {
  require('dotenv').config();
} catch {}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir') {
      args.dir = argv[++i];
    } else if (a === '--bucket') {
      args.bucket = argv[++i];
    } else if (a === '--create-bucket') {
      args.createBucket = true;
    } else if (a === '--public') {
      args.public = true;
    } else if (a === '--help' || a === '-h') {
      args.help = true;
    } else {
      /* ignore */
    }
  }
  return args;
}

function usage() {
  console.log(
    `\nUpload all files from a directory to Supabase Storage bucket\n\n` +
      `Options:\n` +
      `  --dir <path>           Source directory containing files to upload (required)\n` +
      `  --bucket <name>        Target bucket name (default: NEXT_PUBLIC_COURSE_PDFS_BUCKET or 'course-pdfs')\n` +
      `  --create-bucket        Create bucket if it does not exist (private by default)\n` +
      `  --public               Make created bucket public (only used with --create-bucket)\n` +
      `\nEnv:\n` +
      `  NEXT_PUBLIC_SUPABASE_URL         Supabase project URL\n` +
      `  SUPABASE_SERVICE_ROLE_KEY        Service Role key (server-side only)\n` +
      `  NEXT_PUBLIC_COURSE_PDFS_BUCKET   Default bucket name\n`
  );
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    usage();
    process.exit(0);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.'
    );
    process.exit(1);
  }

  const bucket =
    args.bucket || process.env.NEXT_PUBLIC_COURSE_PDFS_BUCKET || 'course-pdfs';
  const sourceDir = args.dir ? path.resolve(process.cwd(), args.dir) : null;
  if (!sourceDir) {
    console.error('Missing --dir <path>');
    usage();
    process.exit(1);
  }
  if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
    console.error(`Source directory not found: ${sourceDir}`);
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (args.createBucket) {
    console.log(
      `Ensuring bucket '${bucket}' exists (public=${!!args.public})...`
    );
    const { data: buckets, error: listErr } =
      await supabase.storage.listBuckets();
    if (listErr) {
      console.error('Failed to list buckets:', listErr.message || listErr);
      process.exit(1);
    }
    const exists = (buckets || []).some((b) => b.name === bucket);
    if (!exists) {
      const { error: createErr } = await supabase.storage.createBucket(bucket, {
        public: !!args.public,
        fileSizeLimit: '50MB',
      });
      if (createErr) {
        console.error(
          'Failed to create bucket:',
          createErr.message || createErr
        );
        process.exit(1);
      }
      console.log('Bucket created.');
    } else {
      console.log('Bucket already exists.');
    }
  }

  const files = fs
    .readdirSync(sourceDir)
    .filter((f) => fs.statSync(path.join(sourceDir, f)).isFile());

  if (files.length === 0) {
    console.warn('No files found to upload.');
    process.exit(0);
  }

  console.log(`Uploading ${files.length} file(s) to bucket '${bucket}'...`);

  let success = 0;
  for (const file of files) {
    const full = path.join(sourceDir, file);
    const ext = path.extname(file).toLowerCase();
    const contentType = ext === '.pdf' ? 'application/pdf' : undefined;
    const data = fs.readFileSync(full);

    // Upload to root with original filename
    const { error } = await supabase.storage.from(bucket).upload(file, data, {
      contentType,
      upsert: true,
    });
    if (error) {
      console.error(`  ✖ ${file}: ${error.message || error}`);
    } else {
      console.log(`  ✓ ${file}`);
      success++;
    }
  }

  console.log(`Done. Uploaded ${success}/${files.length} files.`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});

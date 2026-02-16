import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Lock, Download, CheckCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { boosterAccountService } from '@/services/boosterAccountService';
import { authService } from '@/services/authService';
import { courseService, AVAILABLE_COURSES } from '@/services/courseService';
import { supabase } from '@/integrations/supabase/client';

type CourseStatus = 'available' | 'downloaded' | 'locked';
type CourseView = (typeof AVAILABLE_COURSES)[number] & { status: CourseStatus };
type AccountRow = {
  status: string;
  booster_plans?: { plan_name?: string | null } | null;
};

const planAllowance = (planName: string): number => {
  const name = planName.toLowerCase();
  if (name.includes('starter')) return 1;
  if (name.includes('power')) return 2;
  if (name.includes('max')) return 3;
  if (name.includes('blaster')) return 4;
  if (name.includes('super')) return 5;
  if (name.includes('star')) return 6;
  return 0;
};

export default function MyCoursesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [courses, setCourses] = useState<CourseView[]>([]);
  const [downloadedSlugs, setDownloadedSlugs] = useState<string[]>([]);
  const [allowedDownloads, setAllowedDownloads] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  // Initial load: auth, entitlements (from Supabase), and downloaded courses
  useEffect(() => {
    (async () => {
      const user = await authService.getCurrentUser();
      if (!user) {
        toast({
          title: 'Please sign in',
          description: 'Sign in to access your courses.',
        });
        router.push('/signin');
        return;
      }
      setUserId(user.id);

      try {
        const allAccounts = (await boosterAccountService.getUserAccounts(
          user.id
        )) as unknown as AccountRow[];
        const activeAccounts = allAccounts.filter((a) => a.status === 'active');
        const totalAllowance = activeAccounts.reduce((sum: number, a) => {
          const name = a.booster_plans?.plan_name || '';
          return sum + planAllowance(name);
        }, 0);
        setAllowedDownloads(Math.min(totalAllowance, AVAILABLE_COURSES.length));
      } catch (err) {
        console.error('Failed to load accounts:', err);
      }

      try {
        const rows = await courseService.getDownloadedCourses(user.id);
        const slugs = rows.map((r) => r.course_slug).filter(Boolean);
        setDownloadedSlugs(slugs);
      } catch (e) {
        console.error('Failed to load downloaded courses:', e);
      }
    })();
  }, [router, toast]);

  // Short poll to catch webhook-delayed activations (30s)
  useEffect(() => {
    let poll = 0;
    const maxPolls = 10;
    const interval = setInterval(async () => {
      poll++;
      if (!userId || poll > maxPolls) {
        clearInterval(interval);
        return;
      }
      try {
        const allAccounts = (await boosterAccountService.getUserAccounts(
          userId
        )) as unknown as AccountRow[];
        const activeAccounts = allAccounts.filter((a) => a.status === 'active');
        const totalAllowance = activeAccounts.reduce((sum: number, a) => {
          const name = a.booster_plans?.plan_name || '';
          return sum + planAllowance(name);
        }, 0);
        setAllowedDownloads(Math.min(totalAllowance, AVAILABLE_COURSES.length));
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  // Recompute course list states when downloads or entitlements change
  useEffect(() => {
    const updated: CourseView[] = AVAILABLE_COURSES.map((c) => {
      const isDownloaded = downloadedSlugs.includes(c.slug);
      const status: CourseStatus = isDownloaded
        ? 'downloaded'
        : downloadedSlugs.length >= allowedDownloads
          ? 'locked'
          : 'available';
      return { ...c, status };
    });
    setCourses(updated);
  }, [downloadedSlugs, allowedDownloads]);

  const handleDownload = async (courseSlug: string, fileName: string) => {
    if (downloadedSlugs.length >= allowedDownloads) {
      toast({
        title: 'Download Limit Reached',
        description:
          "You've reached your download limit. Add another Booster Plan to unlock more courses.",
        variant: 'destructive',
      });
      return;
    }

    if (!userId) return;
    try {
      // Ensure we have a valid access token for server-side enforcement
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in again to download courses.',
          variant: 'destructive',
        });
        router.push('/signin');
        return;
      }

      // 1) Request a signed (or public) URL for this course
      const resp = await fetch('/api/courses/download-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseSlug }),
      });
      if (!resp.ok) {
        const err = await resp
          .json()
          .catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || 'Failed to get download URL');
      }
      const { url, mode, filename } = await resp.json();

      // 2) Optimistically update UI (server already recorded download)
      setDownloadedSlugs((prev) => [...prev, courseSlug]);

      // 3) Trigger a download. For signed URLs (cross-origin), the API sets
      // Content-Disposition=attachment via Supabase 'download' option.
      // For same-origin public URLs, use an anchor with download attribute.
      const isSameOrigin =
        url.startsWith('/') || url.startsWith(window.location.origin);
      if (isSameOrigin || mode !== 'signed') {
        const a = document.createElement('a');
        a.href = url.startsWith('/') ? url : new URL(url).pathname;
        if (filename) a.download = filename;
        a.rel = 'noopener';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // Cross-origin signed URL with attachment header will prompt save dialog
        window.location.assign(url);
      }

      // Optional toast
      toast({
        title: 'Course Downloaded',
        description: `Saving ${fileName}...`,
      });
    } catch (e) {
      console.error('Download flow failed:', e);
      toast({
        title: 'Could not start download',
        description:
          e instanceof Error ? e.message : 'Please try again in a moment.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: CourseStatus) => {
    switch (status) {
      case 'available':
        return (
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
            Available
          </Badge>
        );
      case 'downloaded':
        return (
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
            Downloaded
          </Badge>
        );
      case 'locked':
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
            Locked
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-midnight via-brand-charcoal to-brand-midnight">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/settings')}
            className="text-gray-400 hover:text-white hover:bg-brand-charcoal/50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Button>
        </div>

        <Card className="border-brand-sky-blue/20 bg-brand-charcoal/50 backdrop-blur-xl shadow-xl shadow-brand-sky-blue/5 mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white mb-2">
              Educational Courses Library
            </CardTitle>
            <CardDescription className="text-lg text-gray-300 max-w-3xl mx-auto">
              Boost your financial knowledge and credit confidence. Unlock
              courses with each Booster Plan — the more aggressive the plan, the
              more knowledge you gain.
            </CardDescription>
            <div className="mt-6 pt-6 border-t border-brand-sky-blue/20">
              <p className="text-xl text-brand-sky-blue font-semibold">
                You can download up to {allowedDownloads} course
                {allowedDownloads !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                You have downloaded {downloadedSlugs.length} of{' '}
                {AVAILABLE_COURSES.length} courses available in the library
              </p>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {courses.map((course) => (
            <Card
              key={course.slug}
              className={`border-brand-sky-blue/20 backdrop-blur-xl shadow-xl transition-all duration-300 ${
                course.status === 'locked'
                  ? 'bg-brand-charcoal/20 opacity-50'
                  : 'bg-brand-charcoal/50 hover:shadow-brand-sky-blue/10 hover:scale-105'
              }`}
            >
              <CardHeader className="relative">
                <div className="flex justify-between items-start mb-2">
                  <FileText
                    className={`h-8 w-8 ${
                      course.status === 'locked'
                        ? 'text-gray-600'
                        : 'text-brand-sky-blue'
                    }`}
                  />
                  {getStatusBadge(course.status)}
                </div>
                {course.status === 'locked' && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <Lock className="h-12 w-12 text-gray-600" />
                  </div>
                )}
                <CardTitle
                  className={`text-lg ${course.status === 'locked' ? 'text-gray-500' : 'text-white'}`}
                >
                  {course.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription
                  className={`mb-4 min-h-[60px] ${course.status === 'locked' ? 'text-gray-600' : 'text-gray-400'}`}
                >
                  {course.description}
                </CardDescription>

                {course.status === 'available' && (
                  <Button
                    onClick={() => handleDownload(course.slug, course.filename)}
                    className="w-full bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white shadow-lg shadow-brand-sky-blue/30 transition-all duration-300"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                )}

                {course.status === 'downloaded' && (
                  <Button
                    disabled
                    className="w-full bg-gray-700/20 text-gray-400 cursor-not-allowed"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Purchased
                  </Button>
                )}

                {course.status === 'locked' && (
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-2">
                      Add another Booster Plan to unlock
                    </p>
                    <Button
                      disabled
                      className="w-full bg-gray-700/20 text-gray-600 cursor-not-allowed"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Locked
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-brand-sky-blue/20 bg-gradient-to-r from-brand-sky-blue/10 to-brand-sky-blue-light/10 backdrop-blur-xl shadow-xl shadow-brand-sky-blue/5">
          <CardContent className="text-center py-12">
            <p className="text-xl text-brand-sky-blue font-semibold mb-4">
              📈 The more Booster Plans you have, the more knowledge you unlock.
            </p>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Grow your credit and your financial IQ. Add another plan today to
              keep learning.
            </p>
            <Button
              onClick={() => router.push('/choose-plan')}
              size="lg"
              className="bg-gradient-to-r from-brand-sky-blue to-brand-sky-blue-light hover:from-brand-sky-blue-light hover:to-brand-sky-blue text-white shadow-lg shadow-brand-sky-blue/30 transition-all duration-300 hover:scale-105"
            >
              Add Another Plan →
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

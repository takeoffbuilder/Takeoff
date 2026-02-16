/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Explicitly set Turbopack root so Next.js doesn't infer a parent directory
  // when multiple lockfiles exist on the system (e.g., one in $HOME).
  // This silences the warning and ensures builds run from this workspace.
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  allowedDevOrigins: ['*.daytona.work', '*.softgen.dev'],
};

export default nextConfig;

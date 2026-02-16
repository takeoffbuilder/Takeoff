import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { Toaster } from '@/components/ui/toaster';
import AdminLink from '@/components/AdminLink';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <AdminLink />
      <Toaster />
    </>
  );
}

export default MyApp;

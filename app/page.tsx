'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePreferencesStore } from '@/lib/store';
import { Onboarding } from '@/components/features/Onboarding';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { hasOnboarded } = usePreferencesStore();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (status === 'authenticated') {
      // @ts-ignore
      const role = session?.user?.role;

      if (role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } else if (status === 'unauthenticated') {
      // If user has verified onboarding but isn't logged in, send to login
      if (hasOnboarded) {
        router.push('/login');
      }
    }
  }, [status, session, hasOnboarded, mounted, router]);

  if (!mounted || status === 'loading') {
    return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">Loading...</div>;
  }

  // If unauthenticated AND hasn't onboarded, show Onboarding
  if (status === 'unauthenticated' && !hasOnboarded) {
    return <Onboarding />;
  }

  return <div className="flex h-screen items-center justify-center">Redirecting...</div>;
}

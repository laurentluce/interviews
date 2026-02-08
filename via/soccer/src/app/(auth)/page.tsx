'use client';

import { useZTF } from '@/lib/ztf';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const { isConnected, address, isLoading, error } = useZTF();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) return;

    setChecking(true);
    fetch(`/api/passport?address=${address}`)
      .then((r) => {
        if (r.ok) {
          router.push('/passport');
        } else {
          router.push('/pick-team');
        }
      })
      .catch(() => {
        router.push('/pick-team');
      })
      .finally(() => setChecking(false));
  }, [isConnected, address, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-950 to-blue-900">
      <main className="text-center text-white px-8">
        <div className="text-6xl mb-6">&#9917;</div>
        <h1 className="text-4xl font-bold mb-4">World Cup Fan Passport</h1>
        <p className="text-xl text-blue-200 mb-8 max-w-md mx-auto">
          Pledge your allegiance to a World Cup 2026 team and receive a
          cryptographically verifiable Fan Passport.
        </p>

        {isLoading || checking ? (
          <div className="px-6 py-3 bg-white/10 rounded-lg inline-block">
            Authenticating...
          </div>
        ) : error ? (
          <div className="text-red-300 bg-red-900/30 rounded-lg px-6 py-3">
            {error}
          </div>
        ) : !isConnected ? (
          <div className="px-6 py-3 bg-white/10 rounded-lg inline-block">
            Redirecting to sign in...
          </div>
        ) : null}
      </main>
    </div>
  );
}

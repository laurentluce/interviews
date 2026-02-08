'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useZTF } from '@/lib/ztf';
import { PassportCard } from '@/components/PassportCard';
import { AuthButton } from '@/components/AuthButton';
import { FanPassport } from '@/types';

export default function PassportPage() {
  const { isConnected, address } = useZTF();
  const router = useRouter();
  const [passport, setPassport] = useState<FanPassport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !address) return;

    fetch(`/api/passport?address=${address}`)
      .then((r) => {
        if (!r.ok) {
          router.push('/pick-team');
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setPassport(data);
      })
      .catch(() => router.push('/pick-team'))
      .finally(() => setLoading(false));
  }, [isConnected, address, router]);

  const shareUrl =
    typeof window !== 'undefined' && address
      ? `${window.location.origin}/verify/${address}`
      : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">My Fan Passport</h1>
        <AuthButton />
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 flex flex-col items-center">
        {loading ? (
          <p className="text-gray-500">Loading passport...</p>
        ) : passport ? (
          <>
            <PassportCard passport={passport} verified={true} />
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 mb-2">Share your passport:</p>
              <code className="text-xs bg-gray-100 px-3 py-2 rounded block max-w-md break-all">
                {shareUrl}
              </code>
            </div>
          </>
        ) : (
          <p className="text-gray-500">No passport found.</p>
        )}
      </main>
    </div>
  );
}

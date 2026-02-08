'use client';

import { useState, useEffect, use } from 'react';
import { PassportCard } from '@/components/PassportCard';
import { FanPassport } from '@/types';

export default function VerifyPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const [passport, setPassport] = useState<FanPassport | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/passport/${address}`)
      .then((r) => {
        if (!r.ok) throw new Error('Passport not found');
        return r.json();
      })
      .then((data) => {
        setPassport(data.passport);
        setVerified(data.verified);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [address]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <h1 className="text-2xl font-bold mb-2">Fan Passport Verification</h1>
      <p className="text-gray-500 mb-8">
        Independently verify a fan&apos;s World Cup pledge
      </p>

      {loading ? (
        <p className="text-gray-500">Verifying...</p>
      ) : error ? (
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-lg">
          {error}
        </div>
      ) : passport ? (
        <PassportCard passport={passport} verified={verified ?? false} />
      ) : null}
    </div>
  );
}

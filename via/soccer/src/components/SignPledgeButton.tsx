'use client';

import { useState } from 'react';
import { useZTF } from '@/lib/ztf';
import { createPledgeMessage, serializePledgeMessage } from '@/lib/signature';

interface SignPledgeButtonProps {
  teamCode: string;
  teamName: string;
  onSuccess: () => void;
}

export function SignPledgeButton({
  teamCode,
  teamName,
  onSuccess,
}: SignPledgeButtonProps) {
  const { address, signMessage } = useZTF();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSign = async () => {
    if (!address) return;
    setIsLoading(true);
    setError(null);

    try {
      const message = createPledgeMessage(teamCode, teamName);
      const messageString = serializePledgeMessage(message);

      const signature = await signMessage(messageString);
      if (!signature) {
        setError('Signing was cancelled or failed');
        return;
      }

      // Submit to API
      const resp = await fetch('/api/passport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          teamCode,
          teamName,
          signature,
          message,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json();
        setError(data.error || 'Failed to create passport');
        return;
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signing failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleSign}
        disabled={isLoading}
        className="px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Signing Pledge...' : `Pledge to ${teamName}`}
      </button>
      {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
    </div>
  );
}

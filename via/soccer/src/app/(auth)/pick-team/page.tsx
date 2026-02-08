'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useZTF } from '@/lib/ztf';
import { TeamGrid } from '@/components/TeamGrid';
import { SignPledgeButton } from '@/components/SignPledgeButton';
import { AuthButton } from '@/components/AuthButton';
import { TeamWithCount } from '@/types';

export default function PickTeamPage() {
  const { isConnected, address } = useZTF();
  const router = useRouter();
  const [teams, setTeams] = useState<TeamWithCount[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/teams')
      .then((r) => r.json())
      .then(setTeams)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isConnected || !address) return;
    fetch(`/api/passport?address=${address}`)
      .then((r) => {
        if (r.ok) router.push('/passport');
      })
      .catch(() => {});
  }, [isConnected, address, router]);

  const selectedTeamData = teams.find((t) => t.code === selectedTeam);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Pick Your Team</h1>
        <AuthButton />
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <p className="text-gray-600 mb-6">
          Choose the team you want to support in World Cup 2026. This pledge is
          permanent — no switching teams!
        </p>

        <TeamGrid
          teams={teams}
          selectedTeam={selectedTeam}
          onSelect={setSelectedTeam}
        />

        {selectedTeamData && (
          <div className="mt-8 text-center">
            <p className="text-lg mb-4">
              You selected{' '}
              <span className="font-bold">
                {selectedTeamData.flag} {selectedTeamData.name}
              </span>
            </p>
            <SignPledgeButton
              teamCode={selectedTeamData.code}
              teamName={selectedTeamData.name}
              onSuccess={() => router.push('/passport')}
            />
          </div>
        )}
      </main>
    </div>
  );
}

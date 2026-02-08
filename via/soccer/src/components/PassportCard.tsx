import { FanPassport } from '@/types';
import { TEAMS } from '@/lib/teams';

interface PassportCardProps {
  passport: FanPassport;
  verified?: boolean;
}

export function PassportCard({ passport, verified = true }: PassportCardProps) {
  const team = TEAMS.find((t) => t.code === passport.teamCode);
  const date = new Date(passport.pledgedAt * 1000).toLocaleDateString();

  return (
    <div className="w-80 bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl p-6 text-white shadow-xl">
      <div className="text-center mb-4">
        <div className="text-sm font-light tracking-widest">
          WORLD CUP 2026
        </div>
        <div className="text-xl font-bold">FAN PASSPORT</div>
      </div>

      <div className="bg-white/10 rounded-lg p-4 text-center mb-4">
        <div className="text-6xl mb-2">{team?.flag}</div>
        <div className="text-2xl font-bold">{team?.name}</div>
      </div>

      <div className="text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-blue-200">Fan</span>
          <span className="font-mono">
            {passport.walletAddress.slice(0, 6)}...
            {passport.walletAddress.slice(-4)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-200">Pledged</span>
          <span>{date}</span>
        </div>
      </div>

      {verified !== undefined && (
        <div className="mt-4 pt-4 border-t border-white/20 text-center">
          {verified ? (
            <span className="text-green-300 text-sm">
              Cryptographically Verified
            </span>
          ) : (
            <span className="text-red-300 text-sm">
              Verification Failed
            </span>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { TeamWithCount } from '@/types';

interface TeamGridProps {
  teams: TeamWithCount[];
  selectedTeam: string | null;
  onSelect: (teamCode: string) => void;
}

export function TeamGrid({ teams, selectedTeam, onSelect }: TeamGridProps) {
  return (
    <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
      {teams.map((team) => (
        <button
          key={team.code}
          onClick={() => onSelect(team.code)}
          className={`p-4 rounded-lg border-2 text-center transition-all ${
            selectedTeam === team.code
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-gray-400'
          }`}
        >
          <div className="text-3xl mb-1">{team.flag}</div>
          <div className="text-xs font-medium truncate">{team.name}</div>
          {team.fanCount > 0 && (
            <div className="text-xs text-gray-400 mt-1">
              {team.fanCount} fan{team.fanCount !== 1 ? 's' : ''}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

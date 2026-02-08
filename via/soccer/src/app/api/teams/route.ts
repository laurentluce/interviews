import { NextResponse } from 'next/server';
import { TEAMS } from '@/lib/teams';
import { store } from '@/lib/store';

export async function GET() {
  const counts = store.getTeamCounts();
  const teamsWithCounts = TEAMS.map((team) => ({
    ...team,
    fanCount: counts[team.code] || 0,
  }));
  return NextResponse.json(teamsWithCounts);
}

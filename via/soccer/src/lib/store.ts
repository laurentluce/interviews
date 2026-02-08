import { FanPassport } from '@/types';

const passports = new Map<string, FanPassport>();

export const store = {
  get(address: string): FanPassport | null {
    return passports.get(address.toLowerCase()) || null;
  },

  create(passport: FanPassport): FanPassport {
    const key = passport.walletAddress.toLowerCase();
    if (passports.has(key)) {
      throw new Error('Passport already exists for this wallet');
    }
    passports.set(key, passport);
    return passport;
  },

  exists(address: string): boolean {
    return passports.has(address.toLowerCase());
  },

  getAll(): FanPassport[] {
    return Array.from(passports.values());
  },

  getTeamCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    passports.forEach((p) => {
      counts[p.teamCode] = (counts[p.teamCode] || 0) + 1;
    });
    return counts;
  },
};

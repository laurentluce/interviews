import { ethers } from 'ethers';
import { PledgeMessage } from '@/types';

export function createPledgeMessage(
  teamCode: string,
  teamName: string,
): PledgeMessage {
  return {
    team: teamName,
    teamCode,
    pledgedAt: Math.floor(Date.now() / 1000),
    statement: `I pledge my loyalty to ${teamName} for World Cup 2026. No switching teams!`,
  };
}

export function serializePledgeMessage(message: PledgeMessage): string {
  return JSON.stringify(message);
}

export function verifySignature(
  expectedAddress: string,
  message: PledgeMessage,
  signature: string,
): boolean {
  try {
    const messageString = serializePledgeMessage(message);
    const recoveredAddress = ethers.utils.verifyMessage(
      messageString,
      signature,
    );
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch {
    return false;
  }
}

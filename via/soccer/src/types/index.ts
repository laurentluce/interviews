export interface Team {
  code: string;
  name: string;
  flag: string;
}

export interface TeamWithCount extends Team {
  fanCount: number;
}

export interface PledgeMessage {
  team: string;
  teamCode: string;
  pledgedAt: number;
  statement: string;
}

export interface FanPassport {
  walletAddress: string;
  teamCode: string;
  teamName: string;
  pledgedAt: number;
  signature: string;
  message: PledgeMessage;
}

export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
}

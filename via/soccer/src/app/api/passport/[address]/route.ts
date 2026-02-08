import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { verifySignature } from '@/lib/signature';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;
  const passport = store.get(address);
  if (!passport) {
    return NextResponse.json({ error: 'Passport not found' }, { status: 404 });
  }

  const isValid = verifySignature(
    passport.walletAddress,
    passport.message,
    passport.signature,
  );

  return NextResponse.json({
    passport,
    verified: isValid,
  });
}

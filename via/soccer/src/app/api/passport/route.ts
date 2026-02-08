import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { verifySignature } from '@/lib/signature';

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }
  const passport = store.get(address);
  if (!passport) {
    return NextResponse.json({ error: 'Passport not found' }, { status: 404 });
  }
  return NextResponse.json(passport);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { walletAddress, teamCode, teamName, signature, message } = body;

  if (!walletAddress || !teamCode || !teamName || !signature || !message) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    );
  }

  if (store.exists(walletAddress)) {
    return NextResponse.json(
      { error: 'Passport already exists' },
      { status: 409 },
    );
  }

  const isValid = verifySignature(walletAddress, message, signature);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const passport = store.create({
    walletAddress,
    teamCode,
    teamName,
    pledgedAt: message.pledgedAt,
    signature,
    message,
  });

  return NextResponse.json(passport, { status: 201 });
}

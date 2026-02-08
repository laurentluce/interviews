'use client';

import { ZTFProvider } from '@/lib/ztf';
import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <ZTFProvider>{children}</ZTFProvider>;
}

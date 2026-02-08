'use client';

import { ZTFProvider } from '@/lib/ztf';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return <ZTFProvider>{children}</ZTFProvider>;
}

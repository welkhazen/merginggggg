'use client';

import { ReactNode } from 'react';
import { createStytchClient, StytchProvider as StytchProviderBase } from '@stytch/react';

const stytchPublicToken = import.meta.env.VITE_STYTCH_PUBLIC_TOKEN;

if (!stytchPublicToken) {
  console.warn(
    'Warning: VITE_STYTCH_PUBLIC_TOKEN is not set. Authentication will not work. Please add it to your .env.local file.'
  );
}

const stytchClient = createStytchClient(stytchPublicToken || 'test-token');

interface StytchProviderProps {
  children: ReactNode;
}

export function StytchProvider({ children }: StytchProviderProps) {
  return <StytchProviderBase stytch={stytchClient}>{children}</StytchProviderBase>;
}

export { stytchClient };

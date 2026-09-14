'use client';

import { useEffect, ReactNode } from 'react';
import { useAppState } from '@/lib/AppStateContext';

export default function ThemeBody({ children }: { children: ReactNode }) {
  const { theme } = useAppState();

  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
  }, [theme]);

  return <>{children}</>;
}

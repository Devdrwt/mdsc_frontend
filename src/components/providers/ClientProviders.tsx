'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from '../../lib/context/ThemeContext';
import NotificationContainer from '../ui/NotificationContainer';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <NotificationContainer />
    </ThemeProvider>
  );
}


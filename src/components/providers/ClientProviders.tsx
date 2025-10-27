'use client';

import { ThemeProvider } from '../../lib/context/ThemeContext';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}


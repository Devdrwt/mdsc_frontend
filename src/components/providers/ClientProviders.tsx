'use client';

import { ThemeProvider } from '../../lib/context/ThemeContext';
import NotificationContainer from '../ui/NotificationContainer';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <NotificationContainer />
    </ThemeProvider>
  );
}


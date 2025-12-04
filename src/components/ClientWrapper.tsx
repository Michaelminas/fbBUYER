'use client';

import { useEffect } from 'react';
import { ErrorBoundary } from '@/lib/monitoring';
import { useMonitoring } from '@/hooks/useMonitoring';

interface ClientWrapperProps {
  children: React.ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  const monitoring = useMonitoring();

  useEffect(() => {
    // Track page load performance
    monitoring.trackPagePerformance(window.location.pathname);
  }, [monitoring]);

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
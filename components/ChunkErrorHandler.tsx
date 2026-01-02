'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Handles chunk loading errors by automatically reloading the page
 * This is especially useful for Vercel deployments where chunks might be stale
 */
export function ChunkErrorHandler({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const handleChunkError = (event: ErrorEvent) => {
      const error = event.error;
      const isChunkError = 
        error?.message?.includes('chunk') ||
        error?.message?.includes('Loading chunk') ||
        error?.name === 'ChunkLoadError' ||
        error?.message?.includes('Failed to fetch dynamically imported module');

      if (isChunkError) {
        console.warn('Chunk loading error detected, reloading page...', error);
        // Clear Next.js cache by reloading
        window.location.reload();
      }
    };

    // Listen for unhandled errors
    window.addEventListener('error', handleChunkError);
    
    // Also listen for unhandled promise rejections (chunk errors are often promises)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      const isChunkError = 
        error?.message?.includes('chunk') ||
        error?.message?.includes('Loading chunk') ||
        error?.name === 'ChunkLoadError' ||
        error?.message?.includes('Failed to fetch dynamically imported module');

      if (isChunkError) {
        console.warn('Chunk loading error in promise, reloading page...', error);
        event.preventDefault(); // Prevent error logging
        window.location.reload();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [router]);

  return <>{children}</>;
}


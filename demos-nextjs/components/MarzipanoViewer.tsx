'use client';

import { useEffect, useRef } from 'react';
import type * as Marzipano from 'marzipano';

interface MarzipanoViewerOptions {
  stage?: {
    progressive?: boolean;
  };
}

interface MarzipanoViewerProps {
  className?: string;
  options?: MarzipanoViewerOptions;
  onViewerReady: (viewer: Marzipano.Viewer) => void;
}

/**
 * MarzipanoViewer - A React wrapper for Marzipano Viewer
 * 
 * This component handles the lifecycle of a Marzipano Viewer instance,
 * ensuring proper initialization and cleanup.
 */
export default function MarzipanoViewer({
  className = '',
  options,
  onViewerReady
}: MarzipanoViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Marzipano.Viewer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;

    const initViewer = async () => {
      const Marzipano = await import('marzipano');

      if (!mounted || !containerRef.current) return;

      // Create viewer with options
      const viewer = new Marzipano.Viewer(containerRef.current, options);
      viewerRef.current = viewer;

      // Notify parent component
      onViewerReady(viewer);
    };

    initViewer();

    // Cleanup function
    return () => {
      mounted = false;
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [onViewerReady, options]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  );
}


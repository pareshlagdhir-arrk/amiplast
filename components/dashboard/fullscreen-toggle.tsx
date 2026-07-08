'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './fullscreen-toggle.module.css';

function MinimizeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
    </svg>
  );
}

export function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(() =>
    typeof document !== 'undefined' ? !!document.fullscreenElement : false
  );
  const attemptedRef = useRef(false);

  const syncState = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  useEffect(() => {
    const onFSChange = () => syncState();
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, [syncState]);

  useEffect(() => {
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    try {
      document.documentElement.requestFullscreen().catch(() => {
        /* browser may block without gesture */
      });
    } catch {
      /* not supported */
    }
  }, []);

  function handleExit() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function handleEnter() {
    document.documentElement.requestFullscreen().catch(() => {});
  }

  if (!isFullscreen) {
    return (
      <button
        className={styles.button}
        onClick={handleEnter}
        aria-label="Enter fullscreen"
        title="Enter fullscreen"
      >
        <MinimizeIcon />
      </button>
    );
  }

  return (
    <button
      className={styles.button}
      onClick={handleExit}
      aria-label="Exit fullscreen"
      title="Exit fullscreen"
    >
      <MinimizeIcon />
    </button>
  );
}
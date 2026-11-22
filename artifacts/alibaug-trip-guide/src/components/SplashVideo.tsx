import { useEffect, useRef, useState } from 'react';

// Plays the short intro video only the very first time the app is opened.
// The flag lives in localStorage, so it survives closing the app; it is reset
// only by clearing the app's data or reinstalling.
const SEEN_KEY = 'alibag-intro-seen-v1';
const MAX_MS = 4000; // safety net: never block the app longer than this
const FADE_MS = 300;
const VIDEO_RED = '#e81b22'; // matches the video's own background

function shouldPlay(): boolean {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (localStorage.getItem(SEEN_KEY)) return false;
  } catch {
    /* storage unavailable: play it */
  }
  return true;
}

export function SplashVideo() {
  const [mounted, setMounted] = useState(shouldPlay);
  const [fading, setFading] = useState(false);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
    setFading(true);
    window.setTimeout(() => setMounted(false), FADE_MS);
  };

  useEffect(() => {
    if (!mounted) return;
    const t = window.setTimeout(finish, MAX_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div
      onClick={finish}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: VIDEO_RED,
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <video
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
        style={{ width: '100%', maxHeight: '100%', objectFit: 'contain' }}
      >
        <source src={`${import.meta.env.BASE_URL}splash.mp4`} type="video/mp4" />
      </video>
    </div>
  );
}

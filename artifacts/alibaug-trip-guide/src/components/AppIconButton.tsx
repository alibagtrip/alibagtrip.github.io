import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AppIcon } from '@capawesome/capacitor-app-icon';
import { Shuffle } from 'lucide-react';

// Header button that switches the Android launcher icon between
// "One Wish Willow" (default) and "Trip Guide Alibag".
// Only shown inside the installed Android app; renders nothing on the web.
export default function AppIconButton() {
  const native = Capacitor.isNativePlatform();
  const [alt, setAlt] = useState(false); // true when the Trip Guide icon is active
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!native) return;
    AppIcon.getCurrentIcon()
      .then(({ icon }) => setAlt(icon !== null))
      .catch(() => undefined);
  }, [native]);

  if (!native) return null;

  const next = alt ? 'One Wish Willow' : 'Trip Guide Alibag';

  const toggle = async () => {
    if (busy) return;
    if (!window.confirm(`Switch the app icon to "${next}"? The app will restart.`)) return;
    setBusy(true);
    try {
      if (alt) await AppIcon.resetIcon({ relaunch: true });
      else await AppIcon.setIcon({ icon: 'TripIcon', relaunch: true });
    } catch (error) {
      console.error(error);
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className="icon-button"
      onClick={toggle}
      disabled={busy}
      aria-label={`Switch app icon to ${next}`}
      title={`Switch app icon to ${next}`}
      data-testid="header-app-icon"
    >
      <Shuffle size={19} strokeWidth={1.8} />
    </button>
  );
}

import { useEffect, useRef } from 'react';
import type { CronContext } from '../utils/cronNotifications';
import { runCronNotifications, touchLastActive, syncActivityFromData } from '../utils/cronNotifications';
import { isPushRegistered } from '../utils/pushSubscription';

const CHECK_INTERVAL_MS = 60_000; // every minute

export function useCronNotifications(ctx: CronContext) {
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  useEffect(() => {
    if (!ctx.user) return;
    // Server push handles notifications when tab is closed — skip client cron
    if (isPushRegistered()) return;

    syncActivityFromData(ctx.expenses);

    const tick = () => runCronNotifications(ctxRef.current);

    // Run cron before updating last-active so inactivity can be detected
    const initialTick = window.setTimeout(tick, 1000);
    const touchDelay = window.setTimeout(touchLastActive, 2500);

    const interval = window.setInterval(tick, CHECK_INTERVAL_MS);

    const onFocus = () => {
      tick();
      touchLastActive();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') onFocus();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearTimeout(initialTick);
      clearTimeout(touchDelay);
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ctx.user, ctx.expenses.length]);
}

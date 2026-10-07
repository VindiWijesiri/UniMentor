import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { learningRepository } from '../../data/repositories/learningRepository';
import { useAuthStore } from '../../domain/stores/authStore';
import { isFocusClockPaused } from './focusClock';

function localDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export default function StudyPresenceTracker() {
  const role = useAuthStore((state) => state.user?.role);
  const token = useAuthStore((state) => state.token);
  const tokenRef = useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    if (role !== 'student' || !token) return undefined;

    let started = Date.now();
    let live = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    const sessionToken = token;

    const flush = () => {
      const current = useAuthStore.getState().token;
      // Drop the tick if the user signed out or the session token changed.
      if (!live || !current || current !== sessionToken || !tokenRef.current) return;
      if (isFocusClockPaused()) {
        started = Date.now();
        return;
      }
      const seconds = Math.round((Date.now() - started) / 1000);
      started = Date.now();
      if (seconds < 5) return;
      void learningRepository.logPresence(seconds, localDate());
    };

    const start = () => {
      started = Date.now();
      if (timer) clearInterval(timer);
      timer = setInterval(flush, 30000);
    };

    const stop = (shouldFlush: boolean) => {
      if (timer) clearInterval(timer);
      timer = undefined;
      if (shouldFlush) flush();
    };

    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') start();
      else stop(true);
    });

    if (AppState.currentState === 'active') start();

    return () => {
      live = false;
      subscription.remove();
      if (timer) clearInterval(timer);
      timer = undefined;
    };
  }, [role, token]);

  return null;
}

import { useEffect } from 'react';
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

  useEffect(() => {
    if (role !== 'student') return undefined;
    let started = Date.now();
    let timer: ReturnType<typeof setInterval> | undefined;

    const flush = () => {
      if (isFocusClockPaused()) {
        started = Date.now();
        return;
      }
      const seconds = Math.round((Date.now() - started) / 1000);
      started = Date.now();
      if (seconds < 5) return;
      learningRepository.logPresence(seconds, localDate()).catch(() => {});
    };

    const start = () => {
      started = Date.now();
      if (timer) clearInterval(timer);
      timer = setInterval(flush, 30000);
    };

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
      flush();
    };

    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') start();
      else stop();
    });

    if (AppState.currentState === 'active') start();

    return () => {
      subscription.remove();
      stop();
    };
  }, [role]);

  return null;
}

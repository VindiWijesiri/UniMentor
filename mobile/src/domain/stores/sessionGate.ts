import { userRepository } from '../../data/repositories/userRepository';
import { readFlag, writeFlag, removeFlag } from '../../data/storage/appStorage';
import type { User } from '../entities/User';
import { useAuthStore } from './authStore';

const TOKEN_KEY = 'auth.token';
const ONBOARD_KEY = 'onboarding.seen';

function guidanceKey(userId: string) {
  return `guidance.${userId}`;
}

export async function beginSession(user: User, token: string) {
  await writeFlag(TOKEN_KEY, token);
  const seen = user.role === 'student' ? await readFlag(guidanceKey(user._id)) : '1';
  useAuthStore.setState({
    user,
    token,
    isAuthenticated: true,
    needsGuidance: user.role === 'student' && seen !== '1',
    showPostLoginOnboarding: false,
  });
}

/** Student demo path: replay onboarding, then GuidanceWizard → Find Tutors. */
export async function beginFirstTimeSession(user: User, token: string) {
  await writeFlag(TOKEN_KEY, token);
  if (user._id) await removeFlag(guidanceKey(user._id));
  useAuthStore.setState({
    user,
    token,
    isAuthenticated: true,
    needsGuidance: user.role === 'student',
    showPostLoginOnboarding: true,
  });
}

export async function completeGuidance() {
  const user = useAuthStore.getState().user;
  if (user?._id) await writeFlag(guidanceKey(user._id), '1');
  useAuthStore.setState({ needsGuidance: false });
}

export async function hydrateSession() {
  const token = await readFlag(TOKEN_KEY);
  if (!token) return;
  useAuthStore.setState({ token });
  try {
    const user = await userRepository.getProfile();
    const seen = user.role === 'student' ? await readFlag(guidanceKey(user._id)) : '1';
    useAuthStore.setState({
      user,
      token,
      isAuthenticated: true,
      needsGuidance: user.role === 'student' && seen !== '1',
    });
  } catch {
    await removeFlag(TOKEN_KEY);
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      needsGuidance: false,
    });
  }
}

export async function hasSeenOnboarding() {
  return (await readFlag(ONBOARD_KEY)) === '1';
}

export async function markOnboardingSeen() {
  await writeFlag(ONBOARD_KEY, '1');
}

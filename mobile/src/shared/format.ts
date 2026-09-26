import axios from 'axios';

export function apiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
    if (!err.response) {
      return 'Cannot reach the server. Keep the backend running and the phone on the same Wi-Fi as this PC.';
    }
    return err.message || 'Request failed.';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}

export function personName(value: unknown, fallback = 'Member'): string {
  if (value && typeof value === 'object' && 'name' in value && typeof (value as { name: unknown }).name === 'string') {
    return (value as { name: string }).name;
  }
  return fallback;
}

export function personId(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && '_id' in value) return String((value as { _id: unknown })._id);
  return String(value);
}

export function initials(name?: string): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function formatWhen(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

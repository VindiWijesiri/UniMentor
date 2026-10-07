import type { ComponentType } from 'react';
import type { User } from '../../domain/entities/User';
import {
  BellTabIcon,
  BookTabIcon,
  CalendarTabIcon,
  HomeTabIcon,
  PersonTabIcon,
} from '../components/TabIcons';

export type AppRole = User['role'];
export type FooterTabName = 'Home' | 'Sessions' | 'Learning' | 'Messages' | 'Alerts' | 'Profile' | 'Bookings';

type TabIcon = ComponentType<{ color: string; size?: number }>;

export type FooterTabItem = {
  name: FooterTabName;
  label: string;
  Icon: TabIcon;
};

export const studentFooterTabs: FooterTabItem[] = [
  { name: 'Home', label: 'Home', Icon: HomeTabIcon },
  { name: 'Bookings', label: 'Bookings', Icon: CalendarTabIcon },
  { name: 'Learning', label: 'Learning', Icon: BookTabIcon },
  { name: 'Alerts', label: 'Alerts', Icon: BellTabIcon },
  { name: 'Profile', label: 'Profile', Icon: PersonTabIcon },
];

export const mentorFooterTabs: FooterTabItem[] = [
  { name: 'Home', label: 'Home', Icon: HomeTabIcon },
  { name: 'Sessions', label: 'Bookings', Icon: CalendarTabIcon },
  { name: 'Learning', label: 'Learning management', Icon: BookTabIcon },
  { name: 'Alerts', label: 'Alerts', Icon: BellTabIcon },
  { name: 'Profile', label: 'Profile', Icon: PersonTabIcon },
];

export function getFooterTabs(role?: AppRole): FooterTabItem[] {
  return role === 'mentor' ? mentorFooterTabs : studentFooterTabs;
}

export function isStudentRole(role?: AppRole): boolean {
  return role === 'student';
}

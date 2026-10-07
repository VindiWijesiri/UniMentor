import type { ComponentType } from 'react';
import type { User } from '../../domain/entities/User';
import {
  SvgBook,
  SvgCalendar,
  SvgHome,
  SvgNotifications,
  SvgUser,
  SvgVideocam,
} from '../components/common/SvgIcons';

export type AppRole = User['role'];
export type FooterTabName = 'Home' | 'Bookings' | 'Learning' | 'Alerts' | 'Profile' | 'Scheduling' | 'Sessions' | 'Messages';

type TabIcon = ComponentType<{ color: string; size?: number }>;

export type FooterTabItem = {
  name: FooterTabName;
  screen: string;
  label: string;
  Icon: TabIcon;
};

export const studentFooterTabs: FooterTabItem[] = [
  { name: 'Home', screen: 'Home', label: 'Home', Icon: SvgHome },
  { name: 'Bookings', screen: 'Bookings', label: 'Bookings', Icon: SvgCalendar },
  { name: 'Learning', screen: 'Learning', label: 'Learning', Icon: SvgBook },
  { name: 'Alerts', screen: 'Messages', label: 'Alerts', Icon: SvgNotifications },
  { name: 'Profile', screen: 'Profile', label: 'Profile', Icon: SvgUser },
];

export const mentorFooterTabs: FooterTabItem[] = [
  { name: 'Home', screen: 'Home', label: 'Home', Icon: SvgHome },
  { name: 'Scheduling', screen: 'Scheduling', label: 'Scheduling', Icon: SvgCalendar },
  { name: 'Sessions', screen: 'Sessions', label: 'Sessions', Icon: SvgVideocam },
  { name: 'Profile', screen: 'Profile', label: 'Profile', Icon: SvgUser },
];

export function getFooterTabs(role?: AppRole): FooterTabItem[] {
  return role === 'mentor' ? mentorFooterTabs : studentFooterTabs;
}

export function isStudentRole(role?: AppRole): boolean {
  return role === 'student';
}

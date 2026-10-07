export const colors = {
  primary: '#061E47',      // Student Dashboard Deep Navy
  navyCard: '#0B2754',     // Student Dashboard Rich Navy Card
  secondary: '#F59E0B',    // Student Dashboard Vibrant Amber / Gold
  accent: '#FBBF24',       // Student Dashboard Golden highlight
  background: '#F4F7FB',   // Student Dashboard Porcelain Background
  surface: '#FFFFFF',      // Card Surface
  text: '#0F172A',         // Deep Slate text
  textLight: '#64748B',    // Muted Slate text
  textMuted: '#94A3B8',    // Light Muted text
  border: '#E2E8F0',       // Crisp Card Border
  success: '#16A34A',      // Success / Online Green
  successDot: '#22C55E',   // Live Online Dot
  successBg: '#DCFCE7',    // Emerald Tag Background
  successLight: '#E8F5E9', // Green badge background
  warning: '#F59E0B',      // Amber warning badge
  warningBg: '#FFFDF0',    // Deadline Banner
  warningBorder: '#FDE68A',
  warningLight: '#FFF8E1', // Amber badge background
  error: '#EF4444',
  errorLight: '#FEE2E2',   // Error badge background
  white: '#FFFFFF',
  footerActive: '#FF8D28',
  footerInactive: '#C3CAD6',
  footerBorder: '#EEF2F6',

  // Master design system extensions
  navy: '#062B67',        // Deep navy used in brand hero & headings
  navyDark: '#061F5C',    // Dark navy for high contrast
  navyLight: '#0D4F9E',   // Mid navy/blue accent
  pageBg: '#F4F7FB',      // Standard screen background
  cardBg: '#FFFFFF',      // Card background
  borderLight: '#E0E6F0', // Card and input border
  divider: '#EDF0F5',     // Separator divider
  accentYellow: '#FFD200',// Highlight yellow / star
  purple: '#6366F1',      // Academic purple accent
  purpleLight: '#EEF2FF', // Purple badge background
};

export const typography = {
  title: { fontSize: 24, fontWeight: '800' as const, color: colors.navy },
  subtitle: { fontSize: 14, color: colors.textLight },
  heading: { fontSize: 18, fontWeight: '700' as const, color: colors.navy },
  body: { fontSize: 14, color: colors.text },
  caption: { fontSize: 12, color: colors.textLight },
};

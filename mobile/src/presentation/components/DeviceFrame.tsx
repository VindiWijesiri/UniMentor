import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useDeviceFrame() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const tablet = width >= 768;
  return {
    width,
    height,
    tablet,
    top: insets.top + 8,
    bottom: Math.max(insets.bottom, 8),
    frame: {
      width: '100%' as const,
      maxWidth: tablet ? 720 : undefined,
      alignSelf: 'center' as const,
    },
  };
}

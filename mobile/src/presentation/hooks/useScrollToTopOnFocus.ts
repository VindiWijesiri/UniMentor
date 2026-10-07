import { useCallback, useRef } from 'react';
import { ScrollView, FlatList, SectionList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Custom hook that automatically resets the scroll position of a ScrollView, FlatList,
 * or SectionList to the top whenever the screen comes into focus.
 * This ensures that when navigating from one page to another and returning,
 * the page always opens at the top instead of retaining its scrolled position.
 */
export function useScrollToTopOnFocus<T extends ScrollView | FlatList | SectionList = ScrollView>() {
  const ref = useRef<T>(null);

  useFocusEffect(
    useCallback(() => {
      const resetScroll = () => {
        if (!ref.current) return;
        if ('scrollTo' in ref.current && typeof (ref.current as any).scrollTo === 'function') {
          (ref.current as any).scrollTo({ y: 0, animated: false });
        } else if ('scrollToOffset' in ref.current && typeof (ref.current as any).scrollToOffset === 'function') {
          (ref.current as any).scrollToOffset({ offset: 0, animated: false });
        } else if ('scrollToLocation' in ref.current && typeof (ref.current as any).scrollToLocation === 'function') {
          (ref.current as any).scrollToLocation({ itemIndex: 0, sectionIndex: 0, animated: false });
        }
      };

      // Reset immediately
      resetScroll();

      // Reset after transition frame to ensure any native scroll restoration is overridden
      const t1 = setTimeout(resetScroll, 30);
      const t2 = setTimeout(resetScroll, 120);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }, [])
  );

  return ref;
}

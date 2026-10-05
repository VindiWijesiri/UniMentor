import React, { useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UniMentorWordmark from '../../components/UniMentorWordmark';

const SLIDES = [
  {
    key: 'tutor',
    image: require('../../../../assets/onboarding/tutor.jpg'),
    title: 'Find Your Perfect Tutor',
    body: 'Discover verified peer tutors matched to your university modules and learning style.',
    action: 'Next →',
  },
  {
    key: 'together',
    image: require('../../../../assets/onboarding/together.jpg'),
    title: 'Learn Together, Grow Together',
    body: 'Join study squads, book 1-on-1 sessions, and collaborate with peers through Chat PODs.',
    action: 'Next →',
  },
  {
    key: 'progress',
    image: require('../../../../assets/onboarding/progress.jpg'),
    title: 'Track Your Progress',
    body: 'Monitor study goals, assessment health, and get smart recommendations to stay on track.',
    action: 'Get Started →',
  },
];

type Props = { onDone: () => void };

export default function OnboardingScreen({ onDone }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scroller = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const goTo = (next: number) => {
    scroller.current?.scrollTo({ x: next * width, animated: true });
    setIndex(next);
  };

  const advance = () => {
    if (index >= SLIDES.length - 1) onDone();
    else goTo(index + 1);
  };

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  return (
    <View style={[styles.page, { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.top}>
        <UniMentorWordmark tone="onLight" size={22} />
        <TouchableOpacity style={styles.skip} onPress={onDone}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={styles.pager}
      >
        {SLIDES.map((slide) => (
          <View key={slide.key} style={[styles.slide, { width }]}>
            <View style={styles.artWrap}>
              <View style={styles.glow} />
              <View style={styles.circle}>
                <Image source={slide.image} style={styles.art} />
              </View>
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((slide, dot) => (
          <View key={slide.key} style={[styles.dot, dot === index && styles.dotOn]} />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={advance}>
        <Text style={styles.buttonText}>{SLIDES[index].action}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F8FC' },
  top: {
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skip: {
    backgroundColor: '#EEF1F6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  skipText: { color: '#8B95A7', fontWeight: '700', fontSize: 13 },
  pager: { flex: 1 },
  slide: { paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' },
  artWrap: { width: 280, height: 280, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  glow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#E7F0FF',
  },
  circle: {
    width: 248,
    height: 248,
    borderRadius: 124,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  art: { width: '100%', height: '100%' },
  title: {
    color: '#102B5D',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    color: '#7B8798',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 300,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 18 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#D5DCE6' },
  dotOn: { backgroundColor: '#FF8D28', width: 8, height: 8, borderRadius: 4 },
  button: {
    marginHorizontal: 22,
    backgroundColor: '#FF8D28',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#102B5D', fontSize: 16, fontWeight: '800' },
});

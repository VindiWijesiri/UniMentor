import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { colors } from '../../../shared/theme';
import Logo from '../../components/Logo';
import {
  SvgArrowRight,
  SvgChevronLeft,
  SvgCheckCircle,
  SvgStar,
  SvgClock,
} from '../../components/common/SvgIcons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallHeight = SCREEN_HEIGHT < 720;

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;
};

interface SlideData {
  id: string;
  stepNumber: number;
  totalSteps: number;
  tag: string;
  title: string;
  description: string;
  bullets: string[];
  image: ImageSourcePropType;
  floatingBadgeText: string;
  floatingBadgeIcon: 'star' | 'clock' | 'check';
}

const ONBOARDING_SLIDES: SlideData[] = [
  {
    id: 'slide-1',
    stepNumber: 1,
    totalSteps: 3,
    tag: 'PEER MENTORSHIP',
    title: 'Find Verified Peer Mentors',
    description:
      'Connect with top-performing seniors and verified tutors across Sri Lankan universities tailored to your exact degree modules.',
    bullets: ['SLIIT & Campus Verified', 'Degree-Aligned Tutors', '1-on-1 Guidance'],
    image: require('../../../../assets/onboarding_1.jpg'),
    floatingBadgeText: '500+ Verified Mentors',
    floatingBadgeIcon: 'star',
  },
  {
    id: 'slide-2',
    stepNumber: 2,
    totalSteps: 3,
    tag: 'SMART SCHEDULING',
    title: 'Flexible Timetables & Study Pods',
    description:
      'Book sessions, join collaborative study pods, or request custom slot times that fit seamlessly around your lecture timetable.',
    bullets: ['Clash-Free Booking', 'Alternative Slots', 'Real-Time Sync'],
    image: require('../../../../assets/onboarding_2.jpg'),
    floatingBadgeText: 'Real-Time Timetables',
    floatingBadgeIcon: 'clock',
  },
  {
    id: 'slide-3',
    stepNumber: 3,
    totalSteps: 3,
    tag: 'EXAM READINESS',
    title: 'Ace Exams with Practice & Quizzes',
    description:
      'Access verified study materials, chapter practice quizzes, and mock assessments with direct feedback from your mentors.',
    bullets: ['Past Paper Banks', 'Instant Analytics', 'Verified Badges'],
    image: require('../../../../assets/onboarding_3.jpg'),
    floatingBadgeText: '98% Exam Success',
    floatingBadgeIcon: 'check',
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(0);
  const flatListRef = useRef<FlatList<SlideData>>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    if (!pageWidth) return;
    const index = Math.round(offsetX / pageWidth);
    if (index !== activeIndex && index >= 0 && index < ONBOARDING_SLIDES.length) {
      setActiveIndex(index);
    }
  };

  const handleNext = () => {
    if (activeIndex < ONBOARDING_SLIDES.length - 1) {
      const nextIndex = activeIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (activeIndex > 0) {
      const prevIndex = activeIndex - 1;
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
      setActiveIndex(prevIndex);
    }
  };

  const handleComplete = () => {
    navigation.replace('Login');
  };

  const currentSlide = ONBOARDING_SLIDES[activeIndex];

  return (
    <View
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;
        if (nextWidth > 0 && Math.abs(nextWidth - pageWidth) > 1) setPageWidth(nextWidth);
      }}
      style={[
        styles.safeArea,
        {
          paddingTop: Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 12) : 12),
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 12) + 6,
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header with App Logo, Screen Counter & Skip Option */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {activeIndex > 0 ? (
            <TouchableOpacity
              style={styles.headerBack}
              onPress={handleBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <SvgChevronLeft size={22} color={colors.navy} />
            </TouchableOpacity>
          ) : (
            <Logo size="small" showText={false} />
          )}
        </View>

        {/* Prominently Displays Number of Onboarding Screens */}
        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            Step {currentSlide.stepNumber} of {currentSlide.totalSteps}
          </Text>
        </View>

        {/* Skip Option */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleComplete}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Carousel of 3 Onboarding Slides with Real Photography */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        getItemLayout={(_, index) => ({ length: pageWidth, offset: pageWidth * index, index })}
        bounces={false}
        style={styles.flatList}
        onLayout={(event) => {
          const nextHeight = event.nativeEvent.layout.height;
          if (nextHeight > 0 && Math.abs(nextHeight - pageHeight) > 1) setPageHeight(nextHeight);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slideContainer, { width: pageWidth, height: pageHeight || undefined }]}>
            {/* Real Photography Image Container */}
            <View style={[styles.imageCard, { width: pageWidth - 40 }]}>
              <Image source={item.image} style={styles.realImage} resizeMode="cover" />

              {/* Dynamic Floating Badge on Real Image */}
              <View style={styles.floatingBadge}>
                {item.floatingBadgeIcon === 'star' && (
                  <SvgStar size={15} color="#F59E0B" fill="#F59E0B" />
                )}
                {item.floatingBadgeIcon === 'clock' && (
                  <SvgClock size={15} color="#061E47" />
                )}
                {item.floatingBadgeIcon === 'check' && (
                  <SvgCheckCircle size={15} color="#10B981" />
                )}
                <Text style={styles.floatingBadgeText}>{item.floatingBadgeText}</Text>
              </View>
            </View>

            {/* Content Section */}
            <View style={styles.contentWrap}>
              {/* Category Tag */}
              <View style={styles.tagWrap}>
                <Text style={styles.tagText}>{item.tag}</Text>
              </View>

              {/* Title & Description */}
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description} numberOfLines={3}>
                {item.description}
              </Text>

              {/* Feature Highlight Pills */}
              <View style={styles.bulletRow}>
                {item.bullets.map((bullet, idx) => (
                  <View key={idx} style={styles.bulletPill}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      />

      {/* Footer Controls: Progress Dots, Back/Next/Get Started */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {ONBOARDING_SLIDES.map((_, idx) => {
            const isActive = idx === activeIndex;
            return (
              <View
                key={idx}
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              {activeIndex === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <SvgArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Direct Link to Login */}
        <TouchableOpacity
          style={styles.loginLink}
          onPress={handleComplete}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 12, left: 16, right: 16 }}
        >
          <Text style={styles.loginLinkText}>
            Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 4,
  },
  headerLeft: {
    width: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerBack: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  counterBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: '#EAEFF8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4E0F4',
  },
  counterText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.4,
  },
  skipButton: {
    width: 60,
    alignItems: 'flex-end',
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textLight,
  },
  flatList: {
    flex: 1,
  },
  slideContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    alignItems: 'stretch',
  },
  imageCard: {
    flex: 1,
    minHeight: isSmallHeight ? 120 : 160,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    shadowColor: '#061E47',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  realImage: {
    width: '100%',
    height: '100%',
  },
  floatingBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.navy,
  },
  contentWrap: {
    alignItems: 'center',
    width: '100%',
    flexShrink: 0,
    paddingTop: 2,
  },
  tagWrap: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: isSmallHeight ? 18 : 20,
    fontWeight: '800',
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: isSmallHeight ? 23 : 25,
  },
  description: {
    fontSize: isSmallHeight ? 12.5 : 13.5,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: isSmallHeight ? 17 : 19,
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 2,
  },
  bulletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  bulletText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.text,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  dot: {
    height: 7,
    borderRadius: 3.5,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.secondary,
  },
  dotInactive: {
    width: 7,
    backgroundColor: '#CBD5E1',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.primary,
  },
  loginLink: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  loginLinkText: {
    fontSize: 13.5,
    color: colors.textLight,
  },
  loginLinkBold: {
    color: colors.primary,
    fontWeight: '800',
  },
});

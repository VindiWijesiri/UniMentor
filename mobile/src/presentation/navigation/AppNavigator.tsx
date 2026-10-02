import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Mentor } from '../../domain/entities/Mentor';
import type { TutorFilters } from '../../domain/entities/TutorFilters';
import type { Review } from '../../domain/entities/Review';
import HomeScreen from '../screens/home/HomeScreen';
import SearchScreen from '../screens/search/SearchScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import TutorProfileScreen from '../screens/search/TutorProfileScreen';
import FiltersScreen from '../screens/search/FiltersScreen';
import WriteReviewScreen from '../screens/search/WriteReviewScreen';
import ReviewsScreen from '../screens/search/ReviewsScreen';
import CompareTutorsScreen from '../screens/search/CompareTutorsScreen';
import RecommendedTutorScreen from '../screens/search/RecommendedTutorScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import ChatInboxScreen from '../screens/chat/ChatInboxScreen';
import StudentDashboardScreen from '../screens/home/StudentDashboardScreen';
import { useAuthStore } from '../../domain/stores/authStore';
import { colors } from '../../shared/theme';

export type AppTabParamList = {
  Home: undefined;
  Search: {
    initialQuery?: string;
    faculty?: string;
    department?: string;
    programme?: string;
    academicYear?: string;
    semester?: string;
    topic?: string;
    filters?: TutorFilters;
  } | undefined;
  Reviews: undefined;
  Messages: undefined;
  Profile: undefined;
  TutorProfileTab: undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<AppTabParamList> | undefined;
  TutorProfile: { mentor: Mentor };
  Filters: { filters?: TutorFilters; searchParams?: AppTabParamList['Search'] } | undefined;
  WriteReview: { mentor: Mentor; existingReview?: Review };
  CompareTutors: { mentors: Mentor[] };
  RecommendedTutor: { mentor: Mentor; reviews: Review[]; comparedCount: number; isBestMatch: boolean };
  Chat: { mentor: Mentor };
  GuidanceWizard: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

function LogoTitle() {
  return (
    <View style={styles.logoRow}>
      <Image
        source={require('../../../assets/icon.png')}
        style={styles.logoImg}
        resizeMode="contain"
      />
      <View style={styles.textRow}>
        <Text style={styles.uni}>Uni</Text>
        <Text style={styles.mentor}>Mentor</Text>
      </View>
    </View>
  );
}

function MainTabs() {
  const currentUser = useAuthStore((state) => state.user);
  const isStudent = !currentUser || currentUser.role === 'student';

  if (!isStudent) {
    // When logged in as a mentor, display only their tutor profile and essential mentor tabs
    return (
      <Tab.Navigator
        screenOptions={{
          headerTitle: () => <LogoTitle />,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textLight,
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingBottom: 8,
            paddingTop: 4,
            height: 60,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        }}
      >
        <Tab.Screen
          name="TutorProfileTab"
          component={TutorProfileScreen}
          options={{
            tabBarLabel: 'Tutor Profile',
            headerShown: false,
          }}
        />
        <Tab.Screen
          name="Messages"
          component={ChatInboxScreen}
          options={{ tabBarLabel: 'Messages' }}
        />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerTitle: () => <LogoTitle />,
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <Tab.Screen name="Home" component={StudentDashboardScreen} options={{ tabBarLabel: 'Dashboard', headerShown: false }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarLabel: 'Search', headerShown: false }} />
      <Tab.Screen name="Messages" component={ChatInboxScreen} options={{ tabBarLabel: 'Messages' }} />
      <Tab.Screen name="Reviews" component={ReviewsScreen} options={{ tabBarLabel: 'Reviews' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#061E47' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '800', color: '#FFFFFF' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#F4F7FB' },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="TutorProfile" component={TutorProfileScreen} options={{ title: 'Tutor Profile' }} />
      <Stack.Screen name="Filters" component={FiltersScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WriteReview" component={WriteReviewScreen} options={{ title: 'Write a Review' }} />
      <Stack.Screen name="CompareTutors" component={CompareTutorsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RecommendedTutor" component={RecommendedTutorScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GuidanceWizard" component={HomeScreen} options={{ title: 'Academic Guidance' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoImg: { width: 32, height: 32 },
  textRow: { flexDirection: 'row' },
  uni: { fontSize: 18, fontWeight: '800', color: colors.primary },
  mentor: { fontSize: 18, fontWeight: '800', color: colors.secondary },
});

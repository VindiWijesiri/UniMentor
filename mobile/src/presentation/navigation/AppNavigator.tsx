import React from 'react';
import { Image, View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

import TutorDashboardScreen from '../screens/home/TutorDashboardScreen';
import TutorSlotManagementScreen from '../screens/home/TutorSlotManagementScreen';
import SessionsScreen from '../screens/sessions/SessionsScreen';
import BookingFlowScreen from '../screens/booking/BookingFlowScreen';
import { Ionicons } from '@expo/vector-icons';

export type BookingsStackParamList = {
  SessionsList: undefined;
  FindMentor: {
    initialQuery?: string;
    faculty?: string;
    department?: string;
    programme?: string;
    academicYear?: string;
    semester?: string;
    topic?: string;
    filters?: TutorFilters;
  } | undefined;
  BookSession: {
    mentor: any;
    initialMode?: '1-on-1' | 'group';
  };
};

export type AppTabParamList = {
  Home: undefined;
  Bookings: NavigatorScreenParams<BookingsStackParamList> | undefined;
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
  Messages: undefined;
  Profile: undefined;
  Reviews?: undefined;
  TutorProfileTab?: undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<AppTabParamList> | undefined;
  TutorProfile: { mentor: Mentor };
  Filters: { filters?: TutorFilters; searchParams?: AppTabParamList['Search'] } | undefined;
  WriteReview: { mentor: Mentor; existingReview?: Review };
  Reviews: undefined;
  CompareTutors: { mentors: Mentor[] };
  RecommendedTutor: { mentor: Mentor; reviews: Review[]; comparedCount: number; isBestMatch: boolean };
  Chat: { mentor: Mentor };
  GuidanceWizard: undefined;
  TutorDashboard: undefined;
  TutorSlotManagement: undefined;
  BookSession: {
    mentor: any;
    initialMode?: '1-on-1' | 'group';
  };
};

const Tab = createBottomTabNavigator<AppTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();
const BookingsStack = createNativeStackNavigator<BookingsStackParamList>();

function BookingsNavigator() {
  return (
    <BookingsStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F4F7FB' },
      }}
    >
      <BookingsStack.Screen name="SessionsList" component={SessionsScreen} />
      <BookingsStack.Screen name="FindMentor" component={SearchScreen} />
      <BookingsStack.Screen name="BookSession" component={BookingFlowScreen} />
    </BookingsStack.Navigator>
  );
}

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
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((state) => state.user);
  const isStudent = !currentUser || currentUser.role === 'student';

  // Android navigation bar compatibility:
  // insets.bottom is > 0 on devices with software 3-button navigation or gesture bar.
  // On devices without software nav (or when insets.bottom is 0), provide comfortable 10px spacing.
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 10 : 8);
  const barHeight = 56 + bottomInset;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#EAA023',
        tabBarInactiveTintColor: '#64748B',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: barHeight,
          paddingBottom: bottomInset,
          paddingTop: 8,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      {/* 1. Home */}
      <Tab.Screen
        name="Home"
        component={isStudent ? StudentDashboardScreen : TutorDashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />

      {/* 2. Bookings */}
      <Tab.Screen
        name="Bookings"
        component={isStudent ? BookingsNavigator : TutorProfileScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (isStudent) {
              e.preventDefault();
              (navigation as any).navigate('Bookings', {
                screen: 'SessionsList',
              });
            }
          },
        })}
        options={{
          tabBarLabel: 'Bookings',
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={24} color={color} />
          ),
        }}
      />

      {/* 3. Learning */}
      <Tab.Screen
        name="Search"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Learning',
          tabBarIcon: ({ color }) => (
            <Ionicons name="book-outline" size={24} color={color} />
          ),
        }}
      />

      {/* 4. Alerts */}
      <Tab.Screen
        name="Messages"
        component={ChatInboxScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color }) => (
            <Ionicons name="notifications-outline" size={24} color={color} />
          ),
        }}
      />

      {/* 5. Profile */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F4F7FB' },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="TutorProfile" component={TutorProfileScreen} />
      <Stack.Screen name="Filters" component={FiltersScreen} />
      <Stack.Screen name="WriteReview" component={WriteReviewScreen} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} />
      <Stack.Screen name="CompareTutors" component={CompareTutorsScreen} />
      <Stack.Screen name="RecommendedTutor" component={RecommendedTutorScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="GuidanceWizard" component={HomeScreen} />
      <Stack.Screen name="TutorDashboard" component={TutorDashboardScreen} />
      <Stack.Screen name="TutorSlotManagement" component={TutorSlotManagementScreen} />
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

import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Mentor } from '../../domain/entities/Mentor';
import type { TutorFilters } from '../../domain/entities/TutorFilters';
import type { Review } from '../../domain/entities/Review';
import HomeScreen from '../screens/home/HomeScreen';
import MentorHomeScreen from '../screens/home/MentorHomeScreen';
import SearchScreen from '../screens/search/SearchScreen';
import SessionsScreen from '../screens/sessions/SessionsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import TutorProfileScreen from '../screens/search/TutorProfileScreen';
import FiltersScreen from '../screens/search/FiltersScreen';
import WriteReviewScreen from '../screens/search/WriteReviewScreen';
import ReviewsScreen from '../screens/search/ReviewsScreen';
import CompareTutorsScreen from '../screens/search/CompareTutorsScreen';
import RecommendedTutorScreen from '../screens/search/RecommendedTutorScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import ChatInboxScreen from '../screens/chat/ChatInboxScreen';
import AlertsScreen from '../screens/alerts/AlertsScreen';
import LearningDashboardScreen from '../screens/learning/LearningDashboardScreen';
import TutorLearningDashboardScreen from '../screens/learning/TutorLearningDashboardScreen';
import GradeSubmissionScreen from '../screens/learning/GradeSubmissionScreen';
import TutorStudentScreen from '../screens/learning/TutorStudentScreen';
import PackDispatcherScreen from '../screens/learning/PackDispatcherScreen';
import TutorToolsScreen from '../screens/learning/TutorToolsScreen';
import ChatPodScreen from '../screens/learning/ChatPodScreen';
import StudyPlansScreen from '../screens/learning/StudyPlansScreen';
import StudyMaterialsScreen from '../screens/learning/StudyMaterialsScreen';
import StudyMaterialDetailScreen from '../screens/learning/StudyMaterialDetailScreen';
import AssessmentsScreen from '../screens/learning/AssessmentsScreen';
import AssessmentDetailScreen from '../screens/learning/AssessmentDetailScreen';
import LearningActivityScreen from '../screens/learning/LearningActivityScreen';
import DiscussionsScreen from '../screens/learning/DiscussionsScreen';
import LiveSessionScreen from '../screens/learning/LiveSessionScreen';
import { useAuthStore } from '../../domain/stores/authStore';
import { colors } from '../../shared/theme';
import FooterTabBar from './FooterTabBar';
import { isStudentRole } from './tabConfig';

export type SearchParams = {
  initialQuery?: string;
  faculty?: string;
  department?: string;
  programme?: string;
  filters?: TutorFilters;
} | undefined;

export type AppTabParamList = {
  Home: undefined;
  Sessions: undefined;
  Learning: undefined;
  Messages: undefined;
  Alerts: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<AppTabParamList> | undefined;
  Search: SearchParams;
  TutorProfile: { mentor: Mentor };
  Filters: { filters?: TutorFilters; searchParams?: SearchParams } | undefined;
  WriteReview: { mentor: Mentor };
  Reviews: undefined;
  CompareTutors: { mentors: Mentor[] };
  RecommendedTutor: { mentor: Mentor; reviews: Review[]; comparedCount: number; isBestMatch: boolean };
  Chat: { mentor: Mentor };
  ChatPod: undefined;
  StudyPlans: undefined;
  StudyMaterials: undefined;
  StudyMaterialDetail: { id: string };
  Assessments: undefined;
  AssessmentDetail: { id: string };
  LearningActivity: { id?: string };
  Discussions: undefined;
  LiveSession: { id: string; title: string; tutorName?: string; minutesLeft?: number };
  TutorInbox: undefined;
  GradeSubmission: { id: string };
  TutorStudent: { id: string };
  PackDispatcher: undefined;
  TutorTools: { tool: 'bank' | 'voice' | 'squads' | 'export' };
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
  const role = useAuthStore((state) => state.user?.role);
  const student = isStudentRole(role);

  return (
    <Tab.Navigator
      key={role ?? 'student'}
      tabBar={(props) => <FooterTabBar {...props} />}
      screenOptions={{
        headerTitle: () => <LogoTitle />,
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={student ? HomeScreen : MentorHomeScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Sessions" component={SessionsScreen} />
      <Tab.Screen
        name="Learning"
        component={student ? LearningDashboardScreen : TutorLearningDashboardScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Alerts" component={AlertsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const student = isStudentRole(useAuthStore((state) => state.user?.role));

  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: '#062B67',
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#F4F7FB' },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      {student && (
        <>
          <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Find Tutors' }} />
          <Stack.Screen name="TutorProfile" component={TutorProfileScreen} options={{ title: 'Tutor Profile' }} />
          <Stack.Screen name="Filters" component={FiltersScreen} options={{ headerShown: false }} />
          <Stack.Screen name="WriteReview" component={WriteReviewScreen} options={{ title: 'Write a Review' }} />
          <Stack.Screen name="Reviews" component={ReviewsScreen} options={{ title: 'Reviews' }} />
          <Stack.Screen name="CompareTutors" component={CompareTutorsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="RecommendedTutor" component={RecommendedTutorScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ChatPod" component={ChatPodScreen} options={{ headerShown: false }} />
          <Stack.Screen name="StudyPlans" component={StudyPlansScreen} options={{ headerShown: false }} />
          <Stack.Screen name="StudyMaterials" component={StudyMaterialsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="StudyMaterialDetail" component={StudyMaterialDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Assessments" component={AssessmentsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AssessmentDetail" component={AssessmentDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="LearningActivity" component={LearningActivityScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Discussions" component={DiscussionsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="LiveSession" component={LiveSessionScreen} options={{ headerShown: false }} />
        </>
      )}
      {!student && (
        <>
          <Stack.Screen name="TutorInbox" component={ChatInboxScreen} options={{ headerShown: false }} />
          <Stack.Screen name="GradeSubmission" component={GradeSubmissionScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TutorStudent" component={TutorStudentScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PackDispatcher" component={PackDispatcherScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TutorTools" component={TutorToolsScreen} options={{ headerShown: false }} />
        </>
      )}
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
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

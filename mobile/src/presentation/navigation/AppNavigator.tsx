import React from 'react';
import UniMentorWordmark from '../components/UniMentorWordmark';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Mentor } from '../../domain/entities/Mentor';
import type { TutorFilters } from '../../domain/entities/TutorFilters';
import type { Review } from '../../domain/entities/Review';
import HomeScreen from '../screens/home/HomeScreen';
import StudentDashboardScreen from '../screens/home/StudentDashboardScreen';
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
import PodThreadScreen from '../screens/learning/PodThreadScreen';
import CreateSquadScreen from '../screens/learning/CreateSquadScreen';
import FindFriendScreen from '../screens/learning/FindFriendScreen';
import StudyPlansScreen from '../screens/learning/StudyPlansScreen';
import StudyMaterialsScreen from '../screens/learning/StudyMaterialsScreen';
import StudyMaterialDetailScreen from '../screens/learning/StudyMaterialDetailScreen';
import StoreMaterialScreen from '../screens/learning/StoreMaterialScreen';
import GoalDetailScreen from '../screens/goals/GoalDetailScreen';
import GoalMilestonesScreen from '../screens/goals/GoalMilestonesScreen';
import GoalAnalyticsScreen from '../screens/goals/GoalAnalyticsScreen';
import LogGoalProgressScreen from '../screens/goals/LogGoalProgressScreen';
import AddGoalAssessmentScreen from '../screens/goals/AddGoalAssessmentScreen';
import GoalAssessmentResultScreen from '../screens/goals/GoalAssessmentResultScreen';
import FindGoalTutorScreen from '../screens/goals/FindGoalTutorScreen';
import GoalAchievementScreen from '../screens/goals/GoalAchievementScreen';
import StudyTaskTrackerScreen from '../screens/goals/StudyTaskTrackerScreen';
import StudentAssessmentDashboardScreen from '../screens/assessments/StudentAssessmentDashboardScreen';
import ImprovementHistoryScreen from '../screens/assessments/ImprovementHistoryScreen';
import TakeAssessmentScreen from '../screens/assessments/TakeAssessmentScreen';
import AssessmentResultScreen from '../screens/assessments/AssessmentResultScreen';
import TutorAssessmentHubScreen from '../screens/assessments/TutorAssessmentHubScreen';
import CreateAssessmentScreen from '../screens/assessments/CreateAssessmentScreen';
import TutorSubmissionsScreen from '../screens/assessments/TutorSubmissionsScreen';
import AdminPortalScreen, { AdminHomeScreen } from '../screens/assessments/AdminPortalScreen';
import AssessmentDetailScreen from '../screens/learning/AssessmentDetailScreen';
import LearningActivityScreen from '../screens/learning/LearningActivityScreen';
import DiscussionsScreen from '../screens/learning/DiscussionsScreen';
import LiveSessionScreen from '../screens/learning/LiveSessionScreen';
import TutorBookingsScreen from '../screens/tutor/TutorBookingsScreen';
import TutorAvailabilityScreen from '../screens/tutor/TutorAvailabilityScreen';
import TutorPaymentsScreen from '../screens/tutor/TutorPaymentsScreen';
import TutorReviewsScreen from '../screens/tutor/TutorReviewsScreen';
import TutorStudentProgressScreen from '../screens/tutor/TutorStudentProgressScreen';
import TutorProfileEditorScreen from '../screens/tutor/TutorProfileEditorScreen';
import type { AssessmentKind } from '../../domain/entities/AssessmentWork';
import { useAuthStore } from '../../domain/stores/authStore';
import { colors } from '../../shared/theme';
import FooterTabBar from './FooterTabBar';

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
  WriteReview: { mentor: Mentor; existingReview?: Review };
  GuidanceWizard: undefined;
  Reviews: undefined;
  CompareTutors: { mentors: Mentor[] };
  RecommendedTutor: { mentor: Mentor; reviews: Review[]; comparedCount: number; isBestMatch: boolean };
  Chat: { mentor: Mentor };
  ChatPod: undefined;
  PodThread: { conversationId: string };
  CreateSquad: undefined;
  FindFriend: undefined;
  StudyPlans: undefined;
  StudyTaskTracker: undefined;
  GoalDetail: { goalId: string };
  GoalMilestones: { goalId: string };
  GoalAnalytics: { goalId: string };
  LogGoalProgress: { goalId: string };
  AddGoalAssessment: { goalId: string };
  GoalAssessmentResult: { goalId: string; assessmentId: string };
  FindGoalTutor: { goalId: string };
  GoalAchievement: { goalId: string };
  StudyMaterials: { conversationId?: string } | undefined;
  StudyMaterialDetail: { id: string };
  StoreMaterial: { conversationId?: string } | undefined;
  Assessments: undefined;
  AssessmentHistory: undefined;
  TakeAssessment: { paperId: string; preview?: boolean };
  AssessmentResult: { paperId: string };
  TutorAssessmentHub: undefined;
  CreateAssessment: { kind: AssessmentKind };
  TutorSubmissions: { paperId: string };
  AssessmentDetail: { id: string };
  LearningActivity: { id?: string };
  Discussions: undefined;
  LiveSession: { id: string; title: string; tutorName?: string; minutesLeft?: number };
  TutorAvailability: undefined;
  TutorPayments: undefined;
  TutorReviews: undefined;
  TutorStudentProgress: { studentId: string };
  TutorInbox: undefined;
  GradeSubmission: { id: string };
  TutorStudent: { id: string };
  PackDispatcher: undefined;
  TutorTools: { tool: 'bank' | 'voice' | 'squads' | 'export' };
};

const Tab = createBottomTabNavigator<AppTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

function LogoTitle() {
  return <UniMentorWordmark tone="onLight" />;
}

function MainTabs() {
  const role = useAuthStore((state) => state.user?.role);
  const student = role === 'student';
  const mentor = role === 'mentor';
  const staff = role === 'admin' || role === 'lic';

  return (
    <Tab.Navigator
      key={role ?? 'student'}
      initialRouteName={staff ? 'Learning' : 'Home'}
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
        component={student ? StudentDashboardScreen : staff ? AdminHomeScreen : MentorHomeScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Sessions" component={mentor ? TutorBookingsScreen : SessionsScreen} options={{ headerShown: false }} />
      <Tab.Screen
        name="Learning"
        component={student ? LearningDashboardScreen : staff ? AdminPortalScreen : TutorLearningDashboardScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Alerts" component={AlertsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={mentor ? TutorProfileEditorScreen : ProfileScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const role = useAuthStore((state) => state.user?.role);
  const needsGuidance = useAuthStore((state) => state.needsGuidance);
  const student = role === 'student';
  const mentor = role === 'mentor';

  return (
    <Stack.Navigator
      initialRouteName={student && needsGuidance ? 'GuidanceWizard' : 'MainTabs'}
      screenOptions={{
        headerTintColor: '#102B5D',
        headerTitleStyle: { fontWeight: '800', color: '#102B5D' },
        headerShadowVisible: false,
        headerRight: () => <UniMentorWordmark tone="onLight" />,
        contentStyle: { backgroundColor: '#F4F7FB' },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      {student && (
        <>
          <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TutorProfile" component={TutorProfileScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Filters" component={FiltersScreen} options={{ headerShown: false }} />
          <Stack.Screen name="WriteReview" component={WriteReviewScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Reviews" component={ReviewsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CompareTutors" component={CompareTutorsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="RecommendedTutor" component={RecommendedTutorScreen} options={{ headerShown: false }} />
          <Stack.Screen name="StudyPlans" component={StudyPlansScreen} options={{ headerShown: false }} />
          <Stack.Screen name="StudyTaskTracker" component={StudyTaskTrackerScreen} options={{ headerShown: false }} />
          <Stack.Screen name="GoalDetail" component={GoalDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="GoalMilestones" component={GoalMilestonesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="GoalAnalytics" component={GoalAnalyticsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="LogGoalProgress" component={LogGoalProgressScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AddGoalAssessment" component={AddGoalAssessmentScreen} options={{ headerShown: false }} />
          <Stack.Screen name="GoalAssessmentResult" component={GoalAssessmentResultScreen} options={{ headerShown: false }} />
          <Stack.Screen name="FindGoalTutor" component={FindGoalTutorScreen} options={{ headerShown: false }} />
          <Stack.Screen name="GoalAchievement" component={GoalAchievementScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Assessments" component={StudentAssessmentDashboardScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AssessmentHistory" component={ImprovementHistoryScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TakeAssessment" component={TakeAssessmentScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AssessmentResult" component={AssessmentResultScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AssessmentDetail" component={AssessmentDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="LearningActivity" component={LearningActivityScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Discussions" component={DiscussionsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="LiveSession" component={LiveSessionScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TutorPayments" component={TutorPaymentsScreen} options={{ headerShown: false }} />
        </>
      )}
      {mentor && (
        <>
          <Stack.Screen name="TutorInbox" component={ChatInboxScreen} options={{ headerShown: false }} />
          <Stack.Screen name="GradeSubmission" component={GradeSubmissionScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TutorStudent" component={TutorStudentScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PackDispatcher" component={PackDispatcherScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TutorTools" component={TutorToolsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TutorAssessmentHub" component={TutorAssessmentHubScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CreateAssessment" component={CreateAssessmentScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TutorSubmissions" component={TutorSubmissionsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TakeAssessment" component={TakeAssessmentScreen} options={{ headerShown: false }} />
          <Stack.Screen name="LiveSession" component={LiveSessionScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TutorAvailability" component={TutorAvailabilityScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TutorPayments" component={TutorPaymentsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TutorReviews" component={TutorReviewsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TutorStudentProgress" component={TutorStudentProgressScreen} options={{ headerShown: false }} />
        </>
      )}
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GuidanceWizard" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChatPod" component={ChatPodScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PodThread" component={PodThreadScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateSquad" component={CreateSquadScreen} options={{ headerShown: false }} />
      <Stack.Screen name="FindFriend" component={FindFriendScreen} options={{ headerShown: false }} />
      <Stack.Screen name="StudyMaterials" component={StudyMaterialsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="StudyMaterialDetail" component={StudyMaterialDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="StoreMaterial" component={StoreMaterialScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

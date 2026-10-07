import React from 'react';
import { Image, View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Mentor } from '../../domain/entities/Mentor';
import type { TutorFilters } from '../../domain/entities/TutorFilters';
import type { Review } from '../../domain/entities/Review';
import type { AssessmentKind } from '../../domain/entities/AssessmentWork';
import HomeScreen from '../screens/home/HomeScreen';
import SearchScreen from '../screens/search/SearchScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import TutorOwnerProfileScreen from '../screens/profile/TutorOwnerProfileScreen';
import TutorProfileScreen from '../screens/search/TutorProfileScreen';
import FiltersScreen from '../screens/search/FiltersScreen';
import WriteReviewScreen from '../screens/search/WriteReviewScreen';
import ReviewsScreen from '../screens/search/ReviewsScreen';
import CompareTutorsScreen from '../screens/search/CompareTutorsScreen';
import RecommendedTutorScreen from '../screens/search/RecommendedTutorScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import ChatInboxScreen from '../screens/chat/ChatInboxScreen';
import StudentDashboardScreen from '../screens/home/StudentDashboardScreen';
import TutorDashboardScreen from '../screens/home/TutorDashboardScreen';
import TutorSlotManagementScreen from '../screens/home/TutorSlotManagementScreen';
import TutorSessionsScreen from '../screens/home/TutorSessionsScreen';
import SessionsScreen from '../screens/sessions/SessionsScreen';
import BookingFlowScreen from '../screens/booking/BookingFlowScreen';
import LiveSessionRoomScreen from '../screens/sessions/LiveSessionRoomScreen';

// Hima-Personal screens
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
import StudentAssessmentDashboardScreen from '../screens/assessments/StudentAssessmentDashboardScreen';
import ImprovementHistoryScreen from '../screens/assessments/ImprovementHistoryScreen';
import TakeAssessmentScreen from '../screens/assessments/TakeAssessmentScreen';
import AssessmentResultScreen from '../screens/assessments/AssessmentResultScreen';
import TutorAssessmentHubScreen from '../screens/assessments/TutorAssessmentHubScreen';
import CreateAssessmentScreen from '../screens/assessments/CreateAssessmentScreen';
import TutorSubmissionsScreen from '../screens/assessments/TutorSubmissionsScreen';
import AssessmentDetailScreen from '../screens/learning/AssessmentDetailScreen';
import LearningActivityScreen from '../screens/learning/LearningActivityScreen';
import DiscussionsScreen from '../screens/learning/DiscussionsScreen';
import LiveSessionScreen from '../screens/learning/LiveSessionScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import StudentRegistrationScreen from '../screens/auth/StudentRegistrationScreen';
import TutorRegistrationScreen from '../screens/auth/TutorRegistrationScreen';
import EmailVerificationScreen from '../screens/verification/EmailVerificationScreen';
import VerifyIdentityScreen from '../screens/verification/VerifyIdentityScreen';
import FaceVerificationScreen from '../screens/verification/FaceVerificationScreen';
import VerificationResultScreen from '../screens/verification/VerificationResultScreen';
import TutorVerificationStatusScreen from '../screens/verification/TutorVerificationStatusScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AddAdminScreen from '../screens/admin/AddAdminScreen';
import AdminReportsScreen from '../screens/admin/AdminReportsScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import TutorApplicationsScreen from '../screens/admin/TutorApplicationsScreen';
import TutorApplicationDetailsScreen from '../screens/admin/TutorApplicationDetailsScreen';
import DocumentReviewScreen from '../screens/admin/DocumentReviewScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import TutorProfileManageScreen from '../screens/tutor/TutorProfileManageScreen';
import EditProfileScreen from '../screens/tutor/EditProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import SecurityScreen from '../screens/settings/SecurityScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import HelpSupportScreen from '../screens/settings/HelpSupportScreen';
import AccountStatusScreen from '../screens/settings/AccountStatusScreen';

// Integrated Learning & Assessments screens from Charuka
import StudyTaskTrackerScreen from '../screens/goals/StudyTaskTrackerScreen';
import GoalDetailScreen from '../screens/goals/GoalDetailScreen';
import GoalMilestonesScreen from '../screens/goals/GoalMilestonesScreen';
import GoalAnalyticsScreen from '../screens/goals/GoalAnalyticsScreen';
import LogGoalProgressScreen from '../screens/goals/LogGoalProgressScreen';
import AddGoalAssessmentScreen from '../screens/goals/AddGoalAssessmentScreen';
import GoalAssessmentResultScreen from '../screens/goals/GoalAssessmentResultScreen';
import FindGoalTutorScreen from '../screens/goals/FindGoalTutorScreen';
import GoalAchievementScreen from '../screens/goals/GoalAchievementScreen';
import TutorAvailabilityScreen from '../screens/tutor/TutorAvailabilityScreen';
import TutorPaymentsScreen from '../screens/tutor/TutorPaymentsScreen';
import TutorReviewsScreen from '../screens/tutor/TutorReviewsScreen';
import TutorStudentProgressScreen from '../screens/tutor/TutorStudentProgressScreen';
import TutorBookingsScreen from '../screens/tutor/TutorBookingsScreen';
import AdminPortalScreen from '../screens/assessments/AdminPortalScreen';

import { useAuthStore } from '../../domain/stores/authStore';
import { colors } from '../../shared/theme';

import {
  SvgHome,
  SvgCalendar,
  SvgBook,
  SvgNotifications,
  SvgUser,
  SvgVideocam,
  SvgPeople,
  SvgLock,
  SvgUserPlus,
  SvgBarChart,
} from '../components/common/SvgIcons';

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

export type SearchParams = {
  initialQuery?: string;
  faculty?: string;
  department?: string;
  programme?: string;
  academicYear?: string;
  semester?: string;
  topic?: string;
  filters?: TutorFilters;
} | undefined;

export type AppTabParamList = {
  Home: undefined;
  Bookings: NavigatorScreenParams<BookingsStackParamList> | undefined;
  Search?: SearchParams;
  Learning: undefined;
  Messages: undefined;
  Alerts?: undefined;
  Profile: undefined;
  Reviews?: undefined;
  TutorProfileTab?: undefined;
  Scheduling?: undefined;
  Sessions?: undefined;
  Tutors?: undefined;
  Users?: undefined;
  Settings?: undefined;
  AddAdmin?: undefined;
  Reports?: undefined;
  AdminProfile?: undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<AppTabParamList> | undefined;
  Search: SearchParams;
  TutorProfile: { mentor: Mentor };
  Filters: { filters?: TutorFilters; searchParams?: SearchParams } | undefined;
  WriteReview: { mentor: Mentor; existingReview?: Review };
  Reviews: undefined;
  CompareTutors: { mentors: Mentor[] };
  RecommendedTutor: { mentor: Mentor; reviews: Review[]; comparedCount: number; isBestMatch: boolean };
  Chat: { mentor: Mentor };
  GuidanceWizard: undefined;
  TutorDashboard: undefined;
  StudentDashboard: undefined;
  TutorSlotManagement: undefined;
  BookSession: {
    mentor: any;
    initialMode?: '1-on-1' | 'group';
  };
  LiveSessionRoom: { session: any } | undefined;
  Onboarding: undefined;

  // Integrated screens from Hima-Personal
  StudyPlans: undefined;
  Assessments: undefined;
  AssessmentHistory: undefined;
  TakeAssessment: { paperId?: string; preview?: boolean } | undefined;
  AssessmentResult: { paperId?: string } | undefined;
  AssessmentDetail: { id?: string; paperId?: string } | undefined;
  LearningActivity: { id?: string } | undefined;
  Discussions: undefined;
  LiveSession: { id?: string; title?: string; tutorName?: string; minutesLeft?: number } | undefined;
  TutorInbox: undefined;
  GradeSubmission: { id?: string; submissionId?: string } | undefined;
  TutorStudent: { id?: string; studentId?: string } | undefined;
  PackDispatcher: undefined;
  TutorTools: { tool?: 'voice' | 'bank' | 'export' | 'squads' | string } | undefined;
  TutorAssessmentHub: undefined;
  CreateAssessment: { kind?: AssessmentKind } | undefined;
  TutorSubmissions: { paperId?: string } | undefined;
  ChatPod: undefined;
  PodThread: { id?: string; threadId?: string; podId?: string; conversationId?: string } | undefined;
  CreateSquad: undefined;
  FindFriend: undefined;
  StudyMaterials: { conversationId?: string } | undefined;
  StudyMaterialDetail: { id?: string; materialId?: string } | undefined;
  StoreMaterial: { conversationId?: string } | undefined;
  TutorProfileManage: undefined;
  EditProfile: undefined;
  TutorVerificationStatus: undefined;
  VerifyIdentity: { email?: string; role?: 'student' | 'mentor' } | undefined;
  FaceVerification: { role?: 'student' | 'mentor' } | undefined;
  VerificationResult: {
    success?: boolean;
    role?: 'student' | 'mentor';
    reason?: string;
    message?: string;
  } | undefined;
  EmailVerification: {
    email?: string;
    role?: 'student' | 'mentor';
    token?: string;
    user?: any;
  } | undefined;
  AdminDashboard: undefined;
  AddAdmin: undefined;
  AdminReports: undefined;
  AdminProfile: undefined;
  TutorApplications: undefined;
  TutorApplicationDetails: { applicationId?: string } | undefined;
  DocumentReview: { documentType?: string; fileName?: string } | undefined;
  UserManagement: undefined;
  Settings: undefined;
  Security: undefined;
  NotificationSettings: undefined;
  HelpSupport: undefined;
  AccountStatus: undefined;
  RoleSelection: undefined;
  StudentRegistration: undefined;
  TutorRegistration: undefined;

  // Integrated screens from Charuka
  StudyTaskTracker: { id?: string; goalId?: string } | undefined;
  GoalDetail: { id?: string; goalId?: string } | undefined;
  GoalMilestones: { id?: string; goalId?: string } | undefined;
  GoalAnalytics: { id?: string; goalId?: string } | undefined;
  LogGoalProgress: { id?: string; goalId?: string } | undefined;
  AddGoalAssessment: { id?: string; goalId?: string } | undefined;
  GoalAssessmentResult: { id?: string; goalId?: string; assessmentId?: string } | undefined;
  FindGoalTutor: { id?: string; goalId?: string; moduleCode?: string; topic?: string } | undefined;
  GoalAchievement: { id?: string; goalId?: string } | undefined;
  TutorAvailability: undefined;
  TutorPayments: undefined;
  TutorReviews: undefined;
  TutorStudentProgress: { studentId?: string } | undefined;
  TutorBookings: undefined;
  AdminPortal: undefined;
  LearningDashboard: undefined;
  TutorLearningDashboard: undefined;
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
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'lic';
  const isStudent = !currentUser || currentUser.role === 'student';

  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 10 : 8);
  const barHeight = 56 + bottomInset;

  return (
    <Tab.Navigator
      key={currentUser?.role || 'guest'}
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
      {isAdmin ? (
        <>
          {/* 1. Dashboard */}
          <Tab.Screen
            name="Home"
            component={AdminDashboardScreen}
            options={{
              tabBarLabel: 'Dashboard',
              tabBarIcon: ({ color }) => (
                <SvgHome size={22} color={color} />
              ),
            }}
          />

          {/* 2. Add Admin */}
          <Tab.Screen
            name="AddAdmin"
            component={AddAdminScreen}
            options={{
              tabBarLabel: 'Add Admin',
              tabBarIcon: ({ color }) => (
                <SvgUserPlus size={22} color={color} />
              ),
            }}
          />

          {/* 3. Reports */}
          <Tab.Screen
            name="Reports"
            component={AdminReportsScreen}
            options={{
              tabBarLabel: 'Reports',
              tabBarIcon: ({ color }) => (
                <SvgBarChart size={22} color={color} />
              ),
            }}
          />

          {/* 4. Profile */}
          <Tab.Screen
            name="AdminProfile"
            component={AdminProfileScreen}
            options={{
              tabBarLabel: 'Profile',
              tabBarIcon: ({ color }) => (
                <SvgUser size={22} color={color} />
              ),
            }}
          />
        </>
      ) : isStudent ? (
        <>
          {/* 1. Student Home */}
          <Tab.Screen
            name="Home"
            component={StudentDashboardScreen}
            options={{
              tabBarLabel: 'Home',
              tabBarIcon: ({ color }) => (
                <SvgHome size={22} color={color} />
              ),
            }}
          />

          {/* 2. Bookings */}
          <Tab.Screen
            name="Bookings"
            component={BookingsNavigator}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                e.preventDefault();
                (navigation as any).navigate('Bookings', {
                  screen: 'SessionsList',
                });
              },
            })}
            options={{
              tabBarLabel: 'Bookings',
              tabBarIcon: ({ color }) => (
                <SvgCalendar size={22} color={color} />
              ),
            }}
          />

          {/* 3. Learning */}
          <Tab.Screen
            name="Learning"
            component={LearningDashboardScreen as any}
            options={{
              tabBarLabel: 'Learning',
              tabBarIcon: ({ color }) => (
                <SvgBook size={22} color={color} />
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
                <SvgNotifications size={22} color={color} />
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
                <SvgUser size={22} color={color} />
              ),
            }}
          />
        </>
      ) : (
        <>
          {/* 1. Tutor Home */}
          <Tab.Screen
            name="Home"
            component={TutorDashboardScreen}
            options={{
              tabBarLabel: 'Home',
              tabBarIcon: ({ color }) => (
                <SvgHome size={22} color={color} />
              ),
            }}
          />

          {/* 2. Scheduling */}
          <Tab.Screen
            name="Scheduling"
            component={TutorSlotManagementScreen}
            options={{
              tabBarLabel: 'Scheduling',
              tabBarIcon: ({ color }) => (
                <SvgCalendar size={22} color={color} />
              ),
            }}
          />

          {/* 3. Sessions */}
          <Tab.Screen
            name="Sessions"
            component={TutorSessionsScreen}
            options={{
              tabBarLabel: 'Sessions',
              tabBarIcon: ({ color }) => (
                <SvgVideocam size={22} color={color} />
              ),
            }}
          />

          {/* 4. Profile */}
          <Tab.Screen
            name="Profile"
            component={TutorOwnerProfileScreen}
            options={{
              tabBarLabel: 'Profile',
              tabBarIcon: ({ color }) => (
                <SvgUser size={22} color={color} />
              ),
            }}
          />
        </>
      )}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F4F7FB' },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="TutorProfile" component={TutorProfileScreen} />
      <Stack.Screen name="Filters" component={FiltersScreen} />
      <Stack.Screen name="WriteReview" component={WriteReviewScreen} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} />
      <Stack.Screen name="CompareTutors" component={CompareTutorsScreen} />
      <Stack.Screen name="RecommendedTutor" component={RecommendedTutorScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="GuidanceWizard" component={HomeScreen} />
      <Stack.Screen name="TutorDashboard" component={TutorDashboardScreen} />
      <Stack.Screen name="StudentDashboard" component={StudentDashboardScreen as any} />
      <Stack.Screen name="TutorSlotManagement" component={TutorSlotManagementScreen} />
      <Stack.Screen name="LiveSessionRoom" component={LiveSessionRoomScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />

      {/* Integrated Screens from Hima-Personal */}
      <Stack.Screen name="StudyPlans" component={StudyPlansScreen} />
      <Stack.Screen name="Assessments" component={StudentAssessmentDashboardScreen} />
      <Stack.Screen name="AssessmentHistory" component={ImprovementHistoryScreen} />
      <Stack.Screen name="TakeAssessment" component={TakeAssessmentScreen} />
      <Stack.Screen name="AssessmentResult" component={AssessmentResultScreen} />
      <Stack.Screen name="AssessmentDetail" component={AssessmentDetailScreen} />
      <Stack.Screen name="LearningActivity" component={LearningActivityScreen} />
      <Stack.Screen name="Discussions" component={DiscussionsScreen} />
      <Stack.Screen name="LiveSession" component={LiveSessionScreen} />
      <Stack.Screen name="TutorInbox" component={ChatInboxScreen as any} />
      <Stack.Screen name="GradeSubmission" component={GradeSubmissionScreen} />
      <Stack.Screen name="TutorStudent" component={TutorStudentScreen} />
      <Stack.Screen name="PackDispatcher" component={PackDispatcherScreen} />
      <Stack.Screen name="TutorTools" component={TutorToolsScreen} />
      <Stack.Screen name="TutorAssessmentHub" component={TutorAssessmentHubScreen} />
      <Stack.Screen name="CreateAssessment" component={CreateAssessmentScreen} />
      <Stack.Screen name="TutorSubmissions" component={TutorSubmissionsScreen} />
      <Stack.Screen name="ChatPod" component={ChatPodScreen} />
      <Stack.Screen name="PodThread" component={PodThreadScreen} />
      <Stack.Screen name="CreateSquad" component={CreateSquadScreen} />
      <Stack.Screen name="FindFriend" component={FindFriendScreen} />
      <Stack.Screen name="StudyMaterials" component={StudyMaterialsScreen} />
      <Stack.Screen name="StudyMaterialDetail" component={StudyMaterialDetailScreen} />
      <Stack.Screen name="StoreMaterial" component={StoreMaterialScreen} />
      <Stack.Screen name="TutorProfileManage" component={TutorProfileManageScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="TutorVerificationStatus" component={TutorVerificationStatusScreen} />
      <Stack.Screen name="VerifyIdentity" component={VerifyIdentityScreen} />
      <Stack.Screen name="FaceVerification" component={FaceVerificationScreen} />
      <Stack.Screen name="VerificationResult" component={VerificationResultScreen} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      <Stack.Screen name="AdminDashboard" component={MainTabs} />
      <Stack.Screen name="AddAdmin" component={AddAdminScreen} />
      <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
      <Stack.Screen name="AdminProfile" component={AdminProfileScreen} />
      <Stack.Screen name="TutorApplications" component={TutorApplicationsScreen} />
      <Stack.Screen name="TutorApplicationDetails" component={TutorApplicationDetailsScreen} />
      <Stack.Screen name="DocumentReview" component={DocumentReviewScreen} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="AccountStatus" component={AccountStatusScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="StudentRegistration" component={StudentRegistrationScreen} />
      <Stack.Screen name="TutorRegistration" component={TutorRegistrationScreen} />

      {/* Integrated screens from Charuka */}
      <Stack.Screen name="StudyTaskTracker" component={StudyTaskTrackerScreen as any} />
      <Stack.Screen name="GoalDetail" component={GoalDetailScreen as any} />
      <Stack.Screen name="GoalMilestones" component={GoalMilestonesScreen as any} />
      <Stack.Screen name="GoalAnalytics" component={GoalAnalyticsScreen as any} />
      <Stack.Screen name="LogGoalProgress" component={LogGoalProgressScreen as any} />
      <Stack.Screen name="AddGoalAssessment" component={AddGoalAssessmentScreen as any} />
      <Stack.Screen name="GoalAssessmentResult" component={GoalAssessmentResultScreen as any} />
      <Stack.Screen name="FindGoalTutor" component={FindGoalTutorScreen as any} />
      <Stack.Screen name="GoalAchievement" component={GoalAchievementScreen as any} />
      <Stack.Screen name="TutorAvailability" component={TutorAvailabilityScreen as any} />
      <Stack.Screen name="TutorPayments" component={TutorPaymentsScreen as any} />
      <Stack.Screen name="TutorReviews" component={TutorReviewsScreen as any} />
      <Stack.Screen name="TutorStudentProgress" component={TutorStudentProgressScreen as any} />
      <Stack.Screen name="TutorBookings" component={TutorBookingsScreen as any} />
      <Stack.Screen name="AdminPortal" component={AdminPortalScreen as any} />
      <Stack.Screen name="LearningDashboard" component={LearningDashboardScreen as any} />
      <Stack.Screen name="TutorLearningDashboard" component={TutorLearningDashboardScreen as any} />
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

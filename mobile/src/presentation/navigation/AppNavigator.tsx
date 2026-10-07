import React, { useEffect } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation, type NavigatorScreenParams } from '@react-navigation/native';
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
import AdminPortalScreen, { AdminHomeScreen } from '../screens/assessments/AdminPortalScreen';
import AssessmentDetailScreen from '../screens/learning/AssessmentDetailScreen';
import LearningActivityScreen from '../screens/learning/LearningActivityScreen';
import DiscussionsScreen from '../screens/learning/DiscussionsScreen';
import LiveSessionScreen from '../screens/learning/LiveSessionScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import StudentRegistrationScreen from '../screens/auth/StudentRegistrationScreen';
import TutorRegistrationScreen from '../screens/auth/TutorRegistrationScreen';
import EmailVerificationScreen from '../screens/verification/EmailVerificationScreen';
import VerifyIdentityScreen from '../screens/verification/VerifyIdentityScreen';
import FaceVerificationScreen from '../screens/verification/FaceVerificationScreen';
import VerificationResultScreen from '../screens/verification/VerificationResultScreen';
import TutorVerificationStatusScreen from '../screens/verification/TutorVerificationStatusScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import TutorApplicationsScreen from '../screens/admin/TutorApplicationsScreen';
import TutorApplicationDetailsScreen from '../screens/admin/TutorApplicationDetailsScreen';
import DocumentReviewScreen from '../screens/admin/DocumentReviewScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import TutorDashboardScreen from '../screens/tutor/TutorDashboardScreen';
import TutorProfileManageScreen from '../screens/tutor/TutorProfileManageScreen';
import EditProfileScreen from '../screens/tutor/EditProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import SecurityScreen from '../screens/settings/SecurityScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import HelpSupportScreen from '../screens/settings/HelpSupportScreen';
import AccountStatusScreen from '../screens/settings/AccountStatusScreen';
import type { AssessmentKind } from '../../domain/entities/AssessmentWork';
import { useAuthStore } from '../../domain/stores/authStore';
import { colors } from '../../shared/theme';
import FooterTabBar from './FooterTabBar';

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
  TutorInbox: undefined;
  GradeSubmission: { id: string };
  TutorStudent: { id: string };
  PackDispatcher: undefined;
  TutorTools: { tool: 'bank' | 'voice' | 'squads' | 'export' };
  TutorDashboard: undefined;
  TutorProfileManage: undefined;
  EditProfile: undefined;
  TutorVerificationStatus: undefined;
  VerifyIdentity: { email?: string; role?: 'student' | 'mentor' } | undefined;
  FaceVerification: { role?: 'student' | 'mentor' } | undefined;
  VerificationResult: {
    success: boolean;
    role?: 'student' | 'mentor';
    reason?: string;
    message?: string;
  };
  EmailVerification: {
    email: string;
    role?: 'student' | 'mentor';
    name?: string;
    faculty?: string;
    degree?: string;
    hourlyRate?: number;
    selectedModules?: string[];
  };
  AdminDashboard: undefined;
  TutorApplications: undefined;
  TutorApplicationDetails: { applicationId: string };
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
    </View>
  );
}

function MainTabs() {
  const navigation = useNavigation<any>();
  const role = useAuthStore((state) => state.user?.role);
  const pendingRoute = useAuthStore((state) => state.pendingRoute);
  const student = role === 'student';
  const staff = role === 'admin' || role === 'lic';

  useEffect(() => {
    if (!pendingRoute) return;
    navigation.getParent()?.navigate(pendingRoute);
    useAuthStore.setState({ pendingRoute: null });
  }, [navigation, pendingRoute]);

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
        component={student ? HomeScreen : staff ? AdminHomeScreen : MentorHomeScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Sessions" component={SessionsScreen} />
      <Tab.Screen
        name="Learning"
        component={student ? LearningDashboardScreen : staff ? AdminPortalScreen : TutorLearningDashboardScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Alerts" component={AlertsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const role = useAuthStore((state) => state.user?.role);
  const student = role === 'student';
  const mentor = role === 'mentor';

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
          <Stack.Screen name="StudyPlans" component={StudyPlansScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Assessments" component={StudentAssessmentDashboardScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AssessmentHistory" component={ImprovementHistoryScreen} options={{ headerShown: false }} />
          <Stack.Screen name="TakeAssessment" component={TakeAssessmentScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AssessmentResult" component={AssessmentResultScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AssessmentDetail" component={AssessmentDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="LearningActivity" component={LearningActivityScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Discussions" component={DiscussionsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="LiveSession" component={LiveSessionScreen} options={{ headerShown: false }} />
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
        </>
      )}
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GuidanceWizard" component={HomeScreen} options={{ title: 'Academic Guidance' }} />
      <Stack.Screen name="ChatPod" component={ChatPodScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PodThread" component={PodThreadScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateSquad" component={CreateSquadScreen} options={{ headerShown: false }} />
      <Stack.Screen name="FindFriend" component={FindFriendScreen} options={{ headerShown: false }} />
      <Stack.Screen name="StudyMaterials" component={StudyMaterialsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="StudyMaterialDetail" component={StudyMaterialDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="StoreMaterial" component={StoreMaterialScreen} options={{ headerShown: false }} />
      <Stack.Screen name="TutorDashboard" component={TutorDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="TutorProfileManage" component={TutorProfileManageScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="TutorVerificationStatus" component={TutorVerificationStatusScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VerifyIdentity" component={VerifyIdentityScreen} options={{ headerShown: false }} />
      <Stack.Screen name="FaceVerification" component={FaceVerificationScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VerificationResult" component={VerificationResultScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="TutorApplications" component={TutorApplicationsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="TutorApplicationDetails" component={TutorApplicationDetailsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DocumentReview" component={DocumentReviewScreen} options={{ headerShown: false }} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Security" component={SecurityScreen} options={{ headerShown: false }} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AccountStatus" component={AccountStatusScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} options={{ headerShown: false }} />
      <Stack.Screen name="StudentRegistration" component={StudentRegistrationScreen} options={{ headerShown: false }} />
      <Stack.Screen name="TutorRegistration" component={TutorRegistrationScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoImg: { width: 36, height: 36 },
});

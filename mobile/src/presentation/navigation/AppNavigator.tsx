import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { colors } from '../../shared/theme';
import AppFooter from '../components/AppFooter';
import type { Mentor } from '../../domain/entities/Mentor';
import type { Material } from '../../domain/entities/Material';
import type { Submission, QuestionType } from '../../domain/entities/Assessment';
import HomeScreen from '../screens/home/HomeScreen';
import BookingsScreen from '../screens/sessions/SessionsScreen';
import LearningScreen from '../screens/learning/LearningScreen';
import AlertsScreen from '../screens/alerts/AlertsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SearchScreen from '../screens/search/SearchScreen';
import TutorProfileScreen from '../screens/search/TutorProfileScreen';
import BookingDetailScreen from '../screens/sessions/BookingDetailScreen';
import VerifyBookingScreen from '../screens/sessions/VerifyBookingScreen';
import BookSessionScreen from '../screens/sessions/BookSessionScreen';
import MaterialsScreen from '../screens/learning/MaterialsScreen';
import MaterialDetailScreen from '../screens/learning/MaterialDetailScreen';
import MaterialEditorScreen from '../screens/learning/MaterialEditorScreen';
import AssessmentsScreen from '../screens/learning/AssessmentsScreen';
import AssessmentTakeScreen from '../screens/learning/AssessmentTakeScreen';
import AssessmentCreateScreen from '../screens/learning/AssessmentCreateScreen';
import AssessmentBuilderScreen from '../screens/learning/AssessmentBuilderScreen';
import GradeSubmissionScreen from '../screens/learning/GradeSubmissionScreen';
import GoalsScreen from '../screens/learning/GoalsScreen';
import CreateGoalScreen from '../screens/learning/CreateGoalScreen';
import GoalProgressScreen from '../screens/learning/GoalProgressScreen';
import ImprovementHistoryScreen from '../screens/learning/ImprovementHistoryScreen';
import QuestionLibraryScreen from '../screens/learning/QuestionLibraryScreen';
import GroupsScreen from '../screens/learning/GroupsScreen';
import CreateGroupDetailsScreen from '../screens/learning/CreateGroupDetailsScreen';
import CreateGroupMembersScreen from '../screens/learning/CreateGroupMembersScreen';
import GroupHubScreen from '../screens/learning/GroupHubScreen';
import InviteMembersScreen from '../screens/learning/InviteMembersScreen';
import InboxScreen from '../screens/chat/ChatInboxScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import StartChatScreen from '../screens/chat/StartChatScreen';
import ComplaintsScreen from '../screens/learning/ComplaintsScreen';
import FileComplaintScreen from '../screens/learning/FileComplaintScreen';
import PricingScreen from '../screens/learning/PricingScreen';
import IntegrityHubScreen from '../screens/learning/IntegrityHubScreen';
import ExamineCaseScreen from '../screens/learning/ExamineCaseScreen';

export type AppTabParamList = {
  Home: undefined;
  Bookings: undefined;
  Learning: undefined;
  Alerts: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<AppTabParamList> | undefined;
  Search: undefined;
  TutorProfile: { mentor: Mentor };
  BookingDetail: { sessionId: string };
  VerifyBooking: { sessionId?: string } | undefined;
  BookSession: { mentorId: string; mentorName: string; subject?: string };
  Materials: undefined;
  MaterialDetail: { materialId: string };
  MaterialEditor: { material?: Material } | undefined;
  Assessments: undefined;
  AssessmentTake: { assessmentId: string };
  AssessmentCreate: undefined;
  AssessmentBuilder: { type: QuestionType };
  GradeSubmission: { submission: Submission };
  QuestionLibrary: undefined;
  Goals: undefined;
  CreateGoal: undefined;
  GoalProgress: { goalId: string };
  ImprovementHistory: undefined;
  Groups: undefined;
  CreateGroupDetails: undefined;
  CreateGroupMembers: { name: string; subject: string; description?: string };
  GroupHub: { groupId: string };
  InviteMembers: { groupId: string };
  Inbox: undefined;
  StartChat: undefined;
  ChatThread: {
    participantId?: string;
    participantName?: string;
    groupId?: string;
    groupName?: string;
  };
  Complaints: undefined;
  FileComplaint: undefined;
  IntegrityHub: undefined;
  ExamineCase: { complaintId: string };
  Pricing: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <AppFooter tabBar={props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Learning" component={LearningScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="TutorProfile" component={TutorProfileScreen} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <Stack.Screen name="VerifyBooking" component={VerifyBookingScreen} />
      <Stack.Screen name="BookSession" component={BookSessionScreen} />
      <Stack.Screen name="Materials" component={MaterialsScreen} />
      <Stack.Screen name="MaterialDetail" component={MaterialDetailScreen} />
      <Stack.Screen name="MaterialEditor" component={MaterialEditorScreen} />
      <Stack.Screen name="Assessments" component={AssessmentsScreen} />
      <Stack.Screen name="AssessmentTake" component={AssessmentTakeScreen} />
      <Stack.Screen name="AssessmentCreate" component={AssessmentCreateScreen} />
      <Stack.Screen name="AssessmentBuilder" component={AssessmentBuilderScreen} />
      <Stack.Screen name="GradeSubmission" component={GradeSubmissionScreen} />
      <Stack.Screen name="QuestionLibrary" component={QuestionLibraryScreen} />
      <Stack.Screen name="Goals" component={GoalsScreen} />
      <Stack.Screen name="CreateGoal" component={CreateGoalScreen} />
      <Stack.Screen name="GoalProgress" component={GoalProgressScreen} />
      <Stack.Screen name="ImprovementHistory" component={ImprovementHistoryScreen} />
      <Stack.Screen name="Groups" component={GroupsScreen} />
      <Stack.Screen name="CreateGroupDetails" component={CreateGroupDetailsScreen} />
      <Stack.Screen name="CreateGroupMembers" component={CreateGroupMembersScreen} />
      <Stack.Screen name="GroupHub" component={GroupHubScreen} />
      <Stack.Screen name="InviteMembers" component={InviteMembersScreen} />
      <Stack.Screen name="Inbox" component={InboxScreen} />
      <Stack.Screen name="StartChat" component={StartChatScreen} />
      <Stack.Screen name="ChatThread" component={ChatScreen} />
      <Stack.Screen name="Complaints" component={ComplaintsScreen} />
      <Stack.Screen name="FileComplaint" component={FileComplaintScreen} />
      <Stack.Screen name="IntegrityHub" component={IntegrityHubScreen} />
      <Stack.Screen name="ExamineCase" component={ExamineCaseScreen} />
      <Stack.Screen name="Pricing" component={PricingScreen} />
    </Stack.Navigator>
  );
}

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import RegisterCampusIntroScreen from '../screens/auth/RegisterCampusIntroScreen';
import RegisterCampusScreen from '../screens/auth/RegisterCampusScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import StudentRegistrationScreen from '../screens/auth/StudentRegistrationScreen';
import TutorRegistrationScreen from '../screens/auth/TutorRegistrationScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import VerifyCodeScreen from '../screens/auth/VerifyCodeScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import EmailVerificationScreen from '../screens/verification/EmailVerificationScreen';
import VerifyIdentityScreen from '../screens/verification/VerifyIdentityScreen';
import FaceVerificationScreen from '../screens/verification/FaceVerificationScreen';
import VerificationResultScreen from '../screens/verification/VerificationResultScreen';
import TutorVerificationStatusScreen from '../screens/verification/TutorVerificationStatusScreen';
import AdminLoginScreen from '../screens/admin/AdminLoginScreen';
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

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  RegisterCampusIntro: undefined;
  RegisterCampus: undefined;
  RoleSelection: undefined;
  StudentRegistration: undefined;
  TutorRegistration: undefined;
  ForgotPassword: undefined;
  VerifyCode: { email: string };
  ResetPassword: { email: string };
  EmailVerification: {
    email: string;
    role?: 'student' | 'mentor';
    name?: string;
    faculty?: string;
    degree?: string;
    hourlyRate?: number;
    selectedModules?: string[];
    token?: string;
    user?: import('../../domain/entities/User').User;
  };
  VerifyIdentity: { email?: string; role?: 'student' | 'mentor' } | undefined;
  FaceVerification: { role?: 'student' | 'mentor' } | undefined;
  VerificationResult: {
    success: boolean;
    role?: 'student' | 'mentor';
    reason?: string;
    message?: string;
  };
  TutorVerificationStatus: undefined;
  AdminLogin: undefined;
  AdminDashboard: undefined;
  TutorApplications: undefined;
  TutorApplicationDetails: { applicationId: string };
  DocumentReview: { documentType?: string; fileName?: string } | undefined;
  UserManagement: undefined;
  TutorDashboard: undefined;
  TutorProfileManage: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Security: undefined;
  NotificationSettings: undefined;
  HelpSupport: undefined;
  AccountStatus: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="StudentRegistration" component={StudentRegistrationScreen} />
      <Stack.Screen name="TutorRegistration" component={TutorRegistrationScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="RegisterCampusIntro" component={RegisterCampusIntroScreen} />
      <Stack.Screen name="RegisterCampus" component={RegisterCampusScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      <Stack.Screen name="VerifyIdentity" component={VerifyIdentityScreen} />
      <Stack.Screen name="FaceVerification" component={FaceVerificationScreen} />
      <Stack.Screen name="VerificationResult" component={VerificationResultScreen} />
      <Stack.Screen name="TutorVerificationStatus" component={TutorVerificationStatusScreen} />
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="TutorApplications" component={TutorApplicationsScreen} />
      <Stack.Screen name="TutorApplicationDetails" component={TutorApplicationDetailsScreen} />
      <Stack.Screen name="DocumentReview" component={DocumentReviewScreen} />
      <Stack.Screen name="UserManagement" component={UserManagementScreen} />
      <Stack.Screen name="TutorDashboard" component={TutorDashboardScreen} />
      <Stack.Screen name="TutorProfileManage" component={TutorProfileManageScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="AccountStatus" component={AccountStatusScreen} />
    </Stack.Navigator>
  );
}

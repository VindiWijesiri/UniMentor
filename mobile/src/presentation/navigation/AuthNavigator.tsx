import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import RegisterCampusIntroScreen from '../screens/auth/RegisterCampusIntroScreen';
import RegisterCampusScreen from '../screens/auth/RegisterCampusScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  RegisterCampusIntro: undefined;
  RegisterCampus: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="RegisterCampusIntro" component={RegisterCampusIntroScreen} />
      <Stack.Screen name="RegisterCampus" component={RegisterCampusScreen} />
    </Stack.Navigator>
  );
}

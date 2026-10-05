import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../../domain/stores/authStore';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import StudyPresenceTracker from '../presence/StudyPresenceTracker';

export default function RootNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <>
          <StudyPresenceTracker />
          <AppNavigator />
        </>
      ) : <AuthNavigator />}
    </NavigationContainer>
  );
}

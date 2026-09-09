import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '@presentation/screens/home/HomeScreen';
import SearchScreen from '@presentation/screens/search/SearchScreen';
import SessionsScreen from '@presentation/screens/sessions/SessionsScreen';
import ProfileScreen from '@presentation/screens/profile/ProfileScreen';

export type AppTabParamList = {
  Home: undefined;
  Search: undefined;
  Sessions: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Sessions" component={SessionsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

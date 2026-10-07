import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import LearningSubpage, { subpageStyles } from './LearningSubpage';

type Props = NativeStackScreenProps<AppStackParamList, 'LiveSession'>;

export default function LiveSessionScreen({ route, navigation }: Props) {
  const { title, tutorName, minutesLeft } = route.params || {};

  return (
    <LearningSubpage
      eyebrow="LIVE ROOM"
      title={title || 'Live Session'}
      subtitle={tutorName ? `With ${tutorName}` : 'Academic session'}
      onBack={() => navigation.goBack()}
    >
      <View style={subpageStyles.list}>
        <View style={subpageStyles.card}>
          <Text style={subpageStyles.cardTitle}>You are in the room</Text>
          <Text style={subpageStyles.cardMeta}>
            {minutesLeft ? `${minutesLeft} minutes remaining.` : 'Session is open.'}
            {'\n\n'}This live room uses booking/session data. The real video room can replace it later.
          </Text>
          <TouchableOpacity style={subpageStyles.navyBtn} onPress={() => navigation.navigate('MainTabs', { screen: 'Bookings' })}>
            <Text style={subpageStyles.navyText}>View all bookings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LearningSubpage>
  );
}

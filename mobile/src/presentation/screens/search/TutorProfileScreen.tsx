import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Card, PrimaryButton, SecondaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'TutorProfile'>;

export default function TutorProfileScreen({ navigation, route }: Props) {
  const mentor = route.params.mentor;
  return (
    <ScreenLayout title="Tutor profile" showBack activeTab="Home">
      <Card>
        <Text style={styles.name}>{mentor.name}</Text>
        <Text style={styles.meta}>{mentor.email}</Text>
        <Text style={styles.meta}>{(mentor.subjects ?? []).join(' · ')}</Text>
        {mentor.bio ? <Text style={styles.bio}>{mentor.bio}</Text> : null}
      </Card>
      <View style={styles.mt}>
        <PrimaryButton
          label="Book a session"
          onPress={() =>
            navigation.navigate('BookSession', {
              mentorId: mentor._id,
              mentorName: mentor.name,
              subject: mentor.subjects?.[0],
            })
          }
        />
      </View>
      <View style={styles.mt}>
        <SecondaryButton
          label="Message"
          onPress={() => navigation.navigate('ChatThread', { participantId: mentor._id, participantName: mentor.name })}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 22, fontWeight: '800', color: colors.navy },
  meta: { color: colors.muted, marginTop: 6 },
  bio: { marginTop: 12, color: colors.text, lineHeight: 20 },
  mt: { marginTop: 16 },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../../domain/stores/authStore';
import type { AppStackParamList, AppTabParamList } from '../../navigation/AppNavigator';

type Props = BottomTabScreenProps<AppTabParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const isStudent = user?.role === 'student';
  const openReviews = () => {
    navigation.getParent<NativeStackNavigationProp<AppStackParamList>>()?.navigate('Reviews');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.card}>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>{user?.role === 'mentor' ? 'Tutor' : user?.role === 'admin' ? 'Admin / LIC' : 'Student'}</Text>
      </View>
      {isStudent && (
        <TouchableOpacity style={styles.reviewBtn} onPress={openReviews}>
          <Text style={styles.reviewText}>Write a Review</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F9FAFB' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 24, elevation: 1 },
  name: { fontSize: 20, fontWeight: '700', color: '#111827' },
  email: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  role: { fontSize: 13, color: '#4F46E5', marginTop: 8, textTransform: 'capitalize' },
  reviewBtn: { backgroundColor: '#062B67', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  reviewText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  logoutBtn: { backgroundColor: '#EF4444', padding: 14, borderRadius: 8, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

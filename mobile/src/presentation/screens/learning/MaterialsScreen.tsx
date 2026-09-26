import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { Material } from '../../../domain/entities/Material';
import { useAuthStore } from '../../../domain/stores/authStore';
import { apiError, personName } from '../../../shared/format';
import { colors, inputStyle } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Badge, Card, EmptyState, PrimaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = { navigation: NativeStackNavigationProp<AppStackParamList, 'Materials'> };

export default function MaterialsScreen({ navigation }: Props) {
  const role = useAuthStore((s) => s.user?.role);
  const canEdit = role === 'mentor' || role === 'admin';
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Material[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    learningRepository
      .materials({ q: query, mine: role === 'mentor' })
      .then(setItems)
      .catch((err) => setError(apiError(err)));
  }, [query, role]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScreenLayout title={canEdit ? 'Material hub' : 'Study materials'} showBack activeTab="Learning" onRefresh={load}>
      <TextInput
        style={[inputStyle, styles.gap]}
        placeholder="Search packs"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={load}
      />
      {canEdit ? (
        <PrimaryButton label="Add material" onPress={() => navigation.navigate('MaterialEditor')} />
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {items.map((item) => (
        <TouchableOpacity key={item._id} onPress={() => navigation.navigate('MaterialDetail', { materialId: item._id })}>
          <Card style={styles.card}>
            <View style={styles.row}>
              <Badge text={item.published ? 'Published' : 'Draft'} tone={item.published ? 'success' : 'orange'} />
              <Text style={styles.price}>{item.price ? `LKR ${item.price}` : 'Free'}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>
              {item.subject} · {personName(item.mentorId, 'Mentor')}
            </Text>
          </Card>
        </TouchableOpacity>
      ))}
      {!items.length ? <EmptyState text="No materials published yet." /> : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  gap: { marginBottom: 12 },
  error: { color: colors.danger, marginTop: 8 },
  card: { marginTop: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontWeight: '800', color: colors.navy, marginTop: 8, fontSize: 16 },
  meta: { color: colors.muted, marginTop: 4 },
  price: { fontWeight: '700', color: colors.navy },
});

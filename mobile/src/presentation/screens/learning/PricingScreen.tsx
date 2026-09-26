import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { Material } from '../../../domain/entities/Material';
import { apiError, personName } from '../../../shared/format';
import { colors, inputStyle } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Card, EmptyState, FieldLabel, PrimaryButton } from '../../components/Ui';

export default function PricingScreen() {
  const [cap, setCap] = useState('2500');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    learningRepository
      .getPricing()
      .then((data) => {
        setCap(String(data.materialPriceCap));
        setMaterials(data.materials);
      })
      .catch((err) => setError(apiError(err)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const save = async () => {
    try {
      await learningRepository.setPriceCap(Number(cap));
      load();
    } catch (err) {
      Alert.alert('Could not save', apiError(err));
    }
  };

  return (
    <ScreenLayout title="Material pricing" showBack activeTab="Learning" onRefresh={load}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FieldLabel text="Campus price cap (LKR)" />
      <TextInput style={[inputStyle, styles.gap]} value={cap} onChangeText={setCap} keyboardType="numeric" />
      <PrimaryButton label="Update cap" onPress={save} />
      <Text style={styles.section}>Published packs</Text>
      {materials.map((item) => (
        <Card key={item._id} style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>
            {personName(item.mentorId)} · LKR {item.price}
          </Text>
        </Card>
      ))}
      {!materials.length ? <EmptyState text="No materials yet." /> : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
  gap: { marginBottom: 12 },
  section: { marginTop: 18, fontWeight: '800', color: colors.navy, fontSize: 16 },
  card: { marginTop: 10 },
  title: { fontWeight: '800', color: colors.navy },
  meta: { color: colors.muted, marginTop: 4 },
});

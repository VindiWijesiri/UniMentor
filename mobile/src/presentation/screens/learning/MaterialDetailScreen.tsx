import React, { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { Material } from '../../../domain/entities/Material';
import { useAuthStore } from '../../../domain/stores/authStore';
import { apiError, personId, personName } from '../../../shared/format';
import { colors } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Badge, Card, PrimaryButton, SecondaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'MaterialDetail'>;

export default function MaterialDetailScreen({ navigation, route }: Props) {
  const user = useAuthStore((s) => s.user);
  const [item, setItem] = useState<Material | null>(null);

  useEffect(() => {
    learningRepository.getMaterial(route.params.materialId).then(setItem).catch((err) => Alert.alert('Error', apiError(err)));
  }, [route.params.materialId]);

  const mine = item ? personId(item.mentorId) === user?._id || user?.role === 'admin' : false;

  return (
    <ScreenLayout title="Material" showBack activeTab="Learning">
      {item ? (
        <>
          <Card>
            <Badge text={item.published ? 'Published' : 'Draft'} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>
              {item.subject} {item.module ? `· ${item.module}` : ''}
            </Text>
            <Text style={styles.meta}>By {personName(item.mentorId)}</Text>
            <Text style={styles.bodyText}>{item.description}</Text>
            <Text style={styles.price}>{item.price ? `LKR ${item.price}` : 'Free pack'}</Text>
          </Card>
          {item.resourceUrl ? (
            <View style={styles.mt}>
              <PrimaryButton label="Open resource" onPress={() => Linking.openURL(item.resourceUrl as string)} />
            </View>
          ) : null}
          {mine ? (
            <View style={styles.mt}>
              <SecondaryButton label="Edit" onPress={() => navigation.navigate('MaterialEditor', { material: item })} />
            </View>
          ) : null}
        </>
      ) : (
        <Text style={styles.meta}>Loading material…</Text>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', color: colors.navy, marginTop: 8 },
  meta: { color: colors.muted, marginTop: 4 },
  bodyText: { marginTop: 12, color: colors.text, lineHeight: 20 },
  price: { marginTop: 12, fontWeight: '800', color: colors.navy },
  mt: { marginTop: 16 },
});

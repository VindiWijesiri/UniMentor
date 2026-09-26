import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { Complaint } from '../../../domain/entities/Learning';
import { Material } from '../../../domain/entities/Material';
import { Submission } from '../../../domain/entities/Assessment';
import { apiError, personId, personName } from '../../../shared/format';
import { colors, inputStyle } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Badge, Card, FieldLabel, PrimaryButton, SecondaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'ExamineCase'>;

const TITLES: Record<Complaint['category'], string> = {
  assignment: 'Examine code diff',
  copyright: 'Examine copyright',
  ghostwriting: 'Examine tutor conduct',
  tutor_conduct: 'Examine tutor conduct',
  other: 'Examine case',
};

export default function ExamineCaseScreen({ route }: Props) {
  const [item, setItem] = useState<Complaint | null>(null);
  const [note, setNote] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    learningRepository.getComplaint(route.params.complaintId).then(async (complaint) => {
      setItem(complaint);
      setNote(complaint.resolutionNote ?? '');
      const against = personId(complaint.againstUserId);
      if (complaint.category === 'copyright') {
        const list = await learningRepository.materials();
        setMaterials(against ? list.filter((material) => personId(material.mentorId) === against) : list);
      }
      if (complaint.category === 'assignment' || complaint.category === 'ghostwriting') {
        const list = await learningRepository.submissions(against ? { } : { status: 'submitted' });
        setSubs(against ? list.filter((row) => personId(row.studentId) === against) : list);
      }
    }).catch((err) => Alert.alert('Error', apiError(err)));
  }, [route.params.complaintId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const setStatus = async (status: Complaint['status']) => {
    if (!item) return;
    setLoading(true);
    try {
      setItem(await learningRepository.updateComplaint(item._id, { status, resolutionNote: note }));
    } catch (err) {
      Alert.alert('Could not update', apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const title = item ? TITLES[item.category] : 'Examine case';

  return (
    <ScreenLayout title={title} showBack activeTab="Learning">
      {item ? (
        <Card>
          <Badge text={item.status} tone={item.status === 'open' ? 'danger' : 'success'} />
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>Reporter: {personName(item.reporterId)}</Text>
          {item.againstUserId ? <Text style={styles.meta}>Against: {personName(item.againstUserId)}</Text> : null}
          <Text style={styles.body}>{item.details}</Text>
          {item.evidenceUrl ? <Text style={styles.meta}>Evidence: {item.evidenceUrl}</Text> : null}
        </Card>
      ) : null}

      {item?.category === 'copyright' ? (
        <View>
          <Text style={styles.section}>Related materials</Text>
          {materials.map((material) => (
            <Card key={material._id} style={styles.mb}>
              <Text style={styles.cardTitle}>{material.title}</Text>
              <Text style={styles.meta}>{material.resourceUrl || material.description}</Text>
            </Card>
          ))}
        </View>
      ) : null}

      {item?.category === 'assignment' || item?.category === 'ghostwriting' ? (
        <View>
          <Text style={styles.section}>Submissions / code</Text>
          {subs.map((row) => (
            <Card key={row._id} style={styles.mb}>
              <Text style={styles.cardTitle}>{typeof row.assessmentId === 'object' ? row.assessmentId.title : 'Submission'}</Text>
              <Text style={styles.meta}>{JSON.stringify(row.answers)}</Text>
            </Card>
          ))}
        </View>
      ) : null}

      <FieldLabel text="Resolution note" />
      <TextInput style={[inputStyle, styles.area]} value={note} onChangeText={setNote} multiline />
      <View style={styles.row}>
        <View style={styles.flex}>
          <SecondaryButton label="Mark reviewing" onPress={() => setStatus('reviewing')} />
        </View>
      </View>
      <View style={styles.mt}>
        <PrimaryButton label="Resolve case" onPress={() => setStatus('resolved')} loading={loading} />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '800', color: colors.navy, marginTop: 8 },
  meta: { color: colors.muted, marginTop: 4 },
  body: { marginTop: 10, color: colors.text, lineHeight: 20 },
  section: { marginTop: 16, fontWeight: '800', color: colors.navy, marginBottom: 8 },
  mb: { marginBottom: 8 },
  cardTitle: { fontWeight: '800', color: colors.navy },
  area: { minHeight: 90, textAlignVertical: 'top', marginBottom: 12 },
  row: { flexDirection: 'row' },
  flex: { flex: 1 },
  mt: { marginTop: 10 },
});

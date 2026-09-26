import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { searchMentorsUseCase } from '../../../domain/usecases/mentor/searchMentorsUseCase';
import { Mentor } from '../../../domain/entities/Mentor';
import { apiError } from '../../../shared/format';
import { colors, inputStyle } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Card, EmptyState, PrimaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = { navigation: NativeStackNavigationProp<AppStackParamList, 'Search'> };

export default function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Mentor[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async (value = query) => {
    setLoading(true);
    setError('');
    try {
      setResults(await searchMentorsUseCase(value));
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useFocusEffect(
    useCallback(() => {
      void handleSearch('');
    }, [])
  );

  return (
    <ScreenLayout title="Find a mentor" showBack activeTab="Home">
      <TextInput
        style={[inputStyle, styles.gap]}
        placeholder="Search name or subject"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => void handleSearch()}
        returnKeyType="search"
      />
      <PrimaryButton label={loading ? 'Searching…' : 'Search'} onPress={() => void handleSearch()} loading={loading} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {results.map((item) => (
        <TouchableOpacity key={item._id} onPress={() => navigation.navigate('TutorProfile', { mentor: item })}>
          <Card style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{(item.subjects ?? []).join(', ') || 'No subjects listed'}</Text>
            {item.bio ? <Text style={styles.meta}>{item.bio}</Text> : null}
          </Card>
        </TouchableOpacity>
      ))}
      {!results.length ? <EmptyState text="No mentors match that search yet." /> : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  gap: { marginBottom: 12 },
  error: { color: colors.danger, marginTop: 8 },
  card: { marginTop: 12 },
  name: { fontSize: 16, fontWeight: '800', color: colors.navy },
  meta: { color: colors.muted, marginTop: 4 },
});

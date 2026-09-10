import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { searchMentorsUseCase } from '../../../domain/usecases/mentor/searchMentorsUseCase';
import { Mentor } from '../../../domain/entities/Mentor';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Mentor[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      const mentors = await searchMentorsUseCase(query);
      setResults(mentors);
    } catch {}
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find a Mentor</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search by name or subject..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.mentorName}>{item.name}</Text>
            <Text style={styles.mentorSubject}>{item.subjects.join(', ')}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No mentors found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F9FAFB' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
    padding: 10, fontSize: 15, backgroundColor: '#fff',
  },
  searchBtn: {
    backgroundColor: '#4F46E5', paddingHorizontal: 16,
    borderRadius: 8, justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '600' },
  card: {
    backgroundColor: '#fff', borderRadius: 10, padding: 16,
    marginBottom: 12, elevation: 1,
  },
  mentorName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  mentorSubject: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
});

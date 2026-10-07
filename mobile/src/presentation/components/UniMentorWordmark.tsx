import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  tone?: 'onNavy' | 'onLight';
  size?: number;
};

export default function UniMentorWordmark({ tone = 'onNavy', size = 16 }: Props) {
  const uni = tone === 'onNavy' ? '#FFFFFF' : '#102B5D';
  return (
    <View style={styles.row}>
      <Text style={[styles.word, { color: uni, fontSize: size }]}>Uni</Text>
      <Text style={[styles.word, styles.mentor, { fontSize: size }]}>Mentor</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  word: { fontWeight: '800' },
  mentor: { color: '#FF8D28' },
});

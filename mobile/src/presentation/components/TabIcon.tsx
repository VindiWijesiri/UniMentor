import React from 'react';
import { StyleSheet, View } from 'react-native';

type Props = { name: 'Home' | 'Bookings' | 'Learning' | 'Alerts' | 'Profile'; color: string; focused: boolean };

export default function TabIcon({ name, color, focused }: Props) {
  const stroke = focused ? 2.2 : 1.8;
  if (name === 'Home') {
    return (
      <View style={styles.box}>
        <View style={[styles.roof, { borderBottomColor: color, borderBottomWidth: 10 }]} />
        <View style={[styles.homeBody, { borderColor: color, borderWidth: stroke }]} />
      </View>
    );
  }
  if (name === 'Bookings') {
    return (
      <View style={[styles.cal, { borderColor: color, borderWidth: stroke }]}>
        <View style={[styles.calBar, { backgroundColor: color }]} />
        <View style={styles.calDots}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <View style={[styles.dot, { backgroundColor: color }]} />
          <View style={[styles.dot, { backgroundColor: color }]} />
        </View>
      </View>
    );
  }
  if (name === 'Learning') {
    return (
      <View style={[styles.book, { borderColor: color, borderWidth: stroke }]}>
        <View style={[styles.spine, { backgroundColor: color }]} />
      </View>
    );
  }
  if (name === 'Alerts') {
    return (
      <View style={styles.box}>
        <View style={[styles.bell, { borderColor: color, borderWidth: stroke }]} />
        <View style={[styles.clapper, { backgroundColor: color }]} />
      </View>
    );
  }
  return (
    <View style={styles.box}>
      <View style={[styles.head, { borderColor: color, borderWidth: stroke }]} />
      <View style={[styles.shoulders, { borderColor: color, borderWidth: stroke }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: 22, height: 22, alignItems: 'center', justifyContent: 'flex-end' },
  roof: { width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginBottom: -1 },
  homeBody: { width: 14, height: 10, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  cal: { width: 18, height: 16, borderRadius: 3, overflow: 'hidden' },
  calBar: { height: 4 },
  calDots: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 3 },
  dot: { width: 3, height: 3, borderRadius: 2 },
  book: { width: 18, height: 16, borderRadius: 2, overflow: 'hidden' },
  spine: { position: 'absolute', left: 7, top: 0, bottom: 0, width: 2 },
  bell: { width: 14, height: 12, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomWidth: 0 },
  clapper: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
  head: { width: 8, height: 8, borderRadius: 4, marginBottom: 2 },
  shoulders: { width: 16, height: 8, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomWidth: 0 },
});

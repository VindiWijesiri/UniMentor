import React from 'react';
import { StyleSheet, View } from 'react-native';

type IconProps = {
  color: string;
  size?: number;
};

function Frame({ size = 24, children }: { size?: number; children: React.ReactNode }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}

export function HomeTabIcon({ color, size = 24 }: IconProps) {
  return (
    <Frame size={size}>
      <View style={[styles.roof, { borderBottomColor: color }]} />
      <View style={[styles.house, { borderColor: color }]}>
        <View style={[styles.door, { backgroundColor: color }]} />
      </View>
    </Frame>
  );
}

export function CalendarTabIcon({ color, size = 24 }: IconProps) {
  return (
    <Frame size={size}>
      <View style={styles.calendarWrap}>
        <View style={styles.pins}>
          <View style={[styles.pin, { backgroundColor: color }]} />
          <View style={[styles.pin, { backgroundColor: color }]} />
        </View>
        <View style={[styles.calendar, { borderColor: color }]}>
          <View style={[styles.calendarHeader, { backgroundColor: color }]} />
          <View style={styles.calendarGrid}>
            {[0, 1, 2].map((dot) => (
              <View key={dot} style={[styles.calDot, { backgroundColor: color }]} />
            ))}
          </View>
        </View>
      </View>
    </Frame>
  );
}

export function BookTabIcon({ color, size = 24 }: IconProps) {
  return (
    <Frame size={size}>
      <View style={styles.book}>
        <View style={[styles.page, styles.pageLeft, { borderColor: color }]} />
        <View style={[styles.spine, { backgroundColor: color }]} />
        <View style={[styles.page, styles.pageRight, { borderColor: color }]} />
      </View>
    </Frame>
  );
}

export function BellTabIcon({ color, size = 24 }: IconProps) {
  return (
    <Frame size={size}>
      <View style={[styles.bellCap, { backgroundColor: color }]} />
      <View style={[styles.bell, { borderColor: color }]} />
      <View style={[styles.clapper, { backgroundColor: color }]} />
    </Frame>
  );
}

export function PersonTabIcon({ color, size = 24 }: IconProps) {
  return (
    <Frame size={size}>
      <View style={[styles.head, { borderColor: color }]} />
      <View style={[styles.body, { borderColor: color }]} />
    </Frame>
  );
}

export function PeopleTabIcon({ color, size = 24 }: IconProps) {
  return (
    <Frame size={size}>
      <View style={styles.people}>
        <View style={styles.personBack}>
          <View style={[styles.headSmall, { borderColor: color }]} />
          <View style={[styles.bodySmall, { borderColor: color }]} />
        </View>
        <View style={styles.personFront}>
          <View style={[styles.headSmall, { borderColor: color }]} />
          <View style={[styles.bodySmall, { borderColor: color }]} />
        </View>
      </View>
    </Frame>
  );
}

const stroke = 1.8;

const styles = StyleSheet.create({
  roof: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: -1.5,
  },
  house: {
    width: 15,
    height: 11,
    borderWidth: stroke,
    borderTopWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  door: {
    width: 4.5,
    height: 6,
  },
  calendarWrap: {
    alignItems: 'center',
    paddingTop: 3,
  },
  pins: {
    position: 'absolute',
    top: 0,
    width: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  pin: {
    width: 1.6,
    height: 5,
    borderRadius: 1,
  },
  calendar: {
    width: 17,
    height: 15,
    borderWidth: stroke,
    borderRadius: 3,
    overflow: 'hidden',
  },
  calendarHeader: {
    height: 3.5,
    opacity: 0.9,
  },
  calendarGrid: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  calDot: {
    width: 2.2,
    height: 2.2,
    borderRadius: 1.1,
  },
  book: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 16,
  },
  page: {
    width: 8.5,
    height: 14,
    borderWidth: stroke,
  },
  pageLeft: {
    borderRightWidth: 0,
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    transform: [{ skewY: '-10deg' }],
  },
  pageRight: {
    borderLeftWidth: 0,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    transform: [{ skewY: '10deg' }],
  },
  spine: {
    width: 1.7,
    height: 15.5,
    borderRadius: 1,
  },
  bellCap: {
    width: 3,
    height: 2,
    borderRadius: 1,
    marginBottom: -1,
  },
  bell: {
    width: 16,
    height: 13,
    borderWidth: stroke,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
  },
  clapper: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginTop: 1.5,
  },
  head: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: stroke,
    marginBottom: 1.5,
  },
  body: {
    width: 16,
    height: 8,
    borderWidth: stroke,
    borderBottomWidth: 0,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
  },
  people: {
    width: 22,
    height: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  personBack: {
    alignItems: 'center',
    opacity: 0.7,
    marginRight: -4,
  },
  personFront: {
    alignItems: 'center',
  },
  headSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.6,
    marginBottom: 1,
  },
  bodySmall: {
    width: 11,
    height: 6.5,
    borderWidth: 1.6,
    borderBottomWidth: 0,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
});

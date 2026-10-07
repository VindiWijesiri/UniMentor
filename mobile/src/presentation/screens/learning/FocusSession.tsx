import React, { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { setFocusClockPaused } from '../../presence/focusClock';

export type FocusArea = { id: string; title: string; code?: string };

const BLOCKS = [15, 25, 45, 60];

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function clock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

type Props = {
  visible: boolean;
  areas: FocusArea[];
  areaId: string;
  minutes: number;
  studyArea?: string;
  chooseTime?: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export default function FocusSession({ visible, areas, areaId, minutes, studyArea, chooseTime, onClose, onSaved }: Props) {
  const area = areas.find((item) => item.id === areaId) ?? areas[0];
  const [phase, setPhase] = useState<'pick' | 'run' | 'paused' | 'saving' | 'done'>('pick');
  const [blockMinutes, setBlockMinutes] = useState(minutes);
  const [left, setLeft] = useState(minutes * 60 * 1000);
  const [note, setNote] = useState('');
  const endRef = useRef(0);
  const leftRef = useRef(0);
  const pausedRef = useRef(false);
  const savedRef = useRef(false);
  const areaRef = useRef(areaId);
  areaRef.current = area?.id || areaId;

  useEffect(() => {
    setFocusClockPaused(visible);
    return () => setFocusClockPaused(false);
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    savedRef.current = false;
    pausedRef.current = false;
    endRef.current = 0;
    setNote('');
    setBlockMinutes(minutes);
    if (chooseTime) {
      setPhase('pick');
      setLeft(minutes * 60 * 1000);
      return undefined;
    }
    const total = minutes * 60 * 1000;
    endRef.current = Date.now() + total;
    leftRef.current = total;
    setLeft(total);
    setPhase('run');
    return undefined;
  }, [visible, areaId, minutes, chooseTime]);

  useEffect(() => {
    if (!visible || phase !== 'run') return undefined;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      const remain = Math.max(0, endRef.current - Date.now());
      leftRef.current = remain;
      setLeft(remain);
      if (remain <= 0) {
        clearInterval(id);
        void finish(blockMinutes * 60);
      }
    }, 250);
    return () => clearInterval(id);
  }, [visible, phase, blockMinutes]);

  const begin = (mins: number) => {
    const total = mins * 60 * 1000;
    savedRef.current = false;
    pausedRef.current = false;
    endRef.current = Date.now() + total;
    leftRef.current = total;
    setBlockMinutes(mins);
    setLeft(total);
    setPhase('run');
  };

  const finish = async (seconds: number) => {
    if (savedRef.current) return;
    savedRef.current = true;
    pausedRef.current = false;
    setPhase('saving');
    try {
      const result = await learningRepository.logFocus(areaRef.current, seconds, localDate(), studyArea);
      setNote(`${result.minutes} min added to ${result.goalTitle}. Today is now ${result.hoursDone}h.`);
    } catch {
      setNote('This block finished, but it could not be saved. Check your connection.');
    }
    setPhase('done');
  };

  const endEarly = () => {
    const elapsed = Math.round((blockMinutes * 60 * 1000 - leftRef.current) / 1000);
    if (elapsed < 60) {
      onClose();
      return;
    }
    void finish(elapsed);
  };

  const pause = () => {
    leftRef.current = Math.max(0, endRef.current - Date.now());
    pausedRef.current = true;
    setLeft(leftRef.current);
    setPhase('paused');
  };

  const resume = () => {
    endRef.current = Date.now() + leftRef.current;
    pausedRef.current = false;
    setPhase('run');
  };

  const progress = blockMinutes > 0 ? 1 - left / (blockMinutes * 60 * 1000) : 0;
  const label = area ? `${area.code ? `${area.code} · ` : ''}${area.title}` : 'Study goal';

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={phase === 'run' || phase === 'paused' ? endEarly : onClose}>
      <BlurView intensity={36} tint="dark" style={styles.blur}>
        <View style={styles.sheet}>
          <Text style={styles.kicker}>Focus</Text>
          <Text style={styles.title}>{label}</Text>
          {studyArea ? <Text style={styles.lead}>{studyArea}</Text> : null}
          {phase === 'pick' ? (
            <>
              <Text style={styles.lead}>Choose a block. When it ends, the time is added to this goal and to today.</Text>
              <View style={styles.times}>
                {BLOCKS.map((mins) => (
                  <TouchableOpacity key={mins} style={[styles.time, blockMinutes === mins && styles.timeOn]} onPress={() => setBlockMinutes(mins)}>
                    <Text style={[styles.timeText, blockMinutes === mins && styles.timeTextOn]}>{mins}m</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.primary} onPress={() => begin(blockMinutes)}>
                <Text style={styles.primaryText}>Start focus</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}><Text style={styles.quiet}>Not now</Text></TouchableOpacity>
            </>
          ) : phase === 'done' ? (
            <>
              <Text style={styles.clock}>Done</Text>
              <Text style={styles.lead}>{note}</Text>
              <TouchableOpacity style={styles.primary} onPress={() => { onSaved(); onClose(); }}>
                <Text style={styles.primaryText}>Back to learning</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.lead}>
                {phase === 'paused' ? 'Paused. Resume when you are ready.' : 'Stay with this goal until the block ends.'}
              </Text>
              <Text style={styles.clock}>{phase === 'saving' ? 'Saving' : clock(left)}</Text>
              <View style={styles.track}><View style={[styles.fill, { width: `${Math.min(100, Math.max(0, progress * 100))}%` }]} /></View>
              {phase !== 'saving' ? (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.secondary} onPress={phase === 'paused' ? resume : pause}>
                    <Text style={styles.secondaryText}>{phase === 'paused' ? 'Resume' : 'Pause'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryInline} onPress={endEarly}>
                    <Text style={styles.primaryText}>End</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </>
          )}
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blur: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22 },
  sheet: { width: '100%', maxWidth: 360, backgroundColor: '#FFF', borderRadius: 28, padding: 22 },
  kicker: { color: '#EAA023', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  title: { color: '#061E47', fontSize: 20, fontWeight: '800', marginTop: 6 },
  lead: { color: '#64748B', fontSize: 14, lineHeight: 20, marginTop: 8 },
  clock: { color: '#061E47', fontSize: 56, fontWeight: '800', textAlign: 'center', marginTop: 18 },
  track: { height: 8, borderRadius: 8, backgroundColor: '#E7EDF6', marginTop: 16, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: '#EAA023' },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  time: { borderRadius: 14, borderWidth: 1, borderColor: '#E6EAF2', paddingHorizontal: 14, paddingVertical: 10 },
  timeOn: { backgroundColor: '#EAA023', borderColor: '#EAA023' },
  timeText: { color: '#061E47', fontWeight: '800' },
  timeTextOn: { color: '#061E47' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  primary: { backgroundColor: '#EAA023', borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 18 },
  primaryInline: { flex: 1, backgroundColor: '#EAA023', borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: '#061E47', fontWeight: '800', fontSize: 16 },
  secondary: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: '#D5DCE8', paddingVertical: 14, alignItems: 'center' },
  secondaryText: { color: '#061E47', fontWeight: '800', fontSize: 16 },
  quiet: { color: '#64748B', textAlign: 'center', marginTop: 14, fontWeight: '700' },
});


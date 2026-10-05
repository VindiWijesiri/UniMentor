import { useCallback, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BookOpen, CalendarClock, Flag, GraduationCap, Library, Plus, Search } from 'lucide-react-native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { libraryRepository } from '../../../data/repositories/libraryRepository';
import type { GoalPlanView } from '../../../domain/entities/GoalPlan';
import type { LibraryMaterial } from '../../../domain/entities/Library';
import { useAuthStore } from '../../../domain/stores/authStore';
import { useStudentStore } from '../../../domain/stores/studentStore';
import PageHeader from '../../components/PageHeader';
import type { AppStackParamList, AppTabParamList } from '../../navigation/AppNavigator';

const DEMO_GOAL_KEYS = new Set(['goal-weekly', 'goal-graph', 'goal-oop']);
const navy = '#102B5D';
const orange = '#FF8D28';
const muted = '#7585A5';

type Props = BottomTabScreenProps<AppTabParamList, 'Home'>;

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function Stat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Tool({ icon, label, onPress }: { icon: ReactNode; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.tool} onPress={onPress}>
      {icon}
      <Text style={styles.toolText}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function StudentDashboardScreen({ navigation }: Props) {
  const authUser = useAuthStore((state) => state.user);
  const { dashboard, loading, error, fetchDashboard, registerModule, dropModule } = useStudentStore();
  const [materials, setMaterials] = useState<LibraryMaterial[]>([]);
  const [materialCount, setMaterialCount] = useState(0);
  const [goals, setGoals] = useState<GoalPlanView[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [code, setCode] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [savingModule, setSavingModule] = useState(false);

  const load = useCallback(() => {
    let active = true;
    void fetchDashboard();
    libraryRepository.list()
      .then((data) => {
        if (!active) return;
        setMaterials(data.items.slice(0, 4));
        setMaterialCount(data.items.length);
      })
      .catch(() => {
        if (!active) return;
        setMaterials([]);
        setMaterialCount(0);
      });
    learningRepository.goalBoard()
      .then((board) => {
        if (active) setGoals((board.goals ?? []).filter((goal) => !DEMO_GOAL_KEYS.has(goal.seedKey ?? '')));
      })
      .catch(() => { if (active) setGoals([]); });
    return () => { active = false; };
  }, [fetchDashboard]);

  useFocusEffect(load);

  const openStack = <T extends keyof AppStackParamList>(screen: T, params?: AppStackParamList[T]) => {
    const stack = navigation.getParent<NativeStackNavigationProp<AppStackParamList>>();
    const navigate = stack?.navigate as unknown as ((name: T, next?: AppStackParamList[T]) => void) | undefined;
    navigate?.(screen, params);
  };

  const name = dashboard?.user.name || authUser?.name || 'Student';
  const programme = [dashboard?.user.degreeProgramme, dashboard?.user.academicYear, dashboard?.user.semester]
    .filter(Boolean)
    .join(' · ');
  const sessions = dashboard?.upcomingSessions ?? [];
  const modules = dashboard?.enrolledModules ?? [];

  const addModule = async () => {
    if (!code.trim() || !moduleName.trim()) {
      Alert.alert('Add the module code and name.');
      return;
    }
    setSavingModule(true);
    try {
      await registerModule({ code: code.trim(), name: moduleName.trim(), credits: 3 });
      setCode('');
      setModuleName('');
      setAddOpen(false);
    } catch (err) {
      Alert.alert(err instanceof Error ? err.message : 'Could not register this module.');
    } finally {
      setSavingModule(false);
    }
  };

  return (
    <View style={styles.page}>
      <PageHeader title="Home" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.welcome}>Welcome back</Text>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.programme}>{programme || 'Add your programme from Profile'}</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading && !dashboard ? <ActivityIndicator color={navy} style={{ marginTop: 24 }} /> : null}

        <View style={styles.statsRow}>
          <Stat icon={<Flag size={16} color={navy} />} value={String(goals.length)} label="Goals" />
          <Stat icon={<CalendarClock size={16} color={navy} />} value={String(sessions.length)} label="Bookings" />
          <Stat icon={<BookOpen size={16} color={navy} />} value={String(materialCount)} label="Materials" />
          <Stat icon={<GraduationCap size={16} color={navy} />} value={String(modules.length)} label="Modules" />
        </View>

        <View style={styles.tools}>
          <Tool icon={<Library size={16} color="#FFF" />} label="Learning" onPress={() => navigation.navigate('Learning')} />
          <Tool icon={<BookOpen size={16} color="#FFF" />} label="Materials" onPress={() => openStack('StudyMaterials')} />
          <Tool icon={<CalendarClock size={16} color="#FFF" />} label="Bookings" onPress={() => navigation.navigate('Sessions')} />
          <Tool icon={<Search size={16} color="#FFF" />} label="Find tutor" onPress={() => openStack('Search')} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Upcoming bookings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Sessions')}>
              <Text style={styles.link}>Open</Text>
            </TouchableOpacity>
          </View>
          {sessions.length === 0 ? (
            <Text style={styles.empty}>No upcoming sessions. Book a tutor when you are ready.</Text>
          ) : sessions.map((session) => (
            <TouchableOpacity
              key={session._id}
              style={styles.row}
              onPress={() => {
                if (session.isLive) {
                  openStack('LiveSession', { id: session._id, title: session.subject, tutorName: session.mentorName });
                } else {
                  navigation.navigate('Sessions');
                }
              }}
            >
              <View style={styles.iconBubble}><CalendarClock size={18} color={navy} /></View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{session.subject}</Text>
                <Text style={styles.rowMeta}>
                  {formatWhen(session.scheduledAt)}
                  {session.mentorName ? ` · ${session.mentorName}` : ''}
                  {session.moduleCode ? ` · ${session.moduleCode}` : ''}
                </Text>
              </View>
              <Text style={styles.status}>{session.isLive ? 'Live' : session.status}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Learning goals</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Learning')}>
              <Text style={styles.link}>Plans</Text>
            </TouchableOpacity>
          </View>
          {goals.length === 0 ? (
            <Text style={styles.empty}>Goals you create in Learning show up here.</Text>
          ) : goals.slice(0, 3).map((goal) => (
            <TouchableOpacity key={goal._id} style={styles.row} onPress={() => openStack('GoalDetail', { goalId: goal._id })}>
              <View style={styles.iconBubble}><Flag size={18} color={navy} /></View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{goal.title}</Text>
                <Text style={styles.rowMeta}>{[goal.moduleCode, `${goal.progress}%`, goal.dueLabel].filter(Boolean).join(' · ')}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Study materials</Text>
            <TouchableOpacity onPress={() => openStack('StudyMaterials')}>
              <Text style={styles.link}>Library</Text>
            </TouchableOpacity>
          </View>
          {materials.length === 0 ? (
            <Text style={styles.empty}>Nothing stored yet. Add notes, a video outline, a quiz, or code from the library.</Text>
          ) : materials.map((item) => (
            <TouchableOpacity key={item._id} style={styles.row} onPress={() => openStack('StudyMaterialDetail', { id: item._id })}>
              <View style={styles.iconBubble}><BookOpen size={18} color={navy} /></View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowMeta}>{[item.moduleCode, item.kind, item.ownerName].filter(Boolean).join(' · ')}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addBtn} onPress={() => openStack('StoreMaterial')}>
            <Plus size={16} color={navy} />
            <Text style={styles.addText}>Add material</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Enrolled modules</Text>
            <TouchableOpacity onPress={() => setAddOpen(true)}>
              <Text style={styles.link}>Add</Text>
            </TouchableOpacity>
          </View>
          {modules.length === 0 ? (
            <Text style={styles.empty}>Register a module you are studying. It is saved on your account.</Text>
          ) : modules.map((module) => (
            <View key={module.code} style={styles.row}>
              <View style={styles.iconBubble}><GraduationCap size={18} color={navy} /></View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{module.code}</Text>
                <Text style={styles.rowMeta}>{module.name}{module.mentor?.name ? ` · ${module.mentor.name}` : ''}</Text>
              </View>
              <TouchableOpacity onPress={() => {
                Alert.alert('Drop module', `Remove ${module.code} from your modules?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Drop', style: 'destructive', onPress: () => void dropModule(module.code) },
                ]);
              }}>
                <Text style={styles.drop}>Drop</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={addOpen} transparent animationType="fade" onRequestClose={() => setAddOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.cardTitle}>Register module</Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="Module code"
              placeholderTextColor="#8B98AE"
              style={styles.input}
              autoCapitalize="characters"
            />
            <TextInput
              value={moduleName}
              onChangeText={setModuleName}
              placeholder="Module name"
              placeholderTextColor="#8B98AE"
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setAddOpen(false)}>
                <Text style={styles.drop}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.save} onPress={() => void addModule()} disabled={savingModule}>
                <Text style={styles.saveText}>{savingModule ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F7FB' },
  scroll: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 28 },
  welcome: { color: muted, fontSize: 14 },
  name: { color: navy, fontSize: 28, fontWeight: '900', marginTop: 2 },
  programme: { color: muted, marginTop: 6, marginBottom: 14, fontWeight: '700' },
  error: { color: '#A63838', fontWeight: '700', marginBottom: 10 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E3EAF4',
    alignItems: 'flex-start',
    gap: 4,
  },
  statValue: { color: navy, fontSize: 22, fontWeight: '900' },
  statLabel: { color: muted, fontSize: 11, fontWeight: '700' },
  tools: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tool: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: navy,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  toolText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E3EAF4',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { color: navy, fontSize: 16, fontWeight: '800' },
  link: { color: orange, fontSize: 13, fontWeight: '800' },
  empty: { color: '#7C8AA1', fontSize: 13, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  rowCopy: { flex: 1 },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EEF3FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { color: '#111827', fontSize: 14, fontWeight: '800' },
  rowMeta: { color: muted, fontSize: 12, marginTop: 2 },
  status: { color: navy, fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  addBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFD21C',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addText: { color: navy, fontWeight: '900' },
  drop: { color: '#B42318', fontWeight: '800', fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(6, 18, 48, 0.45)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 16 },
  input: {
    backgroundColor: '#F4F7FB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3EAF4',
    paddingHorizontal: 12,
    minHeight: 46,
    color: '#111827',
    marginTop: 10,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 16 },
  save: { backgroundColor: '#FFD21C', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  saveText: { color: navy, fontWeight: '900' },
});

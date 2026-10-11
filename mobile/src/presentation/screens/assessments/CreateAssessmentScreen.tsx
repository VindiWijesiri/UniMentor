import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { assessmentRepository } from '../../../data/repositories/assessmentRepository';
import { KIND_META, type AssessmentKind, type CreatePaperInput, type WorkQuestion } from '../../../domain/entities/AssessmentWork';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { AssessmentScreen, KuppiyaBar, OrangeButton } from './Chrome';
import { blue, card, ink, line, muted, navy, orange, soft } from './theme';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateAssessment'>;

export default function CreateAssessmentScreen({ navigation, route }: Props) {
  const kind: AssessmentKind = route.params?.kind || 'mcq';
  const save = async (input: CreatePaperInput, preview: boolean) => {
    try {
      const created = await assessmentRepository.createPaper({ ...input, publish: !preview });
      if (preview) {
        navigation.navigate('TakeAssessment', { paperId: created.paperId, preview: true });
        return;
      }
      Alert.alert('Sent to LIC', 'Faculty review has this assessment. Students see it after approval.');
      navigation.goBack();
    } catch {
      Alert.alert('Not saved', 'Check the connection and try again.');
    }
  };

  return (
    <AssessmentScreen navigation={navigation}>
      <KuppiyaBar />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>Step 2 of 3 · {KIND_META[kind].label}</Text>
        <Text style={styles.title}>Create {KIND_META[kind].label}</Text>
        <Text style={styles.sub}>{KIND_META[kind].blurb}</Text>
        <Form kind={kind} onSave={save} />
      </ScrollView>
    </AssessmentScreen>
  );
}

function Form({ kind, onSave }: { kind: AssessmentKind; onSave: (input: CreatePaperInput, preview: boolean) => void }) {
  if (kind === 'mcq') return <McqForm onSave={onSave} />;
  if (kind === 'true_false') return <TrueFalseForm onSave={onSave} />;
  if (kind === 'short_answer') return <ShortForm onSave={onSave} />;
  if (kind === 'fill_blank') return <FillForm onSave={onSave} />;
  if (kind === 'matching') return <MatchForm onSave={onSave} />;
  if (kind === 'ordering') return <OrderForm onSave={onSave} />;
  if (kind === 'drag_drop') return <DragForm onSave={onSave} />;
  if (kind === 'essay') return <EssayForm onSave={onSave} />;
  if (kind === 'coding') return <CodingForm onSave={onSave} />;
  if (kind === 'file_project') return <FileForm onSave={onSave} />;
  return <ScenarioForm onSave={onSave} />;
}

function Shell({
  children,
  onDraft,
  onPublish,
}: {
  children: React.ReactNode;
  onDraft: () => void;
  onPublish: () => void;
}) {
  return (
    <View>
      {children}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.ghost} onPress={onDraft}><Text style={styles.ghostText}>Preview</Text></TouchableOpacity>
        <View style={styles.flex}><OrangeButton label="Save for LIC review" onPress={onPublish} /></View>
      </View>
    </View>
  );
}

function McqForm({ onSave }: { onSave: (input: CreatePaperInput, preview: boolean) => void }) {
  const [title, setTitle] = useState('Data Structures & Algorithms - Midterm');
  const [moduleCode, setModuleCode] = useState('CS2040');
  const [marks, setMarks] = useState('20');
  const [minutes, setMinutes] = useState('45');
  const [stem, setStem] = useState('What will be the memory state of the following array allocation in Java immediately after initialization?');
  const [choices, setChoices] = useState(['All elements are garbage values', 'All indices are auto-initialized to zero', 'An ArrayOutOfBounds exception is thrown', 'Array indices contain null pointers']);
  const [correct, setCorrect] = useState(1);
  const [negative, setNegative] = useState(true);
  const build = (preview: boolean): CreatePaperInput => ({
    kind: 'mcq', title, moduleCode, moduleName: 'Data Structures', kindLabel: 'Quiz (MCQ)',
    marks: Number(marks) || 20, durationMin: Number(minutes) || 45, chips: ['MCQ', `${minutes} Mins`],
    questions: [{
      id: 'q1', kind: 'mcq', prompt: stem, marks: Number(marks) || 20, topic: moduleCode,
      choices: choices.map((label, index) => ({ id: String.fromCharCode(97 + index), label })),
      key: { choiceIds: [String.fromCharCode(97 + correct)] },
      hint: negative ? 'Incorrect answers deduct 0.5 marks.' : undefined,
    }],
    publish: !preview,
  });
  return (
    <Shell onDraft={() => onSave(build(true), true)} onPublish={() => onSave(build(false), false)}>
      <Field label="Assessment title" value={title} onChangeText={setTitle} />
      <View style={styles.row}>
        <View style={styles.flex}><Field label="Module" value={moduleCode} onChangeText={setModuleCode} /></View>
        <View style={styles.flex}><Field label="Marks" value={marks} onChangeText={setMarks} /></View>
        <View style={styles.flex}><Field label="Minutes" value={minutes} onChangeText={setMinutes} /></View>
      </View>
      <Field label="Question stem" value={stem} onChangeText={setStem} multiline />
      <Text style={styles.label}>Answer choices · tap the correct key</Text>
      {choices.map((choice, index) => (
        <TouchableOpacity key={choice} style={[styles.choice, correct === index && styles.choiceOn]} onPress={() => setCorrect(index)}>
          <Text style={styles.letter}>{String.fromCharCode(65 + index)}</Text>
          <TextInput style={styles.choiceInput} value={choice} onChangeText={(value) => setChoices(choices.map((item, itemIndex) => itemIndex === index ? value : item))} />
        </TouchableOpacity>
      ))}
      <Toggle label="Negative marking" value={negative} onChange={setNegative} />
    </Shell>
  );
}

function TrueFalseForm({ onSave }: { onSave: (input: CreatePaperInput, preview: boolean) => void }) {
  const [title, setTitle] = useState('AVL Balance Factor Check');
  const [statement, setStatement] = useState('In an AVL Tree, the balance factor of any node must strictly be -1, 0, or +1.');
  const [truth, setTruth] = useState(true);
  const build = (preview: boolean): CreatePaperInput => ({
    kind: 'true_false', title, moduleCode: 'IT2040', moduleName: 'Data Structures', kindLabel: 'True / False',
    marks: 10, durationMin: 15, chips: ['True / False'],
    questions: [{
      id: 'q1', kind: 'true_false', prompt: 'Statement to evaluate', marks: 1.5, topic: 'Binary Search Trees',
      statement, definition: 'Balance factor = Height(Left) - Height(Right)',
      trueDetail: 'The constraint preserves O(log n) height.',
      falseDetail: 'Standard AVL does not allow a temporary imbalance to remain.',
      key: { boolean: truth },
    }],
    publish: !preview,
  });
  return (
    <Shell onDraft={() => onSave(build(true), true)} onPublish={() => onSave(build(false), false)}>
      <Field label="Title" value={title} onChangeText={setTitle} />
      <Field label="Statement" value={statement} onChangeText={setStatement} multiline />
      <Toggle label={truth ? 'Answer key: True' : 'Answer key: False'} value={truth} onChange={setTruth} />
    </Shell>
  );
}

function ShortForm({ onSave }: { onSave: (input: CreatePaperInput, preview: boolean) => void }) {
  const [prompt, setPrompt] = useState('Calculate E[X] for X ~ Poisson(λ = 4.5), rounded to 1 decimal place.');
  const [expected, setExpected] = useState('4.5');
  const build = (preview: boolean): CreatePaperInput => ({
    kind: 'short_answer', title: 'Poisson Expected Value', moduleCode: 'MA2010', moduleName: 'Probability & Statistics', kindLabel: 'Short Answer',
    marks: 10, durationMin: 20, chips: ['Auto-graded'],
    questions: [{
      id: 'q1', kind: 'short_answer', prompt, marks: 3, topic: 'Discrete Distributions',
      formula: 'P(X = k) = (λ^k · e^(-λ)) / k!',
      remember: 'E[X] = λ and Var(X) = λ.',
      key: { text: expected, tolerance: 0.05 },
    }],
    publish: !preview,
  });
  return (
    <Shell onDraft={() => onSave(build(true), true)} onPublish={() => onSave(build(false), false)}>
      <Field label="Prompt" value={prompt} onChangeText={setPrompt} multiline />
      <Field label="Expected answer" value={expected} onChangeText={setExpected} />
    </Shell>
  );
}

function FillForm({ onSave }: { onSave: (input: CreatePaperInput, preview: boolean) => void }) {
  const [sentence, setSentence] = useState('The [TCP] protocol provides reliable transfer, while [UDP] is connectionless.');
  const build = (preview: boolean): CreatePaperInput => {
    const blanks = [...sentence.matchAll(/\[(.+?)\]/g)].map((match) => match[1]);
    const segments: WorkQuestion['segments'] = [];
    let rest = sentence;
    blanks.forEach((blank, index) => {
      const token = `[${blank}]`;
      const at = rest.indexOf(token);
      segments.push({ text: rest.slice(0, at) });
      segments.push({ blankId: `b${index + 1}` });
      rest = rest.slice(at + token.length);
    });
    if (rest) segments.push({ text: rest });
    const keyBlanks = Object.fromEntries(blanks.map((blank, index) => [`b${index + 1}`, [blank]]));
    return {
      kind: 'fill_blank', title: 'Protocol Fill-in-the-Blanks', moduleCode: 'CS2020', moduleName: 'Computer Networks', kindLabel: 'Fill in the Blanks',
      marks: 10, durationMin: 15, chips: ['Word bank'],
      questions: [{
        id: 'q1', kind: 'fill_blank', prompt: 'Complete the statement.', marks: blanks.length * 2 || 2,
        segments, bank: [...blanks, 'ICMP', 'ARP'], key: { blanks: keyBlanks },
      }],
      publish: !preview,
    };
  };
  return (
    <Shell onDraft={() => onSave(build(true), true)} onPublish={() => onSave(build(false), false)}>
      <Text style={styles.tip}>Wrap each blank in brackets, like [TCP].</Text>
      <Field label="Sentence" value={sentence} onChangeText={setSentence} multiline />
    </Shell>
  );
}

function MatchForm({ onSave }: { onSave: (input: CreatePaperInput, preview: boolean) => void }) {
  const [left, setLeft] = useState('Microservices Architecture');
  const [right, setRight] = useState('High deployment autonomy, network latency overhead');
  const build = (preview: boolean): CreatePaperInput => ({
    kind: 'matching', title: 'Architecture Matching', moduleCode: 'SE3010', moduleName: 'Software Architecture', kindLabel: 'Matching Pairs',
    marks: 15, durationMin: 20, chips: ['Pairs'],
    questions: [{
      id: 'q1', kind: 'matching', prompt: 'Match each pattern with its trade-off.', marks: 15,
      left: [{ id: 'l1', title: left, meta: 'Prompt' }],
      right: [{ id: 'r1', title: right, meta: 'Match' }],
      key: { matches: { l1: 'r1' } },
    }],
    publish: !preview,
  });
  return (
    <Shell onDraft={() => onSave(build(true), true)} onPublish={() => onSave(build(false), false)}>
      <Field label="Prompt card" value={left} onChangeText={setLeft} />
      <Field label="Match card" value={right} onChangeText={setRight} />
    </Shell>
  );
}

function OrderForm({ onSave }: { onSave: (input: CreatePaperInput, preview: boolean) => void }) {
  const [steps, setSteps] = useState('Client redirect\nUser consent\nAuthorization code\nToken POST\nAccess token');
  const build = (preview: boolean): CreatePaperInput => {
    const lines = steps.split('\n').map((line) => line.trim()).filter(Boolean);
    return {
      kind: 'ordering', title: 'OAuth Ordering', moduleCode: 'SE2010', moduleName: 'Software Architecture', kindLabel: 'Ordering',
      marks: 10, durationMin: 15, chips: ['Sequence'],
      questions: [{
        id: 'q1', kind: 'ordering', prompt: 'Order these steps from first to last.', marks: 10,
        steps: lines.map((body, index) => ({ id: `s${index + 1}`, title: `Step ${index + 1}`, body })),
        key: { order: lines.map((_, index) => `s${index + 1}`) },
      }],
      publish: !preview,
    };
  };
  return (
    <Shell onDraft={() => onSave(build(true), true)} onPublish={() => onSave(build(false), false)}>
      <Field label="Steps, one per line, already in the correct order" value={steps} onChangeText={setSteps} multiline />
    </Shell>
  );
}

function DragForm({ onSave }: { onSave: (input: CreatePaperInput, preview: boolean) => void }) {
  const [prompt, setPrompt] = useState('Drag each data structure into its worst-case search complexity bucket.');
  const build = (preview: boolean): CreatePaperInput => ({
    kind: 'drag_drop', title: 'Complexity Drag & Drop', moduleCode: 'CS2040', moduleName: 'Data Structures', kindLabel: 'Drag & Drop',
    marks: 10, durationMin: 15, chips: ['Buckets'],
    questions: [{
      id: 'q1', kind: 'drag_drop', prompt, marks: 10,
      buckets: [
        { id: 'a', title: 'O(1)', subtitle: 'Constant' },
        { id: 'b', title: 'O(log n)', subtitle: 'Logarithmic' },
        { id: 'c', title: 'O(n)', subtitle: 'Linear' },
      ],
      tokens: [
        { id: 'hash', label: 'Hash Map' },
        { id: 'avl', label: 'AVL Tree' },
        { id: 'list', label: 'Singly Linked List' },
      ],
      key: { placements: { hash: 'a', avl: 'b', list: 'c' } },
    }],
    publish: !preview,
  });
  return (
    <Shell onDraft={() => onSave(build(true), true)} onPublish={() => onSave(build(false), false)}>
      <Field label="Student instructions" value={prompt} onChangeText={setPrompt} multiline />
      <Text style={styles.tip}>Buckets: O(1), O(log n), O(n). Tokens: Hash Map, AVL Tree, Singly Linked List.</Text>
    </Shell>
  );
}

function EssayForm({ onSave }: { onSave: (input: CreatePaperInput, preview: boolean) => void }) {
  const [title, setTitle] = useState('Architectural trade-offs in microservice teams');
  const [prompt, setPrompt] = useState('Compare architectural trade-offs, team cognitive load, operational complexity, and infrastructure cost.');
  const build = (preview: boolean): CreatePaperInput => ({
    kind: 'essay', title, moduleCode: 'SE1020', moduleName: 'OOP & Software Ethics', kindLabel: 'Essay & Rubric',
    marks: 25, durationMin: 60, chips: ['Rubric', 'LIC review'],
    questions: [{
      id: 'q1', kind: 'essay', prompt, marks: 25, manual: true, minWords: 120, maxWords: 1200,
      tags: ['#Tradeoffs', '#Microservices'],
      rubric: [
        { title: 'Architectural depth', detail: 'Technical reasoning versus a surface list.', points: '10' },
        { title: 'Real-world justification', detail: 'Named systems and constraints.', points: '7.5' },
        { title: 'Structure and citations', detail: 'Clear argument and sources.', points: '7.5' },
      ],
    }],
    publish: !preview,
  });
  return (
    <Shell onDraft={() => onSave(build(true), true)} onPublish={() => onSave(build(false), false)}>
      <Field label="Essay title" value={title} onChangeText={setTitle} />
      <Field label="Instructions" value={prompt} onChangeText={setPrompt} multiline />
      <Text style={styles.tip}>Turnitin threshold stays under 15%. Peer review is anonymized inside the cohort.</Text>
    </Shell>
  );
}

function CodingForm({ onSave }: { onSave: (input: CreatePaperInput, preview: boolean) => void }) {
  const [title, setTitle] = useState('isValidBST');
  const [statement, setStatement] = useState('Implement isValidBST(root) and return True when the tree satisfies the BST invariant.');
  const [code, setCode] = useState('def isValidBST(root):\n    # Write your solution here\n    pass');
  const build = (preview: boolean): CreatePaperInput => ({
    kind: 'coding', title, moduleCode: 'CS2040', moduleName: 'Data Structures', kindLabel: 'Coding Challenge',
    marks: 20, durationMin: 40, chips: ['Python 3.11', '20 Marks'],
    questions: [{
      id: 'q1', kind: 'coding', prompt: statement, marks: 20, topic: 'Programming',
      languages: ['Python 3.11'], filename: 'solution.py', starterCode: code,
      tests: [{ name: 'Public [2,1,3]', detail: 'True' }, { name: 'Hidden [5,1,4,null,null,3,6]', detail: 'False' }],
      constraints: ['Time limit 2.0s'],
      key: { includes: ['def isValidBST', 'return'] },
    }],
    publish: !preview,
  });
  return (
    <Shell onDraft={() => onSave(build(true), true)} onPublish={() => onSave(build(false), false)}>
      <Field label="Problem title" value={title} onChangeText={setTitle} />
      <Field label="Problem statement" value={statement} onChangeText={setStatement} multiline />
      <Field label="Starter code" value={code} onChangeText={setCode} multiline />
      <Text style={styles.tip}>Hidden tests stay on the answer key. Students see the public case only.</Text>
    </Shell>
  );
}

function FileForm({ onSave }: { onSave: (input: CreatePaperInput, preview: boolean) => void }) {
  const [title, setTitle] = useState('Capstone & Lab Deliverable');
  const [instructions, setInstructions] = useState('Upload the repository zip, benchmark PDF, and README with profiling results.');
  const build = (preview: boolean): CreatePaperInput => ({
    kind: 'file_project', title, moduleCode: 'CS2040', moduleName: 'Data Structures & Algorithms', kindLabel: 'File / Project',
    marks: 25, durationMin: 0, chips: ['ZIP', 'PDF', 'GitHub'], dueLabel: '28 October 2026, 11:59 PM',
    detail: 'Late policy: 10% per day, closed after 72 hours.',
    questions: [{
      id: 'q1', kind: 'file_project', prompt: instructions, marks: 25, manual: true, maxMb: 50,
      accept: '.zip, .pdf, .tar.gz · max 50 MB · up to 3 files',
      checklist: [
        { label: 'Source archive', done: false },
        { label: 'Benchmark PDF', done: false },
        { label: 'README profiling notes', done: false },
      ],
    }],
    publish: !preview,
  });
  return (
    <Shell onDraft={() => onSave(build(true), true)} onPublish={() => onSave(build(false), false)}>
      <Field label="Project title" value={title} onChangeText={setTitle} />
      <Field label="Student instructions" value={instructions} onChangeText={setInstructions} multiline />
      <Text style={styles.tip}>Coursework weight 15%. Group size 2–3. Optional grader image kuppiya/grader-cpp20.</Text>
    </Shell>
  );
}

function ScenarioForm({ onSave }: { onSave: (input: CreatePaperInput, preview: boolean) => void }) {
  const [title, setTitle] = useState('Flash-sale deadlock case');
  const [body, setBody] = useState('Midnight traffic deadlocks inventory_sku and checkout latency jumps past 4 seconds.');
  const build = (preview: boolean): CreatePaperInput => ({
    kind: 'scenario', title, moduleCode: 'SE3020', moduleName: 'Distributed Systems', kindLabel: 'Scenario Case Study',
    marks: 20, durationMin: 35, chips: ['Case study'],
    questions: [{
      id: 'q1', kind: 'scenario', prompt: 'Pick the mitigation that keeps ACID inventory allocation.', marks: 4.5,
      scenarioTitle: title, scenarioBody: body, incident: 'Sev-1 write contention',
      choices: [
        { id: 'a', label: 'Redis OCC and async queue', detail: 'Lua script keeps the stock check atomic.' },
        { id: 'b', label: 'Vertical RDS scale', detail: 'Lock manager contention remains.' },
        { id: 'c', label: 'Eventual NoSQL', detail: 'Can oversell.' },
        { id: 'd', label: 'Client backoff only', detail: 'Retry storm.' },
      ],
      key: { choiceIds: ['a'] },
    }],
    publish: !preview,
  });
  return (
    <Shell onDraft={() => onSave(build(true), true)} onPublish={() => onSave(build(false), false)}>
      <Field label="Case title" value={title} onChangeText={setTitle} />
      <Field label="Incident brief" value={body} onChangeText={setBody} multiline />
      <Text style={styles.tip}>Proposal A is the answer key. Students still write a justification note.</Text>
    </Shell>
  );
}

function Field({ label, value, onChangeText, multiline }: { label: string; value: string; onChangeText: (value: string) => void; multiline?: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} multiline={multiline} style={[styles.input, multiline && styles.multiline]} placeholderTextColor={muted} />
    </View>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <View style={styles.toggle}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: orange, false: line }} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 28 },
  flex: { flex: 1 },
  kicker: { color: blue, fontWeight: '800' },
  title: { color: ink, fontSize: 26, fontWeight: '800', marginTop: 4 },
  sub: { color: muted, marginBottom: 12 },
  field: { marginBottom: 10 },
  label: { color: navy, fontWeight: '800', marginBottom: 6 },
  input: { backgroundColor: card, borderWidth: 1, borderColor: line, borderRadius: 14, padding: 12, color: ink },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: line, borderRadius: 14, padding: 8, marginBottom: 8, backgroundColor: card },
  choiceOn: { borderColor: orange, backgroundColor: soft },
  letter: { width: 28, textAlign: 'center', color: navy, fontWeight: '800' },
  choiceInput: { flex: 1, color: ink },
  tip: { color: blue, marginBottom: 10, lineHeight: 18 },
  toggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  toggleLabel: { color: ink, fontWeight: '700', flex: 1 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  ghost: { borderWidth: 1, borderColor: navy, borderRadius: 14, paddingHorizontal: 14, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  ghostText: { color: navy, fontWeight: '800' },
});

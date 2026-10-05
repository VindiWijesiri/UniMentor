import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { WorkAnswer, WorkQuestion } from '../../../domain/entities/AssessmentWork';
import { blue, card, danger, good, ink, line, muted, navy, orange, page, soft } from './theme';

type Props = {
  question: WorkQuestion;
  answer: WorkAnswer;
  onChange: (next: WorkAnswer) => void;
};

function words(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

export default function QuestionBody({ question, answer, onChange }: Props) {
  if (question.kind === 'mcq' || question.kind === 'scenario') return <ChoiceQuestion question={question} answer={answer} onChange={onChange} />;
  if (question.kind === 'true_false') return <TrueFalse question={question} answer={answer} onChange={onChange} />;
  if (question.kind === 'short_answer') return <ShortAnswer question={question} answer={answer} onChange={onChange} />;
  if (question.kind === 'fill_blank') return <FillBlank question={question} answer={answer} onChange={onChange} />;
  if (question.kind === 'matching') return <Matching question={question} answer={answer} onChange={onChange} />;
  if (question.kind === 'ordering') return <Ordering question={question} answer={answer} onChange={onChange} />;
  if (question.kind === 'drag_drop') return <DragDrop question={question} answer={answer} onChange={onChange} />;
  if (question.kind === 'essay') return <Essay question={question} answer={answer} onChange={onChange} />;
  if (question.kind === 'coding') return <Coding question={question} answer={answer} onChange={onChange} />;
  return <FileProject question={question} answer={answer} onChange={onChange} />;
}

function ChoiceQuestion({ question, answer, onChange }: Props) {
  const selected = answer.choiceIds ?? [];
  const pick = (id: string) => {
    if (question.multi) {
      const next = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
      onChange({ ...answer, choiceIds: next });
      return;
    }
    onChange({ ...answer, choiceIds: [id] });
  };
  return (
    <View>
      {question.kind === 'scenario' ? <ScenarioBrief question={question} /> : null}
      <View style={styles.metaRow}>
        {question.topic ? <View style={styles.topic}><MaterialIcons name="account-tree" size={14} color={blue} /><Text style={styles.topicText}>{question.topic}</Text></View> : null}
        <View style={styles.marks}><Text style={styles.marksText}>+{question.marks} Marks</Text></View>
      </View>
      <Text style={styles.prompt}>{question.prompt}</Text>
      {question.codeSnippet ? (
        <View style={styles.code}>
          <View style={styles.codeHead}>
            <Text style={styles.codeFile}>{question.codeSnippet.filename}</Text>
            <Text style={styles.codeBadge}>Standard Library</Text>
          </View>
          {question.codeSnippet.lines.map((line, index) => (
            <Text key={line} style={styles.codeLine}><Text style={styles.lineNo}>{index + 1}  </Text>{line}</Text>
          ))}
        </View>
      ) : null}
      <Text style={styles.choose}>{question.kind === 'scenario' ? 'Architectural proposals' : 'Choose one best answer'}</Text>
      {(question.choices ?? []).map((choice, index) => {
        const on = selected.includes(choice.id);
        return (
          <TouchableOpacity key={choice.id} style={[styles.option, on && styles.optionOn]} onPress={() => pick(choice.id)}>
            <View style={[styles.letter, on && styles.letterOn]}><Text style={[styles.letterText, on && styles.letterTextOn]}>{String.fromCharCode(65 + index)}</Text></View>
            <View style={styles.flex}>
              <Text style={styles.optionTitle}>{choice.label}</Text>
              {choice.detail ? <Text style={styles.optionDetail}>{choice.detail}</Text> : null}
            </View>
            <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>
          </TouchableOpacity>
        );
      })}
      {question.kind === 'scenario' ? (
        <View style={styles.noteBox}>
          <Text style={styles.noteLabel}>Candidate justification</Text>
          <TextInput
            value={answer.note ?? ''}
            onChangeText={(note) => onChange({ ...answer, note })}
            placeholder="Why this proposal holds ACID at the stated load"
            placeholderTextColor={muted}
            style={styles.noteInput}
            multiline
          />
        </View>
      ) : null}
      {question.hint ? <Hint text={question.hint} /> : null}
    </View>
  );
}

function ScenarioBrief({ question }: { question: WorkQuestion }) {
  return (
    <View style={styles.scenario}>
      <Text style={styles.scenarioKicker}>Scenario active</Text>
      <Text style={styles.scenarioTitle}>{question.scenarioTitle}</Text>
      <Text style={styles.scenarioBody}>{question.scenarioBody}</Text>
      {question.incident ? <Text style={styles.incident}>{question.incident}</Text> : null}
      <View style={styles.pipeline}>
        {(question.pipeline ?? []).map((item) => (
          <View key={item.label} style={styles.pipeItem}>
            <Text style={styles.pipeValue}>{item.value}</Text>
            <Text style={styles.pipeLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
      {(question.metrics ?? []).map((item) => (
        <View key={item.label} style={styles.metric}>
          <Text style={styles.metricLabel}>{item.label}</Text>
          <Text style={styles.metricValue}>{item.value}</Text>
          {item.note ? <Text style={styles.metricNote}>{item.note}</Text> : null}
        </View>
      ))}
      {(question.trace ?? []).length > 0 && (
        <View style={styles.trace}>
          <Text style={styles.traceTitle}>Distributed trace</Text>
          {question.trace?.map((line) => <Text key={line} style={styles.traceLine}>{line}</Text>)}
        </View>
      )}
      {question.objective ? <Text style={styles.objective}>{question.objective}</Text> : null}
    </View>
  );
}

function TrueFalse({ question, answer, onChange }: Props) {
  return (
    <View>
      <View style={styles.metaRow}>
        <View style={styles.topic}><Text style={styles.topicText}>{question.topic}</Text></View>
        <View style={styles.marks}><Text style={styles.marksText}>+{question.marks} Marks</Text></View>
      </View>
      <Text style={styles.kicker}>Statement to evaluate</Text>
      <Text style={styles.prompt}>“{question.statement}”</Text>
      {question.definition ? (
        <View style={styles.definition}>
          <Text style={styles.noteLabel}>Key definition</Text>
          <Text style={styles.optionDetail}>{question.definition}</Text>
        </View>
      ) : null}
      <TouchableOpacity style={[styles.tf, answer.boolean === true && styles.optionOn]} onPress={() => onChange({ ...answer, boolean: true })}>
        <MaterialIcons name="check-circle" size={22} color={answer.boolean === true ? navy : good} />
        <View style={styles.flex}>
          <Text style={styles.optionTitle}>TRUE / CORRECT</Text>
          <Text style={styles.optionDetail}>{question.trueDetail}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tf, answer.boolean === false && styles.optionOn]} onPress={() => onChange({ ...answer, boolean: false })}>
        <MaterialIcons name="cancel" size={22} color={answer.boolean === false ? navy : danger} />
        <View style={styles.flex}>
          <Text style={styles.optionTitle}>FALSE / INCORRECT</Text>
          <Text style={styles.optionDetail}>{question.falseDetail}</Text>
        </View>
      </TouchableOpacity>
      {question.hint ? <Hint text={question.hint} /> : null}
    </View>
  );
}

function ShortAnswer({ question, answer, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const text = answer.text ?? '';
  const push = (token: string) => onChange({ ...answer, text: `${text}${token}` });
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', '←'];
  return (
    <View>
      <View style={styles.metaRow}>
        <View style={styles.topic}><Text style={styles.topicText}>{question.topic}</Text></View>
        <View style={styles.marks}><Text style={styles.marksText}>+{question.marks} Marks</Text></View>
      </View>
      <Text style={styles.prompt}>{question.prompt}</Text>
      <Text style={styles.optionDetail}>{question.hint}</Text>
      <TouchableOpacity style={styles.definition} onPress={() => setOpen((value) => !value)}>
        <Text style={styles.noteLabel}>View Poisson PMF & properties</Text>
        {open ? <Text style={styles.optionDetail}>{question.formula}{'\n'}{question.remember}</Text> : null}
      </TouchableOpacity>
      <Text style={styles.choose}>Your response</Text>
      <View style={styles.answerBox}>
        <Text style={styles.answerText}>{text || '0.0'}</Text>
        <TouchableOpacity onPress={() => onChange({ ...answer, text: '' })}><Text style={styles.clear}>Clear</Text></TouchableOpacity>
      </View>
      <View style={styles.keys}>
        {keys.map((key) => (
          <TouchableOpacity key={key} style={styles.key} onPress={() => (key === '←' ? onChange({ ...answer, text: text.slice(0, -1) }) : push(key))}>
            <Text style={styles.keyText}>{key}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.goodLine}>Format valid when the answer is a single decimal.</Text>
    </View>
  );
}

function FillBlank({ question, answer, onChange }: Props) {
  const blankIds = (question.segments ?? []).flatMap((segment) => (segment.blankId ? [segment.blankId] : []));
  const [active, setActive] = useState(blankIds[0] ?? '');
  const used = new Set(Object.values(answer.blanks ?? {}));
  const place = (token: string) => {
    if (!active) return;
    onChange({ ...answer, blanks: { ...(answer.blanks ?? {}), [active]: token } });
    const next = blankIds.find((id) => id !== active && !(answer.blanks ?? {})[id]);
    if (next) setActive(next);
  };
  return (
    <View>
      <View style={styles.metaRow}>
        <View style={styles.topic}><Text style={styles.topicText}>Fill in the blanks</Text></View>
        <Text style={styles.optionDetail}>{blankIds.length} blanks</Text>
      </View>
      <Text style={styles.prompt}>{question.prompt}</Text>
      <View style={styles.sentence}>
        <Text style={styles.sentenceText}>
          {(question.segments ?? []).map((segment, index) => {
            if (!segment.blankId) return <Text key={`t-${index}`}>{segment.text}</Text>;
            const value = answer.blanks?.[segment.blankId];
            const on = active === segment.blankId;
            return (
              <Text key={segment.blankId} onPress={() => setActive(segment.blankId!)} style={[styles.blank, on && styles.blankOn, value && styles.blankFilled]}>
                {value ? ` ${value} ` : ' select '}
              </Text>
            );
          })}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.optionDetail}>Select a token for blank {blankIds.indexOf(active) + 1}</Text>
        <TouchableOpacity onPress={() => onChange({ ...answer, blanks: {} })}><Text style={styles.clear}>Clear all</Text></TouchableOpacity>
      </View>
      <Text style={styles.choose}>Word bank · {(question.bank ?? []).length} tokens</Text>
      <View style={styles.bank}>
        {(question.bank ?? []).map((token) => {
          const taken = used.has(token);
          return (
            <TouchableOpacity key={token} style={[styles.token, taken && styles.tokenUsed]} disabled={taken} onPress={() => place(token)}>
              <Text style={[styles.tokenText, taken && styles.tokenTextUsed]}>{taken ? token : `+ ${token}`}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {question.hint ? <Hint text={question.hint} /> : null}
    </View>
  );
}

function Matching({ question, answer, onChange }: Props) {
  const [leftId, setLeftId] = useState<string | null>(null);
  const matches = answer.matches ?? {};
  const usedRight = new Set(Object.values(matches));
  const link = (rightId: string) => {
    if (!leftId) return;
    onChange({ ...answer, matches: { ...matches, [leftId]: rightId } });
    setLeftId(null);
  };
  return (
    <View>
      <View style={styles.marks}><Text style={styles.marksText}>+{question.marks} Marks</Text></View>
      <Text style={styles.prompt}>{question.prompt}</Text>
      <Text style={styles.optionDetail}>{question.hint}</Text>
      <Text style={styles.choose}>Column A</Text>
      {(question.left ?? []).map((item) => (
        <TouchableOpacity key={item.id} style={[styles.option, (leftId === item.id || matches[item.id]) && styles.optionOn]} onPress={() => setLeftId(item.id)}>
          <View style={styles.flex}>
            <Text style={styles.optionTitle}>{item.title}</Text>
            <Text style={styles.optionDetail}>{matches[item.id] ? 'Linked' : item.meta}</Text>
          </View>
        </TouchableOpacity>
      ))}
      <Text style={styles.choose}>Column B</Text>
      {(question.right ?? []).map((item) => (
        <TouchableOpacity key={item.id} style={[styles.option, usedRight.has(item.id) && styles.optionOn]} onPress={() => link(item.id)}>
          <View style={styles.flex}>
            <Text style={styles.optionTitle}>{item.title}</Text>
            <Text style={styles.optionDetail}>{item.meta}</Text>
          </View>
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={() => onChange({ ...answer, matches: {} })}><Text style={styles.clear}>Reset links</Text></TouchableOpacity>
      <Text style={styles.goodLine}>{Object.keys(matches).length} of {(question.left ?? []).length} pairs connected</Text>
    </View>
  );
}

function Ordering({ question, answer, onChange }: Props) {
  const initial = useMemo(() => (question.steps ?? []).map((step) => step.id), [question.steps]);
  useEffect(() => {
    if (!answer.order?.length) onChange({ ...answer, order: initial });
    // Seed the visible order once so an untouched sequence still submits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);
  const order = answer.order?.length ? answer.order : initial;
  const byId = new Map((question.steps ?? []).map((step) => [step.id, step]));
  const move = (index: number, direction: -1 | 1) => {
    const next = [...order];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange({ ...answer, order: next });
  };
  return (
    <View>
      <View style={styles.marks}><Text style={styles.marksText}>+{question.marks} Marks</Text></View>
      <Text style={styles.prompt}>{question.prompt}</Text>
      <Text style={styles.optionDetail}>{question.hint}</Text>
      {order.map((id, index) => {
        const step = byId.get(id);
        if (!step) return null;
        return (
          <View key={id} style={styles.step}>
            <Text style={styles.stepNo}>{String(index + 1).padStart(2, '0')}</Text>
            <View style={styles.flex}>
              <Text style={styles.optionTitle}>{step.title}</Text>
              <Text style={styles.optionDetail}>{step.body}</Text>
            </View>
            <View>
              <TouchableOpacity onPress={() => move(index, -1)}><MaterialIcons name="keyboard-arrow-up" size={22} color={navy} /></TouchableOpacity>
              <TouchableOpacity onPress={() => move(index, 1)}><MaterialIcons name="keyboard-arrow-down" size={22} color={navy} /></TouchableOpacity>
            </View>
          </View>
        );
      })}
      <TouchableOpacity onPress={() => onChange({ ...answer, order: initial })}><Text style={styles.clear}>Revert to initial order</Text></TouchableOpacity>
    </View>
  );
}

function DragDrop({ question, answer, onChange }: Props) {
  const [tokenId, setTokenId] = useState<string | null>(null);
  const placements = answer.placements ?? {};
  const place = (bucketId: string) => {
    if (!tokenId) return;
    onChange({ ...answer, placements: { ...placements, [tokenId]: bucketId } });
    setTokenId(null);
  };
  const pooled = (question.tokens ?? []).filter((token) => !placements[token.id]);
  return (
    <View>
      <View style={styles.marks}><Text style={styles.marksText}>+{question.marks} Marks</Text></View>
      <Text style={styles.prompt}>{question.prompt}</Text>
      <Text style={styles.optionDetail}>{question.hint}</Text>
      {(question.buckets ?? []).map((bucket) => {
        const inside = (question.tokens ?? []).filter((token) => placements[token.id] === bucket.id);
        return (
          <TouchableOpacity key={bucket.id} style={styles.bucket} onPress={() => place(bucket.id)}>
            <Text style={styles.optionTitle}>{bucket.title}</Text>
            <Text style={styles.optionDetail}>{bucket.subtitle} · {inside.length} placed</Text>
            {inside.map((token) => (
              <TouchableOpacity key={token.id} onPress={() => {
                const next = { ...placements };
                delete next[token.id];
                onChange({ ...answer, placements: next });
              }}>
                <Text style={styles.placed}>{token.label}  ×</Text>
              </TouchableOpacity>
            ))}
            {inside.length === 0 ? <Text style={styles.dropHint}>Tap a token, then tap here</Text> : null}
          </TouchableOpacity>
        );
      })}
      <Text style={styles.choose}>Available tokens · {pooled.length}</Text>
      <View style={styles.bank}>
        {pooled.map((token) => (
          <TouchableOpacity key={token.id} style={[styles.token, tokenId === token.id && styles.tokenOn]} onPress={() => setTokenId(token.id)}>
            <Text style={styles.tokenText}>{token.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function Essay({ question, answer, onChange }: Props) {
  const text = answer.text ?? question.starter ?? '';
  useEffect(() => {
    if (answer.text === undefined && question.starter) onChange({ ...answer, text: question.starter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);
  const count = words(text);
  const min = question.minWords ?? 120;
  const ready = count >= min;
  return (
    <View>
      <View style={styles.bank}>
        {(question.tags ?? []).map((tag) => <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>)}
      </View>
      <Text style={styles.prompt}>{question.prompt}</Text>
      {(question.rubric ?? []).map((item) => (
        <View key={item.title} style={styles.rubric}>
          <View style={styles.flex}>
            <Text style={styles.optionTitle}>{item.title}</Text>
            <Text style={styles.optionDetail}>{item.detail}</Text>
          </View>
          <Text style={styles.marksText}>{item.points}</Text>
        </View>
      ))}
      <View style={styles.metaRow}>
        <Text style={styles.optionTitle}>{count} words</Text>
        <Text style={styles.optionDetail}>Target {min}–{question.maxWords ?? 750}</Text>
      </View>
      <View style={styles.track}><View style={[styles.trackFill, { width: `${Math.min(100, Math.round((count / min) * 100))}%` }]} /></View>
      <TextInput
        value={text}
        onChangeText={(value) => onChange({ ...answer, text: value })}
        multiline
        style={styles.essay}
      />
      <Text style={ready ? styles.goodLine : styles.warnLine}>{ready ? 'Word count is inside the rubric range.' : `Add ${min - count} more words to meet the lower bound.`}</Text>
    </View>
  );
}

function Coding({ question, answer, onChange }: Props) {
  const [language, setLanguage] = useState(question.languages?.[0] ?? 'Python 3.11');
  const [report, setReport] = useState<{ name: string; passed: boolean }[] | null>(null);
  useEffect(() => {
    if (answer.text === undefined && question.starterCode) onChange({ ...answer, text: question.starterCode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);
  const code = answer.text ?? question.starterCode ?? '';
  const run = () => {
    const passed = /\breturn\b/.test(code) && code.length > 30;
    setReport((question.tests ?? []).map((test) => ({ name: test.name, passed })));
  };
  return (
    <View>
      <View style={styles.metaRow}>
        <View style={styles.topic}><Text style={styles.topicText}>{question.topic}</Text></View>
        <View style={styles.marks}><Text style={styles.marksText}>+{question.marks} Marks</Text></View>
      </View>
      <Text style={styles.prompt}>{question.prompt}</Text>
      <Text style={styles.optionDetail}>{question.hint}</Text>
      <View style={styles.bank}>
        {(question.constraints ?? []).map((item) => <View key={item} style={styles.tag}><Text style={styles.tagText}>{item}</Text></View>)}
      </View>
      <View style={styles.bank}>
        {(question.languages ?? []).map((item) => (
          <TouchableOpacity key={item} style={[styles.lang, language === item && styles.langOn]} onPress={() => setLanguage(item)}>
            <Text style={[styles.langText, language === item && styles.langTextOn]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.choose}>{question.filename}</Text>
      <TextInput value={code} onChangeText={(text) => onChange({ ...answer, text })} multiline style={styles.editor} autoCapitalize="none" autoCorrect={false} />
      <TouchableOpacity style={styles.run} onPress={run}>
        <MaterialIcons name="play-arrow" size={18} color={navy} />
        <Text style={styles.runText}>Run tests</Text>
      </TouchableOpacity>
      {report ? report.map((item) => (
        <Text key={item.name} style={item.passed ? styles.goodLine : styles.warnLine}>{item.passed ? 'Passed' : 'Failed'} · {item.name}</Text>
      )) : null}
    </View>
  );
}

function FileProject({ question, answer, onChange }: Props) {
  const files = answer.files ?? [];
  const used = files.reduce((sum, file) => sum + file.sizeMb, 0);
  const add = () => {
    const name = files.length % 2 === 0 ? `order-service-v${files.length + 1}.zip` : `architecture-note-v${files.length + 1}.pdf`;
    onChange({ ...answer, files: [...files, { name, sizeMb: files.length % 2 === 0 ? 12.4 : 2.2 }] });
  };
  return (
    <View>
      <View style={styles.marks}><Text style={styles.marksText}>+{question.marks} Marks</Text></View>
      <Text style={styles.kicker}>{question.topic}</Text>
      <Text style={styles.prompt}>{question.prompt}</Text>
      {(question.checklist ?? []).map((item) => (
        <Text key={item.label} style={styles.check}>{item.done ? '✓' : '○'}  {item.label}</Text>
      ))}
      <TouchableOpacity style={styles.drop} onPress={add}>
        <MaterialIcons name="cloud-upload" size={28} color={blue} />
        <Text style={styles.optionTitle}>Browse device files</Text>
        <Text style={styles.optionDetail}>{question.accept}</Text>
      </TouchableOpacity>
      <Text style={styles.optionDetail}>{used.toFixed(1)} MB of {question.maxMb ?? 50} MB used</Text>
      {files.map((file) => (
        <View key={file.name} style={styles.fileRow}>
          <View style={styles.flex}>
            <Text style={styles.optionTitle}>{file.name}</Text>
            <Text style={styles.optionDetail}>{file.sizeMb} MB · attached</Text>
          </View>
          <TouchableOpacity onPress={() => onChange({ ...answer, files: files.filter((item) => item.name !== file.name) })}>
            <MaterialIcons name="close" size={18} color={danger} />
          </TouchableOpacity>
        </View>
      ))}
      <Text style={styles.choose}>GitHub repository</Text>
      <TextInput
        value={answer.repoUrl ?? ''}
        onChangeText={(repoUrl) => onChange({ ...answer, repoUrl })}
        placeholder="github.com/you/repo · branch · commit"
        placeholderTextColor={muted}
        style={styles.repo}
        autoCapitalize="none"
      />
    </View>
  );
}

function Hint({ text }: { text: string }) {
  return (
    <View style={styles.hint}>
      <MaterialIcons name="lightbulb" size={16} color={orange} />
      <Text style={styles.hintText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 },
  topic: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EEF3FB', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  topicText: { color: blue, fontWeight: '700', fontSize: 12 },
  marks: { backgroundColor: soft, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  marksText: { color: navy, fontWeight: '800', fontSize: 12 },
  prompt: { color: ink, fontSize: 18, fontWeight: '800', lineHeight: 26, marginVertical: 8 },
  kicker: { color: muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  choose: { color: ink, fontWeight: '800', marginTop: 12, marginBottom: 8 },
  option: { flexDirection: 'row', gap: 10, backgroundColor: card, borderWidth: 1, borderColor: line, borderRadius: 16, padding: 12, marginBottom: 8, alignItems: 'center' },
  optionOn: { backgroundColor: soft, borderColor: orange },
  letter: { width: 28, height: 28, borderRadius: 14, backgroundColor: page, alignItems: 'center', justifyContent: 'center' },
  letterOn: { backgroundColor: orange },
  letterText: { color: navy, fontWeight: '800' },
  letterTextOn: { color: navy },
  optionTitle: { color: ink, fontWeight: '800', fontSize: 14 },
  optionDetail: { color: muted, fontSize: 12, marginTop: 2, lineHeight: 17 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#C5CEDD', alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: orange },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: orange },
  code: { backgroundColor: navy, borderRadius: 16, padding: 12, marginTop: 8 },
  codeHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  codeFile: { color: '#D6E2FF', fontSize: 12, fontWeight: '700' },
  codeBadge: { color: orange, fontSize: 11, fontWeight: '800' },
  codeLine: { color: '#F4F7FF', fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
  lineNo: { color: '#8EA0C8' },
  hint: { flexDirection: 'row', gap: 8, backgroundColor: '#F3F6FB', borderRadius: 14, padding: 12, marginTop: 8 },
  hintText: { color: blue, flex: 1, fontSize: 12, lineHeight: 18 },
  tf: { flexDirection: 'row', gap: 10, backgroundColor: card, borderWidth: 1, borderColor: line, borderRadius: 16, padding: 14, marginTop: 10 },
  definition: { backgroundColor: '#F3F6FB', borderRadius: 14, padding: 12, marginTop: 8 },
  noteLabel: { color: navy, fontWeight: '800', marginBottom: 4 },
  answerBox: { backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: line, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  answerText: { color: ink, fontSize: 28, fontWeight: '800' },
  clear: { color: blue, fontWeight: '800' },
  keys: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  key: { width: '30%', backgroundColor: card, borderRadius: 12, borderWidth: 1, borderColor: line, paddingVertical: 12, alignItems: 'center' },
  keyText: { color: navy, fontWeight: '800', fontSize: 16 },
  goodLine: { color: good, fontWeight: '700', marginTop: 8 },
  warnLine: { color: '#B45309', fontWeight: '700', marginTop: 8 },
  sentence: { backgroundColor: '#F3F6FB', borderRadius: 16, padding: 12 },
  sentenceText: { color: ink, fontSize: 15, lineHeight: 28 },
  blank: { backgroundColor: navy, color: '#fff', borderRadius: 8, overflow: 'hidden', fontWeight: '800' },
  blankOn: { backgroundColor: orange, color: navy },
  blankFilled: { backgroundColor: orange, color: navy },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  token: { backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: line, paddingHorizontal: 12, paddingVertical: 8 },
  tokenOn: { borderColor: orange, backgroundColor: soft },
  tokenUsed: { backgroundColor: '#EEF1F6' },
  tokenText: { color: navy, fontWeight: '700' },
  tokenTextUsed: { color: muted },
  step: { flexDirection: 'row', gap: 8, backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: line, padding: 12, marginBottom: 8 },
  stepNo: { color: orange, fontWeight: '800' },
  bucket: { backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: line, padding: 12, marginBottom: 8 },
  placed: { color: navy, fontWeight: '700', marginTop: 6 },
  dropHint: { color: muted, marginTop: 6 },
  tag: { backgroundColor: '#EEF3FB', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  tagText: { color: blue, fontSize: 11, fontWeight: '800' },
  rubric: { flexDirection: 'row', gap: 8, backgroundColor: card, borderRadius: 14, borderWidth: 1, borderColor: line, padding: 12, marginBottom: 8 },
  track: { height: 8, backgroundColor: '#E7EDF6', borderRadius: 8, marginVertical: 8 },
  trackFill: { height: 8, backgroundColor: orange, borderRadius: 8 },
  essay: { minHeight: 160, backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: line, padding: 12, color: ink, textAlignVertical: 'top' },
  lang: { borderRadius: 14, borderWidth: 1, borderColor: line, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: card },
  langOn: { backgroundColor: navy, borderColor: navy },
  langText: { color: navy, fontWeight: '700', fontSize: 12 },
  langTextOn: { color: '#fff' },
  editor: { minHeight: 220, backgroundColor: navy, color: '#F4F7FF', borderRadius: 16, padding: 12, fontFamily: 'monospace', fontSize: 12, textAlignVertical: 'top' },
  run: { marginTop: 10, backgroundColor: orange, borderRadius: 14, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  runText: { color: navy, fontWeight: '800' },
  check: { color: ink, marginTop: 6, fontWeight: '600' },
  drop: { marginTop: 12, borderWidth: 1, borderColor: blue, borderStyle: 'dashed', borderRadius: 16, padding: 16, alignItems: 'center', backgroundColor: '#F7FAFF' },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: card, borderRadius: 14, borderWidth: 1, borderColor: line, padding: 12, marginTop: 8 },
  repo: { backgroundColor: card, borderRadius: 14, borderWidth: 1, borderColor: line, padding: 12, color: ink },
  scenario: { backgroundColor: navy, borderRadius: 18, padding: 14, marginBottom: 8 },
  scenarioKicker: { color: orange, fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  scenarioTitle: { color: '#fff', fontWeight: '800', fontSize: 16, marginTop: 4 },
  scenarioBody: { color: '#D5E0F5', marginTop: 6, lineHeight: 20 },
  incident: { color: orange, fontWeight: '800', marginTop: 8 },
  pipeline: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  pipeItem: { backgroundColor: '#1C3E78', borderRadius: 12, padding: 8, minWidth: 70 },
  pipeValue: { color: '#fff', fontWeight: '800', fontSize: 12 },
  pipeLabel: { color: '#C9D4EA', fontSize: 10 },
  metric: { marginTop: 8 },
  metricLabel: { color: '#C9D4EA', fontSize: 11 },
  metricValue: { color: '#fff', fontWeight: '800' },
  metricNote: { color: '#F2C7A5', fontSize: 11 },
  trace: { backgroundColor: '#0C2048', borderRadius: 12, padding: 10, marginTop: 10 },
  traceTitle: { color: orange, fontWeight: '800', marginBottom: 4, fontSize: 12 },
  traceLine: { color: '#D6E2FF', fontFamily: 'monospace', fontSize: 11, lineHeight: 16 },
  objective: { color: '#fff', marginTop: 10, lineHeight: 20 },
  noteBox: { marginTop: 8 },
  noteInput: { minHeight: 70, backgroundColor: card, borderRadius: 14, borderWidth: 1, borderColor: line, padding: 10, color: ink, textAlignVertical: 'top' },
});

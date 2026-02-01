import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { useAppStore } from '../../src/store';
import { spacing, fontSize, borderRadius } from '../../src/theme/spacing';
import { Audio } from 'expo-av';
import { Project, Task, ProjectPhase } from '../../src/store/types';
import { structureVoiceText, transcribeAudio, isGroqConfigured } from '../../src/services/groq';

// --- Constants ---

const PHASES: ProjectPhase[] = ['design', 'engineering', 'build', 'launch', 'closure'];

const PHASE_LABELS: Record<ProjectPhase, string> = {
  design: 'Design',
  engineering: 'Engineering',
  build: 'Build',
  launch: 'Launch',
  closure: 'Closure',
};

const PHASE_SHORT: Record<ProjectPhase, string> = {
  design: 'Design',
  engineering: 'Engineer',
  build: 'Build',
  launch: 'Launch',
  closure: 'Closure',
};

const PHASE_COLORS: Record<ProjectPhase, string> = {
  design: '#ec4899',
  engineering: '#10b981',
  build: '#eab308',
  launch: '#22c55e',
  closure: '#14b8a6',
};

const PHASE_ABBREV: Record<ProjectPhase, string> = {
  design: 'DE',
  engineering: 'EN',
  build: 'BU',
  launch: 'LA',
  closure: 'CL',
};

const SUB_STAGES: Record<ProjectPhase, string[]> = {
  design: ['Conception', 'Discovery', 'Requirements'],
  engineering: ['Architecture', 'QA Planning', 'Review'],
  build: ['Development', 'Testing', 'Staging'],
  launch: ['Beta', 'Release', 'Marketing'],
  closure: ['Retrospective', 'Documentation', 'Archive'],
};

const PRIORITY_COLORS: Record<string, string> = {
  P0: '#ef4444',
  P1: '#f97316',
  P2: '#eab308',
  P3: '#6b7280',
};

const STATUS_COLORS: Record<string, string> = {
  'todo': '#6b7280',
  'in-progress': '#3B82F6',
  'review': '#A78BFA',
  'completed': '#10b981',
  'blocked': '#ef4444',
};

// --- Helpers ---

function getPhaseIndex(phase: ProjectPhase): number {
  return PHASES.indexOf(phase);
}

/** Map project.stage string → sub-stage index within the current phase */
function getSubStageIndex(stage: string): number {
  const map: Record<string, number> = {
    // Design
    conception: 0, design: 0, discovery: 1, requirements: 2,
    // Engineering
    architecture: 0, engineering: 0, 'qa-planning': 1, 'qa_planning': 1, review: 2,
    // Build
    development: 0, build: 0, testing: 1, staging: 2,
    // Launch
    beta: 0, launch: 0, release: 1, ship: 1, marketing: 2, announce: 2,
    // Closure
    retrospective: 0, closure: 0, documentation: 1, archive: 2,
  };
  return map[stage.toLowerCase()] ?? 0;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDaysActive(dateString: string | null): number {
  if (!dateString) return 0;
  const start = new Date(dateString);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

/** Detect "start over" / "delete this" intent at the start of a transcription */
const RESET_PATTERNS = [
  /^(hey\s+)?(please\s+)?(delete|clear|remove)\s+(everything|all|whatever|what'?s?\s*(here|present|there))\s*/i,
  /^(hey\s+)?(please\s+)?(let'?s?\s+)?start\s+(over|from\s+(the\s+)?(first|scratch|beginning|start)|fresh|again)\s*/i,
  /^(hey\s+)?(please\s+)?replace\s+(everything|all|this)\s*/i,
  /^(hey\s+)?(please\s+)?never\s*mind\s*/i,
  /^(hey\s+)?(please\s+)?scratch\s+that\s*/i,
];

function detectResetIntent(text: string): { replace: boolean; cleanText: string } {
  for (const pattern of RESET_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      // Strip the command, keep any remaining content
      const remaining = text.slice(match[0].length).trim();
      return { replace: true, cleanText: remaining };
    }
  }
  return { replace: false, cleanText: text };
}

// --- Component ---

export default function ProjectDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, taskId } = useLocalSearchParams<{ id: string; taskId?: string }>();

  const project = useAppStore((s) => s.projects).find((p) => p.id === id);
  const projectTasks = useAppStore((s) => s.tasks).filter((t) => t.projectId === id);
  const inboxItems = useAppStore((s) => s.inbox);
  const addInboxItem = useAppStore((s) => s.addInboxItem);

  const [expandedTask, setExpandedTask] = useState<string | null>(taskId ?? null);
  const [voiceText, setVoiceText] = useState('');
  const [voiceProcessing, setVoiceProcessing] = useState(false);

  // Inline voice recording
  const inlineRecRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const completedCount = useMemo(
    () => projectTasks.filter((t) => t.status === 'completed').length,
    [projectTasks]
  );

  const progressPercent = useMemo(() => {
    if (projectTasks.length === 0) return project?.progress ?? 0;
    return Math.round((completedCount / projectTasks.length) * 100);
  }, [projectTasks, completedCount, project]);

  const daysActive = useMemo(
    () => (project ? getDaysActive(project.startedAt) : 0),
    [project]
  );

  const currentPhaseIndex = useMemo(
    () => (project ? getPhaseIndex(project.currentPhase) : 0),
    [project]
  );

  const activeSubIndex = useMemo(
    () => (project ? getSubStageIndex(project.stage) : 0),
    [project]
  );

  /** Get inbox items linked to a specific task */
  const getTaskReplies = useCallback(
    (taskId: string) => inboxItems.filter((item) => item.taskRef === taskId),
    [inboxItems]
  );

  const toggleTask = useCallback((tid: string) => {
    setExpandedTask((prev) => (prev === tid ? null : tid));
  }, []);

  const handleVoiceSubmit = useCallback(async (task: Task) => {
    if (!voiceText.trim() || !project) return;
    setVoiceProcessing(true);
    try {
      const context = `Project: ${project.name} | Task: ${task.title} | Phase: ${PHASE_LABELS[project.currentPhase]}`;
      const structured = await structureVoiceText(voiceText.trim(), context);
      addInboxItem({
        id: `inbox-${Date.now()}`,
        text: structured.title + (structured.description ? `\n${structured.description}` : ''),
        type: 'task',
        project: project.id,
        priority: structured.priority,
        status: 'pending',
        createdAt: new Date().toISOString(),
        forClaude: false,
        read: true,
        author: 'user',
        parentId: null,
        replies: [],
        taskRef: task.id,
        taskTitle: task.title,
      });
      setVoiceText('');
    } catch {
      // Fallback: save raw text
      addInboxItem({
        id: `inbox-${Date.now()}`,
        text: voiceText.trim(),
        type: 'note',
        project: project?.id ?? null,
        priority: null,
        status: 'pending',
        createdAt: new Date().toISOString(),
        forClaude: false,
        read: true,
        author: 'user',
        parentId: null,
        replies: [],
        taskRef: task.id,
        taskTitle: task.title,
      });
      setVoiceText('');
    } finally {
      setVoiceProcessing(false);
    }
  }, [voiceText, project, addInboxItem]);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (inlineRecRef.current) {
        inlineRecRef.current.stopAndUnloadAsync().catch(() => {});
        inlineRecRef.current = null;
      }
    };
  }, []);

  const handleInlineRecord = useCallback(async () => {
    // If already recording, stop and transcribe
    if (isRecording && inlineRecRef.current) {
      // Grab ref and null immediately to prevent double-tap
      const recording = inlineRecRef.current;
      inlineRecRef.current = null;
      setIsRecording(false);
      setIsTranscribing(true);
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

        if (!uri) throw new Error('No audio file');
        const text = await transcribeAudio(uri);
        // Smart append: if text starts with reset intent, replace; otherwise append
        const result = detectResetIntent(text);
        if (result.replace || !voiceText.trim()) {
          setVoiceText(result.cleanText);
        } else {
          setVoiceText((prev) => (prev.trim() + ' ' + result.cleanText).trim());
        }
      } catch {
        // Transcription failed — user can type manually
      } finally {
        setIsTranscribing(false);
      }
      return;
    }

    // Start recording
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      const configured = await isGroqConfigured();
      if (!configured) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      inlineRecRef.current = recording;
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  }, [isRecording, voiceText]);

  const styles = makeStyles(colors, insets);

  // --- Empty state ---
  if (!project) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText}>Project</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>Project not found</Text>
        </View>
      </View>
    );
  }

  // Sort tasks: completed last, then by priority
  const sortedTasks = [...projectTasks].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return -1;
    if (a.status !== 'completed' && b.status === 'completed') return 1;
    const priorityOrder = ['P0', 'P1', 'P2', 'P3'];
    return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
  });

  return (
    <View style={styles.container}>
      {/* ====== HEADER BAR ====== */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitleText}>Project Details</Text>
          <Text style={styles.headerSubtitle}>
            Started {formatDate(project.startedAt)}
            {project.startedAt ? (
              <Text style={styles.headerDays}> · {daysActive} days</Text>
            ) : null}
          </Text>
        </View>
        {/* Completion Ring — SVG circular progress */}
        {(() => {
          const size = 44;
          const strokeWidth = 3.5;
          const radius = (size - strokeWidth) / 2;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (progressPercent / 100) * circumference;
          return (
            <View style={styles.completionRingContainer}>
              <Svg width={size} height={size}>
                {/* Background track */}
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={colors.border}
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                {/* Progress arc */}
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#10b981"
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${size / 2}, ${size / 2}`}
                />
              </Svg>
              <Text style={styles.completionText}>{progressPercent}%</Text>
            </View>
          );
        })()}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ====== PROJECT TITLE + BADGES ====== */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: '#10b98120' }]}>
            <Text style={[styles.badgeText, { color: '#10b981' }]}>
              {PHASE_LABELS[project.currentPhase]}
            </Text>
          </View>
          {project.techStack.length > 0 && (
            <View style={[styles.techHeaderBadge]}>
              <Text style={[styles.techHeaderBadgeText]}>
                {project.techStack[0]}
              </Text>
            </View>
          )}
          {project.githubUrl && (
            <>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                style={styles.githubBadge}
                onPress={() => Linking.openURL(project.githubUrl!)}
                activeOpacity={0.7}
              >
                <Ionicons name="logo-github" size={14} color="#10b981" />
                <Text style={styles.githubBadgeText}>GitHub</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <Text style={styles.projectTitle}>{project.name}</Text>
        <Text style={styles.projectDesc}>{project.description}</Text>

        {/* ====== 5-STAGE WORKFLOW ====== */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Workflow</Text>
          <View style={styles.workflowCard}>
            {/* Stage Icons Row */}
            <View style={styles.stageRow}>
              {PHASES.map((phase, i) => {
                const isDone = i < currentPhaseIndex;
                const isCurrent = i === currentPhaseIndex;
                const isPending = i > currentPhaseIndex;

                return (
                  <View key={phase} style={styles.stageItem}>
                    {/* Connector line (before this stage) */}
                    {i > 0 && (
                      <View
                        style={[
                          styles.stageConnector,
                          { backgroundColor: isDone || isCurrent ? '#10b981' : colors.textMuted + '40' },
                        ]}
                      />
                    )}
                    {/* Stage circle */}
                    <View
                      style={[
                        styles.stageCircle,
                        isDone && styles.stageCircleDone,
                        isCurrent && styles.stageCircleCurrent,
                        isPending && styles.stageCirclePending,
                      ]}
                    >
                      {isDone ? (
                        <Ionicons name="checkmark" size={14} color="#ffffff" />
                      ) : isCurrent ? (
                        <View style={styles.currentDot} />
                      ) : (
                        <Text style={styles.pendingNumber}>{i + 1}</Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.stageLabel,
                        isDone && styles.stageLabelDone,
                        isCurrent && styles.stageLabelCurrent,
                        isPending && styles.stageLabelPending,
                      ]}
                    >
                      {PHASE_SHORT[phase]}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Current Stage Sub-stages */}
            <View style={styles.subStageCard}>
              <View style={styles.subStageHeader}>
                <Text style={styles.subStageTitle}>
                  {PHASE_LABELS[project.currentPhase]}
                </Text>
                <Text style={styles.subStageSuffix}>— Current stage</Text>
              </View>
              {SUB_STAGES[project.currentPhase].map((sub, i) => {
                const subDone = i < activeSubIndex;
                const subActive = i === activeSubIndex;

                return (
                  <View key={sub} style={styles.subStageRow}>
                    <View
                      style={[
                        styles.subDot,
                        subDone && styles.subDotDone,
                        subActive && styles.subDotActive,
                        !subDone && !subActive && styles.subDotPending,
                      ]}
                    >
                      {subDone && (
                        <Ionicons name="checkmark" size={8} color="#ffffff" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.subStageText,
                        subDone && styles.subStageTextDone,
                        subActive && styles.subStageTextActive,
                      ]}
                    >
                      {sub}
                    </Text>
                    <Text style={styles.subStageStatus}>
                      {subDone ? formatDate(project.startedAt) : subActive ? 'In progress' : 'Upcoming'}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Completed Stages Summary */}
            {currentPhaseIndex > 0 && (
              <View style={styles.completedStagesGrid}>
                {PHASES.slice(0, currentPhaseIndex).map((phase) => (
                  <View key={phase} style={styles.completedStageBox}>
                    <Text style={styles.completedStageTitle}>
                      {PHASE_LABELS[phase]}
                    </Text>
                    {SUB_STAGES[phase].map((sub) => (
                      <View key={sub} style={styles.completedSubRow}>
                        <View style={styles.completedSubDot}>
                          <Ionicons name="checkmark" size={8} color="#ffffff" />
                        </View>
                        <Text style={styles.completedSubText}>{sub}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ====== TASKS (EXPANDABLE) ====== */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>Tasks</Text>
            <Text style={styles.sectionCount}>
              {completedCount} / {projectTasks.length}
            </Text>
          </View>

          {sortedTasks.length === 0 ? (
            <View style={styles.emptyTasks}>
              <Ionicons name="checkbox-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyTasksText}>No tasks yet</Text>
            </View>
          ) : (
            sortedTasks.map((task) => {
              const isCompleted = task.status === 'completed';
              const isBlocked = task.status === 'blocked';
              const isExpanded = expandedTask === task.id;
              const priorityColor = PRIORITY_COLORS[task.priority] ?? '#6b7280';
              const statusColor = STATUS_COLORS[task.status] ?? '#6b7280';

              return (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskCard}
                  onPress={() => toggleTask(task.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.taskRow}>
                    {/* Priority bar */}
                    <View
                      style={[
                        styles.taskPriorityBar,
                        { backgroundColor: isCompleted ? '#10b981' : priorityColor },
                      ]}
                    />
                    {/* Checkbox */}
                    <View
                      style={[
                        styles.taskCheckbox,
                        isCompleted && styles.taskCheckboxDone,
                        !isCompleted && { borderColor: colors.border },
                      ]}
                    >
                      {isCompleted && (
                        <Ionicons name="checkmark" size={12} color="#ffffff" />
                      )}
                    </View>
                    {/* Title */}
                    <Text
                      style={[
                        styles.taskTitle,
                        isCompleted && styles.taskTitleDone,
                      ]}
                      numberOfLines={2}
                    >
                      {task.title}
                    </Text>
                    {/* Stage badge */}
                    <View style={[styles.stageBadge, { borderColor: PHASE_COLORS[project.currentPhase] + '40' }]}>
                      <Text style={[styles.stageBadgeText, { color: PHASE_COLORS[project.currentPhase] }]}>
                        {PHASE_ABBREV[project.currentPhase]}
                      </Text>
                    </View>
                    {/* Chevron */}
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textMuted}
                      style={[
                        styles.taskChevron,
                        isExpanded && { transform: [{ rotate: '90deg' }] },
                      ]}
                    />
                  </View>

                  {/* Expanded details */}
                  {isExpanded && (
                    <View style={styles.taskExpandArea}>
                      {task.description ? (
                        <Text style={styles.taskDescription}>{task.description}</Text>
                      ) : null}
                      <View style={styles.taskMetaRow}>
                        <View style={[styles.taskMetaBadge, { backgroundColor: statusColor + '1A' }]}>
                          <View style={[styles.taskMetaDot, { backgroundColor: statusColor }]} />
                          <Text style={[styles.taskMetaText, { color: statusColor }]}>
                            {task.status === 'in-progress' ? 'In Progress' :
                             task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                          </Text>
                        </View>
                        <View style={[styles.taskMetaBadge, { backgroundColor: priorityColor + '1A' }]}>
                          <Text style={[styles.taskMetaText, { color: priorityColor }]}>
                            {task.priority}
                          </Text>
                        </View>
                        {task.dueDate && (
                          <Text style={styles.taskDueDate}>
                            Due {formatDate(task.dueDate)}
                          </Text>
                        )}
                      </View>
                      {isCompleted && task.completedAt && (
                        <Text style={styles.taskCompletedDate}>
                          Completed {formatDate(task.completedAt)}
                        </Text>
                      )}
                      {isBlocked && (
                        <View style={styles.blockedBanner}>
                          <Ionicons name="warning" size={12} color="#ef4444" />
                          <Text style={styles.blockedText}>This task is blocked</Text>
                        </View>
                      )}

                      {/* Task-linked inbox threads */}
                      {(() => {
                        const taskReplies = getTaskReplies(task.id);
                        if (taskReplies.length === 0) return null;
                        return (
                          <View style={styles.threadContainer}>
                            <View style={styles.threadHeader}>
                              <Ionicons name="chatbubbles-outline" size={14} color="#94a3b8" />
                              <Text style={styles.threadHeaderText}>
                                {taskReplies.length} message{taskReplies.length > 1 ? 's' : ''}
                              </Text>
                            </View>
                            {taskReplies.map((item) => (
                              <View key={item.id}>
                                <View style={styles.threadMessage}>
                                  <View style={[styles.threadAuthorDot, { backgroundColor: item.author === 'claude' ? '#3b82f6' : '#10b981' }]} />
                                  <View style={styles.threadMessageContent}>
                                    <View style={styles.threadMessageHeader}>
                                      <Text style={[styles.threadAuthorName, { color: item.author === 'claude' ? '#3b82f6' : '#10b981' }]}>
                                        {item.author === 'claude' ? 'Claude' : 'You'}
                                      </Text>
                                      <Text style={styles.threadTimestamp}>
                                        {formatDate(item.createdAt)}
                                      </Text>
                                    </View>
                                    <Text style={styles.threadMessageText}>{item.text}</Text>
                                  </View>
                                </View>
                                {item.replies.map((reply) => (
                                  <View key={reply.id} style={[styles.threadMessage, styles.threadReply]}>
                                    <View style={[styles.threadAuthorDot, { backgroundColor: reply.author === 'claude' ? '#3b82f6' : '#10b981' }]} />
                                    <View style={styles.threadMessageContent}>
                                      <View style={styles.threadMessageHeader}>
                                        <Text style={[styles.threadAuthorName, { color: reply.author === 'claude' ? '#3b82f6' : '#10b981' }]}>
                                          {reply.author === 'claude' ? 'Claude' : 'You'}
                                        </Text>
                                        <Text style={styles.threadTimestamp}>
                                          {formatDate(reply.createdAt)}
                                        </Text>
                                      </View>
                                      <Text style={styles.threadMessageText}>{reply.text}</Text>
                                    </View>
                                  </View>
                                ))}
                              </View>
                            ))}
                          </View>
                        );
                      })()}

                      {/* Voice note input row */}
                      <View style={styles.voiceInputRow}>
                        <TextInput
                          style={styles.voiceInput}
                          placeholder={
                            isRecording ? 'Recording... tap mic to stop'
                            : isTranscribing ? 'Transcribing...'
                            : 'Voice note for this task...'
                          }
                          placeholderTextColor={isRecording ? '#ef4444' : colors.textMuted}
                          value={voiceText}
                          onChangeText={setVoiceText}
                          multiline={false}
                          editable={!voiceProcessing && !isRecording && !isTranscribing}
                        />
                        {/* Mic button — records voice */}
                        <TouchableOpacity
                          style={[
                            styles.micRecordButton,
                            isRecording && styles.micRecordButtonActive,
                          ]}
                          onPress={handleInlineRecord}
                          activeOpacity={0.7}
                          disabled={isTranscribing || voiceProcessing}
                        >
                          {isTranscribing ? (
                            <ActivityIndicator size="small" color="#f97316" />
                          ) : (
                            <Ionicons
                              name={isRecording ? 'stop' : 'mic'}
                              size={16}
                              color={isRecording ? '#ffffff' : '#10b981'}
                            />
                          )}
                        </TouchableOpacity>
                        {/* Send button */}
                        <TouchableOpacity
                          style={[
                            styles.voiceSendButton,
                            !voiceText.trim() && styles.voiceSendDisabled,
                          ]}
                          onPress={() => handleVoiceSubmit(task)}
                          disabled={!voiceText.trim() || voiceProcessing}
                          activeOpacity={0.7}
                        >
                          {voiceProcessing ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <Ionicons name="send" size={14} color="#ffffff" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ====== DESCRIPTION ====== */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.descriptionText}>{project.description}</Text>
        </View>

        {/* ====== TECH STACK ====== */}
        {project.techStack.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>Tech Stack</Text>
            <View style={styles.techRow}>
              {project.techStack.map((tech) => (
                <View key={tech} style={styles.techBadge}>
                  <Text style={styles.techBadgeText}>{tech}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ====== TEAM ====== */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>Team</Text>
          <View style={styles.teamRow}>
            <View style={styles.avatarStack}>
              <View style={[styles.avatar, styles.avatarArun]}>
                <Text style={styles.avatarText}>AC</Text>
              </View>
              <View style={[styles.avatar, styles.avatarClaude, { marginLeft: -10 }]}>
                <Text style={styles.avatarText}>CL</Text>
              </View>
            </View>
            <Text style={styles.teamNames}>Arun + Claude</Text>
          </View>
        </View>

        {/* ====== QUICK ACTIONS ====== */}
        <View style={styles.sectionContainer}>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push(`/voice-capture?projectId=${project.id}`)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#10b9811A' }]}>
                <Ionicons name="mic" size={22} color="#10b981" />
              </View>
              <Text style={styles.quickActionLabel}>Voice Note</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/inbox-capture')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#10b9811A' }]}>
                <Ionicons name="add-circle" size={22} color="#10b981" />
              </View>
              <Text style={styles.quickActionLabel}>Add to Inbox</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footerText}>Orbit — Project Detail</Text>
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

// --- Styles ---

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  insets: { top: number; bottom: number }
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // Header
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: insets.top + spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.md,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCenter: {
      flex: 1,
    },
    headerTitleText: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    headerSubtitle: {
      fontSize: 11,
      fontWeight: '500',
      color: colors.textMuted,
      marginTop: 2,
    },
    headerDays: {
      color: '#10b981',
      fontWeight: '600',
    },
    completionRingContainer: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    completionText: {
      position: 'absolute',
      fontSize: 10,
      fontWeight: '700',
      color: '#10b981',
    },

    // Empty state
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
    },
    emptyText: {
      fontSize: fontSize.lg,
      color: colors.textSecondary,
    },

    // Scroll
    scrollView: { flex: 1 },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: insets.bottom + spacing.xxxl,
    },

    // Title + badges
    badgeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    // FIX 3: Tech header badge with theme-safe colors
    techHeaderBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    techHeaderBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    githubBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: borderRadius.md,
      backgroundColor: '#10b9810D',
      borderWidth: 1,
      borderColor: '#10b98140',
    },
    githubBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#10b981',
    },
    projectTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    projectDesc: {
      fontSize: fontSize.sm,
      fontWeight: '500',
      color: colors.textMuted,
      marginBottom: spacing.xl,
    },

    // Section
    sectionContainer: {
      marginBottom: spacing.xl,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    sectionLabel: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    sectionCount: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
    },

    // Workflow card
    workflowCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
    },

    // Stage row
    stageRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.lg,
    },
    stageItem: {
      alignItems: 'center',
      flex: 1,
      position: 'relative',
    },
    stageConnector: {
      position: 'absolute',
      top: 15,
      right: '50%',
      left: '-50%',
      height: 2,
      zIndex: 0,
    },
    stageCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5,
      position: 'relative',
      marginBottom: 4,
      borderWidth: 3,
      borderColor: colors.surface,
    },
    stageCircleDone: {
      backgroundColor: '#10b981',
    },
    stageCircleCurrent: {
      backgroundColor: '#10b981',
      ...Platform.select({
        ios: {
          shadowColor: '#10b981',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    stageCirclePending: {
      backgroundColor: colors.textMuted + '30',
      borderColor: colors.textMuted + '60',
    },
    currentDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#ffffff',
    },
    pendingNumber: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.textMuted,
    },
    stageLabel: {
      fontSize: 10,
      fontWeight: '600',
    },
    stageLabelDone: {
      color: '#10b981',
    },
    stageLabelCurrent: {
      color: colors.textPrimary,
      fontWeight: '700',
    },
    stageLabelPending: {
      color: colors.textMuted,
    },

    // Sub-stage card
    subStageCard: {
      backgroundColor: 'rgba(16, 185, 129, 0.06)',
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.12)',
      borderRadius: borderRadius.lg,
      padding: 14,
      marginBottom: spacing.md,
    },
    subStageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: 12,
    },
    subStageTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: '#10b981',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    subStageSuffix: {
      fontSize: 10,
      fontWeight: '500',
      color: colors.textMuted,
    },
    subStageRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 10,
    },
    subDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    subDotDone: {
      backgroundColor: '#10b981',
    },
    subDotActive: {
      backgroundColor: '#10b981',
      ...Platform.select({
        ios: {
          shadowColor: '#10b981',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 6,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    subDotPending: {
      backgroundColor: colors.textMuted + '30',
      borderWidth: 1,
      borderColor: colors.textMuted + '50',
    },
    subStageText: {
      flex: 1,
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    subStageTextDone: {
      color: colors.textMuted,
      textDecorationLine: 'line-through',
    },
    subStageTextActive: {
      color: colors.textPrimary,
      fontWeight: '600',
    },
    subStageStatus: {
      fontSize: 10,
      color: colors.textMuted,
    },

    // Completed stages grid
    completedStagesGrid: {
      flexDirection: 'row',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    completedStageBox: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.surfaceSecondary,
      borderRadius: borderRadius.md,
      padding: 10,
    },
    completedStageTitle: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    completedSubRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 3,
    },
    completedSubDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#10b981',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    completedSubText: {
      fontSize: 10,
      color: colors.textMuted,
    },

    // Tasks
    taskCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
      overflow: 'hidden',
    },
    taskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
    },
    taskPriorityBar: {
      width: 3,
      height: 32,
      borderRadius: 2,
    },
    taskCheckbox: {
      width: 20,
      height: 20,
      borderRadius: 6,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    taskCheckboxDone: {
      backgroundColor: '#10b981',
      borderColor: '#10b981',
    },
    taskTitle: {
      flex: 1,
      fontSize: fontSize.sm,
      fontWeight: '500',
      color: colors.textPrimary,
      lineHeight: 20,
    },
    taskTitleDone: {
      color: colors.textMuted,
      textDecorationLine: 'line-through',
    },
    // FIX 4: Stage badge on task cards
    stageBadge: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stageBadgeText: {
      fontSize: 8,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    taskChevron: {
      marginLeft: 4,
    },
    taskExpandArea: {
      paddingHorizontal: 14,
      paddingBottom: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
    },
    taskDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 10,
    },
    taskMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    taskMetaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
    },
    taskMetaDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    taskMetaText: {
      fontSize: 11,
      fontWeight: '600',
    },
    taskDueDate: {
      fontSize: 10,
      color: colors.textMuted,
      fontWeight: '500',
    },
    taskCompletedDate: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 8,
    },
    blockedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#ef44441A',
      borderRadius: borderRadius.md,
      padding: 8,
      marginTop: 8,
    },
    blockedText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#ef4444',
    },
    emptyTasks: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
      gap: spacing.sm,
    },
    emptyTasksText: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
    },

    // FIX 5: Voice input styles
    voiceInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
    },
    voiceInput: {
      flex: 1,
      height: 36,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      fontSize: 12,
      color: colors.textPrimary,
    },
    voiceSendButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#10b981',
      alignItems: 'center',
      justifyContent: 'center',
    },
    voiceSendDisabled: {
      opacity: 0.4,
    },
    micRecordButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#10b9811A',
      borderWidth: 1,
      borderColor: '#10b98140',
      alignItems: 'center',
      justifyContent: 'center',
    },
    micRecordButtonActive: {
      backgroundColor: '#ef4444',
      borderColor: '#ef4444',
    },

    // Thread styles
    threadContainer: {
      marginTop: 12,
      borderLeftWidth: 2,
      borderLeftColor: '#64748b40',
      backgroundColor: '#64748b08',
      borderRadius: borderRadius.md,
      paddingLeft: 12,
      paddingRight: 10,
      paddingTop: 10,
      paddingBottom: 4,
    },
    threadHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
    },
    threadHeaderText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#94a3b8',
    },
    threadMessage: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
      backgroundColor: '#64748b0D',
      borderRadius: borderRadius.sm,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    threadReply: {
      marginLeft: 16,
    },
    threadAuthorDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 5,
    },
    threadMessageContent: {
      flex: 1,
    },
    threadMessageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    threadAuthorName: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    threadTimestamp: {
      fontSize: 9,
      color: colors.textMuted,
    },
    threadMessageText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },

    // Description
    descriptionText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      lineHeight: 22,
    },

    // Tech Stack
    techRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    techBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    techBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },

    // Team
    teamRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatarStack: {
      flexDirection: 'row',
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.background,
    },
    avatarArun: {
      backgroundColor: '#059669',
    },
    avatarClaude: {
      backgroundColor: '#2563EB',
    },
    avatarText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#ffffff',
    },
    teamNames: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textMuted,
    },

    // Quick actions
    quickActionsRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    quickActionButton: {
      flex: 1,
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.lg,
      minHeight: 88,
      justifyContent: 'center',
    },
    quickActionIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickActionLabel: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.textPrimary,
    },

    // Footer
    footerText: {
      textAlign: 'center',
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '500',
      letterSpacing: 0.5,
      paddingVertical: spacing.lg,
    },
  });
}

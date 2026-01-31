import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme/ThemeContext';
import { useAppStore } from '../src/store';
import { spacing, fontSize, borderRadius } from '../src/theme/spacing';
import { structureVoiceText } from '../src/services/groq';
import { Priority, Complexity, Project } from '../src/store/types';

type CaptureState = 'idle' | 'recording' | 'processing' | 'review';

const PRIORITIES: Priority[] = ['P0', 'P1', 'P2', 'P3'];
const COMPLEXITIES: Complexity[] = ['XS', 'S', 'M', 'L', 'XL'];
const PRIORITY_COLORS: Record<Priority, string> = {
  P0: '#ef4444',
  P1: '#f97316',
  P2: '#eab308',
  P3: '#6b7280',
};

export default function VoiceCaptureScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const projects = useAppStore((s) => s.projects);
  const addInboxItem = useAppStore((s) => s.addInboxItem);

  const [state, setState] = useState<CaptureState>('idle');
  const [rawText, setRawText] = useState('');

  // Review fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('P2');
  const [complexity, setComplexity] = useState<Complexity>('M');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Error handling
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Pulse animation for mic button
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'recording') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state, pulseAnim]);

  const handleStartRecording = useCallback(() => {
    setRawText('');
    setProcessingError(null);
    setState('recording');
  }, []);

  const handleDone = useCallback(async () => {
    const trimmed = rawText.trim();
    if (trimmed.length === 0) return;

    setState('processing');
    setProcessingError(null);

    try {
      const selectedProjectName = selectedProject
        ? projects.find((p: Project) => p.id === selectedProject)?.name
        : undefined;

      const structured = await structureVoiceText(trimmed, selectedProjectName);

      setTitle(structured.title);
      setDescription(structured.description);
      setPriority(structured.priority);
      setComplexity(structured.complexity);
      setState('review');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to structure text';
      setProcessingError(message);
      // Fall back to review with raw text
      setTitle(trimmed.slice(0, 60));
      setDescription(trimmed);
      setPriority('P2');
      setComplexity('M');
      setState('review');
    }
  }, [rawText, selectedProject, projects]);

  const handleReRecord = useCallback(() => {
    setTitle('');
    setDescription('');
    setPriority('P2');
    setComplexity('M');
    setSelectedProject(null);
    setRawText('');
    setProcessingError(null);
    setState('idle');
  }, []);

  const handleSave = useCallback(() => {
    if (title.trim().length === 0) return;

    addInboxItem({
      id: `inbox-${Date.now()}`,
      text: `${title}\n\n${description}`,
      type: 'idea',
      project: selectedProject,
      priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
      forClaude: false,
      read: true,
      author: 'user',
      parentId: null,
      replies: [],
    });

    router.back();
  }, [title, description, priority, selectedProject, addInboxItem, router]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const canSubmit = rawText.trim().length > 0;
  const canSave = title.trim().length > 0;
  const styles = makeStyles(colors, insets);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Capture</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* State: Idle */}
      {state === 'idle' && (
        <View style={styles.centeredContent}>
          <Animated.View
            style={[
              styles.micButtonOuter,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <TouchableOpacity
              style={styles.micButton}
              onPress={handleStartRecording}
              activeOpacity={0.8}
            >
              <Ionicons name="mic" size={48} color="#ffffff" />
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.instruction}>Tap to start</Text>
          <Text style={styles.hint}>
            Speak naturally about a task, idea, or instruction
          </Text>
        </View>
      )}

      {/* State: Recording (MVP - text input) */}
      {state === 'recording' && (
        <View style={styles.recordingContainer}>
          {/* Waveform-style header area */}
          <View style={styles.recordingHeader}>
            <Animated.View
              style={[
                styles.micButtonRecording,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <View style={styles.micButtonRecordingInner}>
                <Ionicons name="mic" size={36} color="#ffffff" />
              </View>
            </Animated.View>

            {/* Simulated waveform bars */}
            <View style={styles.waveformRow}>
              {Array.from({ length: 9 }).map((_, i) => {
                const heights = [12, 20, 28, 16, 32, 24, 18, 26, 14];
                return (
                  <View
                    key={i}
                    style={[
                      styles.waveformBar,
                      {
                        height: heights[i],
                        backgroundColor:
                          rawText.length > 0
                            ? colors.primary
                            : colors.textMuted,
                      },
                    ]}
                  />
                );
              })}
            </View>

            <Text style={styles.recordingLabel}>
              {rawText.length > 0 ? 'Transcribing...' : 'Listening...'}
            </Text>
          </View>

          {/* Text input area (MVP for voice) */}
          <View style={styles.transcriptInputBox}>
            <TextInput
              style={styles.transcriptInput}
              value={rawText}
              onChangeText={setRawText}
              placeholder="Type or paste your voice note"
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          </View>

          {/* Live preview info */}
          {rawText.length > 0 && (
            <Text style={styles.charCount}>
              {rawText.trim().split(/\s+/).filter(Boolean).length} words
            </Text>
          )}

          {/* Done / Cancel buttons */}
          <View style={styles.recordingActions}>
            <TouchableOpacity
              style={styles.cancelRecordButton}
              onPress={handleReRecord}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              <Text style={styles.cancelRecordText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.doneButton,
                !canSubmit && styles.doneButtonDisabled,
              ]}
              onPress={handleDone}
              activeOpacity={0.8}
              disabled={!canSubmit}
            >
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* State: Processing */}
      {state === 'processing' && (
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.processingText}>Structuring your input...</Text>
          <View style={styles.groqBadge}>
            <Ionicons name="flash" size={14} color="#f97316" />
            <Text style={styles.groqBadgeText}>Groq AI</Text>
          </View>
        </View>
      )}

      {/* State: Review */}
      {state === 'review' && (
        <ScrollView
          style={styles.reviewScrollView}
          contentContainerStyle={styles.reviewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Error notice (shown if AI structuring failed) */}
          {processingError && (
            <View style={styles.errorBanner}>
              <Ionicons name="warning" size={16} color="#f59e0b" />
              <Text style={styles.errorBannerText}>
                AI structuring failed. Fields populated from raw text.
              </Text>
            </View>
          )}

          {/* Title */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter title"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description"
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Priority */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Priority</Text>
            <View style={styles.chipRow}>
              {PRIORITIES.map((p) => {
                const isActive = priority === p;
                const chipColor = PRIORITY_COLORS[p];
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.chip,
                      isActive && {
                        backgroundColor: chipColor + '26',
                        borderColor: chipColor,
                      },
                    ]}
                    onPress={() => setPriority(p)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isActive && { color: chipColor },
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Complexity */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Complexity</Text>
            <View style={styles.chipRow}>
              {COMPLEXITIES.map((c) => {
                const isActive = complexity === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.chip,
                      isActive && styles.chipActive,
                    ]}
                    onPress={() => setComplexity(c)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isActive && styles.chipTextActive,
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Project Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Project</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.projectChipRow}
            >
              <TouchableOpacity
                style={[
                  styles.chip,
                  !selectedProject && styles.chipActive,
                ]}
                onPress={() => setSelectedProject(null)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    !selectedProject && styles.chipTextActive,
                  ]}
                >
                  None
                </Text>
              </TouchableOpacity>
              {projects.map((proj: Project) => {
                const isActive = selectedProject === proj.id;
                return (
                  <TouchableOpacity
                    key={proj.id}
                    style={[
                      styles.chip,
                      isActive && styles.chipActive,
                    ]}
                    onPress={() => setSelectedProject(proj.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isActive && styles.chipTextActive,
                      ]}
                    >
                      {proj.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.reRecordButton}
              onPress={handleReRecord}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={18} color={colors.textPrimary} />
              <Text style={styles.reRecordText}>Re-record</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                !canSave && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={!canSave}
            >
              <Ionicons name="checkmark" size={20} color="#ffffff" />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: insets.top + spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    closeButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.textPrimary,
    },

    // Centered Content (idle, processing)
    centeredContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xxxl,
      paddingBottom: spacing.xxxl,
    },

    // Idle
    micButtonOuter: {
      marginBottom: spacing.xxl,
    },
    micButton: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: '#10b981',
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#10b981',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
        },
        android: {
          elevation: 12,
        },
      }),
    },
    instruction: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    hint: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      fontWeight: '400',
    },

    // Recording
    recordingContainer: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    recordingHeader: {
      alignItems: 'center',
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
    },
    micButtonRecording: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#10b98140',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    micButtonRecordingInner: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#10b981',
      alignItems: 'center',
      justifyContent: 'center',
    },
    waveformRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: spacing.md,
    },
    waveformBar: {
      width: 4,
      borderRadius: 2,
    },
    recordingLabel: {
      fontSize: fontSize.sm,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    transcriptInputBox: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
    },
    transcriptInput: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      fontSize: fontSize.md,
      color: colors.textPrimary,
      fontWeight: '400',
      lineHeight: 22,
    },
    charCount: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textAlign: 'right',
      marginBottom: spacing.md,
      fontWeight: '500',
    },
    recordingActions: {
      flexDirection: 'row',
      gap: spacing.md,
      paddingBottom: insets.bottom + spacing.lg,
    },
    cancelRecordButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.lg,
      minHeight: 52,
    },
    cancelRecordText: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    doneButton: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: '#10b981',
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.lg,
      minHeight: 52,
    },
    doneButtonDisabled: {
      opacity: 0.4,
    },
    doneButtonText: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: '#ffffff',
    },

    // Processing
    processingText: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.textPrimary,
      marginTop: spacing.xxl,
      marginBottom: spacing.md,
    },
    groqBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    groqBadgeText: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      fontWeight: '600',
    },

    // Review
    reviewScrollView: {
      flex: 1,
    },
    reviewContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: insets.bottom + spacing.xxxl,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: '#f59e0b40',
      padding: spacing.md,
      marginBottom: spacing.xl,
    },
    errorBannerText: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      fontWeight: '500',
      flex: 1,
    },
    fieldGroup: {
      marginBottom: spacing.xl,
    },
    fieldLabel: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    titleInput: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.textPrimary,
      height: 52,
    },
    descriptionInput: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: fontSize.md,
      color: colors.textPrimary,
      minHeight: 100,
      fontWeight: '400',
    },
    chipRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    projectChipRow: {
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipActive: {
      backgroundColor: colors.primary + '26',
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: colors.primary,
    },

    // Action Row
    actionRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    reRecordButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.lg,
      minHeight: 52,
    },
    reRecordText: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    saveButton: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: '#10b981',
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.lg,
      minHeight: 52,
    },
    saveButtonDisabled: {
      opacity: 0.4,
    },
    saveButtonText: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: '#ffffff',
    },
  });
}

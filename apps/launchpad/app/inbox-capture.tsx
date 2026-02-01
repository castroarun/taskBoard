import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme/ThemeContext';
import { useAppStore } from '../src/store';
import { spacing, fontSize, borderRadius } from '../src/theme/spacing';
import { Priority } from '../src/store/types';

const PRIORITIES: Priority[] = ['P0', 'P1', 'P2', 'P3'];

const PRIORITY_COLORS: Record<Priority, string> = {
  P0: '#ef4444',
  P1: '#f97316',
  P2: '#eab308',
  P3: '#6b7280',
};

export default function InboxCaptureScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const projects = useAppStore((s) => s.projects);
  const addInboxItem = useAppStore((s) => s.addInboxItem);

  const [text, setText] = useState('');
  const [priorityIndex, setPriorityIndex] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(
    projects.length > 0 ? projects[0].id : null
  );
  const [forClaude, setForClaude] = useState(false);

  const currentPriority: Priority | null =
    priorityIndex !== null ? PRIORITIES[priorityIndex] : null;

  const selectedProjectName: string =
    projects.find((p) => p.id === selectedProject)?.name ?? 'Project';

  const canSave = text.trim().length > 0;

  const cyclePriority = useCallback(() => {
    setPriorityIndex((prev) => {
      if (prev === null) return 0;
      if (prev >= PRIORITIES.length - 1) return null;
      return prev + 1;
    });
  }, []);

  const cycleProject = useCallback(() => {
    if (projects.length === 0) return;
    setSelectedProject((prev) => {
      if (prev === null) return projects[0].id;
      const currentIdx = projects.findIndex((p) => p.id === prev);
      if (currentIdx === -1 || currentIdx >= projects.length - 1) return null;
      return projects[currentIdx + 1].id;
    });
  }, [projects]);

  const toggleForClaude = useCallback(() => {
    setForClaude((prev) => !prev);
  }, []);

  const handleSave = useCallback(() => {
    if (!canSave) return;

    addInboxItem({
      id: `inbox-${Date.now()}`,
      text: text.trim(),
      type: 'task',
      project: selectedProject,
      priority: currentPriority,
      status: 'pending',
      createdAt: new Date().toISOString(),
      forClaude,
      read: true,
      author: 'user',
      parentId: null,
      replies: [],
      taskRef: null,
      taskTitle: null,
    });

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [text, currentPriority, selectedProject, forClaude, canSave, addInboxItem, router]);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [router]);

  const handleVoice = useCallback(() => {
    router.push('/voice-capture');
  }, [router]);

  const styles = makeStyles(colors, insets);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="add" size={20} color="#10b981" />
          </View>
          <Text style={styles.headerTitle}>Quick Add</Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Text Input */}
        <TextInput
          style={styles.textArea}
          value={text}
          onChangeText={setText}
          placeholder="What's on your mind? Type a task, idea, or note..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          autoFocus
        />

        {/* Option Chips Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {/* Priority Chip */}
          <TouchableOpacity
            style={[
              styles.chip,
              currentPriority !== null && {
                backgroundColor: PRIORITY_COLORS[currentPriority] + '1A',
                borderColor: PRIORITY_COLORS[currentPriority] + '66',
              },
            ]}
            onPress={cyclePriority}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.priorityDot,
                {
                  backgroundColor:
                    currentPriority !== null
                      ? PRIORITY_COLORS[currentPriority]
                      : colors.textMuted,
                },
              ]}
            />
            <Text
              style={[
                styles.chipText,
                currentPriority !== null && {
                  color: PRIORITY_COLORS[currentPriority],
                },
              ]}
            >
              {currentPriority !== null ? currentPriority : 'Priority'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={14}
              color={
                currentPriority !== null
                  ? PRIORITY_COLORS[currentPriority]
                  : colors.textMuted
              }
            />
          </TouchableOpacity>

          {/* Project Selector Chip */}
          <TouchableOpacity
            style={[
              styles.chip,
              selectedProject !== null && {
                backgroundColor: colors.primary + '1A',
                borderColor: colors.primary + '66',
              },
            ]}
            onPress={cycleProject}
            activeOpacity={0.7}
          >
            <Ionicons
              name="folder-outline"
              size={16}
              color={selectedProject !== null ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.chipText,
                selectedProject !== null && { color: colors.primary },
              ]}
            >
              {selectedProject !== null ? selectedProjectName : 'Project'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={14}
              color={selectedProject !== null ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>

          {/* For Claude Toggle Chip */}
          <TouchableOpacity
            style={[
              styles.chip,
              forClaude && {
                backgroundColor: '#8b5cf61A',
                borderColor: '#8b5cf666',
              },
            ]}
            onPress={toggleForClaude}
            activeOpacity={0.7}
          >
            <Ionicons
              name={forClaude ? 'checkmark-circle' : 'sparkles-outline'}
              size={16}
              color={forClaude ? '#8b5cf6' : colors.textSecondary}
            />
            <Text
              style={[
                styles.chipText,
                forClaude && { color: '#8b5cf6' },
              ]}
            >
              For Claude
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </ScrollView>

      {/* Actions Row */}
      <View style={styles.actionsContainer}>
        <View style={styles.actionsRow}>
          {/* Voice Button (Secondary) */}
          <TouchableOpacity
            style={styles.voiceButton}
            onPress={handleVoice}
            activeOpacity={0.7}
          >
            <Ionicons name="mic" size={20} color={colors.primary} />
            <Text style={styles.voiceButtonText}>Voice</Text>
          </TouchableOpacity>

          {/* Add to Inbox Button (Primary) */}
          <TouchableOpacity
            style={[styles.addButton, !canSave && styles.addButtonDisabled]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={!canSave}
          >
            <Ionicons name="send" size={18} color="#ffffff" />
            <Text style={styles.addButtonText}>Add to Inbox</Text>
          </TouchableOpacity>
        </View>
      </View>
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
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    headerIcon: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.sm,
      backgroundColor: colors.primary + '1A',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Scroll
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xxxl,
    },

    // Text Input
    textArea: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      fontSize: fontSize.md,
      color: colors.textPrimary,
      minHeight: 120,
      fontWeight: '400',
      lineHeight: 22,
      marginBottom: spacing.lg,
    },

    // Option Chips Row
    chipsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingBottom: spacing.sm,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    priorityDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },

    // Actions
    actionsContainer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: insets.bottom + spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surfaceSecondary,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    voiceButton: {
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
    voiceButtonText: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    addButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: '#10b981',
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.lg,
      minHeight: 52,
    },
    addButtonDisabled: {
      opacity: 0.4,
    },
    addButtonText: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: '#ffffff',
    },
  });
}

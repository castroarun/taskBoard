import { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { useAppStore } from '../../src/store';
import { spacing, fontSize, borderRadius } from '../../src/theme/spacing';
import { Project, ProjectPhase } from '../../src/store/types';

const PHASE_COLORS: Record<ProjectPhase, string> = {
  design: '#ec4899',
  engineering: '#0ea5e9',
  build: '#eab308',
  launch: '#22c55e',
  closure: '#14b8a6',
};

const PHASE_LABELS: Record<ProjectPhase, string> = {
  design: 'Design',
  engineering: 'Engineering',
  build: 'Build',
  launch: 'Launch',
  closure: 'Closure',
};

const PRIORITY_COLORS: Record<string, string> = {
  P0: '#ef4444',
  P1: '#f97316',
  P2: '#eab308',
  P3: '#6b7280',
};

const MAX_READINESS = 130;

function getShippingReadiness(project: Project): number {
  let score = 0;
  score += project.progress;
  score += project.metrics.blockedTasks === 0 ? 10 : -20;
  score += project.targetDate ? 5 : 0;
  const allDone =
    project.metrics.totalTasks > 0 &&
    project.metrics.completedTasks === project.metrics.totalTasks;
  score += allDone ? 15 : 0;
  if (project.currentPhase === 'launch') score += 10;
  if (project.currentPhase === 'closure') score += 5;
  return score;
}

interface RankedProject {
  project: Project;
  readiness: number;
}

type ShipSection = 'ready' | 'close' | 'progress';

function getSection(readiness: number): ShipSection {
  if (readiness > 100) return 'ready';
  if (readiness >= 60) return 'close';
  return 'progress';
}

const SECTION_META: Record<ShipSection, { title: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  ready: { title: 'Ready to Ship', icon: 'rocket', color: '#22c55e' },
  close: { title: 'Getting Close', icon: 'trending-up', color: '#f59e0b' },
  progress: { title: 'In Progress', icon: 'build-outline', color: '#6b7280' },
};

export default function ShipScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const projects = useAppStore((s) => s.projects);

  const ranked: RankedProject[] = useMemo(() => {
    return projects
      .map((project) => ({
        project,
        readiness: getShippingReadiness(project),
      }))
      .sort((a, b) => b.readiness - a.readiness);
  }, [projects]);

  const sections = useMemo(() => {
    const groups: Record<ShipSection, RankedProject[]> = {
      ready: [],
      close: [],
      progress: [],
    };
    for (const item of ranked) {
      groups[getSection(item.readiness)].push(item);
    }
    return groups;
  }, [ranked]);

  const isLight = colors.background !== '#09090B';
  const styles = makeStyles(colors, insets, isLight);

  const renderCard = ({ project, readiness }: RankedProject) => {
    const phaseColor = PHASE_COLORS[project.currentPhase];
    const priorityColor = PRIORITY_COLORS[project.priority] ?? '#6b7280';
    const readinessRatio = Math.max(0, Math.min(readiness / MAX_READINESS, 1));
    const hasBlockers = project.metrics.blockedTasks > 0;

    return (
      <TouchableOpacity
        key={project.id}
        style={styles.card}
        onPress={() => router.push(`/project/${project.id}`)}
        activeOpacity={0.7}
      >
        {/* Row 1: Name + Phase + Chevron */}
        <View style={styles.cardRow1}>
          <Text style={styles.projectName} numberOfLines={1}>
            {project.name}
          </Text>
          <View style={styles.cardRow1Right}>
            <View
              style={[
                styles.phaseBadge,
                { backgroundColor: phaseColor + '26' },
              ]}
            >
              <View style={[styles.phaseDot, { backgroundColor: phaseColor }]} />
              <Text style={[styles.phaseBadgeText, { color: phaseColor }]}>
                {PHASE_LABELS[project.currentPhase]}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </View>

        {/* Row 2: Progress bar + percentage */}
        <View style={styles.progressRow}>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${project.progress}%`, backgroundColor: phaseColor },
              ]}
            />
          </View>
          <Text style={styles.progressPercent}>{project.progress}%</Text>
        </View>

        {/* Row 3: Metrics */}
        <View style={styles.metricsRow}>
          <Text style={styles.metricText}>
            {project.metrics.completedTasks}/{project.metrics.totalTasks} tasks
          </Text>
          <Text style={styles.metricDot}>&middot;</Text>
          <Text
            style={[
              styles.metricText,
              hasBlockers && { color: '#ef4444' },
            ]}
          >
            {hasBlockers
              ? `${project.metrics.blockedTasks} blocked`
              : 'No blockers'}
          </Text>
          <Text style={styles.metricDot}>&middot;</Text>
          <Text style={[styles.metricText, { color: priorityColor }]}>
            {project.priority}
          </Text>
        </View>

        {/* Row 4: Readiness score bar */}
        <View style={styles.readinessRow}>
          <Text style={styles.readinessLabel}>Readiness</Text>
          <View style={styles.readinessBarContainer}>
            <View
              style={[
                styles.readinessBarFill,
                {
                  width: `${readinessRatio * 100}%`,
                  backgroundColor:
                    readiness > 100
                      ? '#22c55e'
                      : readiness >= 60
                      ? '#f59e0b'
                      : colors.textMuted,
                },
              ]}
            />
          </View>
          <Text style={styles.readinessValue}>
            {readiness}/{MAX_READINESS}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (key: ShipSection) => {
    const items = sections[key];
    if (items.length === 0) return null;
    const meta = SECTION_META[key];
    return (
      <View key={key} style={styles.sectionBlock}>
        <View style={styles.sectionHeader}>
          <Ionicons name={meta.icon} size={16} color={meta.color} />
          <Text style={[styles.sectionTitle, { color: meta.color }]}>
            {meta.title}
          </Text>
          <View style={[styles.sectionCount, { backgroundColor: meta.color + '1A' }]}>
            <Text style={[styles.sectionCountText, { color: meta.color }]}>
              {items.length}
            </Text>
          </View>
        </View>
        {items.map(renderCard)}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="rocket" size={28} color={colors.primary} />
          <Text style={styles.title}>Ship Queue</Text>
        </View>
        <Text style={styles.subtitle}>
          Projects ranked by shipping readiness
        </Text>

        {/* Content */}
        {ranked.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="rocket-outline"
                size={48}
                color={colors.textMuted}
              />
            </View>
            <Text style={styles.emptyTitle}>No projects yet</Text>
            <Text style={styles.emptySubtitle}>
              Projects will appear here ranked by their shipping readiness
            </Text>
          </View>
        ) : (
          <>
            {renderSection('ready')}
            {renderSection('close')}
            {renderSection('progress')}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  insets: { top: number },
  isLight: boolean
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: insets.top + spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxxl,
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: fontSize.xxl,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginBottom: spacing.xxl,
      fontWeight: '400',
    },

    // Section block
    sectionBlock: {
      marginBottom: spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionCount: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.full,
    },
    sectionCountText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
    },

    // Card
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    cardRow1: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    projectName: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1,
      marginRight: spacing.sm,
    },
    cardRow1Right: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    phaseBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: borderRadius.full,
    },
    phaseDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    phaseBadgeText: {
      fontSize: fontSize.xs,
      fontWeight: '600',
    },

    // Progress
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    progressBarContainer: {
      flex: 1,
      height: 6,
      backgroundColor: isLight ? '#e5e7eb' : '#3f3f46',
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    progressPercent: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: colors.textPrimary,
      width: 36,
      textAlign: 'right',
    },

    // Metrics
    metricsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: spacing.md,
    },
    metricText: {
      fontSize: fontSize.xs,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    metricDot: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
    },

    // Readiness
    readinessRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    readinessLabel: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: colors.textMuted,
      width: 62,
    },
    readinessBarContainer: {
      flex: 1,
      height: 4,
      backgroundColor: isLight ? '#f3f4f6' : '#27272a',
      borderRadius: 2,
      overflow: 'hidden',
    },
    readinessBarFill: {
      height: '100%',
      borderRadius: 2,
    },
    readinessValue: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: colors.textSecondary,
      width: 50,
      textAlign: 'right',
    },

    // Empty State
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xxxl * 2,
      gap: spacing.md,
    },
    emptyIconCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    emptyTitle: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    emptySubtitle: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: spacing.xxxl,
      fontWeight: '400',
    },
  });
}

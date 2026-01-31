import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
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

type FilterOption = 'all' | ProjectPhase;

const FILTER_OPTIONS: Array<{ key: FilterOption; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'design', label: 'Design' },
  { key: 'engineering', label: 'Engineering' },
  { key: 'build', label: 'Build' },
  { key: 'launch', label: 'Launch' },
  { key: 'closure', label: 'Closure' },
];

function getStaleDays(dateString: string): number {
  return Math.floor(
    (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function getDaysAgo(staleDays: number): string {
  if (staleDays === 0) return 'Today';
  if (staleDays === 1) return 'Yesterday';
  return `${staleDays}d ago`;
}

/** Color-coded health: green ≤3d, yellow 4-7d, orange 8-14d, red 15d+ */
function getHealthColor(staleDays: number): string {
  if (staleDays <= 3) return '#10b981';  // green — healthy
  if (staleDays <= 7) return '#eab308';  // yellow — getting stale
  if (staleDays <= 14) return '#f97316'; // orange — stale
  return '#ef4444';                      // red — critical
}

export default function ProjectsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const projects = useAppStore((s) => s.projects);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

  const filteredProjects = useMemo(() => {
    let result = projects;

    if (activeFilter !== 'all') {
      result = result.filter((p) => p.currentPhase === activeFilter);
    }

    if (search.trim()) {
      const query = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.techStack.some((t) => t.toLowerCase().includes(query))
      );
    }

    return result.sort(
      (a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
  }, [projects, search, activeFilter]);

  const styles = makeStyles(colors, insets);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Projects</Text>
          <Text style={styles.subtitle}>{projects.length} total</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color={colors.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search projects..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScrollView}
          contentContainerStyle={styles.filtersContent}
        >
          {FILTER_OPTIONS.map((option) => {
            const isActive = activeFilter === option.key;
            const phaseColor =
              option.key !== 'all' ? PHASE_COLORS[option.key] : colors.primary;

            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterChip,
                  isActive && {
                    backgroundColor: phaseColor + '26',
                    borderColor: phaseColor,
                  },
                ]}
                onPress={() => setActiveFilter(option.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && { color: phaseColor },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Project Cards */}
        {filteredProjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="folder-open-outline"
              size={48}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitle}>No projects found</Text>
            <Text style={styles.emptySubtitle}>
              {search
                ? 'Try a different search term'
                : 'No projects in this phase'}
            </Text>
          </View>
        ) : (
          filteredProjects.map((project) => (
            <TouchableOpacity
              key={project.id}
              style={styles.projectCard}
              onPress={() => router.push(`/project/${project.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.projectName} numberOfLines={1}>
                  {project.name}
                </Text>
                <View
                  style={[
                    styles.phaseBadge,
                    {
                      backgroundColor:
                        PHASE_COLORS[project.currentPhase] + '26',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.phaseBadgeText,
                      { color: PHASE_COLORS[project.currentPhase] },
                    ]}
                  >
                    {PHASE_LABELS[project.currentPhase]}
                  </Text>
                </View>
              </View>

              <Text style={styles.projectDescription} numberOfLines={1}>
                {project.description}
              </Text>

              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${project.progress}%`,
                      backgroundColor: PHASE_COLORS[project.currentPhase],
                    },
                  ]}
                />
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.progressPercent}>
                  {project.progress}%
                </Text>
                {/* Color-coded stale health indicator */}
                {(() => {
                  const stale = getStaleDays(project.lastUpdated);
                  const healthColor = getHealthColor(stale);
                  return (
                    <View style={styles.healthBadge}>
                      <View style={[styles.healthDot, { backgroundColor: healthColor }]} />
                      <Text style={[styles.healthText, { color: healthColor }]}>
                        {getDaysAgo(stale)}
                      </Text>
                    </View>
                  );
                })()}
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Bottom spacer for FAB */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB - Voice Capture */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/voice-capture')}
        activeOpacity={0.8}
      >
        <Ionicons name="mic" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  insets: { top: number }
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
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: fontSize.xxl,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
      fontWeight: '400',
    },

    // Search
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.lg,
      height: 48,
    },
    searchIcon: {
      marginRight: spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: fontSize.md,
      color: colors.textPrimary,
      height: '100%',
    },

    // Filters
    filtersScrollView: {
      marginBottom: spacing.lg,
      maxHeight: 40,
    },
    filtersContent: {
      gap: spacing.sm,
      paddingRight: spacing.lg,
    },
    filterChip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.textSecondary,
    },

    // Project Card
    projectCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    projectName: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1,
      marginRight: spacing.md,
    },
    phaseBadge: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
    },
    phaseBadgeText: {
      fontSize: fontSize.xs,
      fontWeight: '600',
    },
    projectDescription: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginBottom: spacing.md,
      fontWeight: '400',
    },
    progressBarContainer: {
      height: 6,
      backgroundColor: colors.borderLight,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    progressPercent: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    healthBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    healthDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    healthText: {
      fontSize: fontSize.xs,
      fontWeight: '600',
    },

    // Empty State
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xxxl * 2,
      gap: spacing.sm,
    },
    emptyTitle: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.textPrimary,
      marginTop: spacing.md,
    },
    emptySubtitle: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      fontWeight: '400',
    },

    // FAB
    fab: {
      position: 'absolute',
      bottom: spacing.xxl,
      right: spacing.lg,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#10b981',
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#10b981',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
      }),
    },
  });
}

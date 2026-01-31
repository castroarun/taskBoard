import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { useTheme } from '../../src/theme/ThemeContext';
import { useAppStore } from '../../src/store';
import { spacing, fontSize, borderRadius } from '../../src/theme/spacing';
import { Project, ProjectPhase } from '../../src/store/types';
import { useOnboardingStore } from '../../src/store/onboarding';
import { detectNewRepos, UntrackedRepo } from '../../src/services/sync';

const PHASE_COLORS: Record<ProjectPhase, string> = {
  design: '#ec4899',
  engineering: '#0ea5e9',
  build: '#eab308',
  launch: '#22c55e',
  closure: '#14b8a6',
};

const PHASE_LABELS: Record<ProjectPhase, string> = {
  design: 'Design',
  engineering: 'Engineer',
  build: 'Build',
  launch: 'Launch',
  closure: 'Done',
};

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate(): string {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
}

interface AttentionItem {
  id: string;
  projectId?: string;
  label: string;
  subtitle: string;
  type: 'stale' | 'blocked' | 'overdue' | 'inbox';
  dotColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  score: number;
}

function getStaleDays(dateString: string): number {
  return Math.floor(
    (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24)
  );
}

/** Color-coded staleness: green ≤3d, yellow 4-7d, orange 8-14d, red 15d+ */
function getStaleColor(days: number): string {
  if (days <= 3) return '#10b981';
  if (days <= 7) return '#eab308';
  if (days <= 14) return '#f97316';
  return '#ef4444';
}

// Ring Decay constants — SVG circle ring that depletes with staleness
const RING_RADIUS = 10;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ~62.83

/** Ring offset: 1d = nearly full, 21d+ = nearly empty */
function getRingOffset(days: number): number {
  const maxDays = 21;
  const ratio = Math.min(days / maxDays, 1);
  return RING_CIRCUMFERENCE * ratio * 0.95; // cap at 95% empty
}

interface RecommendationReason {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

/** Contextual banner: tells the user WHY this project is recommended */
function getRecommendationReason(project: Project, staleDays: number): RecommendationReason {
  const isHighPriority = project.priority === 'P0' || project.priority === 'P1';
  const isCloseToFinish = project.progress >= 75;
  const isCriticallyStale = staleDays >= 15;
  const isStale = staleDays >= 7;

  // Priority 1: Critically stale — red urgency
  if (isCriticallyStale) {
    return {
      icon: 'warning-outline',
      text: `${staleDays} days idle — project at risk!`,
      color: '#ef4444',
      bgColor: 'rgba(239,68,68,0.12)',
      borderColor: 'rgba(239,68,68,0.15)',
    };
  }

  // Priority 2: Close to finish + stale — push to finish
  if (isCloseToFinish && staleDays >= 3) {
    return {
      icon: 'trophy-outline',
      text: `${project.progress}% done — finish strong!`,
      color: '#10b981',
      bgColor: 'rgba(16,185,129,0.10)',
      borderColor: 'rgba(16,185,129,0.15)',
    };
  }

  // Priority 3: Close to finish (not stale) — momentum
  if (isCloseToFinish) {
    return {
      icon: 'rocket-outline',
      text: `Almost there at ${project.progress}% — push to the finish line`,
      color: '#10b981',
      bgColor: 'rgba(16,185,129,0.10)',
      borderColor: 'rgba(16,185,129,0.15)',
    };
  }

  // Priority 4: Stale (7-14d)
  if (isStale) {
    return {
      icon: 'time-outline',
      text: `Idle for ${staleDays}d — pick up where you left off`,
      color: staleDays >= 8 ? '#f97316' : '#eab308',
      bgColor: staleDays >= 8 ? 'rgba(249,115,22,0.12)' : 'rgba(234,179,8,0.10)',
      borderColor: staleDays >= 8 ? 'rgba(249,115,22,0.15)' : 'rgba(234,179,8,0.15)',
    };
  }

  // Priority 5: High priority + somewhat stale
  if (isHighPriority && staleDays >= 2) {
    return {
      icon: 'flag-outline',
      text: `${project.priority} priority — needs your attention`,
      color: '#f97316',
      bgColor: 'rgba(249,115,22,0.10)',
      borderColor: 'rgba(249,115,22,0.12)',
    };
  }

  // Priority 6: High priority (fresh)
  if (isHighPriority) {
    return {
      icon: 'flag-outline',
      text: `${project.priority} priority — keep the momentum`,
      color: '#0ea5e9',
      bgColor: 'rgba(14,165,233,0.10)',
      borderColor: 'rgba(14,165,233,0.12)',
    };
  }

  // Default: Show progress encouragement
  if (project.progress > 0) {
    return {
      icon: 'trending-up-outline',
      text: `${project.progress}% progress — keep building`,
      color: '#10b981',
      bgColor: 'rgba(16,185,129,0.08)',
      borderColor: 'rgba(16,185,129,0.12)',
    };
  }

  // Brand new project
  return {
    icon: 'sparkles-outline',
    text: 'Just started — build the first milestone',
    color: '#0ea5e9',
    bgColor: 'rgba(14,165,233,0.08)',
    borderColor: 'rgba(14,165,233,0.12)',
  };
}

const PRIORITY_SCORE: Record<string, number> = {
  P0: 20,
  P1: 10,
  P2: 5,
  P3: 0,
};

/**
 * Score projects by urgency to continue.
 * Factors: staleness (needs attention), proximity to completion (high value to finish), priority.
 * A project stale for 20 days at 90% progress scores higher than one stale 30 days at 20%.
 */
function getRecommendationScore(project: Project): number {
  const staleDays = Math.min(getStaleDays(project.lastUpdated), 60);
  const completionProximity = project.progress; // 0-100
  const priorityBonus = PRIORITY_SCORE[project.priority] ?? 0;

  // Weight completion proximity more heavily — finishing projects is high value
  return (staleDays * 2) + (completionProximity * 1.5) + priorityBonus;
}

export default function DashboardScreen() {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const projects = useAppStore((s) => s.projects);
  const tasks = useAppStore((s) => s.tasks);
  const lastSynced = useAppStore((s) => s.lastSynced);
  const isOnboarded = useOnboardingStore((s) => s.isOnboarded);

  // Auto-detect new repos on GitHub not yet tracked in Orbit
  const [untrackedRepos, setUntrackedRepos] = useState<UntrackedRepo[]>([]);
  const [showNewReposBanner, setShowNewReposBanner] = useState(false);

  useEffect(() => {
    if (!isOnboarded) return;
    detectNewRepos()
      .then((result) => {
        if (result.untrackedRepos.length > 0) {
          setUntrackedRepos(result.untrackedRepos);
          setShowNewReposBanner(true);
        }
      })
      .catch(() => {
        // Silently fail — sync check is non-critical
      });
  }, [isOnboarded]);

  // Smart recommendation: rank all incomplete projects by urgency score
  const rankedProjects = useMemo(() => {
    if (projects.length === 0) return [];
    const incomplete = projects.filter((p) => p.progress < 100);
    if (incomplete.length === 0) return [projects[0]];
    return [...incomplete].sort(
      (a, b) => getRecommendationScore(b) - getRecommendationScore(a)
    );
  }, [projects]);

  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const phaseCounts = useMemo(() => {
    const counts: Record<ProjectPhase, number> = {
      design: 0, engineering: 0, build: 0, launch: 0, closure: 0,
    };
    projects.forEach((p) => {
      counts[p.currentPhase] = (counts[p.currentPhase] || 0) + 1;
    });
    return counts;
  }, [projects]);

  const needsAttention = useMemo(() => {
    const items: AttentionItem[] = [];

    projects.forEach((p) => {
      const daysSince = getStaleDays(p.lastUpdated);
      if (daysSince >= 5) {
        // Score: projects closer to completion rank higher
        const score = (daysSince * 2) + (p.progress * 1.5) + (PRIORITY_SCORE[p.priority] ?? 0);
        items.push({
          id: `stale-${p.id}`,
          projectId: p.id,
          label: p.name,
          subtitle: `No activity for ${daysSince} days · ${p.progress}% done`,
          type: 'stale',
          dotColor: '#eab308',
          icon: 'time-outline',
          score,
        });
      }
    });

    tasks.forEach((t) => {
      if (t.status === 'blocked') {
        items.push({
          id: `blocked-${t.id}`,
          projectId: t.projectId,
          label: t.title,
          subtitle: 'Blocked — needs unblocking',
          type: 'blocked',
          dotColor: '#ef4444',
          icon: 'alert-circle-outline',
          score: 200, // Blockers always high priority
        });
      }
      if (t.dueDate) {
        const due = new Date(t.dueDate);
        const daysUntil = Math.ceil(
          (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntil <= 3 && daysUntil > 0 && t.status !== 'completed') {
          items.push({
            id: `due-${t.id}`,
            projectId: t.projectId,
            label: t.title,
            subtitle: `Due in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`,
            type: 'overdue',
            dotColor: '#ef4444',
            icon: 'alert-circle-outline',
            score: 180 + (3 - daysUntil) * 10,
          });
        } else if (due < new Date() && t.status !== 'completed') {
          items.push({
            id: `overdue-${t.id}`,
            projectId: t.projectId,
            label: t.title,
            subtitle: 'Overdue',
            type: 'overdue',
            dotColor: '#ef4444',
            icon: 'alert-circle-outline',
            score: 250, // Overdue is critical
          });
        }
      }
    });

    // Sort by score — blockers and overdue first, then stale projects closer to shipping
    return items.sort((a, b) => b.score - a.score);
  }, [projects, tasks]);

  const streakDays = 14;
  const bestStreak = 23;
  const deepWorkDays = 4;
  const isLight = mode === 'light';

  // Carousel: card width = screen width minus horizontal padding (spacing.xl * 2)
  const cardWidth = Dimensions.get('window').width - (spacing.xl * 2);

  const onCarouselScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / cardWidth);
      setActiveCardIndex(index);
    },
    [cardWidth],
  );

  const styles = makeStyles(colors, insets, mode);

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.name}>Arun</Text>
          <Text style={styles.dateText}>{getFormattedDate()}</Text>
        </View>
        <TouchableOpacity style={styles.notificationBell}>
          <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
          {needsAttention.length > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{needsAttention.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* New Repos Detected Banner */}
        {showNewReposBanner && untrackedRepos.length > 0 && (
          <Pressable
            style={{
              backgroundColor: 'rgba(14, 165, 233, 0.08)',
              borderWidth: 1,
              borderColor: 'rgba(14, 165, 233, 0.15)',
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              marginBottom: spacing.lg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
            }}
            onPress={() =>
              router.push({
                pathname: '/new-repos',
                params: { repos: JSON.stringify(untrackedRepos) },
              })
            }
          >
            <Text style={{ fontSize: 20 }}>📡</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: fontSize.md,
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: 2,
                }}
              >
                {untrackedRepos.length} new repo
                {untrackedRepos.length !== 1 ? 's' : ''} detected
              </Text>
              <Text
                style={{
                  fontSize: fontSize.xs,
                  color: colors.textSecondary,
                }}
              >
                {untrackedRepos
                  .slice(0, 3)
                  .map((r) => r.name)
                  .join(', ')}
                {untrackedRepos.length > 3
                  ? ` +${untrackedRepos.length - 3} more`
                  : ''}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        )}

        {/* Stats Row — Gradient Cards with Watermark Icons */}
        <View style={styles.statsRow}>
          <LinearGradient
            colors={isLight ? ['#d1fae5', '#a7f3d0'] : ['#065f46', '#10b981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statWatermark}>
              <Ionicons name="flame" size={64} color={isLight ? '#065f46' : '#ffffff'} />
            </View>
            <Text style={[styles.statValue, isLight && { color: '#111827' }]}>
              {streakDays} <Text style={[styles.statUnit, isLight && { color: '#065f46' }]}>days</Text>
            </Text>
            <Text style={[styles.statLabel, isLight && { color: '#065f46' }]}>Current Streak</Text>
            <Text style={[styles.statSubtitle, isLight && { color: '#6b7280' }]}>Best: {bestStreak} days</Text>
          </LinearGradient>

          <LinearGradient
            colors={isLight ? ['#dbeafe', '#bae6fd'] : ['#0c4a6e', '#0ea5e9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statWatermark}>
              <Ionicons name="flash" size={64} color={isLight ? '#0c4a6e' : '#ffffff'} />
            </View>
            <Text style={[styles.statValue, isLight && { color: '#111827' }]}>
              {deepWorkDays} <Text style={[styles.statUnit, isLight && { color: '#0c4a6e' }]}>days</Text>
            </Text>
            <Text style={[styles.statLabel, isLight && { color: '#0c4a6e' }]}>Deep Work</Text>
            <Text style={[styles.statSubtitle, isLight && { color: '#6b7280' }]}>This week (6h+)</Text>
          </LinearGradient>
        </View>

        {/* Continue Where You Left Off — Horizontal Carousel */}
        {rankedProjects.length > 0 && (
          <View style={styles.carouselContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onCarouselScroll}
              scrollEventThrottle={16}
              decelerationRate="fast"
              snapToInterval={cardWidth + spacing.md}
              snapToAlignment="start"
              contentContainerStyle={{ gap: spacing.md }}
            >
              {rankedProjects.map((project) => {
                const staleDays = getStaleDays(project.lastUpdated);
                const staleColor = getStaleColor(staleDays);
                const ringOffset = getRingOffset(staleDays);
                const reason = getRecommendationReason(project, staleDays);

                return (
                  <View
                    key={project.id}
                    style={[
                      styles.continueCard,
                      { width: cardWidth },
                      staleDays >= 15 && { borderColor: 'rgba(239,68,68,0.3)' },
                    ]}
                  >
                    <View style={[
                      styles.continueAccent,
                      staleDays >= 7 && staleDays < 15 && { backgroundColor: '#eab308' },
                      staleDays >= 15 && { backgroundColor: '#ef4444' },
                    ]} />
                    <View style={styles.continueContent}>
                      {/* Smart Banner — always visible, explains WHY this is recommended */}
                      <View style={[
                        styles.staleBanner,
                        { backgroundColor: reason.bgColor, borderBottomColor: reason.borderColor },
                      ]}>
                        <Ionicons name={reason.icon} size={14} color={reason.color} />
                        <Text style={[styles.staleBannerText, { color: reason.color }]}>
                          {reason.text}
                        </Text>
                      </View>

                      <View style={styles.continueLabelRow}>
                        <Text style={styles.continueLabel}>CONTINUE</Text>
                        {/* Ring Decay — always visible when stale */}
                        {staleDays > 0 && (
                          <View style={styles.staleRingRow}>
                            <Text style={[styles.staleRingLabel, { color: staleColor }]}>idle</Text>
                            <View style={styles.staleRingWrap}>
                              <Svg width={26} height={26} viewBox="0 0 24 24">
                                <SvgCircle
                                  cx={12} cy={12} r={RING_RADIUS}
                                  stroke={isLight ? '#e5e7eb' : '#27272a'}
                                  strokeWidth={3} fill="none"
                                />
                                <SvgCircle
                                  cx={12} cy={12} r={RING_RADIUS}
                                  stroke={staleColor}
                                  strokeWidth={3} fill="none"
                                  strokeLinecap="round"
                                  strokeDasharray={`${RING_CIRCUMFERENCE}`}
                                  strokeDashoffset={`${ringOffset}`}
                                  transform="rotate(-90 12 12)"
                                />
                              </Svg>
                              <Text style={[styles.staleRingNum, { color: staleColor }]}>
                                {staleDays}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                      <Text style={styles.continueProjectName}>{project.name}</Text>

                      <View style={styles.progressRow}>
                        <View style={styles.progressBarContainer}>
                          <View
                            style={[styles.progressBarFill, { width: `${project.progress}%` }]}
                          />
                        </View>
                        <Text style={styles.progressPercent}>{project.progress}%</Text>
                      </View>

                      <Text style={styles.progressPhase}>
                        {PHASE_LABELS[project.currentPhase]} phase
                      </Text>

                      <TouchableOpacity
                        style={styles.continueButton}
                        onPress={() => router.push(`/project/${project.id}`)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.continueButtonText}>Open Project</Text>
                        <Ionicons name="arrow-forward" size={14} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Pagination dots */}
            {rankedProjects.length > 1 && (
              <View style={styles.paginationRow}>
                {rankedProjects.map((p, i) => (
                  <View
                    key={p.id}
                    style={[
                      styles.paginationDot,
                      i === activeCardIndex && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Pipeline — Connected Flow */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>PIPELINE</Text>
          <View style={styles.pipelineCard}>
            {(Object.keys(PHASE_LABELS) as ProjectPhase[]).map((phase, index) => (
              <View key={phase} style={styles.pipelineNodeWrapper}>
                {index > 0 && <View style={styles.pipelineLine} />}
                <View style={styles.pipelineNode}>
                  <View style={[styles.pipelineCircle, { backgroundColor: PHASE_COLORS[phase] }]}>
                    <Text style={styles.pipelineCount}>{phaseCounts[phase]}</Text>
                  </View>
                  <Text style={styles.pipelineLabel}>{PHASE_LABELS[phase]}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Needs Attention */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>NEEDS ATTENTION</Text>
            {needsAttention.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{needsAttention.length}</Text>
              </View>
            )}
          </View>

          {needsAttention.length === 0 ? (
            <View style={styles.card}>
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={24} color={colors.textMuted} />
                <Text style={styles.emptyText}>All clear. No items need attention.</Text>
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              {needsAttention.map((item, index) => {
                // Build deep-link: for task items, include taskId param
                const taskId = item.id.startsWith('blocked-') || item.id.startsWith('due-') || item.id.startsWith('overdue-')
                  ? item.id.split('-').slice(1).join('-')
                  : undefined;
                const href = item.projectId
                  ? `/project/${item.projectId}${taskId ? `?taskId=${taskId}` : ''}`
                  : undefined;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.attentionItem,
                      index < needsAttention.length - 1 && styles.attentionItemBorder,
                    ]}
                    onPress={() => href && router.push(href)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.attentionDot, { backgroundColor: item.dotColor }]} />
                    <View style={styles.attentionContent}>
                      <Text style={styles.attentionLabel}>{item.label}</Text>
                      <Text style={styles.attentionSubtitle}>{item.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Sync Footer */}
        <View style={styles.syncFooter}>
          <Ionicons name="checkmark-circle-outline" size={13} color={colors.textMuted} />
          <Text style={styles.syncText}>
            {lastSynced ? `Synced ${getTimeAgo(lastSynced)}` : 'Not synced'}
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/voice-capture')}
        activeOpacity={0.8}
      >
        <Ionicons name="mic" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  insets: { top: number; bottom: number },
  mode: string
) {
  const isLight = mode === 'light';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xxxl,
    },

    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingTop: insets.top + spacing.lg,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xl,
      backgroundColor: colors.background,
    },
    greeting: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
      fontWeight: '400',
    },
    name: {
      fontSize: 26,
      color: colors.textPrimary,
      fontWeight: '700',
      marginTop: 2,
      letterSpacing: -0.3,
    },
    dateText: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      marginTop: 4,
      fontWeight: '400',
    },
    notificationBell: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isLight ? colors.surfaceSecondary : colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 6,
    },
    notifBadge: {
      position: 'absolute',
      top: -3,
      right: -3,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: '#10b981',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    notifBadgeText: {
      fontSize: 9,
      fontWeight: '700',
      color: '#ffffff',
    },

    // Stats Row — Gradient Cards with Watermark
    statsRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    statCard: {
      flex: 1,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      paddingBottom: 12,
      overflow: 'hidden',
      position: 'relative',
    },
    statWatermark: {
      position: 'absolute',
      top: -6,
      right: -6,
      opacity: isLight ? 0.06 : 0.08,
    },
    statValue: {
      fontSize: 28,
      fontWeight: '800',
      color: '#ffffff',
      letterSpacing: -0.5,
      lineHeight: 32,
    },
    statUnit: {
      fontSize: 12,
      fontWeight: '400',
      opacity: 0.7,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.6)',
      marginTop: 4,
    },
    statSubtitle: {
      fontSize: 9,
      color: 'rgba(255,255,255,0.4)',
      marginTop: 2,
      fontWeight: '400',
    },

    // Continue Card Carousel
    carouselContainer: {
      marginBottom: spacing.xl,
    },
    continueCard: {
      flexDirection: 'row',
      backgroundColor: isLight ? colors.surface : colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: isLight ? colors.border : colors.border,
      overflow: 'hidden',
    },
    paginationRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
    },
    paginationDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: isLight ? '#d1d5db' : '#3f3f46',
    },
    paginationDotActive: {
      width: 18,
      borderRadius: 3,
      backgroundColor: '#10b981',
    },
    continueAccent: {
      width: 3,
      backgroundColor: '#10b981',
    },
    continueContent: {
      flex: 1,
      padding: spacing.lg,
    },
    continueLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    continueLabel: {
      fontSize: 10,
      color: colors.textMuted,
      fontWeight: '600',
      letterSpacing: 1,
    },
    // Stale Banner Alert (7d+ idle)
    staleBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginTop: -spacing.lg,
      marginLeft: -spacing.lg,
      marginRight: -spacing.lg,
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'transparent',
    },
    staleBannerText: {
      fontSize: 11,
      fontWeight: '600',
      flex: 1,
    },
    // Ring Decay indicator
    staleRingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    staleRingLabel: {
      fontSize: 9,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    staleRingWrap: {
      width: 26,
      height: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    staleRingNum: {
      position: 'absolute',
      fontSize: 10,
      fontWeight: '800',
    },
    continueProjectName: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: 6,
    },
    progressBarContainer: {
      flex: 1,
      height: 4,
      backgroundColor: isLight ? colors.borderLight : colors.surfaceSecondary,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: '#10b981',
      borderRadius: 2,
    },
    progressPercent: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    progressPhase: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      fontWeight: '400',
      marginBottom: spacing.lg,
    },
    continueButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: '#10b981',
      borderRadius: borderRadius.md,
      paddingVertical: 10,
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.xl,
    },
    continueButtonText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: '#ffffff',
    },

    // Section
    sectionContainer: {
      marginBottom: spacing.xl,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
      letterSpacing: 0.8,
      marginBottom: spacing.md,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },

    // Pipeline — Connected Flow
    pipelineCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isLight ? colors.surface : colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: isLight ? colors.border : colors.border,
      paddingVertical: 14,
      paddingHorizontal: 10,
    },
    pipelineNodeWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    pipelineLine: {
      width: 14,
      height: 2,
      backgroundColor: isLight ? colors.borderLight : colors.border,
      marginTop: -14,
    },
    pipelineNode: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    pipelineCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pipelineLabel: {
      fontSize: 8,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    pipelineCount: {
      fontSize: 13,
      fontWeight: '800',
      color: '#ffffff',
    },

    // Attention
    countBadge: {
      backgroundColor: isLight ? '#fef3c7' : '#422006',
      paddingHorizontal: 7,
      paddingVertical: 1,
      borderRadius: borderRadius.full,
    },
    countBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#d97706',
    },
    card: {
      backgroundColor: isLight ? colors.surface : colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: isLight ? colors.border : colors.border,
    },
    emptyState: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xxl,
    },
    emptyText: {
      fontSize: fontSize.sm,
      color: colors.textMuted,
      fontWeight: '400',
    },
    attentionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    attentionItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: isLight ? colors.borderLight : colors.border,
    },
    attentionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    attentionContent: {
      flex: 1,
    },
    attentionLabel: {
      fontSize: fontSize.sm,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    attentionSubtitle: {
      fontSize: fontSize.xs,
      fontWeight: '400',
      color: colors.textSecondary,
      marginTop: 2,
    },

    // Sync Footer
    syncFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: spacing.lg,
    },
    syncText: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      fontWeight: '400',
    },

    // FAB
    fab: {
      position: 'absolute',
      bottom: spacing.xxl,
      right: spacing.xl,
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: '#10b981',
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
        android: { elevation: 6 },
        web: { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
      }),
    },
  });
}

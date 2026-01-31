import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme/ThemeContext';
import { spacing, fontSize, borderRadius } from '../src/theme/spacing';
import { UntrackedRepo, addRepoToOrbit } from '../src/services/sync';
import {
  setupRepo,
  RepoSetupProgress,
  RepoSetupResult,
} from '../src/services/repo-agent';

type RepoAction = 'idle' | 'adding' | 'setting-up' | 'done' | 'error';

interface RepoState {
  action: RepoAction;
  improveReadme: boolean;
  progress: string;
  result: RepoSetupResult | null;
  error: string | null;
}

export default function NewReposScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ repos: string }>();

  const repos: UntrackedRepo[] = params.repos
    ? JSON.parse(params.repos)
    : [];

  const [repoStates, setRepoStates] = useState<Record<string, RepoState>>(
    () => {
      const initial: Record<string, RepoState> = {};
      for (const repo of repos) {
        initial[repo.name] = {
          action: 'idle',
          improveReadme: true,
          progress: '',
          result: null,
          error: null,
        };
      }
      return initial;
    }
  );

  const styles = makeStyles(colors, insets);

  function updateRepoState(name: string, updates: Partial<RepoState>) {
    setRepoStates((prev) => ({
      ...prev,
      [name]: { ...prev[name], ...updates },
    }));
  }

  async function handleAddSimple(repo: UntrackedRepo) {
    updateRepoState(repo.name, { action: 'adding', error: null });
    try {
      await addRepoToOrbit(repo);
      updateRepoState(repo.name, {
        action: 'done',
        result: {
          addedToOrbit: true,
          readmeImproved: false,
          readmeHealth: 'unknown',
          readmeIssues: [],
          languages: repo.language ? [repo.language] : [],
          errors: [],
        },
      });
    } catch (e) {
      updateRepoState(repo.name, {
        action: 'error',
        error: (e as Error).message,
      });
    }
  }

  async function handleSetupWithAgent(repo: UntrackedRepo) {
    const state = repoStates[repo.name];
    updateRepoState(repo.name, { action: 'setting-up', error: null });

    try {
      const result = await setupRepo(
        repo,
        state.improveReadme,
        (p: RepoSetupProgress) => {
          updateRepoState(repo.name, { progress: p.message });
        }
      );

      updateRepoState(repo.name, {
        action: 'done',
        result,
      });
    } catch (e) {
      updateRepoState(repo.name, {
        action: 'error',
        error: (e as Error).message,
      });
    }
  }

  function renderRepo({ item }: { item: UntrackedRepo }) {
    const state = repoStates[item.name];

    return (
      <View style={styles.repoCard}>
        <View style={styles.repoHeader}>
          <View style={styles.repoNameRow}>
            <Text style={styles.repoName}>{item.name}</Text>
            {item.isPrivate && <Text style={styles.lockIcon}>🔒</Text>}
          </View>
          {item.description && (
            <Text style={styles.repoDesc} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.repoMeta}>
            {item.language && (
              <View style={styles.langBadge}>
                <Text style={styles.langText}>{item.language}</Text>
              </View>
            )}
            <Text style={styles.lastPush}>
              {item.daysSinceLastPush === 0
                ? 'today'
                : `${item.daysSinceLastPush}d ago`}
            </Text>
          </View>
        </View>

        {/* Actions based on state */}
        {state.action === 'idle' && (
          <View style={styles.actions}>
            <View style={styles.readmeToggle}>
              <Text style={styles.readmeToggleLabel}>Improve README</Text>
              <Switch
                value={state.improveReadme}
                onValueChange={(val) =>
                  updateRepoState(item.name, { improveReadme: val })
                }
                trackColor={{
                  false: colors.border,
                  true: colors.primaryDark,
                }}
                thumbColor={
                  state.improveReadme ? colors.primary : colors.textMuted
                }
              />
            </View>
            <View style={styles.buttonRow}>
              <Pressable
                style={styles.addButton}
                onPress={() => handleAddSimple(item)}
              >
                <Text style={styles.addButtonText}>Add to Orbit</Text>
              </Pressable>
              <Pressable
                style={styles.agentButton}
                onPress={() => handleSetupWithAgent(item)}
              >
                <Ionicons name="sparkles" size={14} color="#a78bfa" />
                <Text style={styles.agentButtonText}>
                  Set up with Agent
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {(state.action === 'adding' || state.action === 'setting-up') && (
          <View style={styles.progressRow}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.progressText}>
              {state.action === 'adding'
                ? 'Adding to Orbit...'
                : state.progress || 'Setting up...'}
            </Text>
          </View>
        )}

        {state.action === 'done' && state.result && (
          <View style={styles.doneRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <View style={styles.doneInfo}>
              <Text style={styles.doneText}>Added to Orbit</Text>
              {state.result.readmeImproved && (
                <Text style={styles.doneDetail}>README improved</Text>
              )}
              {state.result.readmeHealth === 'weak' &&
                !state.result.readmeImproved && (
                  <Text style={[styles.doneDetail, { color: colors.warning }]}>
                    README is weak — {state.result.readmeIssues.length} issues
                  </Text>
                )}
              {state.result.readmeHealth === 'missing' &&
                !state.result.readmeImproved && (
                  <Text style={[styles.doneDetail, { color: colors.danger }]}>
                    No README found
                  </Text>
                )}
              {state.result.languages.length > 0 && (
                <Text style={styles.doneDetail}>
                  Tech: {state.result.languages.slice(0, 3).join(', ')}
                </Text>
              )}
            </View>
          </View>
        )}

        {state.action === 'error' && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{state.error}</Text>
            <Pressable
              onPress={() =>
                updateRepoState(item.name, { action: 'idle', error: null })
              }
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  const doneCount = Object.values(repoStates).filter(
    (s) => s.action === 'done'
  ).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>New repos detected</Text>
          <Text style={styles.subtitle}>
            {repos.length} repo{repos.length !== 1 ? 's' : ''} on GitHub not
            yet tracked in Orbit
          </Text>
        </View>
      </View>

      <FlatList
        data={repos}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderRepo}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {doneCount > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {doneCount} repo{doneCount !== 1 ? 's' : ''} added
          </Text>
          <Pressable
            style={styles.doneButton}
            onPress={() => router.back()}
          >
            <Text style={styles.doneButtonText}>Back to Dashboard</Text>
          </Pressable>
        </View>
      )}
    </View>
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
      paddingTop: insets.top + spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingHorizontal: spacing.xxl,
      marginBottom: spacing.lg,
    },
    backBtn: {
      marginTop: 4,
    },
    headerText: {
      flex: 1,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    list: {
      paddingHorizontal: spacing.xxl,
      paddingBottom: spacing.xxxl,
    },
    repoCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    repoHeader: {
      marginBottom: spacing.md,
    },
    repoNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: 4,
    },
    repoName: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    lockIcon: {
      fontSize: 12,
    },
    repoDesc: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      lineHeight: 20,
    },
    repoMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    langBadge: {
      backgroundColor: 'rgba(14, 165, 233, 0.1)',
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    langText: {
      fontSize: fontSize.xs,
      color: '#0ea5e9',
      fontWeight: '500',
    },
    lastPush: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
    },
    actions: {
      gap: spacing.md,
    },
    readmeToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
    },
    readmeToggleLabel: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    addButton: {
      flex: 1,
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    addButtonText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    agentButton: {
      flex: 1,
      backgroundColor: 'rgba(139, 92, 246, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.15)',
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    agentButtonText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: '#a78bfa',
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    progressText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    doneRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    doneInfo: {
      flex: 1,
      gap: 2,
    },
    doneText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.success,
    },
    doneDetail: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
    },
    errorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    errorText: {
      flex: 1,
      fontSize: fontSize.xs,
      color: colors.danger,
    },
    retryText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.primary,
    },
    footer: {
      paddingHorizontal: spacing.xxl,
      paddingBottom: insets.bottom + spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: spacing.sm,
    },
    footerText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    doneButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
    },
    doneButtonText: {
      fontSize: fontSize.md,
      fontWeight: '700',
      color: '#ffffff',
    },
  });
}

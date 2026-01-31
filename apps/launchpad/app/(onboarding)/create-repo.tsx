import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, borderRadius } from '../../src/theme/spacing';
import {
  createTaskboardRepo,
  taskboardRepoExists,
} from '../../src/services/github';
import { useOnboardingStore } from '../../src/store/onboarding';

export default function CreateRepoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const username = useOnboardingStore((s) => s.githubUsername);
  const setCurrentStep = useOnboardingStore((s) => s.setCurrentStep);

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = makeStyles(colors, insets);

  async function handleCreate() {
    if (!username) return;

    setIsCreating(true);
    setError(null);

    try {
      // Check if repo already exists
      const exists = await taskboardRepoExists(username);

      if (!exists) {
        await createTaskboardRepo();
      }

      setCurrentStep('scan-results');
      router.push('/(onboarding)/scan-results');
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes('name already exists')) {
        // Repo exists, continue
        setCurrentStep('scan-results');
        router.push('/(onboarding)/scan-results');
      } else {
        setError(msg || 'Failed to create repo');
      }
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.stepLabel}>STEP 2 OF 5</Text>
          <Text style={styles.title}>Create workspace</Text>
          <Text style={styles.subtitle}>
            Orbit needs a private repo to store your project data. This is
            where your tasks, notes, and settings live.
          </Text>
        </View>

        <View style={styles.repoCard}>
          <View style={styles.repoIconRow}>
            <Text style={styles.repoIcon}>🔒</Text>
            <View style={styles.privateBadge}>
              <Text style={styles.privateBadgeText}>Private</Text>
            </View>
          </View>

          <Text style={styles.repoName}>
            github.com/{username}/.taskboard
          </Text>

          <View style={styles.divider} />

          <View style={styles.fileList}>
            <FileRow name="projects.json" desc="Your tracked projects" colors={colors} />
            <FileRow name="tasks.json" desc="Tasks and to-dos" colors={colors} />
            <FileRow name="inbox.json" desc="Ideas and captures" colors={colors} />
            <FileRow name="config.json" desc="Your preferences" colors={colors} />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Only you can see this repo. Orbit reads and writes to it to keep
            your data in sync across devices.
          </Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.primaryButton, isCreating && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Create & Continue</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FileRow({
  name,
  desc,
  colors,
}: {
  name: string;
  desc: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={fileStyles(colors).row}>
      <Text style={fileStyles(colors).name}>{name}</Text>
      <Text style={fileStyles(colors).desc}>{desc}</Text>
    </View>
  );
}

function fileStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    name: {
      fontSize: fontSize.sm,
      fontWeight: '500',
      color: colors.textPrimary,
      fontFamily: 'monospace',
    },
    desc: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
    },
  });
}

function makeStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  insets: { top: number; bottom: number }
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top + spacing.xxl,
      paddingBottom: insets.bottom + spacing.lg,
      paddingHorizontal: spacing.xxl,
    },
    content: {
      flex: 1,
    },
    header: {
      marginBottom: spacing.xxl,
    },
    stepLabel: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: colors.primary,
      letterSpacing: 1,
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    repoCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.xl,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.lg,
    },
    repoIconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    repoIcon: {
      fontSize: 20,
    },
    privateBadge: {
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.2)',
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    privateBadgeText: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: colors.primary,
    },
    repoName: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'monospace',
      marginBottom: spacing.lg,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginBottom: spacing.md,
    },
    fileList: {
      gap: 0,
    },
    infoBox: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
    },
    infoText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    errorBox: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.2)',
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginTop: spacing.md,
    },
    errorText: {
      fontSize: fontSize.sm,
      color: colors.danger,
    },
    footer: {
      gap: spacing.md,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.lg,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    primaryButtonText: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: '#ffffff',
    },
    backButton: {
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    backButtonText: {
      fontSize: fontSize.md,
      color: colors.textMuted,
    },
  });
}

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, borderRadius } from '../../src/theme/spacing';

export default function CompleteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    projectCount: string;
    filesCreated: string;
    readmesImproved: string;
  }>();

  const projectCount = parseInt(params.projectCount || '0', 10);
  const filesCreated = parseInt(params.filesCreated || '0', 10);
  const readmesImproved = parseInt(params.readmesImproved || '0', 10);

  const styles = makeStyles(colors, insets);

  function handleOpenDashboard() {
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🪐</Text>
        <Text style={styles.title}>You're all set</Text>
        <Text style={styles.subtitle}>
          Your Orbit workspace is ready. Here's what we set up:
        </Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{projectCount}</Text>
            <Text style={styles.statLabel}>
              Project{projectCount !== 1 ? 's' : ''} tracked
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{filesCreated}</Text>
            <Text style={styles.statLabel}>
              File{filesCreated !== 1 ? 's' : ''} created
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>Private repo</Text>
          </View>
        </View>

        {readmesImproved > 0 && (
          <View style={styles.readmeBanner}>
            <Text style={styles.readmeBannerIcon}>📝</Text>
            <Text style={styles.readmeBannerText}>
              Improved {readmesImproved} README{readmesImproved !== 1 ? 's' : ''}{' '}
              with badges, tech stack, and structure
            </Text>
          </View>
        )}

        <View style={styles.klaritySection}>
          <Text style={styles.klaritySectionTitle}>
            Also use Klarity on desktop?
          </Text>
          <Text style={styles.klaritySectionDesc}>
            Run this command on your laptop to sync your workspace locally:
          </Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>npx orbit-setup</Text>
          </View>
          <Text style={styles.klarityNote}>
            Optional — Orbit works standalone on your phone.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={styles.primaryButton}
          onPress={handleOpenDashboard}
        >
          <Text style={styles.primaryButtonText}>Open Dashboard</Text>
        </Pressable>
      </View>
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
      paddingTop: insets.top + spacing.xxxl,
      paddingBottom: insets.bottom + spacing.lg,
      paddingHorizontal: spacing.xxl,
    },
    content: {
      flex: 1,
      alignItems: 'center',
    },
    icon: {
      fontSize: 56,
      marginBottom: spacing.xxl,
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
      textAlign: 'center',
      marginBottom: spacing.xxl,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.xxl,
      width: '100%',
    },
    statCard: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: 'rgba(16, 185, 129, 0.05)',
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.1)',
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.lg,
    },
    statNumber: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.primary,
    },
    statLabel: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    readmeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: 'rgba(245, 158, 11, 0.05)',
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.1)',
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      width: '100%',
      marginBottom: spacing.xxl,
    },
    readmeBannerIcon: {
      fontSize: 20,
    },
    readmeBannerText: {
      flex: 1,
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    klaritySection: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    klaritySectionTitle: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    klaritySectionDesc: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    codeBlock: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    codeText: {
      fontSize: fontSize.md,
      fontFamily: 'monospace',
      color: colors.primary,
      fontWeight: '600',
    },
    klarityNote: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      fontStyle: 'italic',
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
    primaryButtonText: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: '#ffffff',
    },
  });
}

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, borderRadius } from '../../src/theme/spacing';
import { scanRepos, ScanProgress, ScannedRepo, getReadmeSummary } from '../../src/services/scanner';
import { useOnboardingStore } from '../../src/store/onboarding';

export default function ScanResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const scannedRepos = useOnboardingStore((s) => s.scannedRepos);
  const setScannedRepos = useOnboardingStore((s) => s.setScannedRepos);
  const toggleRepoSelection = useOnboardingStore((s) => s.toggleRepoSelection);
  const setCurrentStep = useOnboardingStore((s) => s.setCurrentStep);

  const [isScanning, setIsScanning] = useState(true);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const styles = makeStyles(colors, insets);

  useEffect(() => {
    startScan();
  }, []);

  async function startScan() {
    setIsScanning(true);
    setError(null);

    try {
      const repos = await scanRepos((p) => setProgress(p));
      setScannedRepos(repos);
    } catch (e) {
      setError((e as Error).message || 'Failed to scan repos');
    } finally {
      setIsScanning(false);
    }
  }

  const selectedCount = scannedRepos.filter((r) => r.selected).length;
  const readmeSummary = getReadmeSummary(scannedRepos);

  function renderRepo({ item }: { item: ScannedRepo }) {
    return (
      <Pressable
        style={[
          styles.repoCard,
          item.selected && styles.repoCardSelected,
        ]}
        onPress={() => toggleRepoSelection(item.id)}
      >
        <View style={styles.repoRow}>
          <View
            style={[
              styles.checkbox,
              item.selected && styles.checkboxSelected,
            ]}
          >
            {item.selected && <Text style={styles.checkmark}>✓</Text>}
          </View>

          <View style={styles.repoInfo}>
            <View style={styles.repoNameRow}>
              <Text style={styles.repoName}>{item.name}</Text>
              {item.isPrivate && (
                <Text style={styles.privateBadge}>🔒</Text>
              )}
            </View>

            {item.description && (
              <Text style={styles.repoDesc} numberOfLines={1}>
                {item.description}
              </Text>
            )}

            <View style={styles.repoMeta}>
              {item.language && (
                <View style={styles.metaBadge}>
                  <Text style={styles.metaText}>{item.language}</Text>
                </View>
              )}

              <View
                style={[
                  styles.statusBadge,
                  item.status === 'active' && styles.statusActive,
                  item.status === 'stale' && styles.statusStale,
                  item.status === 'inactive' && styles.statusInactive,
                  item.status === 'archived' && styles.statusArchived,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    item.status === 'active' && styles.statusTextActive,
                    item.status === 'stale' && styles.statusTextStale,
                    item.status === 'inactive' && styles.statusTextInactive,
                    item.status === 'archived' && styles.statusTextArchived,
                  ]}
                >
                  {item.status}
                </Text>
              </View>

              <View
                style={[
                  styles.readmeBadge,
                  item.readme.health === 'good' && styles.readmeGood,
                  item.readme.health === 'weak' && styles.readmeWeak,
                  item.readme.health === 'missing' && styles.readmeMissing,
                ]}
              >
                <Text
                  style={[
                    styles.readmeText,
                    item.readme.health === 'good' && styles.readmeTextGood,
                    item.readme.health === 'weak' && styles.readmeTextWeak,
                    item.readme.health === 'missing' && styles.readmeTextMissing,
                  ]}
                >
                  README: {item.readme.health}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  if (isScanning) {
    return (
      <View style={styles.container}>
        <View style={styles.scanningContainer}>
          <Text style={styles.scanningIcon}>📡</Text>
          <Text style={styles.scanningTitle}>Scanning your GitHub</Text>
          <Text style={styles.scanningMessage}>
            {progress?.message || 'Connecting...'}
          </Text>
          {progress && progress.total > 0 && (
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(progress.current / progress.total) * 100}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
          )}
          <ActivityIndicator
            color={colors.primary}
            size="large"
            style={{ marginTop: spacing.xxl }}
          />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.scanningContainer}>
          <Text style={styles.scanningTitle}>Scan failed</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={startScan}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>STEP 3 OF 5</Text>
        <Text style={styles.title}>Your projects</Text>
        <Text style={styles.subtitle}>
          Found {scannedRepos.length} repos. Select which ones to track.
        </Text>

        {/* README health summary */}
        <View style={styles.readmeSummary}>
          <Text style={styles.readmeSummaryTitle}>README health:</Text>
          <View style={styles.readmeSummaryRow}>
            <Text style={[styles.readmeSummaryBadge, { color: colors.success }]}>
              {readmeSummary.good} good
            </Text>
            <Text style={[styles.readmeSummaryBadge, { color: colors.warning }]}>
              {readmeSummary.weak} weak
            </Text>
            <Text style={[styles.readmeSummaryBadge, { color: colors.danger }]}>
              {readmeSummary.missing} missing
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={scannedRepos}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderRepo}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <Text style={styles.selectedCount}>
          {selectedCount} project{selectedCount !== 1 ? 's' : ''} selected
        </Text>
        <Pressable
          style={[
            styles.primaryButton,
            selectedCount === 0 && styles.buttonDisabled,
          ]}
          onPress={() => {
            setCurrentStep('review');
            router.push('/(onboarding)/review');
          }}
          disabled={selectedCount === 0}
        >
          <Text style={styles.primaryButtonText}>Review Setup</Text>
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
      paddingTop: insets.top + spacing.xl,
    },
    header: {
      paddingHorizontal: spacing.xxl,
      marginBottom: spacing.lg,
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
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    readmeSummary: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
    },
    readmeSummaryTitle: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: colors.textMuted,
      marginBottom: spacing.xs,
    },
    readmeSummaryRow: {
      flexDirection: 'row',
      gap: spacing.lg,
    },
    readmeSummaryBadge: {
      fontSize: fontSize.sm,
      fontWeight: '600',
    },
    list: {
      paddingHorizontal: spacing.xxl,
      paddingBottom: spacing.md,
    },
    repoCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    repoCardSelected: {
      borderColor: colors.primary,
      backgroundColor: 'rgba(16, 185, 129, 0.03)',
    },
    repoRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: borderRadius.sm,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    checkboxSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkmark: {
      fontSize: 13,
      color: '#ffffff',
      fontWeight: '700',
    },
    repoInfo: {
      flex: 1,
    },
    repoNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: 2,
    },
    repoName: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    privateBadge: {
      fontSize: 12,
    },
    repoDesc: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    repoMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    metaBadge: {
      backgroundColor: 'rgba(14, 165, 233, 0.1)',
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    metaText: {
      fontSize: fontSize.xs,
      color: '#0ea5e9',
      fontWeight: '500',
    },
    statusBadge: {
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    statusActive: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
    statusStale: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
    statusInactive: { backgroundColor: 'rgba(107, 114, 128, 0.1)' },
    statusArchived: { backgroundColor: 'rgba(107, 114, 128, 0.1)' },
    statusText: { fontSize: fontSize.xs, fontWeight: '500' },
    statusTextActive: { color: '#10b981' },
    statusTextStale: { color: '#f59e0b' },
    statusTextInactive: { color: '#6b7280' },
    statusTextArchived: { color: '#6b7280' },
    readmeBadge: {
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    readmeGood: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
    readmeWeak: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
    readmeMissing: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
    readmeText: { fontSize: fontSize.xs, fontWeight: '500' },
    readmeTextGood: { color: '#10b981' },
    readmeTextWeak: { color: '#f59e0b' },
    readmeTextMissing: { color: '#ef4444' },
    footer: {
      paddingHorizontal: spacing.xxl,
      paddingBottom: insets.bottom + spacing.lg,
      paddingTop: spacing.md,
      gap: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    selectedCount: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
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
    // Scanning state
    scanningContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xxxl,
    },
    scanningIcon: {
      fontSize: 48,
      marginBottom: spacing.xxl,
    },
    scanningTitle: {
      fontSize: fontSize.xxl,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    scanningMessage: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    progressBar: {
      width: '100%',
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      marginTop: spacing.xxl,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    errorText: {
      fontSize: fontSize.md,
      color: colors.danger,
      textAlign: 'center',
      marginBottom: spacing.xxl,
    },
    retryButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xxl,
      borderRadius: borderRadius.lg,
    },
    retryButtonText: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.textPrimary,
    },
  });
}

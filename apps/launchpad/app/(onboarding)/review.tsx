import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, borderRadius } from '../../src/theme/spacing';
import { useOnboardingStore } from '../../src/store/onboarding';
import { getReadmeSummary } from '../../src/services/scanner';
import { buildTaskboardFiles, improveRepoReadmes } from '../../src/services/builder';

export default function ReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const username = useOnboardingStore((s) => s.githubUsername);
  const scannedRepos = useOnboardingStore((s) => s.scannedRepos);
  const improveReadmes = useOnboardingStore((s) => s.improveReadmes);
  const setImproveReadmes = useOnboardingStore((s) => s.setImproveReadmes);
  const setOnboarded = useOnboardingStore((s) => s.setOnboarded);

  const [isBuilding, setIsBuilding] = useState(false);
  const [buildMessage, setBuildMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const styles = makeStyles(colors, insets);

  const selectedRepos = scannedRepos.filter((r) => r.selected);
  const readmeSummary = getReadmeSummary(scannedRepos);
  const readmesToImprove = readmeSummary.weak + readmeSummary.missing;

  async function handleConfirm() {
    if (!username) return;

    setIsBuilding(true);
    setError(null);

    try {
      // Step 1: Build .taskboard files
      const result = await buildTaskboardFiles(
        username,
        scannedRepos,
        (msg) => setBuildMessage(msg)
      );

      if (result.errors.length > 0) {
        setError(`Some files failed: ${result.errors.join(', ')}`);
        setIsBuilding(false);
        return;
      }

      // Step 2: Improve READMEs if opted in
      let readmesImproved = 0;
      if (improveReadmes && readmesToImprove > 0) {
        setBuildMessage('Improving READMEs...');
        const readmeResult = await improveRepoReadmes(
          scannedRepos,
          (msg) => setBuildMessage(msg)
        );
        readmesImproved = readmeResult.improved;
      }

      // Mark onboarding complete
      setOnboarded(true);

      router.replace({
        pathname: '/(onboarding)/complete',
        params: {
          projectCount: String(selectedRepos.length),
          filesCreated: String(result.filesCreated.length),
          readmesImproved: String(readmesImproved),
        },
      });
    } catch (e) {
      setError((e as Error).message || 'Setup failed');
      setIsBuilding(false);
    }
  }

  if (isBuilding) {
    return (
      <View style={styles.container}>
        <View style={styles.buildingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.buildingTitle}>Setting up your workspace</Text>
          <Text style={styles.buildingMessage}>{buildMessage}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.stepLabel}>STEP 4 OF 5</Text>
          <Text style={styles.title}>Review & confirm</Text>
          <Text style={styles.subtitle}>
            Here's what Orbit will create. Review and confirm.
          </Text>
        </View>

        {/* Projects section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Projects ({selectedRepos.length})
          </Text>
          {selectedRepos.map((repo) => (
            <View key={repo.id} style={styles.projectRow}>
              <Text style={styles.projectName}>{repo.name}</Text>
              <View style={styles.projectMeta}>
                {repo.language && (
                  <Text style={styles.projectLang}>{repo.language}</Text>
                )}
                <Text
                  style={[
                    styles.projectStatus,
                    repo.status === 'active' && { color: colors.success },
                    repo.status === 'stale' && { color: colors.warning },
                  ]}
                >
                  {repo.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Files section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Files to create in .taskboard repo
          </Text>
          <ConsentItem
            name="projects.json"
            desc={`${selectedRepos.length} projects with metadata`}
            colors={colors}
          />
          <ConsentItem
            name="tasks.json"
            desc="Empty — you'll add tasks as you go"
            colors={colors}
          />
          <ConsentItem
            name="inbox.json"
            desc="Empty — for capturing ideas"
            colors={colors}
          />
          <ConsentItem
            name="config.json"
            desc="Your preferences and settings"
            colors={colors}
          />
        </View>

        {/* README improvement section */}
        {readmesToImprove > 0 && (
          <View style={styles.section}>
            <View style={styles.readmeHeader}>
              <View style={styles.readmeHeaderText}>
                <Text style={styles.sectionTitle}>Improve READMEs</Text>
                <Text style={styles.readmeDesc}>
                  {readmesToImprove} repo{readmesToImprove !== 1 ? 's have' : ' has'}{' '}
                  weak or missing READMEs. Orbit can generate professional READMEs
                  with badges, tech stack, install instructions, and structure.
                </Text>
              </View>
              <Switch
                value={improveReadmes}
                onValueChange={setImproveReadmes}
                trackColor={{ false: colors.border, true: colors.primaryDark }}
                thumbColor={improveReadmes ? colors.primary : colors.textMuted}
              />
            </View>

            {improveReadmes && (
              <View style={styles.readmeList}>
                {scannedRepos
                  .filter(
                    (r) =>
                      r.selected &&
                      (r.readme.health === 'weak' || r.readme.health === 'missing')
                  )
                  .map((repo) => (
                    <View key={repo.id} style={styles.readmeItem}>
                      <Text style={styles.readmeRepoName}>{repo.name}</Text>
                      <View style={styles.readmeIssues}>
                        {repo.readme.issues.map((issue, i) => (
                          <Text key={i} style={styles.readmeIssue}>
                            • {issue}
                          </Text>
                        ))}
                      </View>
                      <Text style={styles.readmeAction}>
                        Will {repo.readme.health === 'missing' ? 'create' : 'improve'}{' '}
                        README.md
                      </Text>
                    </View>
                  ))}

                <View style={styles.readmeNote}>
                  <Text style={styles.readmeNoteText}>
                    Each README will be committed to the repo with the message:
                    "Improve README structure — via Orbit setup"
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.primaryButton} onPress={handleConfirm}>
          <Text style={styles.primaryButtonText}>
            Looks good, set it up
          </Text>
        </Pressable>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go back</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ConsentItem({
  name,
  desc,
  colors,
}: {
  name: string;
  desc: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.sm,
      }}
    >
      <Text style={{ color: colors.primary, fontSize: 14 }}>→</Text>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: fontSize.sm,
            fontWeight: '600',
            color: colors.textPrimary,
            fontFamily: 'monospace',
          }}
        >
          {name}
        </Text>
        <Text
          style={{
            fontSize: fontSize.xs,
            color: colors.textSecondary,
          }}
        >
          {desc}
        </Text>
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
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.xxl,
      paddingBottom: spacing.xxl,
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
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    projectRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    projectName: {
      fontSize: fontSize.sm,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    projectMeta: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    projectLang: {
      fontSize: fontSize.xs,
      color: '#0ea5e9',
    },
    projectStatus: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
    },
    readmeHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    readmeHeaderText: {
      flex: 1,
    },
    readmeDesc: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    readmeList: {
      marginTop: spacing.lg,
      gap: spacing.md,
    },
    readmeItem: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: borderRadius.md,
      padding: spacing.md,
    },
    readmeRepoName: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    readmeIssues: {
      marginBottom: spacing.sm,
    },
    readmeIssue: {
      fontSize: fontSize.xs,
      color: colors.warning,
      lineHeight: 18,
    },
    readmeAction: {
      fontSize: fontSize.xs,
      color: colors.primary,
      fontWeight: '500',
    },
    readmeNote: {
      backgroundColor: 'rgba(16, 185, 129, 0.05)',
      borderRadius: borderRadius.md,
      padding: spacing.md,
    },
    readmeNoteText: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      fontStyle: 'italic',
      lineHeight: 18,
    },
    errorBox: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.2)',
      borderRadius: borderRadius.md,
      padding: spacing.md,
    },
    errorText: {
      fontSize: fontSize.sm,
      color: colors.danger,
    },
    footer: {
      paddingHorizontal: spacing.xxl,
      paddingBottom: insets.bottom + spacing.lg,
      paddingTop: spacing.md,
      gap: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
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
    backButton: {
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    backButtonText: {
      fontSize: fontSize.md,
      color: colors.textMuted,
    },
    buildingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xxxl,
    },
    buildingTitle: {
      fontSize: fontSize.xl,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: spacing.xxl,
      marginBottom: spacing.sm,
    },
    buildingMessage: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
}

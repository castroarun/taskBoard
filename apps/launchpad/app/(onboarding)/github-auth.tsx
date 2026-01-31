import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, borderRadius } from '../../src/theme/spacing';
import {
  validateToken,
  setGitHubToken,
  setGitHubUsername,
} from '../../src/services/github';
import { useOnboardingStore } from '../../src/store/onboarding';


export default function GitHubAuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const setStoreUsername = useOnboardingStore((s) => s.setGitHubUsername);
  const setCurrentStep = useOnboardingStore((s) => s.setCurrentStep);

  const [token, setToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = makeStyles(colors, insets);

  async function handleConnect() {
    if (!token.trim()) {
      setError('Please enter your GitHub token');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const user = await validateToken(token.trim());
      if (!user) {
        setError('Invalid token. Please check and try again.');
        setIsValidating(false);
        return;
      }

      await setGitHubToken(token.trim());
      await setGitHubUsername(user.login);
      setStoreUsername(user.login);
      setCurrentStep('create-repo');

      router.push('/(onboarding)/create-repo');
    } catch (e) {
      setError((e as Error).message || 'Failed to validate token');
    } finally {
      setIsValidating(false);
    }
  }

  function openTokenPage() {
    Linking.openURL(
      'https://github.com/settings/tokens/new?scopes=repo&description=Orbit%20App'
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.stepLabel}>STEP 1 OF 5</Text>
          <Text style={styles.title}>Connect GitHub</Text>
          <Text style={styles.subtitle}>
            Orbit reads your repos to build your project dashboard. We need a
            personal access token with repo scope.
          </Text>
        </View>

        <View style={styles.tokenSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Personal Access Token</Text>
            <TextInput
              style={styles.input}
              value={token}
              onChangeText={(text) => {
                setToken(text);
                setError(null);
              }}
              placeholder="ghp_xxxxxxxxxxxx"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Pressable style={styles.helpLink} onPress={openTokenPage}>
            <Text style={styles.helpLinkText}>
              Create a token on GitHub →
            </Text>
          </Pressable>

          <View style={styles.scopeInfo}>
            <Text style={styles.scopeTitle}>Required scope:</Text>
            <View style={styles.scopeBadge}>
              <Text style={styles.scopeBadgeText}>repo</Text>
            </View>
            <Text style={styles.scopeDesc}>
              Read/write access to your repos and the .taskboard repo
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.primaryButton,
            (!token.trim() || isValidating) && styles.buttonDisabled,
          ]}
          onPress={handleConnect}
          disabled={!token.trim() || isValidating}
        >
          {isValidating ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Connect & Continue</Text>
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
      marginBottom: spacing.xxxl,
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
    tokenSection: {
      gap: spacing.lg,
    },
    inputContainer: {
      gap: spacing.sm,
    },
    inputLabel: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md + 2,
      fontSize: fontSize.md,
      color: colors.textPrimary,
      fontFamily: 'monospace',
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
    helpLink: {
      alignSelf: 'flex-start',
    },
    helpLinkText: {
      fontSize: fontSize.sm,
      color: colors.primary,
      fontWeight: '500',
    },
    scopeInfo: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    scopeTitle: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    scopeBadge: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.2)',
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    scopeBadgeText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: colors.primary,
      fontFamily: 'monospace',
    },
    scopeDesc: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
      lineHeight: 16,
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

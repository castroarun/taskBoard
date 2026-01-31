import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeContext';
import { spacing, fontSize, borderRadius } from '../../src/theme/spacing';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const styles = makeStyles(colors, insets);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🪐</Text>
        </View>

        <Text style={styles.title}>Welcome to Orbit</Text>
        <Text style={styles.subtitle}>
          Your entire dev life, in your pocket.
        </Text>

        <View style={styles.features}>
          <FeatureRow
            emoji="📡"
            title="Scan your GitHub"
            description="Auto-detect all your projects, tech stacks, and activity"
            colors={colors}
          />
          <FeatureRow
            emoji="📋"
            title="Track progress"
            description="See every project's status at a glance — active, stale, shipped"
            colors={colors}
          />
          <FeatureRow
            emoji="📝"
            title="Improve your READMEs"
            description="Detect weak READMEs and generate professional ones"
            colors={colors}
          />
          <FeatureRow
            emoji="🎤"
            title="Voice capture"
            description="Capture tasks and ideas with your voice, structured by AI"
            colors={colors}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push('/(onboarding)/github-auth')}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </Pressable>

        <Text style={styles.footerNote}>
          You'll sign in with GitHub to connect your repos
        </Text>
      </View>
    </View>
  );
}

function FeatureRow({
  emoji,
  title,
  description,
  colors,
}: {
  emoji: string;
  title: string;
  description: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={featureStyles(colors).row}>
      <Text style={featureStyles(colors).emoji}>{emoji}</Text>
      <View style={featureStyles(colors).textContainer}>
        <Text style={featureStyles(colors).title}>{title}</Text>
        <Text style={featureStyles(colors).description}>{description}</Text>
      </View>
    </View>
  );
}

function featureStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    emoji: {
      fontSize: 24,
      marginTop: 2,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: fontSize.md,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    description: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      lineHeight: 18,
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
      justifyContent: 'center',
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: spacing.xxl,
    },
    icon: {
      fontSize: 64,
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: fontSize.lg,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.xxxl + spacing.lg,
    },
    features: {
      paddingHorizontal: spacing.sm,
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
    footerNote: {
      fontSize: fontSize.xs,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });
}

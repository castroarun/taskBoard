import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext';
import { useOnboardingStore } from '../../src/store/onboarding';

export default function OnboardingLayout() {
  const { colors } = useTheme();
  const currentStep = useOnboardingStore((s) => s.currentStep);

  // Resume from where user left off — if they already authenticated,
  // skip back to that step instead of restarting from welcome
  const resumeStep = getResumeScreen(currentStep);

  return (
    <Stack
      initialRouteName={resumeStep}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="github-auth" />
      <Stack.Screen name="create-repo" />
      <Stack.Screen name="scan-results" />
      <Stack.Screen name="review" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}

/**
 * Determine which screen to resume from.
 * Scan results and review depend on transient data (scannedRepos)
 * that isn't persisted, so we resume at the step that can
 * re-fetch that data rather than showing an empty list.
 */
function getResumeScreen(step: string): string {
  switch (step) {
    case 'welcome':
      return 'welcome';
    case 'github-auth':
      return 'github-auth';
    case 'create-repo':
      return 'create-repo';
    // scan-results and review need scannedRepos which isn't persisted,
    // so resume at scan-results to re-scan
    case 'scan-results':
    case 'review':
      return 'scan-results';
    case 'complete':
      return 'complete';
    default:
      return 'welcome';
  }
}

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { useAppStore } from '../src/store';
import { useOnboardingStore } from '../src/store/onboarding';
import { useSyncScheduler } from '../src/hooks/useSyncScheduler';

function RootLayoutInner() {
  const { mode, colors } = useTheme();
  const loadSampleData = useAppStore((s) => s.loadSampleData);
  const projects = useAppStore((s) => s.projects);
  const isOnboarded = useOnboardingStore((s) => s.isOnboarded);

  // Initialize sync scheduler
  useSyncScheduler();

  useEffect(() => {
    // Load sample data for the main app if onboarded but no projects loaded yet
    if (isOnboarded && projects.length === 0) loadSampleData();
  }, [isOnboarded]);

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {isOnboarded ? (
          <>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="voice-capture"
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="inbox-capture"
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="project/[id]" />
            <Stack.Screen name="new-repos" />
          </>
        ) : (
          <Stack.Screen name="(onboarding)" />
        )}
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootLayoutInner />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

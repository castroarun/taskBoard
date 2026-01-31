import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScannedRepo } from '../services/scanner';

export type OnboardingStep =
  | 'welcome'
  | 'github-auth'
  | 'create-repo'
  | 'scan-results'
  | 'review'
  | 'complete';

interface OnboardingStore {
  // State
  isOnboarded: boolean;
  currentStep: OnboardingStep;
  githubUsername: string | null;
  scannedRepos: ScannedRepo[];
  improveReadmes: boolean;

  // Actions
  setOnboarded: (onboarded: boolean) => void;
  setCurrentStep: (step: OnboardingStep) => void;
  setGitHubUsername: (username: string) => void;
  setScannedRepos: (repos: ScannedRepo[]) => void;
  toggleRepoSelection: (repoId: number) => void;
  setImproveReadmes: (improve: boolean) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      isOnboarded: false,
      currentStep: 'welcome',
      githubUsername: null,
      scannedRepos: [],
      improveReadmes: false,

      setOnboarded: (onboarded) => set({ isOnboarded: onboarded }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setGitHubUsername: (username) => set({ githubUsername: username }),
      setScannedRepos: (repos) => set({ scannedRepos: repos }),
      toggleRepoSelection: (repoId) =>
        set((state) => ({
          scannedRepos: state.scannedRepos.map((r) =>
            r.id === repoId ? { ...r, selected: !r.selected } : r
          ),
        })),
      setImproveReadmes: (improve) => set({ improveReadmes: improve }),
      reset: () =>
        set({
          isOnboarded: false,
          currentStep: 'welcome',
          githubUsername: null,
          scannedRepos: [],
          improveReadmes: false,
        }),
    }),
    {
      name: 'orbit-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isOnboarded: state.isOnboarded,
        currentStep: state.currentStep,
        githubUsername: state.githubUsername,
      }),
    }
  )
);

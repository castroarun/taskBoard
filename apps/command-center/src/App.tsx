import { useEffect } from 'react';
import { useAppStore, TabId } from './store';
import { useDataLoader } from './hooks/useDataLoader';
import { useNotifications } from './hooks/useNotifications';
import { Header } from './components/ui/Header';
import { QuickLaunch } from './components/ui/QuickLaunch';
import { NewProjectModal } from './components/ui/NewProjectModal';
import { SettingsPanel } from './components/ui/SettingsPanel';
import { VoiceCapture } from './components/ui/VoiceCapture';
import { PipelineView } from './components/pipeline/PipelineView';
import { DocsView } from './components/docs/DocsView';
import { InboxView } from './components/inbox/InboxView';
import { HelpView } from './components/help/HelpView';

export default function App() {
  const {
    activeTab,
    isQuickLaunchOpen,
    isNewProjectModalOpen,
    isSettingsOpen,
    isVoiceCaptureOpen,
    openQuickLaunch,
    closeQuickLaunch,
    closeSettings,
    closeVoiceCapture,
    addInboxItem,
    isLoading,
  } = useAppStore();

  // Load data from backend
  useDataLoader();

  // Notification hooks
  const { notifyVoiceTranscript } = useNotifications();

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open Quick Launch
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openQuickLaunch();
      }

      // Tab switching with Ctrl+1/2/3/4
      if (e.ctrlKey && !e.shiftKey && !e.altKey) {
        const tabMap: Record<string, TabId> = {
          '1': 'pipeline',
          '2': 'docs',
          '3': 'inbox',
          '4': 'help',
        };
        if (tabMap[e.key]) {
          e.preventDefault();
          useAppStore.getState().setActiveTab(tabMap[e.key]);
        }
      }

      // Escape to close Quick Launch
      if (e.key === 'Escape' && isQuickLaunchOpen) {
        closeQuickLaunch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickLaunchOpen, openQuickLaunch, closeQuickLaunch]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh">
      <Header />

      <main className="pt-14">
        {activeTab === 'pipeline' && <PipelineView />}
        {activeTab === 'docs' && <DocsView />}
        {activeTab === 'inbox' && <InboxView />}
        {activeTab === 'help' && <HelpView />}
      </main>

      {isQuickLaunchOpen && <QuickLaunch />}
      {isNewProjectModalOpen && <NewProjectModal />}
      {isSettingsOpen && <SettingsPanel onClose={closeSettings} />}
      {isVoiceCaptureOpen && (
        <VoiceCapture
          onTranscript={(text) => {
            // Add voice transcript to inbox
            addInboxItem({
              id: `inbox-voice-${Date.now()}`,
              text,
              type: 'note',
              project: null,
              priority: null,
              status: 'pending',
              createdAt: new Date().toISOString(),
            });
            // Notify user
            notifyVoiceTranscript(text);
          }}
          onClose={closeVoiceCapture}
        />
      )}
    </div>
  );
}

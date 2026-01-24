import { useState } from 'react';
import { useAppStore, Project, Priority } from '@/store';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { transcribeAudio } from '@/lib/groq';
import clsx from 'clsx';

// Auto-determine complexity based on description keywords
function determineComplexity(desc: string): 'E' | 'F' {
  const simpleKeywords = ['simple', 'quick', 'small', 'mini', 'basic', 'prototype', 'poc', 'test', 'demo', 'single', 'one-page', 'landing'];
  const complexKeywords = ['full', 'complete', 'enterprise', 'platform', 'system', 'integration', 'api', 'database', 'auth', 'dashboard', 'multi', 'complex'];

  const lowerDesc = desc.toLowerCase();
  const simpleScore = simpleKeywords.filter(k => lowerDesc.includes(k)).length;
  const complexScore = complexKeywords.filter(k => lowerDesc.includes(k)).length;

  return simpleScore > complexScore ? 'E' : 'F';
}

export function NewProjectModal() {
  const { closeNewProjectModal, projects, setProjects } = useAppStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('P1');
  const [repoPath, setRepoPath] = useState('');

  // Voice recording (browser-based)
  const { isRecording, isSupported, startRecording, stopRecording, error: recorderError } = useVoiceRecorder();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Auto-determined complexity
  const complexity = determineComplexity(description);

  // Handle voice input
  const handleVoiceInput = async () => {
    setVoiceError(null);

    if (!isSupported) {
      setVoiceError('Voice not supported');
      return;
    }

    if (isRecording) {
      // Stop and transcribe
      const audioBlob = await stopRecording();
      if (audioBlob) {
        setIsTranscribing(true);
        const result = await transcribeAudio(audioBlob);
        setIsTranscribing(false);

        if (result.error) {
          setVoiceError(result.error);
        } else if (result.text) {
          setDescription(prev => prev ? `${prev} ${result.text}` : result.text);
        }
      }
    } else {
      // Start recording
      await startRecording();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProject: Project = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name: name.trim(),
      description: description.trim() || 'New project',
      repoPath: repoPath.trim() || `~/Projects/${name.toLowerCase().replace(/\s+/g, '-')}`,
      githubUrl: null,
      stage: 'conception',
      stageStatus: 'not-started',
      currentPhase: 'design',
      priority,
      complexity,
      progress: 0,
      targetDate: null,
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      completedAt: null,
      tags: [],
      techStack: [],
      links: {
        github: null,
        docs: null,
        live: null,
      },
      metrics: {
        totalTasks: 0,
        completedTasks: 0,
        blockedTasks: 0,
      },
    };

    setProjects([...projects, newProject]);
    closeNewProjectModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeNewProjectModal}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">New Project</h2>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-500 font-mono">
              Ctrl+N
            </kbd>
          </div>
          <button
            onClick={closeNewProjectModal}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Voice Input - Top Right */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Fill in details or use voice</span>
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isTranscribing}
              className={clsx(
                'relative flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium',
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : isTranscribing
                  ? 'bg-blue-500/50 text-blue-200'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
              )}
              title={isRecording ? 'Click to stop' : isTranscribing ? 'Transcribing...' : 'Voice input (AI powered)'}
            >
              {/* AI Sparkle Indicator */}
              {!isRecording && !isTranscribing && (
                <span className="absolute -top-1.5 -left-1.5 flex items-center justify-center w-4 h-4 bg-purple-500 rounded-full">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
                  </svg>
                </span>
              )}
              {isTranscribing ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              )}
              {isRecording ? 'Stop' : isTranscribing ? 'Transcribing...' : 'Voice'}
            </button>
          </div>

          {/* Voice status */}
          {(voiceError || recorderError) && (
            <p className="text-xs text-red-400 -mt-2">{voiceError || recorderError}</p>
          )}
          {isRecording && (
            <p className="text-xs text-red-400 -mt-2 animate-pulse">● Recording... click button to stop</p>
          )}

          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Project"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this project do?"
              rows={2}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Repo Path */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Repository Path
            </label>
            <input
              type="text"
              value={repoPath}
              onChange={(e) => setRepoPath(e.target.value)}
              placeholder="~/Projects/my-project"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
          </div>

          {/* Priority & Complexity */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Priority
              </label>
              <div className="flex gap-2">
                {(['P0', 'P1', 'P2', 'P3'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={clsx(
                      'flex-1 py-2 rounded-lg text-xs font-semibold transition-colors border',
                      priority === p
                        ? p === 'P0'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : p === 'P1'
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                          : p === 'P2'
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-600'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Complexity - Auto-detected */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Complexity
                <span className="ml-2 text-[10px] text-zinc-500 font-normal">(auto)</span>
              </label>
              <div className="flex gap-2">
                <div
                  className={clsx(
                    'flex-1 py-2 rounded-lg text-xs font-semibold text-center border transition-colors',
                    complexity === 'E'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-800/50 text-zinc-600 border-zinc-700/50'
                  )}
                >
                  Easy
                </div>
                <div
                  className={clsx(
                    'flex-1 py-2 rounded-lg text-xs font-semibold text-center border transition-colors',
                    complexity === 'F'
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : 'bg-zinc-800/50 text-zinc-600 border-zinc-700/50'
                  )}
                >
                  Full
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={closeNewProjectModal}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

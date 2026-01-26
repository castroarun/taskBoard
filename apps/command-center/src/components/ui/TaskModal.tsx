import { useState } from 'react';
import { useAppStore, Task, Priority, Complexity, TaskStatus, ProjectStage } from '@/store';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { transcribeAudio, structureTaskFromVoice } from '@/lib/groq';
import clsx from 'clsx';

interface TaskModalProps {
  projectId: string;
  task?: Task | null;
  defaultStage?: ProjectStage;
  onClose: () => void;
}

// AI Badge Component
function AIBadge({ model, purpose }: { model: string; purpose: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded-lg">
      <span className="w-4 h-4 bg-purple-500 rounded flex items-center justify-center">
        <span className="text-[8px] text-white font-bold">AI</span>
      </span>
      <span className="text-[10px] text-purple-400 font-medium">{model}</span>
      <span className="text-[10px] text-zinc-500">• {purpose}</span>
    </div>
  );
}

export function TaskModal({ projectId, task, defaultStage, onClose }: TaskModalProps) {
  const { addTask, updateTask } = useAppStore();
  const isEditing = !!task;

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Priority>(task?.priority || 'P2');
  const [complexity, setComplexity] = useState<Complexity>(task?.complexity || 'M');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');
  const [stage, _setStage] = useState<ProjectStage>(task?.stage || defaultStage || 'development');

  // Voice state
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isStructuring, setIsStructuring] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [aiUsed, setAiUsed] = useState<{ whisper: boolean; llama: boolean }>({ whisper: false, llama: false });
  const { isRecording, isSupported, startRecording, stopRecording, error: recorderError } = useVoiceRecorder();

  const handleVoiceInput = async () => {
    setVoiceError(null);

    if (!isSupported) {
      setVoiceError('Voice recording not supported');
      return;
    }

    if (isRecording) {
      // Stop recording, transcribe, and structure
      const audioBlob = await stopRecording();
      if (audioBlob) {
        // Step 1: Transcribe with Whisper
        setIsTranscribing(true);
        const transcription = await transcribeAudio(audioBlob);
        setIsTranscribing(false);

        if (transcription.error) {
          setVoiceError(transcription.error);
          return;
        }

        if (!transcription.text) {
          setVoiceError('No speech detected');
          return;
        }

        setAiUsed((prev) => ({ ...prev, whisper: true }));

        // Step 2: Structure with LLaMA
        setIsStructuring(true);
        const structured = await structureTaskFromVoice(transcription.text);
        setIsStructuring(false);

        if (structured.error) {
          // Fallback: just use transcription as description
          setDescription(transcription.text);
          if (!title) {
            setTitle(transcription.text.slice(0, 60));
          }
        } else if (structured.task) {
          setAiUsed((prev) => ({ ...prev, llama: true }));
          setTitle(structured.task.title);
          setDescription(structured.task.description);
          setPriority(structured.task.priority);
          setComplexity(structured.task.complexity);
        }
      }
    } else {
      // Start recording
      await startRecording();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEditing && task) {
      updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        complexity,
        status,
        stage,
      });
    } else {
      const newTask: Task = {
        id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        projectId,
        title: title.trim(),
        description: description.trim(),
        stage,
        phase: getPhaseFromStage(stage),
        status: 'todo',
        priority,
        complexity,
        assignee: 'claude',
        assignedAgent: 'dev-agent',
        dueDate: null,
        startedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        dependencies: [],
        linkedDocs: [],
        subtasks: [],
        tags: [],
        comments: [],
        createdBy: 'user',
        sourceDoc: null,
      };
      addTask(newTask);
    }
    onClose();
  };

  const handleDelete = () => {
    if (task && confirm('Delete this task?')) {
      updateTask(task.id, { status: 'completed' });
      onClose();
    }
  };

  const isProcessing = isTranscribing || isStructuring;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-zinc-100">
              {isEditing ? 'Edit Task' : 'New Task'}
            </h2>
            {/* Voice Input Button */}
            {!isEditing && (
              <button
                type="button"
                onClick={handleVoiceInput}
                disabled={isProcessing}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative',
                  isRecording
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                    : isProcessing
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-200'
                )}
                title={isRecording ? 'Click to stop & process' : 'Voice instruct task'}
              >
                {isTranscribing ? (
                  <>
                    <span className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                    Transcribing...
                  </>
                ) : isStructuring ? (
                  <>
                    <span className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                    Structuring...
                  </>
                ) : isRecording ? (
                  <>⏹️ Stop</>
                ) : (
                  <>🎤 Voice</>
                )}
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-[8px] text-white font-bold">AI</span>
                </span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* AI Badges */}
        {(aiUsed.whisper || aiUsed.llama) && (
          <div className="px-6 py-2 border-b border-zinc-800/50 bg-zinc-800/30 flex items-center gap-2 flex-wrap">
            {aiUsed.whisper && <AIBadge model="Groq Whisper" purpose="Voice transcription" />}
            {aiUsed.llama && <AIBadge model="Groq LLaMA" purpose="Task structuring" />}
          </div>
        )}

        {/* Voice Error */}
        {(voiceError || recorderError) && (
          <div className="px-6 py-2 bg-red-500/10 border-b border-red-500/20">
            <p className="text-xs text-red-400">⚠️ {voiceError || recorderError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
              placeholder="Add details..."
              rows={3}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
          </div>

          {/* Priority & Complexity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Priority</label>
              <div className="flex gap-1">
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

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Complexity</label>
              <div className="flex gap-1">
                {(['XS', 'S', 'M', 'L', 'XL'] as Complexity[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setComplexity(c)}
                    className={clsx(
                      'flex-1 py-2 rounded-lg text-xs font-semibold transition-colors border',
                      complexity === c
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-600'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Status (only for editing) */}
          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Status</label>
              <div className="flex gap-2">
                {(['todo', 'in-progress', 'review', 'completed'] as TaskStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={clsx(
                      'flex-1 py-2 rounded-lg text-xs font-medium transition-colors border capitalize',
                      status === s
                        ? s === 'completed'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : s === 'in-progress'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          : 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-600'
                    )}
                  >
                    {s.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Delete Task
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {isEditing ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function getPhaseFromStage(stage: ProjectStage): string {
  const stageToPhase: Record<ProjectStage, string> = {
    conception: 'design',
    discovery: 'design',
    requirements: 'design',
    architecture: 'engineering',
    'qa-planning': 'engineering',
    review: 'engineering',
    development: 'build',
    testing: 'build',
    staging: 'build',
    ship: 'launch',
    announce: 'launch',
    walkthrough: 'launch',
    documentation: 'closure',
    portfolio: 'closure',
    retrospective: 'closure',
  };
  return stageToPhase[stage] || 'build';
}

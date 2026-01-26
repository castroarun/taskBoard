import { useState } from 'react';
import { useAppStore, Task, TaskComment, CommentType, Priority } from '@/store';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { transcribeAudio } from '@/lib/groq';
import clsx from 'clsx';

// AI Badge Component
function AIBadge({ model, purpose }: { model: string; purpose: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/30 rounded text-[10px]">
      <span className="w-3 h-3 bg-purple-500 rounded flex items-center justify-center">
        <span className="text-[6px] text-white font-bold">AI</span>
      </span>
      <span className="text-purple-400 font-medium">{model}</span>
      <span className="text-zinc-500">• {purpose}</span>
    </span>
  );
}

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const { addTaskComment, updateTask: _updateTask } = useAppStore();
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState<CommentType>('instruction');
  const [isSending, setIsSending] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [usedWhisper, setUsedWhisper] = useState(false);
  const { isRecording, isSupported, startRecording, stopRecording, error: recorderError } = useVoiceRecorder();

  const priorityColors: Record<Priority, string> = {
    P0: 'bg-red-500/20 text-red-400 border-red-500/30',
    P1: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    P2: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    P3: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  };

  const statusColors: Record<string, string> = {
    'todo': 'bg-zinc-500/20 text-zinc-400',
    'in-progress': 'bg-blue-500/20 text-blue-400',
    'review': 'bg-purple-500/20 text-purple-400',
    'completed': 'bg-green-500/20 text-green-400',
    'blocked': 'bg-red-500/20 text-red-400',
  };

  const commentTypeIcons: Record<CommentType, string> = {
    instruction: '📋',
    review: '👀',
    question: '❓',
    note: '📝',
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;

    setIsSending(true);

    const newComment: TaskComment = {
      id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: commentType,
      author: 'arun',
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
      forClaude: true,
      resolved: false,
      source: 'text',
    };

    addTaskComment(task.id, newComment);
    setCommentText('');
    setIsSending(false);
  };

  const handleVoiceCapture = async () => {
    setVoiceError(null);

    if (!isSupported) {
      setVoiceError('Voice recording not supported in this browser');
      return;
    }

    if (isRecording) {
      // Stop recording and transcribe
      const audioBlob = await stopRecording();
      if (audioBlob) {
        setIsTranscribing(true);
        const result = await transcribeAudio(audioBlob);
        setIsTranscribing(false);

        if (result.error) {
          setVoiceError(result.error);
        } else if (result.text) {
          // Append transcribed text to comment
          setCommentText((prev) => (prev ? `${prev} ${result.text}` : result.text));
          setUsedWhisper(true);
        }
      }
    } else {
      // Start recording
      await startRecording();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl overflow-hidden animate-slide-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={clsx('px-2 py-0.5 rounded text-xs font-medium border', priorityColors[task.priority])}>
                {task.priority}
              </span>
              <span className={clsx('px-2 py-0.5 rounded text-xs font-medium capitalize', statusColors[task.status])}>
                {task.status.replace('-', ' ')}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-400 capitalize">
                {task.stage}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-zinc-100 truncate">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Description */}
          {task.description && (
            <div className="px-6 py-4 border-b border-zinc-800/50">
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Description</h3>
              <p className="text-sm text-zinc-300">{task.description}</p>
            </div>
          )}

          {/* Task Meta */}
          <div className="px-6 py-4 border-b border-zinc-800/50 grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-zinc-500">Complexity</span>
              <p className="text-sm text-zinc-300 font-medium">{task.complexity}</p>
            </div>
            <div>
              <span className="text-xs text-zinc-500">Assignee</span>
              <p className="text-sm text-zinc-300 font-medium capitalize">{task.assignee}</p>
            </div>
            <div>
              <span className="text-xs text-zinc-500">Created</span>
              <p className="text-sm text-zinc-300">{formatDate(task.createdAt)}</p>
            </div>
            <div>
              <span className="text-xs text-zinc-500">Updated</span>
              <p className="text-sm text-zinc-300">{formatDate(task.updatedAt)}</p>
            </div>
          </div>

          {/* Comments Section */}
          <div className="px-6 py-4">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
              Comments ({task.comments?.length || 0})
            </h3>

            {/* Comments List */}
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {(!task.comments || task.comments.length === 0) ? (
                <p className="text-sm text-zinc-600 text-center py-4">No comments yet</p>
              ) : (
                task.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={clsx(
                      'p-3 rounded-lg border',
                      comment.resolved
                        ? 'bg-zinc-800/30 border-zinc-800 opacity-60'
                        : 'bg-zinc-800/50 border-zinc-700'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{commentTypeIcons[comment.type]}</span>
                        <span className="text-xs font-medium text-zinc-400 capitalize">
                          {comment.author}
                        </span>
                        {comment.forClaude && (
                          <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px] font-semibold">
                            FOR CLAUDE
                          </span>
                        )}
                        {comment.source === 'voice' && (
                          <span className="text-zinc-500 text-xs">🎤</span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-600">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-zinc-300">{comment.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment */}
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-zinc-500">Type:</span>
                {(['instruction', 'review', 'question', 'note'] as CommentType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setCommentType(type)}
                    className={clsx(
                      'px-2 py-1 rounded text-xs font-medium transition-colors capitalize',
                      commentType === type
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-zinc-700 text-zinc-400 border border-zinc-600 hover:border-zinc-500'
                    )}
                  >
                    {commentTypeIcons[type]} {type}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmitComment()}
                  placeholder="Add instruction for Claude..."
                  className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                  onClick={handleVoiceCapture}
                  disabled={isTranscribing || !isSupported}
                  className={clsx(
                    'px-3 py-2 rounded-lg transition-all relative',
                    isRecording
                      ? 'bg-red-500/20 border border-red-500/50 text-red-400 animate-pulse'
                      : isTranscribing
                        ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400'
                        : 'bg-zinc-700 border border-zinc-600 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-600'
                  )}
                  title={isRecording ? 'Click to stop & transcribe' : 'Click to start recording'}
                >
                  {isTranscribing ? (
                    <span className="w-4 h-4 inline-block border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                  ) : isRecording ? (
                    '⏹️'
                  ) : (
                    '🎤'
                  )}
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-[8px] text-white font-bold">AI</span>
                  </span>
                </button>
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || isSending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isSending ? '...' : 'Send'}
                </button>
              </div>
              {usedWhisper && (
                <div className="mt-2">
                  <AIBadge model="Groq Whisper" purpose="Voice transcription" />
                </div>
              )}
              {(voiceError || recorderError) && (
                <p className="text-xs text-red-400 mt-2">
                  ⚠️ {voiceError || recorderError}
                </p>
              )}
              <p className="text-xs text-zinc-600 mt-2">
                💡 Comments marked "FOR CLAUDE" will be read by Claude Code on next session
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Task ID: {task.id}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useAppStore, InboxItem, InboxReply, Priority, Project } from '@/store';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { transcribeAudio } from '@/lib/groq';
import clsx from 'clsx';

// Calculate actionable items from projects
interface ActionItem {
  id: string;
  type: 'review' | 'ship' | 'discovery' | 'stale';
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  daysPending: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

function getActionItems(projects: Project[]): ActionItem[] {
  const actions: ActionItem[] = [];
  const now = new Date();

  projects.forEach(project => {
    // Skip completed projects
    if (project.completedAt) return;

    const daysSinceUpdate = Math.floor((now.getTime() - new Date(project.lastUpdated).getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceStart = Math.floor((now.getTime() - new Date(project.startedAt || project.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    // 1. Documents pending review
    if (project.reviews) {
      const pendingReviews = project.reviews.filter(r => !r.approved);
      pendingReviews.forEach(review => {
        const daysPending = Math.floor((now.getTime() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        actions.push({
          id: `review-${project.id}-${review.id}`,
          type: 'review',
          title: `Review pending: ${review.document}`,
          description: `${review.comments?.length || 0} comments`,
          projectId: project.id,
          projectName: project.name,
          daysPending,
          urgency: daysPending > 7 ? 'critical' : daysPending > 3 ? 'high' : 'medium',
        });
      });
    }

    // 2. Shipping pending (in launch phase but not shipped)
    if (project.currentPhase === 'launch' && project.stage !== 'announce') {
      actions.push({
        id: `ship-${project.id}`,
        type: 'ship',
        title: `Ready to ship: ${project.name}`,
        description: `Stage: ${project.stage}`,
        projectId: project.id,
        projectName: project.name,
        daysPending: daysSinceUpdate,
        urgency: daysSinceUpdate > 3 ? 'high' : 'medium',
      });
    }

    // 3. Ideas logged but discovery not initiated (in design phase, conception stage for too long)
    if (project.currentPhase === 'design' && project.stage === 'conception' && daysSinceStart > 7) {
      actions.push({
        id: `discovery-${project.id}`,
        type: 'discovery',
        title: `Start discovery: ${project.name}`,
        description: `Idea logged ${daysSinceStart}d ago`,
        projectId: project.id,
        projectName: project.name,
        daysPending: daysSinceStart,
        urgency: daysSinceStart > 14 ? 'high' : 'medium',
      });
    }

    // 4. Stale projects (not touched in 14+ days)
    if (daysSinceUpdate > 14 && project.currentPhase !== 'closure') {
      actions.push({
        id: `stale-${project.id}`,
        type: 'stale',
        title: `Stale project: ${project.name}`,
        description: `No updates in ${daysSinceUpdate}d`,
        projectId: project.id,
        projectName: project.name,
        daysPending: daysSinceUpdate,
        urgency: daysSinceUpdate > 30 ? 'critical' : 'high',
      });
    }
  });

  // Sort by urgency
  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return actions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
}

export function InboxView() {
  const {
    inboxItems,
    addInboxItem,
    updateInboxItem,
    deleteInboxItem,
    addReplyToInboxItem,
    markInboxItemRead,
    projects,
    setSelectedProjectId,
    setActiveTab,
    isSaving,
  } = useAppStore();

  const [inputText, setInputText] = useState('');
  const [selectedType, setSelectedType] = useState<'idea' | 'task' | 'note'>('note');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [commentingActionId, setCommentingActionId] = useState<string | null>(null);
  const [actionComment, setActionComment] = useState('');

  // Browser-based voice recording with Groq transcription
  const { isRecording, isSupported, startRecording, stopRecording, error: recorderError } = useVoiceRecorder();

  // Calculate action items from projects
  const actionItems = useMemo(() => getActionItems(projects), [projects]);

  // Navigate to project
  const handleActionClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveTab('projects');
  };

  // Handle comment on action item - creates inbox item for Claude
  const handleActionComment = (action: ActionItem) => {
    if (!actionComment.trim()) return;

    const newItem: InboxItem = {
      id: `inbox-${Date.now()}`,
      text: `[${action.type.toUpperCase()}] ${action.projectName}: ${actionComment.trim()}`,
      type: 'note',
      project: action.projectName.toLowerCase().replace(/\s+/g, '-'),
      priority: action.urgency === 'critical' ? 'P0' : action.urgency === 'high' ? 'P1' : 'P2',
      status: 'pending',
      createdAt: new Date().toISOString(),
      read: true, // User created this
      author: 'user',
      parentId: null,
      replies: [],
    };

    addInboxItem(newItem);
    setActionComment('');
    setCommentingActionId(null);
  };

  // Use inbox items from store (mock data loaded in dev mode via tauri.ts)
  const displayItems = inboxItems;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Parse input for patterns like @project, P0, P1, etc.
    const projectMatch = inputText.match(/@(\w+)/);
    const priorityMatch = inputText.match(/\b(P[0-3])\b/i);
    const cleanText = inputText
      .replace(/@\w+/g, '')
      .replace(/\b(P[0-3])\b/gi, '')
      .trim();

    const newItem: InboxItem = {
      id: `inbox-${Date.now()}`,
      text: cleanText || inputText.trim(),
      type: selectedType,
      project: projectMatch ? projectMatch[1] : null,
      priority: priorityMatch ? (priorityMatch[1].toUpperCase() as Priority) : null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      read: false,
      author: 'user',
      parentId: null,
      replies: [],
    };

    addInboxItem(newItem);
    setInputText('');
  };

  const handleStatusChange = (id: string, status: 'pending' | 'done' | 'skipped') => {
    updateInboxItem(id, { status });
  };

  const handleDelete = (id: string) => {
    deleteInboxItem(id);
    if (expandedItemId === id) {
      setExpandedItemId(null);
    }
  };

  const handleExpand = (id: string) => {
    if (expandedItemId === id) {
      setExpandedItemId(null);
    } else {
      setExpandedItemId(id);
      // Mark as read when expanded
      const item = displayItems.find(i => i.id === id);
      if (item && !item.read) {
        markInboxItemRead(id);
      }
    }
    setReplyText('');
  };

  const handleReply = (itemId: string) => {
    if (!replyText.trim()) return;

    const newReply: InboxReply = {
      id: `reply-${Date.now()}`,
      author: 'user',
      text: replyText.trim(),
      createdAt: new Date().toISOString(),
    };

    addReplyToInboxItem(itemId, newReply);
    setReplyText('');
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
          setInputText((prev) => (prev ? `${prev} ${result.text}` : result.text));
        }
      }
    } else {
      // Start recording
      await startRecording();
    }
  };

  const pendingItems = displayItems.filter((item) => item.status === 'pending');
  const completedItems = displayItems.filter((item) => item.status !== 'pending');

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-zinc-100">Inbox</h1>
          {isSaving && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <div className="w-2 h-2 border border-zinc-500 border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-500 mt-1">
          Quick capture for ideas, tasks, and notes. Agents process these automatically.
        </p>
      </div>

      {/* Action Items - Things that need your attention */}
      {actionItems.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              Action Items ({actionItems.length})
            </h2>
          </div>
          <div className="space-y-3">
            {actionItems.slice(0, 6).map((action) => (
              <ActionItemCard
                key={action.id}
                action={action}
                onClick={() => handleActionClick(action.projectId)}
                isReplying={commentingActionId === action.id}
                onToggleReply={() => {
                  setCommentingActionId(commentingActionId === action.id ? null : action.id);
                  setActionComment('');
                }}
                replyText={commentingActionId === action.id ? actionComment : ''}
                onReplyChange={setActionComment}
                onSubmitReply={() => handleActionComment(action)}
                relatedInboxItems={inboxItems.filter(item =>
                  item.text.includes(`[${action.type.toUpperCase()}]`) &&
                  item.text.includes(action.projectName)
                )}
              />
            ))}
          </div>
          {actionItems.length > 6 && (
            <p className="text-xs text-zinc-500 mt-2 text-center">
              +{actionItems.length - 6} more action items
            </p>
          )}
        </div>
      )}

      {/* Quick Add Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or speak your instruction... (e.g., 'Create task for taskboard: Add dark mode')"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-200 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <button
              type="button"
              onClick={handleVoiceCapture}
              disabled={isTranscribing || !isSupported}
              className={clsx(
                'px-4 py-3 border rounded-lg transition-all group relative',
                isRecording
                  ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                  : isTranscribing
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
              )}
              title={isTranscribing ? 'Transcribing...' : isRecording ? 'Click to stop and transcribe' : 'Voice capture (AI transcription)'}
            >
              {isTranscribing ? (
                <span className="animate-spin">⏳</span>
              ) : isRecording ? (
                '⏹️'
              ) : (
                '🎤'
              )}
              {/* AI Badge */}
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">AI</span>
              </span>
            </button>
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-colors"
            >
              Add
            </button>
          </div>

          {/* Type selector */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-zinc-500">Type:</span>
            {(['idea', 'task', 'note'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={clsx(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                  selectedType === type
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                )}
              >
                {type === 'idea' && '💡'} {type === 'task' && '📋'} {type === 'note' && '📝'}{' '}
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Voice Error */}
          {(voiceError || recorderError) && (
            <p className="text-xs text-red-400 mt-2">⚠️ {voiceError || recorderError}</p>
          )}

          {/* Recording Status */}
          {isRecording && (
            <p className="text-xs text-red-400 mt-2 animate-pulse">🎙️ Recording... Click stop when done</p>
          )}

          {/* Transcribing Status */}
          {isTranscribing && (
            <p className="text-xs text-purple-400 mt-2">⏳ Transcribing with Groq Whisper...</p>
          )}

          {/* Hint */}
          <p className="text-xs text-zinc-500 mt-3">
            💡 Patterns: <code className="text-zinc-400">@projectname</code> • <code className="text-zinc-400">P0/P1/P2</code> • <code className="text-zinc-400">"Move X to Y"</code>
          </p>
        </div>
      </form>

      {/* Pending Items */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-zinc-300">
            Pending ({pendingItems.length})
          </h2>
          {pendingItems.length > 0 && (
            <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5 group">
              <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px] font-semibold">AI</span>
              Process All with Agent →
            </button>
          )}
        </div>

        <div className="space-y-2">
          {pendingItems.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center">
              <p className="text-zinc-600 text-sm">No quick captures yet. Use the form above to add notes, tasks, or ideas.</p>
            </div>
          ) : (
            pendingItems.map((item) => (
              <InboxItemCard
                key={item.id}
                item={item}
                isExpanded={expandedItemId === item.id}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onExpand={handleExpand}
                onReply={handleReply}
                replyText={expandedItemId === item.id ? replyText : ''}
                onReplyTextChange={setReplyText}
              />
            ))
          )}
        </div>
      </div>

      {/* Completed Items */}
      {completedItems.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-500 mb-3">
            Completed ({completedItems.length})
          </h2>
          <div className="space-y-2 opacity-60">
            {completedItems.map((item) => (
              <InboxItemCard
                key={item.id}
                item={item}
                isExpanded={expandedItemId === item.id}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onExpand={handleExpand}
                onReply={handleReply}
                replyText={expandedItemId === item.id ? replyText : ''}
                onReplyTextChange={setReplyText}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface InboxItemCardProps {
  item: InboxItem;
  isExpanded: boolean;
  onStatusChange: (id: string, status: 'pending' | 'done' | 'skipped') => void;
  onDelete: (id: string) => void;
  onExpand: (id: string) => void;
  onReply: (itemId: string) => void;
  replyText: string;
  onReplyTextChange: (text: string) => void;
}

function InboxItemCard({
  item,
  isExpanded,
  onStatusChange,
  onDelete,
  onExpand,
  onReply,
  replyText,
  onReplyTextChange,
}: InboxItemCardProps) {
  const typeIcons: Record<InboxItem['type'], string> = {
    idea: '💡',
    task: '📋',
    note: '📝',
    'claude-response': '🤖',
  };

  const priorityColors: Record<Priority, string> = {
    P0: 'bg-red-500/20 text-red-400 border-red-500/30',
    P1: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    P2: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    P3: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const hasReplies = item.replies && item.replies.length > 0;
  const hasClaudeReply = item.replies?.some(r => r.author === 'claude') || false;
  // Only show unread styling for items with Claude responses OR items from Claude
  const hasUnreadClaudeContent = !item.read && item.status === 'pending' && (hasClaudeReply || item.author === 'claude');

  return (
    <div
      className={clsx(
        'bg-zinc-900/50 border rounded-xl transition-all',
        item.status === 'pending' && 'hover:border-zinc-700',
        hasUnreadClaudeContent
          ? 'border-purple-500/30 bg-purple-500/5'
          : 'border-zinc-800'
      )}
    >
      {/* Main content row */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Status checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(item.id, item.status === 'done' ? 'pending' : 'done');
            }}
            className={clsx(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors mt-0.5 flex-shrink-0',
              item.status === 'done'
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-zinc-600 hover:border-zinc-400'
            )}
          >
            {item.status === 'done' && <span className="text-xs">✓</span>}
          </button>

          {/* Content - clickable to expand */}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => onExpand(item.id)}
          >
            <div className="flex items-center gap-2 mb-1">
              <span>{typeIcons[item.type]}</span>
              <span
                className={clsx(
                  'text-sm',
                  item.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-200'
                )}
              >
                {item.text}
              </span>
              {/* Unread Claude response indicator */}
              {hasUnreadClaudeContent && (
                <span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" title="New response from Claude" />
              )}
              {/* Reply count badge */}
              {hasReplies && (
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                  {item.replies.length} {item.replies.length === 1 ? 'reply' : 'replies'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {item.project && (
                <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                  @{item.project}
                </span>
              )}
              {item.priority && (
                <span
                  className={clsx(
                    'text-xs px-2 py-0.5 rounded border',
                    priorityColors[item.priority]
                  )}
                >
                  {item.priority}
                </span>
              )}
              {item.author === 'claude' && (
                <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                  Claude
                </span>
              )}
              <span className="text-xs text-zinc-600">{formatTime(item.createdAt)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {item.status === 'pending' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(item.id, 'skipped');
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded transition-colors"
              >
                Skip
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExpand(item.id);
              }}
              className={clsx(
                'p-1.5 rounded transition-colors',
                isExpanded
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
              )}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg
                className={clsx('w-4 h-4 transition-transform', isExpanded && 'rotate-180')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded section with replies and reply input */}
      {isExpanded && (
        <div className="border-t border-zinc-800 px-4 py-3 bg-zinc-900/30">
          {/* Thread / Replies */}
          {hasReplies && (
            <div className="mb-4 space-y-3">
              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Conversation</h4>
              <div className="space-y-2 pl-4 border-l-2 border-zinc-700">
                {item.replies.map((reply) => (
                  <div key={reply.id} className="py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={clsx(
                          'text-xs font-medium',
                          reply.author === 'claude' ? 'text-purple-400' : 'text-blue-400'
                        )}
                      >
                        {reply.author === 'claude' ? '🤖 Claude' : '👤 You'}
                      </span>
                      <span className="text-[10px] text-zinc-600">{formatTime(reply.createdAt)}</span>
                    </div>
                    <p className="text-sm text-zinc-300">{reply.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reply input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => onReplyTextChange(e.target.value)}
              placeholder="Add a reply..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onReply(item.id);
                }
              }}
            />
            <button
              onClick={() => onReply(item.id)}
              disabled={!replyText.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Action Item Card Component with Voice Support
interface ActionItemCardProps {
  action: ActionItem;
  onClick: () => void;
  isReplying: boolean;
  onToggleReply: () => void;
  replyText: string;
  onReplyChange: (text: string) => void;
  onSubmitReply: () => void;
  relatedInboxItems: InboxItem[];
}

function ActionItemCard({
  action,
  onClick,
  isReplying,
  onToggleReply,
  replyText,
  onReplyChange,
  onSubmitReply,
  relatedInboxItems,
}: ActionItemCardProps) {
  // Voice recording for action item replies
  const { isRecording, isSupported, startRecording, stopRecording, error: recorderError } = useVoiceRecorder();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const handleVoiceCapture = async () => {
    setVoiceError(null);

    if (!isSupported) {
      setVoiceError('Voice not supported');
      return;
    }

    if (isRecording) {
      const audioBlob = await stopRecording();
      if (audioBlob) {
        setIsTranscribing(true);
        const result = await transcribeAudio(audioBlob);
        setIsTranscribing(false);

        if (result.error) {
          setVoiceError(result.error);
        } else if (result.text) {
          onReplyChange(replyText ? `${replyText} ${result.text}` : result.text);
        }
      }
    } else {
      await startRecording();
    }
  };
  // Neutral styling for all action items (no colors per type)
  const typeConfig = {
    review: { icon: '📝', badge: 'bg-zinc-700 text-zinc-300' },
    ship: { icon: '🚀', badge: 'bg-zinc-700 text-zinc-300' },
    discovery: { icon: '💡', badge: 'bg-zinc-700 text-zinc-300' },
    stale: { icon: '⏰', badge: 'bg-zinc-700 text-zinc-300' },
  };

  const urgencyColors = {
    critical: 'text-red-400',
    high: 'text-orange-400',
    medium: 'text-yellow-400',
    low: 'text-zinc-400',
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const config = typeConfig[action.type];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 transition-all hover:border-zinc-700">
      {/* Main clickable row */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">{config.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-zinc-200">{action.title}</span>
              {relatedInboxItems.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                  {relatedInboxItems.length} {relatedInboxItems.length === 1 ? 'reply' : 'replies'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={clsx('text-xs px-1.5 py-0.5 rounded', config.badge)}>
                {action.projectName}
              </span>
              <span className={clsx('text-xs font-medium', urgencyColors[action.urgency])}>
                {action.daysPending}d pending
              </span>
              <span className="text-xs text-zinc-500">{action.description}</span>
            </div>
          </div>
          <button
            onClick={onClick}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
            title="Go to project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Show existing replies */}
        {relatedInboxItems.length > 0 && (
          <div className="mt-3 pl-8 space-y-2 border-l-2 border-zinc-700 ml-2">
            {relatedInboxItems.map((item) => (
              <div key={item.id} className="py-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-blue-400">👤 You</span>
                  <span className="text-[10px] text-zinc-600">{formatTime(item.createdAt)}</span>
                </div>
                <p className="text-xs text-zinc-300">
                  {item.text.replace(`[${action.type.toUpperCase()}] ${action.projectName}: `, '')}
                </p>
                {/* Show Claude replies to this item */}
                {item.replies?.filter(r => r.author === 'claude').map((reply) => (
                  <div key={reply.id} className="mt-2 pl-3 border-l border-purple-500/30">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-purple-400">🤖 Claude</span>
                      <span className="text-[10px] text-zinc-600">{formatTime(reply.createdAt)}</span>
                    </div>
                    <p className="text-xs text-zinc-300">{reply.text}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Reply button */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleReply();
            }}
            className={clsx(
              'text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5',
              isReplying
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700'
            )}
          >
            Reply
          </button>
        </div>
      </div>

      {/* Reply input (expandable) */}
      {isReplying && (
        <div className="px-4 pb-4 border-t border-zinc-800/50">
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={replyText}
              onChange={(e) => onReplyChange(e.target.value)}
              placeholder={`Reply about ${action.title}...`}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSubmitReply();
                }
                if (e.key === 'Escape') {
                  onToggleReply();
                }
              }}
              autoFocus
            />
            {/* Voice button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleVoiceCapture();
              }}
              disabled={isTranscribing || !isSupported}
              className={clsx(
                'px-3 py-2 border rounded-lg transition-all relative',
                isRecording
                  ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                  : isTranscribing
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
              )}
              title={isTranscribing ? 'Transcribing...' : isRecording ? 'Stop recording' : 'Voice reply'}
            >
              {isTranscribing ? '⏳' : isRecording ? '⏹️' : '🎤'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSubmitReply();
              }}
              disabled={!replyText.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
          {/* Voice status messages */}
          {isRecording && (
            <p className="text-xs text-red-400 mt-2 animate-pulse">Recording... Click stop when done</p>
          )}
          {isTranscribing && (
            <p className="text-xs text-purple-400 mt-2">Transcribing...</p>
          )}
          {(voiceError || recorderError) && (
            <p className="text-xs text-red-400 mt-2">{voiceError || recorderError}</p>
          )}
          <p className="text-[10px] text-zinc-500 mt-2">
            → Saves to inbox.md with context: <span className="text-zinc-400">[{action.type.toUpperCase()}] {action.projectName}</span>
          </p>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useAppStore, InboxItem, InboxReply, Priority } from '@/store';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { transcribeAudio } from '@/lib/groq';
import clsx from 'clsx';

type FilterType = 'all' | 'unread' | 'action' | 'claude';

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
  } = useAppStore();

  const [inputText, setInputText] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const { isRecording, isSupported, startRecording, stopRecording, error: recorderError } = useVoiceRecorder();

  // Get selected item
  const selectedItem = selectedItemId ? inboxItems.find(i => i.id === selectedItemId) : null;

  // Filter items based on active filter
  const filteredItems = useMemo(() => {
    let items = inboxItems;

    switch (filter) {
      case 'unread':
        items = items.filter(i => !i.read && i.status === 'pending');
        break;
      case 'action':
        items = items.filter(i => i.status === 'pending');
        break;
      case 'claude':
        items = items.filter(i => i.author === 'claude' || i.replies?.some(r => r.author === 'claude'));
        break;
    }

    return items;
  }, [inboxItems, filter]);

  // Separate pending and completed
  const pendingItems = filteredItems.filter(i => i.status === 'pending');
  const completedItems = filteredItems.filter(i => i.status !== 'pending');

  // Items needing attention (unread with Claude response)
  const needsAttentionItems = pendingItems.filter(i =>
    !i.read && (i.author === 'claude' || i.replies?.some(r => r.author === 'claude'))
  );
  const regularPendingItems = pendingItems.filter(i =>
    i.read || (!i.replies?.some(r => r.author === 'claude') && i.author !== 'claude')
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const projectMatch = inputText.match(/@(\w+)/);
    const priorityMatch = inputText.match(/\b(P[0-3])\b/i);
    const cleanText = inputText.replace(/@\w+/g, '').replace(/\b(P[0-3])\b/gi, '').trim();

    const newItem: InboxItem = {
      id: `inbox-${Date.now()}`,
      text: cleanText || inputText.trim(),
      type: 'note',
      project: projectMatch ? projectMatch[1] : null,
      priority: priorityMatch ? (priorityMatch[1].toUpperCase() as Priority) : null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      read: true,
      author: 'user',
      parentId: null,
      replies: [],
    };

    addInboxItem(newItem);
    setInputText('');
    setSelectedItemId(newItem.id);
  };

  const handleSelectItem = (id: string) => {
    setSelectedItemId(id);
    const item = inboxItems.find(i => i.id === id);
    if (item && !item.read) {
      markInboxItemRead(id);
    }
    setReplyText('');
  };

  const handleReply = () => {
    if (!replyText.trim() || !selectedItemId) return;

    const newReply: InboxReply = {
      id: `reply-${Date.now()}`,
      author: 'user',
      text: replyText.trim(),
      createdAt: new Date().toISOString(),
    };

    addReplyToInboxItem(selectedItemId, newReply);
    setReplyText('');
  };

  const handleVoiceCapture = async () => {
    setVoiceError(null);
    if (!isSupported) {
      setVoiceError('Voice recording not supported');
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
          if (selectedItemId) {
            setReplyText(prev => prev ? `${prev} ${result.text}` : result.text);
          } else {
            setInputText(prev => prev ? `${prev} ${result.text}` : result.text);
          }
        }
      }
    } else {
      await startRecording();
    }
  };

  const handleDelete = (id: string) => {
    deleteInboxItem(id);
    if (selectedItemId === id) {
      setSelectedItemId(null);
    }
  };

  const handleStatusChange = (id: string, status: 'pending' | 'done' | 'skipped') => {
    updateInboxItem(id, { status });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  const formatFullTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    if (diff < 172800000) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const typeIcons: Record<InboxItem['type'], string> = {
    idea: '💡',
    task: '📋',
    note: '📝',
    'claude-response': '🤖',
  };

  const priorityColors: Record<Priority, string> = {
    P0: 'bg-red-500/10 text-red-400 border-red-500/20',
    P1: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    P2: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    P3: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex mx-60 mt-4 mb-0 rounded-t-xl overflow-hidden border border-zinc-800/60 border-b-0">
      {/* LEFT PANE: Inbox List */}
      <div className="w-[420px] border-r border-zinc-800/80 flex flex-col bg-zinc-950/50 flex-shrink-0">
        {/* Header with filters */}
        <header className="flex items-center justify-between px-4 h-12 border-b border-zinc-800/80 bg-zinc-950/90 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-semibold text-zinc-200">Inbox</h1>
            <nav className="flex items-center gap-1">
              {(['all', 'unread', 'action', 'claude'] as FilterType[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={clsx(
                    'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                    filter === f
                      ? 'text-blue-400 bg-blue-500/10'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                  )}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-600">
              <kbd className="px-1 py-0.5 bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700 rounded text-[9px] font-medium text-zinc-500">C</kbd> capture
            </span>
          </div>
        </header>

        {/* Quick Capture */}
        <div className="p-3 border-b border-zinc-800/50">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Quick capture... (C)"
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2 pr-20 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={handleVoiceCapture}
                disabled={isTranscribing || !isSupported}
                className={clsx(
                  'p-1.5 transition-colors rounded',
                  isRecording ? 'text-red-400 animate-pulse' : isTranscribing ? 'text-purple-400' : 'text-zinc-600 hover:text-zinc-400'
                )}
                title="Voice capture"
              >
                {isTranscribing ? '⏳' : isRecording ? '⏹️' : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-14 0m14 0a7 7 0 00-14 0m14 0v1a7 7 0 01-14 0v-1m7 8v3m-4 0h8"/>
                  </svg>
                )}
              </button>
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-2 py-1 text-[10px] font-medium text-zinc-500 hover:text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </form>
          {(voiceError || recorderError) && (
            <p className="text-[10px] text-red-400 mt-1">{voiceError || recorderError}</p>
          )}
        </div>

        {/* Inbox Items List */}
        <div className="flex-1 overflow-y-auto">
          {/* Needs Attention Section */}
          {needsAttentionItems.length > 0 && (
            <>
              <div className="px-3 py-2 sticky top-0 bg-zinc-950/95 backdrop-blur-sm z-10">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Needs Attention</span>
                </div>
              </div>
              {needsAttentionItems.map((item, idx) => (
                <InboxListItem
                  key={item.id}
                  item={item}
                  isSelected={selectedItemId === item.id}
                  onSelect={() => handleSelectItem(item.id)}
                  onDelete={deleteInboxItem}
                  formatTime={formatTime}
                  index={idx}
                />
              ))}
            </>
          )}

          {/* Pending Section */}
          {regularPendingItems.length > 0 && (
            <>
              <div className="px-3 py-2 sticky top-0 bg-zinc-950/95 backdrop-blur-sm z-10 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Pending</span>
                  <span className="text-[10px] text-zinc-700">({regularPendingItems.length})</span>
                </div>
              </div>
              {regularPendingItems.map((item, idx) => (
                <InboxListItem
                  key={item.id}
                  item={item}
                  isSelected={selectedItemId === item.id}
                  onSelect={() => handleSelectItem(item.id)}
                  onDelete={deleteInboxItem}
                  formatTime={formatTime}
                  index={idx}
                />
              ))}
            </>
          )}

          {/* Completed Section */}
          {completedItems.length > 0 && (
            <>
              <div className="px-3 py-2 sticky top-0 bg-zinc-950/95 backdrop-blur-sm z-10 mt-2">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-1.5 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  <svg className={clsx('w-3 h-3 transition-transform', showCompleted && 'rotate-90')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                  <span className="font-medium uppercase tracking-wider">Completed</span>
                  <span className="text-zinc-700">({completedItems.length})</span>
                </button>
              </div>
              {showCompleted && completedItems.map((item, idx) => (
                <InboxListItem
                  key={item.id}
                  item={item}
                  isSelected={selectedItemId === item.id}
                  onSelect={() => handleSelectItem(item.id)}
                  onDelete={deleteInboxItem}
                  formatTime={formatTime}
                  index={idx}
                />
              ))}
            </>
          )}

          {/* Empty State */}
          {pendingItems.length === 0 && completedItems.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-sm text-zinc-600">No items in inbox</p>
              <p className="text-xs text-zinc-700 mt-1">Use quick capture above to add notes</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANE: Detail View */}
      <div className="flex-1 flex flex-col bg-zinc-900/30">
        {selectedItem ? (
          <>
            {/* Detail Header */}
            <div className="px-6 py-4 border-b border-zinc-800/50 flex items-start justify-between flex-shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-medium text-zinc-100">{selectedItem.text}</h2>
                  {selectedItem.author === 'claude' && (
                    <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">Claude</span>
                  )}
                  {selectedItem.replies?.some(r => r.author === 'claude') && selectedItem.author !== 'claude' && (
                    <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">Claude replied</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {selectedItem.project && (
                    <span className="text-zinc-500">@{selectedItem.project}</span>
                  )}
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-500">{formatFullTime(selectedItem.createdAt)}</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-500">{typeIcons[selectedItem.type]} {selectedItem.type.charAt(0).toUpperCase() + selectedItem.type.slice(1)}</span>
                  {selectedItem.priority && (
                    <>
                      <span className="text-zinc-600">·</span>
                      <span className={clsx('px-1.5 py-0.5 rounded border text-[10px]', priorityColors[selectedItem.priority])}>
                        {selectedItem.priority}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleStatusChange(selectedItem.id, selectedItem.status === 'done' ? 'pending' : 'done')}
                  className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                  title={selectedItem.status === 'done' ? 'Mark pending' : 'Mark done (E)'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                </button>
                {selectedItem.project && (
                  <button
                    onClick={() => {
                      const project = projects.find(p => p.name.toLowerCase().replace(/\s+/g, '-') === selectedItem.project);
                      if (project) {
                        setSelectedProjectId(project.id);
                        setActiveTab('projects');
                      }
                    }}
                    className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Go to project"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => handleDelete(selectedItem.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Conversation Thread */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="max-w-2xl space-y-6">
                {/* Original message */}
                <div className="flex gap-4">
                  <div className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    selectedItem.author === 'claude' ? 'bg-purple-500/20' : 'bg-blue-500/20'
                  )}>
                    <span className="text-sm">{selectedItem.author === 'claude' ? '🤖' : '👤'}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={clsx(
                        'text-sm font-medium',
                        selectedItem.author === 'claude' ? 'text-purple-400' : 'text-zinc-200'
                      )}>
                        {selectedItem.author === 'claude' ? 'Claude' : 'You'}
                      </span>
                      <span className="text-xs text-zinc-600">{formatFullTime(selectedItem.createdAt)}</span>
                    </div>
                    <div className={clsx(
                      'rounded-xl rounded-tl-sm px-4 py-3',
                      selectedItem.author === 'claude' ? 'bg-purple-500/5 border border-purple-500/10' : 'bg-zinc-800/50'
                    )}>
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{selectedItem.text}</p>
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {selectedItem.replies?.map(reply => (
                  <div key={reply.id} className="flex gap-4">
                    <div className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      reply.author === 'claude' ? 'bg-purple-500/20' : 'bg-blue-500/20'
                    )}>
                      <span className="text-sm">{reply.author === 'claude' ? '🤖' : '👤'}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={clsx(
                          'text-sm font-medium',
                          reply.author === 'claude' ? 'text-purple-400' : 'text-zinc-200'
                        )}>
                          {reply.author === 'claude' ? 'Claude' : 'You'}
                        </span>
                        <span className="text-xs text-zinc-600">{formatFullTime(reply.createdAt)}</span>
                      </div>
                      <div className={clsx(
                        'rounded-xl rounded-tl-sm px-4 py-3',
                        reply.author === 'claude' ? 'bg-purple-500/5 border border-purple-500/10' : 'bg-zinc-800/50'
                      )}>
                        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{reply.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reply Input */}
            <div className="border-t border-zinc-800/50 px-6 py-4 bg-zinc-900/50 flex-shrink-0">
              <div className="max-w-2xl">
                <div className="flex items-end gap-3">
                  <div className="flex-1 relative">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Reply... (R)"
                      rows={2}
                      className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleReply();
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2 pb-1">
                    <button
                      type="button"
                      onClick={handleVoiceCapture}
                      disabled={isTranscribing || !isSupported}
                      className={clsx(
                        'relative p-3 border rounded-xl transition-colors',
                        isRecording
                          ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                          : isTranscribing
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                          : 'text-zinc-500 hover:text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border-zinc-700'
                      )}
                      title="Voice reply (M)"
                    >
                      {isTranscribing ? '⏳' : isRecording ? '⏹️' : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-14 0m14 0a7 7 0 00-14 0m14 0v1a7 7 0 01-14 0v-1m7 8v3m-4 0h8"/>
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={handleReply}
                      disabled={!replyText.trim()}
                      className="px-5 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-xl transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-zinc-600">
                    Press <kbd className="px-1 py-0.5 bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700 rounded text-[9px] font-medium text-zinc-500">Enter</kbd> to send · <kbd className="px-1 py-0.5 bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700 rounded text-[9px] font-medium text-zinc-500">Shift+Enter</kbd> for new line
                  </p>
                  <p className="text-[10px] text-zinc-600">
                    Saved to inbox.json for Claude
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-zinc-400 mb-1">Select an item</h3>
              <p className="text-xs text-zinc-600">Choose an inbox item to view details</p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

// List item component for left pane
function InboxListItem({
  item,
  isSelected,
  onSelect,
  onDelete,
  formatTime,
  index = 0,
}: {
  item: InboxItem;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (id: string) => void;
  formatTime: (dateStr: string) => string;
  index?: number;
}) {
  const hasClaudeContent = item.author === 'claude' || item.replies?.some(r => r.author === 'claude');
  const isUnread = !item.read && item.status === 'pending';
  const isDone = item.status !== 'pending';
  const isEvenRow = index % 2 === 0;

  // Title is first sentence or first 50 chars
  const titleEnd = item.text.indexOf('. ');
  const title = titleEnd > 0 && titleEnd < 60 ? item.text.slice(0, titleEnd) : (item.text.length > 50 ? item.text.slice(0, 50) : item.text);
  const hasPreview = item.text.length > title.length;

  return (
    <div
      onClick={onSelect}
      className={clsx(
        'group px-3 py-2.5 cursor-pointer border-b border-zinc-800/20 transition-colors',
        isSelected
          ? 'bg-blue-500/8 border-l-2 border-l-blue-500'
          : isEvenRow
          ? 'bg-zinc-950/30 hover:bg-zinc-800/40 border-l-2 border-l-transparent'
          : 'bg-zinc-900/20 hover:bg-zinc-800/40 border-l-2 border-l-transparent',
        isDone && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Unread indicator */}
        <div className={clsx(
          'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
          isUnread && hasClaudeContent ? 'bg-purple-500' : 'bg-transparent'
        )} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className={clsx(
              'text-sm truncate',
              isDone ? 'text-zinc-500 line-through' : isSelected ? 'font-medium text-zinc-100' : 'text-zinc-300'
            )}>
              {title}
            </span>
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              <span className="text-[10px] text-zinc-600">{formatTime(item.createdAt)}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/10 rounded transition-all text-zinc-600 hover:text-red-400"
                title="Delete"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content preview */}
          {hasPreview && (
            <p className={clsx(
              'text-[11px] truncate mb-1',
              isDone ? 'text-zinc-600' : 'text-zinc-500'
            )}>
              {item.text.slice(title.length).replace(/^\.\s*/, '').slice(0, 80)}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {item.project && (
              <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800/60 text-zinc-500 rounded">@{item.project}</span>
            )}
            {item.priority && (
              <span className={clsx(
                'text-[10px] px-1.5 py-0.5 rounded border',
                item.priority === 'P0' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                item.priority === 'P1' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                item.priority === 'P2' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
              )}>
                {item.priority}
              </span>
            )}
            {hasClaudeContent && isUnread && (
              <span className="text-[10px] text-purple-400">Claude replied</span>
            )}
            {item.replies && item.replies.length > 0 && (
              <span className="text-[10px] text-zinc-600">{item.replies.length} {item.replies.length === 1 ? 'reply' : 'replies'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

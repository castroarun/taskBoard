import { useState, useEffect, useCallback } from 'react';
import { useAppStore, InboxItem, Priority } from '@/store';
import { readInbox, writeInbox, checkVoiceAvailable, voiceCapture } from '@/lib/tauri';
import clsx from 'clsx';

// Mock inbox items for demo
const MOCK_INBOX: InboxItem[] = [
  {
    id: 'inbox-1',
    text: 'Move taskboard pipeline task to review',
    type: 'task',
    project: 'taskboard',
    priority: 'P1',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inbox-2',
    text: 'Create task for taskboard: Add keyboard shortcuts',
    type: 'task',
    project: 'taskboard',
    priority: 'P2',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'inbox-3',
    text: 'P0 the file watcher task',
    type: 'task',
    project: null,
    priority: 'P0',
    status: 'pending',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'inbox-4',
    text: 'Research Whisper alternatives for tradevoice',
    type: 'idea',
    project: 'tradevoice',
    priority: null,
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'inbox-5',
    text: 'Update tradevoice to architecture stage',
    type: 'task',
    project: 'tradevoice',
    priority: 'P1',
    status: 'done',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

export function InboxView() {
  const { inboxItems, setInboxItems, addInboxItem, updateInboxItem } = useAppStore();
  const [inputText, setInputText] = useState('');
  const [selectedType, setSelectedType] = useState<'idea' | 'task' | 'note'>('note');
  const [items, setItems] = useState<InboxItem[]>(MOCK_INBOX);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check voice availability on mount
  useEffect(() => {
    checkVoiceAvailable().then(setVoiceAvailable).catch(() => setVoiceAvailable(false));
  }, []);

  // Use mock items for demo, sync with store
  const displayItems = items.length > 0 ? items : inboxItems;

  // Auto-save items when they change
  const saveItems = useCallback(async (itemsToSave: InboxItem[]) => {
    setIsSaving(true);
    try {
      // Convert items to markdown format for inbox.md
      const markdown = itemsToSave
        .filter((item) => item.status === 'pending')
        .map((item) => {
          const prefix = item.type === 'task' ? '- [ ]' : item.type === 'idea' ? '- 💡' : '-';
          const priority = item.priority ? ` [${item.priority}]` : '';
          const project = item.project ? ` @${item.project}` : '';
          return `${prefix} ${item.text}${priority}${project}`;
        })
        .join('\n');

      await writeInbox(`# Inbox\n\n${markdown}\n`);
    } catch (err) {
      console.error('Failed to save inbox:', err);
    } finally {
      setIsSaving(false);
    }
  }, []);

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
    };

    const newItems = [newItem, ...items];
    setItems(newItems);
    addInboxItem(newItem);
    setInputText('');
    saveItems(newItems);
  };

  const handleStatusChange = (id: string, status: 'pending' | 'done' | 'skipped') => {
    const newItems = items.map((item) => (item.id === id ? { ...item, status } : item));
    setItems(newItems);
    updateInboxItem(id, { status });
    saveItems(newItems);
  };

  const handleVoiceCapture = async () => {
    if (!voiceAvailable || isRecording) return;

    setIsRecording(true);
    try {
      const transcript = await voiceCapture(5); // 5 second recording
      if (transcript) {
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    } catch (err) {
      console.error('Voice capture failed:', err);
    } finally {
      setIsRecording(false);
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
              disabled={!voiceAvailable || isRecording}
              className={clsx(
                'px-4 py-3 border rounded-lg transition-all',
                isRecording
                  ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                  : voiceAvailable
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
                  : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-600 cursor-not-allowed'
              )}
              title={voiceAvailable ? (isRecording ? 'Recording...' : 'Voice capture') : 'Voice not available'}
            >
              {isRecording ? '⏺️' : '🎤'}
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
            <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Process All with Agent →
            </button>
          )}
        </div>

        <div className="space-y-2">
          {pendingItems.length === 0 ? (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
              <div className="text-3xl mb-2">📥</div>
              <p className="text-zinc-500 text-sm">Inbox is empty</p>
            </div>
          ) : (
            pendingItems.map((item) => (
              <InboxItemCard
                key={item.id}
                item={item}
                onStatusChange={handleStatusChange}
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
                onStatusChange={handleStatusChange}
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
  onStatusChange: (id: string, status: 'pending' | 'done' | 'skipped') => void;
}

function InboxItemCard({ item, onStatusChange }: InboxItemCardProps) {
  const typeIcons = {
    idea: '💡',
    task: '📋',
    note: '📝',
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

  return (
    <div
      className={clsx(
        'bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 transition-colors',
        item.status === 'pending' && 'hover:border-zinc-700'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status checkbox */}
        <button
          onClick={() =>
            onStatusChange(item.id, item.status === 'done' ? 'pending' : 'done')
          }
          className={clsx(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors mt-0.5',
            item.status === 'done'
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-zinc-600 hover:border-zinc-400'
          )}
        >
          {item.status === 'done' && <span className="text-xs">✓</span>}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
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
          </div>

          <div className="flex items-center gap-2">
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
            <span className="text-xs text-zinc-600">{formatTime(item.createdAt)}</span>
          </div>
        </div>

        {/* Actions */}
        {item.status === 'pending' && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onStatusChange(item.id, 'skipped')}
              className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded transition-colors"
            >
              Skip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

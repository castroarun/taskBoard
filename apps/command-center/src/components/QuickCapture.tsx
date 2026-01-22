import React, { useState, useRef, useEffect } from 'react';
import { addToInbox, parseQuickInput } from '../features/quick-capture';
import { VoiceButton } from '../hooks/useVoiceCapture';

interface QuickCaptureProps {
  isOpen: boolean;
  onClose: () => void;
}

type CaptureType = 'idea' | 'task' | 'note';

export function QuickCapture({ isOpen, onClose }: QuickCaptureProps) {
  const [text, setText] = useState('');
  const [type, setType] = useState<CaptureType>('note');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, text]);

  const handleSubmit = async () => {
    if (!text.trim()) return;

    setIsSubmitting(true);
    try {
      const parsed = parseQuickInput(text);
      await addToInbox({ ...parsed, type });
      setText('');
      onClose();
    } catch (error) {
      console.error('Failed to add to inbox:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
          <h2 className="text-sm font-medium text-zinc-300">Quick Capture</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <span className="text-lg">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Input with Voice */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or hold 🎤 to speak..."
              className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <VoiceButton
              onTranscript={(transcript) => setText(text ? `${text} ${transcript}` : transcript)}
              disabled={isSubmitting}
            />
          </div>

          {/* Type selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Type:</span>
            <div className="flex gap-1">
              {(['idea', 'task', 'note'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    type === t
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  {t === 'idea' && '💡'} {t === 'task' && '📋'} {t === 'note' && '📝'}{' '}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Hint */}
          <p className="text-xs text-zinc-500">
            💡 Tip: Include <code className="text-zinc-400">@projectname</code> or{' '}
            <code className="text-zinc-400">P1</code> to auto-tag
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-zinc-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isSubmitting}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            Add to Inbox
            <span className="text-xs text-indigo-300">↵</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Floating Action Button for Quick Capture
 */
export function QuickCaptureButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-500 hover:bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center text-white text-2xl transition-all hover:scale-110 z-40"
      title="Quick Capture (Ctrl+Shift+N)"
    >
      +
    </button>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { checkVoiceAvailable, voiceCapture } from '@/lib/tauri';
import clsx from 'clsx';

interface VoiceCaptureProps {
  onTranscript: (text: string) => void;
  onClose: () => void;
}

export function VoiceCapture({ onTranscript, onClose }: VoiceCaptureProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Check voice availability on mount
  useEffect(() => {
    checkVoiceAvailable()
      .then(setIsAvailable)
      .catch(() => setIsAvailable(false));
  }, []);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const handleRecord = useCallback(async () => {
    if (!isAvailable) {
      setError('Voice capture not available');
      return;
    }

    if (isRecording) return;

    setIsRecording(true);
    setRecordingTime(0);
    setError(null);

    try {
      const transcript = await voiceCapture(5); // 5 second recording
      if (transcript) {
        onTranscript(transcript);
        onClose();
      } else {
        setError('No speech detected');
      }
    } catch (err) {
      setError('Recording failed');
      console.error('Voice capture error:', err);
    } finally {
      setIsRecording(false);
    }
  }, [isAvailable, isRecording, onTranscript, onClose]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl p-8 animate-slide-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-zinc-100 mb-6">Voice Capture</h3>

          {/* Recording Button */}
          <button
            onClick={handleRecord}
            disabled={!isAvailable || isRecording}
            className={clsx(
              'w-24 h-24 rounded-full flex items-center justify-center transition-all mx-auto mb-4',
              isRecording
                ? 'bg-red-500 animate-pulse scale-110'
                : isAvailable
                ? 'bg-blue-600 hover:bg-blue-500 hover:scale-105'
                : 'bg-zinc-700 cursor-not-allowed'
            )}
          >
            {isRecording ? (
              <div className="flex flex-col items-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                <span className="text-white text-xs mt-1">{formatTime(recordingTime)}</span>
              </div>
            ) : (
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            )}
          </button>

          {/* Status */}
          <div className="text-sm text-zinc-400 mb-2">
            {!isAvailable ? (
              <span className="text-amber-400">Voice capture not available in browser mode</span>
            ) : isRecording ? (
              <span className="text-red-400">Recording... Speak now</span>
            ) : (
              'Click to start recording'
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-400 mt-2">{error}</div>
          )}

          {/* Visualizer (fake, just for show) */}
          {isRecording && (
            <div className="flex items-center justify-center gap-1 mt-4">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-blue-500 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 20 + 10}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Instructions */}
          <p className="text-xs text-zinc-500 mt-4 max-w-xs mx-auto">
            Speak clearly into your microphone. Recording will automatically stop after 5 seconds.
          </p>
        </div>
      </div>
    </div>
  );
}

// Hook for easy voice capture usage
export function useVoiceCapture() {
  const [isOpen, setIsOpen] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);

  const openVoiceCapture = useCallback(() => setIsOpen(true), []);
  const closeVoiceCapture = useCallback(() => setIsOpen(false), []);

  const handleTranscript = useCallback((text: string) => {
    setLastTranscript(text);
  }, []);

  return {
    isOpen,
    lastTranscript,
    openVoiceCapture,
    closeVoiceCapture,
    handleTranscript,
    VoiceCaptureModal: isOpen ? (
      <VoiceCapture onTranscript={handleTranscript} onClose={closeVoiceCapture} />
    ) : null,
  };
}

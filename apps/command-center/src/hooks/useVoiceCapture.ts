/**
 * Voice Capture Hook
 *
 * Uses Whisper.cpp via Tauri backend for local speech-to-text.
 * Press and hold to record, release to transcribe.
 */

import { useState, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface VoiceState {
  isRecording: boolean;
  isTranscribing: boolean;
  isAvailable: boolean;
  error: string | null;
}

interface UseVoiceCaptureResult {
  state: VoiceState;
  transcript: string;
  startRecording: () => void;
  stopRecording: () => Promise<string>;
  checkAvailability: () => Promise<boolean>;
  setupVoice: () => Promise<void>;
}

export function useVoiceCapture(): UseVoiceCaptureResult {
  const [state, setState] = useState<VoiceState>({
    isRecording: false,
    isTranscribing: false,
    isAvailable: false,
    error: null,
  });
  const [transcript, setTranscript] = useState('');
  const recordingStartTime = useRef<number>(0);

  const checkAvailability = useCallback(async (): Promise<boolean> => {
    try {
      const available = await invoke<boolean>('check_voice_available');
      setState((s) => ({ ...s, isAvailable: available }));
      return available;
    } catch (error) {
      console.error('Failed to check voice availability:', error);
      return false;
    }
  }, []);

  const setupVoice = useCallback(async (): Promise<void> => {
    try {
      setState((s) => ({ ...s, error: null }));
      await invoke<string>('setup_voice');
      await checkAvailability();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState((s) => ({ ...s, error: message }));
      throw error;
    }
  }, [checkAvailability]);

  const startRecording = useCallback(() => {
    recordingStartTime.current = Date.now();
    setState((s) => ({ ...s, isRecording: true, error: null }));
    setTranscript('');
  }, []);

  const stopRecording = useCallback(async (): Promise<string> => {
    const duration = Math.ceil((Date.now() - recordingStartTime.current) / 1000);
    setState((s) => ({ ...s, isRecording: false, isTranscribing: true }));

    try {
      // Minimum 1 second, maximum 30 seconds
      const recordDuration = Math.max(1, Math.min(duration, 30));
      const result = await invoke<string>('voice_capture', {
        durationSecs: recordDuration,
      });

      setTranscript(result);
      setState((s) => ({ ...s, isTranscribing: false }));
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState((s) => ({ ...s, isTranscribing: false, error: message }));
      throw error;
    }
  }, []);

  return {
    state,
    transcript,
    startRecording,
    stopRecording,
    checkAvailability,
    setupVoice,
  };
}

/**
 * Voice button component for use in Quick Capture
 */
export function VoiceButton({
  onTranscript,
  disabled = false,
}: {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}) {
  const { state, startRecording, stopRecording, setupVoice } = useVoiceCapture();

  const handleMouseDown = () => {
    if (!state.isAvailable) {
      setupVoice().catch(console.error);
      return;
    }
    startRecording();
  };

  const handleMouseUp = async () => {
    if (!state.isRecording) return;
    try {
      const text = await stopRecording();
      if (text) {
        onTranscript(text);
      }
    } catch (error) {
      console.error('Voice capture failed:', error);
    }
  };

  return (
    <button
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      disabled={disabled || state.isTranscribing}
      className={`
        p-3 rounded-xl transition-all
        ${state.isRecording
          ? 'bg-red-500 text-white scale-110 animate-pulse'
          : state.isTranscribing
          ? 'bg-yellow-500/20 text-yellow-400'
          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={
        state.isRecording
          ? 'Release to transcribe'
          : state.isTranscribing
          ? 'Transcribing...'
          : state.isAvailable
          ? 'Hold to speak'
          : 'Click to setup voice'
      }
    >
      {state.isRecording ? (
        <span className="text-lg">🔴</span>
      ) : state.isTranscribing ? (
        <span className="text-lg animate-spin">⏳</span>
      ) : (
        <span className="text-lg">🎤</span>
      )}
    </button>
  );
}

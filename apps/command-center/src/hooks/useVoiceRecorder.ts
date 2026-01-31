/**
 * Voice Recording Hook
 *
 * Uses browser MediaRecorder API to capture audio.
 * Returns audio blob ready for Groq transcription.
 */

import { useState, useRef, useCallback } from 'react';

interface UseVoiceRecorderResult {
  isRecording: boolean;
  isSupported: boolean;
  recordingDuration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  error: string | null;
}

export function useVoiceRecorder(): UseVoiceRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if MediaRecorder is supported
  const isSupported = typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Voice recording not supported in this browser');
      return;
    }

    try {
      setError(null);
      chunksRef.current = [];
      setRecordingDuration(0);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      });

      // Create MediaRecorder with best available codec
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      startTimeRef.current = Date.now();
      setIsRecording(true);

      // Update duration every 100ms
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 100);
    } catch (err) {
      console.error('[useVoiceRecorder] Failed to start:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Microphone access denied. Please allow microphone access.');
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to start recording');
      }
    }
  }, [isSupported]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    // Clear duration interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    const elapsed = Date.now() - startTimeRef.current;

    // Reject recordings shorter than 1 second — Whisper hallucinates on very short audio
    if (elapsed < 1000) {
      const mediaRecorder = mediaRecorderRef.current;
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
      setRecordingDuration(0);
      setError('Recording too short. Hold for at least 1 second.');
      return null;
    }

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;

      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        setIsRecording(false);
        setRecordingDuration(0);
        resolve(null);
        return;
      }

      mediaRecorder.onstop = () => {
        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach(track => track.stop());

        // Create blob from chunks
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType
        });

        setIsRecording(false);
        setRecordingDuration(0);
        resolve(blob);
      };

      mediaRecorder.stop();
    });
  }, []);

  return {
    isRecording,
    isSupported,
    recordingDuration,
    startRecording,
    stopRecording,
    error,
  };
}

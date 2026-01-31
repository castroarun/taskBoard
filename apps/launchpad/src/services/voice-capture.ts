/**
 * Voice Capture Service for Orbit (Mobile)
 *
 * MVP Flow (text-based, no native voice yet):
 * 1. User types or pastes text
 * 2. Text → Groq LLaMA → structured task
 * 3. Structured task → saved to inbox
 * 4. Command Center's Claude agent picks up later
 *
 * Future: Replace with expo-av recording + Groq Whisper transcription
 * when using development client build.
 */

import { structureVoiceText, StructuredTask } from './groq';

export type CaptureState = 'idle' | 'recording' | 'processing' | 'review' | 'success';

interface VoiceCaptureState {
  state: CaptureState;
  rawText: string;
  structured: StructuredTask | null;
  error: string | null;
}

const initialState: VoiceCaptureState = {
  state: 'idle',
  rawText: '',
  structured: null,
  error: null,
};

class VoiceCaptureService {
  private currentState: VoiceCaptureState = { ...initialState };
  private listeners: Set<(state: VoiceCaptureState) => void> = new Set();

  private updateState(partial: Partial<VoiceCaptureState>) {
    this.currentState = { ...this.currentState, ...partial };
    this.listeners.forEach((listener) => listener(this.currentState));
  }

  subscribe(listener: (state: VoiceCaptureState) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): VoiceCaptureState {
    return this.currentState;
  }

  startCapture() {
    this.updateState({ state: 'recording', rawText: '', structured: null, error: null });
  }

  setRawText(text: string) {
    this.updateState({ rawText: text });
  }

  async processText(projectContext?: string): Promise<StructuredTask> {
    this.updateState({ state: 'processing', error: null });

    try {
      const structured = await structureVoiceText(
        this.currentState.rawText,
        projectContext
      );
      this.updateState({ state: 'review', structured });
      return structured;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to structure text';
      this.updateState({ state: 'recording', error: message });
      throw error;
    }
  }

  reset() {
    this.currentState = { ...initialState };
    this.listeners.forEach((listener) => listener(this.currentState));
  }

  destroy() {
    this.listeners.clear();
  }
}

export const voiceCapture = new VoiceCaptureService();

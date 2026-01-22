/**
 * Voice Capture Service for Launchpad (Mobile)
 *
 * Flow:
 * 1. User gets notification about stale project
 * 2. User opens Launchpad, taps "Quick Instruct"
 * 3. Records voice → Android Speech-to-Text → raw text
 * 4. Raw text → Groq → structured instruction
 * 5. Structured instruction → saved to inbox (synced)
 * 6. Command Center's Claude agent picks up later
 */

import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';
import { structureVoiceInput, StructuredInstruction } from '@taskboard/shared/llm';

interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  error: string | null;
  partialResults: string[];
}

class VoiceCaptureService {
  private state: VoiceState = {
    isListening: false,
    isProcessing: false,
    error: null,
    partialResults: [],
  };

  private listeners: Set<(state: VoiceState) => void> = new Set();
  private onResultCallback: ((text: string) => void) | null = null;

  constructor() {
    this.setupVoiceListeners();
  }

  private setupVoiceListeners() {
    Voice.onSpeechStart = () => {
      this.updateState({ isListening: true, error: null });
    };

    Voice.onSpeechEnd = () => {
      this.updateState({ isListening: false });
    };

    Voice.onSpeechResults = (event: SpeechResultsEvent) => {
      const text = event.value?.[0] || '';
      if (text && this.onResultCallback) {
        this.onResultCallback(text);
      }
    };

    Voice.onSpeechPartialResults = (event: SpeechResultsEvent) => {
      this.updateState({ partialResults: event.value || [] });
    };

    Voice.onSpeechError = (event: SpeechErrorEvent) => {
      this.updateState({
        isListening: false,
        error: event.error?.message || 'Speech recognition error',
      });
    };
  }

  private updateState(partial: Partial<VoiceState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => listener(this.state));
  }

  subscribe(listener: (state: VoiceState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): VoiceState {
    return this.state;
  }

  /**
   * Start listening for voice input
   */
  async startListening(): Promise<void> {
    try {
      await Voice.start('en-US');
    } catch (error) {
      this.updateState({
        error: error instanceof Error ? error.message : 'Failed to start voice',
      });
    }
  }

  /**
   * Stop listening and get the result
   */
  async stopListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.onResultCallback = (text) => {
        this.onResultCallback = null;
        resolve(text);
      };

      Voice.stop().catch(reject);

      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.onResultCallback) {
          this.onResultCallback = null;
          resolve(this.state.partialResults[0] || '');
        }
      }, 5000);
    });
  }

  /**
   * Cancel voice capture
   */
  async cancel(): Promise<void> {
    await Voice.cancel();
    this.updateState({ isListening: false, partialResults: [] });
  }

  /**
   * Full flow: Record → Transcribe → Structure → Save
   */
  async captureAndStructure(
    projectContext?: string
  ): Promise<StructuredInstruction> {
    // Start recording
    await this.startListening();

    // Wait for user to stop (handled by UI)
    // This is called after stopListening() returns the text

    throw new Error('Use startListening/stopListening flow instead');
  }

  /**
   * Process raw text into structured instruction
   */
  async processVoiceText(
    rawText: string,
    projectContext?: string
  ): Promise<StructuredInstruction> {
    this.updateState({ isProcessing: true });

    try {
      const structured = await structureVoiceInput(
        rawText,
        projectContext,
        true // isMobile = true, always use Groq
      );

      this.updateState({ isProcessing: false });
      return structured;
    } catch (error) {
      this.updateState({
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to process',
      });
      throw error;
    }
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    await Voice.destroy();
    this.listeners.clear();
  }
}

export const voiceCapture = new VoiceCaptureService();

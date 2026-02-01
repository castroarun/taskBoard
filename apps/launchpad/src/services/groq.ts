import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_TRANSCRIPTION_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

const GROQ_KEY_STORAGE = 'groq-api-key';

type Priority = 'P0' | 'P1' | 'P2' | 'P3';
type Complexity = 'XS' | 'S' | 'M' | 'L' | 'XL';

const VALID_PRIORITIES: Priority[] = ['P0', 'P1', 'P2', 'P3'];
const VALID_COMPLEXITIES: Complexity[] = ['XS', 'S', 'M', 'L', 'XL'];

export interface StructuredTask {
  title: string;
  description: string;
  priority: Priority;
  complexity: Complexity;
}

export async function getGroqApiKey(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(GROQ_KEY_STORAGE);
    }
    return await SecureStore.getItemAsync(GROQ_KEY_STORAGE);
  } catch {
    return null;
  }
}

export async function setGroqApiKey(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(GROQ_KEY_STORAGE, key);
  } else {
    await SecureStore.setItemAsync(GROQ_KEY_STORAGE, key);
  }
}

export async function isGroqConfigured(): Promise<boolean> {
  const key = await getGroqApiKey();
  return key !== null && key.length > 0;
}

function buildFallbackTask(voiceText: string): StructuredTask {
  return {
    title: voiceText.slice(0, 60).trim(),
    description: voiceText,
    priority: 'P2',
    complexity: 'M',
  };
}

export async function structureVoiceText(
  voiceText: string,
  projectContext?: string
): Promise<StructuredTask> {
  const apiKey = await getGroqApiKey();

  if (!apiKey) {
    return buildFallbackTask(voiceText);
  }

  const contextNote = projectContext
    ? `\nProject context: ${projectContext}`
    : '';

  const response = await fetch(GROQ_CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are a task structuring assistant. Convert voice input into a structured task.
Extract:
- title: A clear, concise task title (max 60 chars)
- description: Detailed description of what needs to be done
- priority: P0 (critical/urgent), P1 (high), P2 (medium), P3 (low)
- complexity: XS (trivial), S (small), M (medium), L (large), XL (very large)

Respond ONLY with valid JSON in this exact format:
{"title": "...", "description": "...", "priority": "P2", "complexity": "M"}

If the input is unclear, make reasonable assumptions. Default to P2 priority and M complexity if not specified.${contextNote}`,
        },
        { role: 'user', content: voiceText },
      ],
      temperature: 0.3,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI structuring failed: ${response.status}`);
  }

  interface GroqChatResponse {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  }

  const data: GroqChatResponse = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed: Record<string, unknown> = JSON.parse(jsonMatch[0]);
      const parsedPriority = parsed.priority as string;
      const parsedComplexity = parsed.complexity as string;

      return {
        title:
          typeof parsed.title === 'string'
            ? parsed.title
            : voiceText.slice(0, 60),
        description:
          typeof parsed.description === 'string'
            ? parsed.description
            : voiceText,
        priority: VALID_PRIORITIES.includes(parsedPriority as Priority)
          ? (parsedPriority as Priority)
          : 'P2',
        complexity: VALID_COMPLEXITIES.includes(parsedComplexity as Complexity)
          ? (parsedComplexity as Complexity)
          : 'M',
      };
    }
  } catch {
    // Parse failed, use fallback
  }

  return buildFallbackTask(voiceText);
}

export async function transcribeAudio(audioUri: string): Promise<string> {
  const apiKey = await getGroqApiKey();

  if (!apiKey) {
    throw new Error('Groq API key not configured. Go to Settings to add it.');
  }

  const formData = new FormData();

  if (Platform.OS === 'web') {
    // Web: blob URLs have no file extension — read actual blob type instead
    const blob = await fetch(audioUri).then((r) => r.blob());
    const blobType = blob.type.split(';')[0]; // e.g. "audio/webm;codecs=opus" → "audio/webm"

    // Map MIME → extension (Groq validates by filename extension)
    const extFromMime: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav',
      'audio/mp4': 'mp4',
      'audio/mpeg': 'mp3',
      'audio/m4a': 'm4a',
      'audio/flac': 'flac',
      'audio/opus': 'opus',
    };
    const ext = extFromMime[blobType] || 'webm';
    const file = new File([blob], `recording.${ext}`, { type: blobType || 'audio/webm' });
    formData.append('file', file);
  } else {
    // Native: expo-av saves as .m4a on iOS, .3gp on Android
    const ext = audioUri.split('.').pop() || 'm4a';
    const mimeMap: Record<string, string> = {
      m4a: 'audio/m4a',
      '3gp': 'audio/3gpp',
      mp4: 'audio/mp4',
      wav: 'audio/wav',
      webm: 'audio/webm',
    };
    formData.append('file', {
      uri: audioUri,
      type: mimeMap[ext] || 'audio/m4a',
      name: `recording.${ext}`,
    } as unknown as Blob);
  }
  formData.append('model', 'whisper-large-v3');
  formData.append('language', 'en');

  const response = await fetch(GROQ_TRANSCRIPTION_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Transcription failed (${response.status}): ${errorText}`);
  }

  interface TranscriptionResponse {
    text?: string;
  }

  const data: TranscriptionResponse = await response.json();
  const text = data.text?.trim() || '';

  if (text.length === 0) {
    throw new Error('No speech detected. Please try again.');
  }

  return text;
}

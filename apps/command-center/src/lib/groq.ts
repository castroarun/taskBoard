/**
 * Groq API Integration
 *
 * - Whisper: Voice-to-text transcription
 * - LLaMA: AI structuring for task creation
 *
 * API Docs: https://console.groq.com/docs
 */

const GROQ_WHISPER_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface TranscriptionResult {
  text: string;
  error?: string;
}

interface StructuredTask {
  title: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  complexity: 'XS' | 'S' | 'M' | 'L' | 'XL';
}

interface AIStructureResult {
  task: StructuredTask | null;
  error?: string;
}

interface StructuredProject {
  name: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  complexity: 'E' | 'F';
}

interface AIProjectResult {
  project: StructuredProject | null;
  error?: string;
}

/**
 * Get Groq API key from config
 * Checks localStorage overrides first (user-saved settings), then falls back to config.json
 */
export async function getGroqApiKey(): Promise<string | null> {
  // First check localStorage for user-saved overrides
  try {
    const savedOverrides = localStorage.getItem('taskboard-config-overrides');
    if (savedOverrides) {
      const overrides = JSON.parse(savedOverrides);
      const apiKey = overrides.integrations?.groq?.apiKey;
      if (apiKey && apiKey.length > 0) {
        return apiKey;
      }
    }
  } catch (e) {
    console.warn('[groq] Failed to parse localStorage config');
  }

  // Fall back to config.json
  try {
    const response = await fetch('/data/config.json');
    if (response.ok) {
      const config = await response.json();
      // Check integrations.groq.apiKey (current location) or apiKeys.groq (legacy)
      const apiKey = config.integrations?.groq?.apiKey || config.apiKeys?.groq || null;
      return apiKey && apiKey.length > 0 ? apiKey : null;
    }
  } catch (e) {
    console.warn('[groq] Failed to fetch config');
  }
  return null;
}

/**
 * Get file extension from MIME type
 */
function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/webm;codecs=opus': 'webm',
    'audio/mp4': 'mp4',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/flac': 'flac',
  };
  return mimeToExt[mimeType] || 'webm';
}

/**
 * Transcribe audio blob using Groq Whisper API
 */
export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  const apiKey = await getGroqApiKey();

  if (!apiKey) {
    return {
      text: '',
      error: 'Groq API key not configured. Add it in Settings.',
    };
  }

  try {
    // Get correct file extension based on blob type
    const extension = getFileExtension(audioBlob.type);
    const fileName = `recording.${extension}`;

    console.log('[groq] Transcribing audio:', {
      type: audioBlob.type,
      size: audioBlob.size,
      fileName,
    });

    // Create form data with the audio file
    const formData = new FormData();
    formData.append('file', audioBlob, fileName);
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'en');
    formData.append('response_format', 'json');

    const response = await fetch(GROQ_WHISPER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[groq] Whisper API error:', errorData);
      return {
        text: '',
        error: errorData.error?.message || `Transcription failed: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      text: data.text || '',
    };
  } catch (error) {
    console.error('[groq] Transcription failed:', error);
    return {
      text: '',
      error: error instanceof Error ? error.message : 'Transcription failed',
    };
  }
}

/**
 * Use Groq LLaMA to structure voice input into task details
 */
export async function structureTaskFromVoice(voiceText: string): Promise<AIStructureResult> {
  const apiKey = await getGroqApiKey();

  if (!apiKey) {
    return {
      task: null,
      error: 'Groq API key not configured.',
    };
  }

  try {
    const response = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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

If the input is unclear, make reasonable assumptions. Default to P2 priority and M complexity if not specified.`,
          },
          {
            role: 'user',
            content: voiceText,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[groq] LLaMA API error:', errorData);
      return {
        task: null,
        error: errorData.error?.message || `AI structuring failed: ${response.status}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse the JSON response
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          task: {
            title: parsed.title || '',
            description: parsed.description || '',
            priority: ['P0', 'P1', 'P2', 'P3'].includes(parsed.priority) ? parsed.priority : 'P2',
            complexity: ['XS', 'S', 'M', 'L', 'XL'].includes(parsed.complexity) ? parsed.complexity : 'M',
          },
        };
      }
    } catch (parseError) {
      console.error('[groq] Failed to parse AI response:', content);
    }

    // Fallback: use voice text as description, derive title
    return {
      task: {
        title: voiceText.slice(0, 60).trim(),
        description: voiceText,
        priority: 'P2',
        complexity: 'M',
      },
    };
  } catch (error) {
    console.error('[groq] AI structuring failed:', error);
    return {
      task: null,
      error: error instanceof Error ? error.message : 'AI structuring failed',
    };
  }
}

/**
 * Use Groq LLaMA to structure voice input into project details
 */
export async function structureProjectFromVoice(voiceText: string): Promise<AIProjectResult> {
  const apiKey = await getGroqApiKey();

  if (!apiKey) {
    return {
      project: null,
      error: 'Groq API key not configured.',
    };
  }

  try {
    const response = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a project structuring assistant. Convert voice input into a structured project.
Extract:
- name: A clear, concise project name (max 40 chars, title case, no special characters)
- description: What the project does (1-2 sentences)
- priority: P0 (critical/urgent), P1 (high), P2 (medium), P3 (low)
- complexity: E (easy/quick - simple apps, landing pages, prototypes) or F (full effort - complex systems, APIs, dashboards)

Respond ONLY with valid JSON in this exact format:
{"name": "...", "description": "...", "priority": "P1", "complexity": "F"}

Examples:
- "I want to build a simple landing page for my portfolio" → {"name": "Portfolio Landing Page", "description": "A simple landing page to showcase portfolio work", "priority": "P2", "complexity": "E"}
- "Create a full task management system with user auth and API" → {"name": "Task Management System", "description": "Full task management app with user authentication and REST API", "priority": "P1", "complexity": "F"}

Default to P1 priority and F complexity if unclear.`,
          },
          {
            role: 'user',
            content: voiceText,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[groq] LLaMA API error:', errorData);
      return {
        project: null,
        error: errorData.error?.message || `AI structuring failed: ${response.status}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse the JSON response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          project: {
            name: parsed.name || '',
            description: parsed.description || '',
            priority: ['P0', 'P1', 'P2', 'P3'].includes(parsed.priority) ? parsed.priority : 'P1',
            complexity: ['E', 'F'].includes(parsed.complexity) ? parsed.complexity : 'F',
          },
        };
      }
    } catch (parseError) {
      console.error('[groq] Failed to parse AI response:', content);
    }

    // Fallback: derive name from first few words
    const words = voiceText.split(' ').slice(0, 4).join(' ');
    return {
      project: {
        name: words.slice(0, 40).trim(),
        description: voiceText,
        priority: 'P1',
        complexity: 'F',
      },
    };
  } catch (error) {
    console.error('[groq] AI structuring failed:', error);
    return {
      project: null,
      error: error instanceof Error ? error.message : 'AI structuring failed',
    };
  }
}

/**
 * Check if Groq is configured
 */
export async function isGroqConfigured(): Promise<boolean> {
  const apiKey = await getGroqApiKey();
  return apiKey !== null && apiKey.length > 0;
}

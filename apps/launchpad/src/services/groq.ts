import * as SecureStore from 'expo-secure-store';

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

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
    return await SecureStore.getItemAsync('groq-api-key');
  } catch {
    return null;
  }
}

export async function setGroqApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync('groq-api-key', key);
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

/**
 * Hybrid LLM System
 *
 * Standardized provider selection:
 * - Complex tasks → Claude (manual or API)
 * - Routine tasks → Ollama (local) → Groq (cloud fallback)
 * - Mobile voice → Groq (always cloud for mobile)
 *
 * This is NOT user configurable - it's the standard approach.
 */

export * from './types';
export { OllamaProvider, ollama } from './providers/ollama';
export { GroqProvider, groq } from './providers/groq';
export { ClaudeProvider, claude } from './providers/claude';

import type {
  LLMProvider,
  LLMResponse,
  Message,
  AgentTask,
  TaskComplexity,
  ProviderType,
} from './types';
import { TASK_COMPLEXITY, PROVIDER_PRIORITY } from './types';
import { ollama } from './providers/ollama';
import { groq } from './providers/groq';
import { claude } from './providers/claude';

/**
 * Get the appropriate provider for a task
 * Automatically handles fallback
 */
export async function getProvider(task: AgentTask): Promise<LLMProvider> {
  const complexity = TASK_COMPLEXITY[task];
  const providers = PROVIDER_PRIORITY[complexity];

  for (const providerName of providers) {
    const provider = getProviderByName(providerName);
    if (await provider.isAvailable()) {
      return provider;
    }
  }

  // If all else fails, return Claude (clipboard mode always works)
  return claude;
}

function getProviderByName(name: ProviderType): LLMProvider {
  switch (name) {
    case 'ollama':
      return ollama;
    case 'groq':
      return groq;
    case 'claude':
      return claude;
  }
}

/**
 * Execute a task with automatic provider selection
 */
export async function executeTask(
  task: AgentTask,
  messages: Message[]
): Promise<LLMResponse> {
  const provider = await getProvider(task);

  console.log(`[LLM] Using ${provider.name} for task: ${task}`);

  return provider.chat(messages);
}

/**
 * Structure raw voice input into actionable instructions
 * Uses Groq (cloud) for mobile, Ollama for desktop
 */
export async function structureVoiceInput(
  rawText: string,
  projectContext?: string,
  isMobile: boolean = false
): Promise<StructuredInstruction> {
  // Mobile always uses Groq (no local LLM)
  // Desktop tries Ollama first
  const provider = isMobile ? groq : (await ollama.isAvailable()) ? ollama : groq;

  const systemPrompt = `You are an instruction parser for a project management system.
Convert the user's voice input into a structured JSON instruction.

Output ONLY valid JSON in this exact format:
{
  "action": "task" | "note" | "status" | "reminder",
  "project": "project-name or null",
  "title": "short title",
  "description": "detailed description",
  "priority": "P0" | "P1" | "P2" | "P3" | null,
  "dueDate": "YYYY-MM-DD or null",
  "tags": ["tag1", "tag2"]
}

${projectContext ? `Current project context: ${projectContext}` : ''}`;

  const response = await provider.chat([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: rawText },
  ]);

  try {
    return JSON.parse(response.content);
  } catch {
    // If parsing fails, return a basic structure
    return {
      action: 'note',
      project: null,
      title: rawText.slice(0, 50),
      description: rawText,
      priority: null,
      dueDate: null,
      tags: [],
    };
  }
}

export interface StructuredInstruction {
  action: 'task' | 'note' | 'status' | 'reminder';
  project: string | null;
  title: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3' | null;
  dueDate: string | null;
  tags: string[];
}

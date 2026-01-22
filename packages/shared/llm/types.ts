/**
 * LLM Provider Types
 *
 * Standardized hybrid approach:
 * - Complex tasks → Claude
 * - Routine tasks → Ollama (local) → Groq (fallback)
 */

export type ProviderType = 'claude' | 'ollama' | 'groq';

export type TaskComplexity = 'complex' | 'routine';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  provider: ProviderType;
  model: string;
  tokensUsed?: number;
}

export interface LLMProvider {
  name: ProviderType;
  isAvailable(): Promise<boolean>;
  chat(messages: Message[], options?: ChatOptions): Promise<LLMResponse>;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

/**
 * Task categories and their complexity mapping
 */
export type AgentTask =
  // Complex tasks - require Claude's reasoning
  | 'architecture'
  | 'prd'
  | 'review'
  | 'design'
  | 'complex_refactor'
  // Routine tasks - can use local LLM
  | 'inbox_processing'
  | 'simple_code'
  | 'git_commit'
  | 'task_update'
  | 'status_report'
  | 'docs_update';

/**
 * Standard mapping - NOT user configurable
 */
export const TASK_COMPLEXITY: Record<AgentTask, TaskComplexity> = {
  // Complex - Claude only
  architecture: 'complex',
  prd: 'complex',
  review: 'complex',
  design: 'complex',
  complex_refactor: 'complex',

  // Routine - Ollama/Groq
  inbox_processing: 'routine',
  simple_code: 'routine',
  git_commit: 'routine',
  task_update: 'routine',
  status_report: 'routine',
  docs_update: 'routine',
};

/**
 * Standard provider priority - NOT user configurable
 */
export const PROVIDER_PRIORITY: Record<TaskComplexity, ProviderType[]> = {
  complex: ['claude'],           // Claude only for complex tasks
  routine: ['ollama', 'groq'],   // Local first, cloud fallback
};

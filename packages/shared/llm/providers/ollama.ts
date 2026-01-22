/**
 * Ollama Provider
 *
 * Local LLM provider using Ollama.
 * Recommended model: deepseek-coder:33b for coding tasks
 *
 * Setup:
 *   winget install Ollama.Ollama
 *   ollama pull deepseek-coder:33b
 *   ollama serve
 */

import type { LLMProvider, LLMResponse, Message, ChatOptions } from '../types';

const DEFAULT_BASE_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'deepseek-coder:33b';
const FALLBACK_MODEL = 'deepseek-coder:6.7b';  // Smaller, needs less RAM

interface OllamaConfig {
  baseUrl?: string;
  model?: string;
}

export class OllamaProvider implements LLMProvider {
  name = 'ollama' as const;
  private baseUrl: string;
  private model: string;

  constructor(config: OllamaConfig = {}) {
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    this.model = config.model || DEFAULT_MODEL;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000), // 2 second timeout
      });

      if (!response.ok) return false;

      const data = await response.json();
      const models = data.models?.map((m: { name: string }) => m.name) || [];

      // Check if our preferred model is available
      return models.some((m: string) =>
        m.includes('deepseek-coder') || m.includes('codellama') || m.includes('llama')
      );
    } catch {
      return false;
    }
  }

  async chat(messages: Message[], options: ChatOptions = {}): Promise<LLMResponse> {
    const model = options.model || this.model;

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens ?? 4096,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama error: ${error}`);
    }

    const data = await response.json();

    return {
      content: data.message?.content || '',
      provider: 'ollama',
      model,
      tokensUsed: data.eval_count,
    };
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`);
    const data = await response.json();
    return data.models?.map((m: { name: string }) => m.name) || [];
  }

  /**
   * Pull a model if not present
   */
  async pullModel(model: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model }),
    });

    if (!response.ok) {
      throw new Error(`Failed to pull model: ${model}`);
    }

    // Stream the response to wait for completion
    const reader = response.body?.getReader();
    if (reader) {
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    }
  }
}

export const ollama = new OllamaProvider();

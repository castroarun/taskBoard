/**
 * Groq Provider
 *
 * Fast cloud LLM provider with free tier.
 * Used as fallback when Ollama is not available.
 *
 * Setup:
 *   1. Get free API key at https://console.groq.com
 *   2. Set GROQ_API_KEY environment variable
 *
 * Free tier: 30 requests/minute, 14,400 requests/day
 */

import type { LLMProvider, LLMResponse, Message, ChatOptions } from '../types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';  // Best free model

interface GroqConfig {
  apiKey?: string;
  model?: string;
}

export class GroqProvider implements LLMProvider {
  name = 'groq' as const;
  private apiKey: string | null;
  private model: string;

  constructor(config: GroqConfig = {}) {
    this.apiKey = config.apiKey || process.env.GROQ_API_KEY || null;
    this.model = config.model || DEFAULT_MODEL;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async chat(messages: Message[], options: ChatOptions = {}): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured. Set GROQ_API_KEY environment variable.');
    }

    const model = options.model || this.model;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Groq error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.choices?.[0]?.message?.content || '',
      provider: 'groq',
      model,
      tokensUsed: data.usage?.total_tokens,
    };
  }
}

export const groq = new GroqProvider();

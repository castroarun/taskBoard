/**
 * Claude Provider
 *
 * Primary provider for complex tasks.
 *
 * Modes:
 *   1. Clipboard (default) - Builds prompt, copies to clipboard, opens Claude
 *   2. API - Direct API calls (requires ANTHROPIC_API_KEY)
 *   3. CLI - Uses Claude Code CLI
 *
 * For complex tasks, Claude is the only option - no fallback.
 */

import type { LLMProvider, LLMResponse, Message, ChatOptions } from '../types';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

type ClaudeMode = 'clipboard' | 'api' | 'cli';

interface ClaudeConfig {
  mode?: ClaudeMode;
  apiKey?: string;
  model?: string;
}

export class ClaudeProvider implements LLMProvider {
  name = 'claude' as const;
  private mode: ClaudeMode;
  private apiKey: string | null;
  private model: string;

  constructor(config: ClaudeConfig = {}) {
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || null;
    this.model = config.model || DEFAULT_MODEL;

    // Auto-detect mode
    if (config.mode) {
      this.mode = config.mode;
    } else if (this.apiKey) {
      this.mode = 'api';
    } else {
      this.mode = 'clipboard';  // Default: manual paste
    }
  }

  async isAvailable(): Promise<boolean> {
    // Claude is always "available" - clipboard mode doesn't require anything
    if (this.mode === 'clipboard') return true;

    if (this.mode === 'api' && this.apiKey) {
      try {
        // Simple check - just verify API key format
        return this.apiKey.startsWith('sk-ant-');
      } catch {
        return false;
      }
    }

    if (this.mode === 'cli') {
      // Check if claude CLI is available
      try {
        // This would be implemented in Tauri backend
        return true;
      } catch {
        return false;
      }
    }

    return true;
  }

  async chat(messages: Message[], options: ChatOptions = {}): Promise<LLMResponse> {
    switch (this.mode) {
      case 'api':
        return this.chatViaAPI(messages, options);
      case 'cli':
        return this.chatViaCLI(messages, options);
      case 'clipboard':
      default:
        return this.chatViaClipboard(messages, options);
    }
  }

  /**
   * API Mode - Direct Anthropic API call
   */
  private async chatViaAPI(messages: Message[], options: ChatOptions): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const model = options.model || this.model;

    // Convert messages format
    const systemMessage = messages.find((m) => m.role === 'system')?.content;
    const chatMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: options.maxTokens ?? 4096,
        system: systemMessage,
        messages: chatMessages,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.content?.[0]?.text || '',
      provider: 'claude',
      model,
      tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens,
    };
  }

  /**
   * CLI Mode - Uses Claude Code CLI
   */
  private async chatViaCLI(messages: Message[], _options: ChatOptions): Promise<LLMResponse> {
    // Build the prompt
    const prompt = this.buildPrompt(messages);

    // This would invoke the Claude CLI via Tauri shell
    // For now, throw an error indicating it needs Tauri backend
    throw new Error(
      'CLI mode requires Tauri backend. Use invoke("claude_cli", { prompt }) from frontend.'
    );
  }

  /**
   * Clipboard Mode - Build prompt, copy, open Claude
   */
  private async chatViaClipboard(messages: Message[], _options: ChatOptions): Promise<LLMResponse> {
    const prompt = this.buildPrompt(messages);

    // Return the prompt for the frontend to handle
    // Frontend will: 1) Copy to clipboard 2) Open Claude 3) Wait for user
    return {
      content: prompt,
      provider: 'claude',
      model: 'clipboard-mode',
      tokensUsed: 0,
    };
  }

  /**
   * Build a complete prompt from messages
   */
  buildPrompt(messages: Message[]): string {
    let prompt = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        prompt += `# INSTRUCTIONS\n\n${msg.content}\n\n---\n\n`;
      } else if (msg.role === 'user') {
        prompt += `# TASK\n\n${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        prompt += `# PREVIOUS RESPONSE\n\n${msg.content}\n\n`;
      }
    }

    return prompt.trim();
  }
}

export const claude = new ClaudeProvider();

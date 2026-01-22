/**
 * Quick Capture Feature
 *
 * Allows quick idea/task input from anywhere:
 * - Floating button in app
 * - Global hotkey (Win+Shift+N)
 * - System tray menu
 */

import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';
import { register } from '@tauri-apps/plugin-global-shortcut';
import { homeDir } from '@tauri-apps/api/path';

interface QuickCaptureInput {
  text: string;
  type: 'idea' | 'task' | 'note';
  project?: string;
  priority?: 'P0' | 'P1' | 'P2' | 'P3';
}

const INBOX_PATH = 'arun-task-board/inbox.md';

/**
 * Append entry to inbox.md
 */
export async function addToInbox(input: QuickCaptureInput): Promise<void> {
  const home = await homeDir();
  const inboxPath = `${home}/${INBOX_PATH}`;

  // Read current content
  let content = '';
  try {
    content = await readTextFile(inboxPath);
  } catch {
    content = '# Inbox\n\nQuick instructions for agents.\n\n---\n';
  }

  // Format today's date
  const today = new Date().toISOString().split('T')[0];
  const dateHeader = `## ${today}`;

  // Format the entry
  let entry = `- ${input.text}`;
  if (input.priority) {
    entry += ` (${input.priority})`;
  }
  if (input.project) {
    entry += ` @${input.project}`;
  }

  // Add type prefix
  const typePrefix = {
    idea: '💡',
    task: '📋',
    note: '📝',
  }[input.type];
  entry = `- ${typePrefix} ${input.text}`;

  // Check if today's section exists
  if (content.includes(dateHeader)) {
    // Append under today's section
    const insertPos = content.indexOf(dateHeader) + dateHeader.length;
    const nextLinePos = content.indexOf('\n', insertPos) + 1;
    content =
      content.slice(0, nextLinePos) +
      '\n' + entry +
      content.slice(nextLinePos);
  } else {
    // Create today's section after the header
    const headerEnd = content.indexOf('---') + 3;
    content =
      content.slice(0, headerEnd) +
      '\n\n' + dateHeader + '\n\n' + entry + '\n' +
      content.slice(headerEnd);
  }

  await writeTextFile(inboxPath, content);
}

/**
 * Register global hotkey for quick capture
 */
export async function registerQuickCaptureHotkey(
  onTrigger: () => void
): Promise<void> {
  await register('CommandOrControl+Shift+N', (event) => {
    if (event.state === 'Pressed') {
      onTrigger();
    }
  });
}

/**
 * Parse natural language input to structured format
 *
 * Examples:
 * - "Add dark mode to taskboard P1" → { text: "Add dark mode", project: "taskboard", priority: "P1" }
 * - "Research Whisper alternatives" → { text: "Research Whisper alternatives" }
 */
export function parseQuickInput(raw: string): QuickCaptureInput {
  let text = raw.trim();
  let priority: QuickCaptureInput['priority'];
  let project: string | undefined;
  let type: QuickCaptureInput['type'] = 'note';

  // Extract priority (P0, P1, P2, P3)
  const priorityMatch = text.match(/\b(P[0-3])\b/i);
  if (priorityMatch) {
    priority = priorityMatch[1].toUpperCase() as QuickCaptureInput['priority'];
    text = text.replace(priorityMatch[0], '').trim();
  }

  // Extract project (@projectname)
  const projectMatch = text.match(/@(\w+)/);
  if (projectMatch) {
    project = projectMatch[1];
    text = text.replace(projectMatch[0], '').trim();
  }

  // Detect type from keywords
  if (text.toLowerCase().startsWith('idea:') || text.includes('💡')) {
    type = 'idea';
    text = text.replace(/^idea:\s*/i, '').replace('💡', '').trim();
  } else if (
    text.toLowerCase().startsWith('task:') ||
    text.toLowerCase().startsWith('todo:') ||
    text.toLowerCase().includes('create task')
  ) {
    type = 'task';
    text = text.replace(/^(task|todo):\s*/i, '').trim();
  }

  return { text, type, project, priority };
}

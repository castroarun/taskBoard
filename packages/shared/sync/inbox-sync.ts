/**
 * Inbox Sync Service
 *
 * Syncs structured instructions between Orbit (mobile) and Command Center (desktop).
 *
 * Flow:
 * 1. Orbit (mobile) captures voice → structures via Groq
 * 2. Saves to shared inbox (GitHub Gist or Vercel KV)
 * 3. Command Center pulls inbox on startup / file watch
 * 4. Claude agent processes instructions
 *
 * Storage options:
 * - GitHub Gist (free, simple, works offline with caching)
 * - Vercel KV (already in Orbit backend)
 * - Local file + Git sync
 */

import type { StructuredInstruction } from '../llm';

interface InboxItem {
  id: string;
  createdAt: string;
  source: 'orbit' | 'command-center';
  status: 'pending' | 'processing' | 'done' | 'skipped';
  instruction: StructuredInstruction;
  rawText?: string;
  processedBy?: string;
  processedAt?: string;
}

interface InboxState {
  items: InboxItem[];
  lastSynced: string | null;
}

// GitHub Gist storage (free, simple)
const GIST_ID = process.env.INBOX_GIST_ID || null;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || null;

/**
 * Add item to shared inbox
 */
export async function addToInbox(
  instruction: StructuredInstruction,
  source: 'orbit' | 'command-center',
  rawText?: string
): Promise<InboxItem> {
  const item: InboxItem = {
    id: `inbox-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    source,
    status: 'pending',
    instruction,
    rawText,
  };

  // Get current inbox
  const inbox = await getInbox();
  inbox.items.unshift(item);
  inbox.lastSynced = new Date().toISOString();

  // Save
  await saveInbox(inbox);

  return item;
}

/**
 * Get all inbox items
 */
export async function getInbox(): Promise<InboxState> {
  if (GIST_ID && GITHUB_TOKEN) {
    return getFromGist();
  }
  // Fallback to local storage / Vercel KV
  return getFromLocal();
}

/**
 * Update item status
 */
export async function updateInboxItem(
  id: string,
  updates: Partial<Pick<InboxItem, 'status' | 'processedBy' | 'processedAt'>>
): Promise<void> {
  const inbox = await getInbox();
  const item = inbox.items.find((i) => i.id === id);

  if (item) {
    Object.assign(item, updates);
    await saveInbox(inbox);
  }
}

/**
 * Get pending items for Claude agent
 */
export async function getPendingInstructions(): Promise<InboxItem[]> {
  const inbox = await getInbox();
  return inbox.items.filter((i) => i.status === 'pending');
}

/**
 * Mark item as done
 */
export async function markAsDone(id: string, agent: string): Promise<void> {
  await updateInboxItem(id, {
    status: 'done',
    processedBy: agent,
    processedAt: new Date().toISOString(),
  });
}

// --- Storage implementations ---

async function getFromGist(): Promise<InboxState> {
  const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    console.error('Failed to fetch inbox gist');
    return { items: [], lastSynced: null };
  }

  const gist = await response.json();
  const content = gist.files?.['inbox.json']?.content;

  if (content) {
    try {
      return JSON.parse(content);
    } catch {
      return { items: [], lastSynced: null };
    }
  }

  return { items: [], lastSynced: null };
}

async function saveToGist(inbox: InboxState): Promise<void> {
  await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        'inbox.json': {
          content: JSON.stringify(inbox, null, 2),
        },
      },
    }),
  });
}

// Local storage fallback (for desktop or when offline)
let localInbox: InboxState = { items: [], lastSynced: null };

async function getFromLocal(): Promise<InboxState> {
  // In real implementation, this would read from file system
  // For now, use in-memory
  return localInbox;
}

async function saveToLocal(inbox: InboxState): Promise<void> {
  localInbox = inbox;
  // In real implementation, save to file system
}

async function saveInbox(inbox: InboxState): Promise<void> {
  if (GIST_ID && GITHUB_TOKEN) {
    await saveToGist(inbox);
  }
  await saveToLocal(inbox);
}

/**
 * Convert inbox items to markdown for inbox.md
 */
export function inboxToMarkdown(inbox: InboxState): string {
  let md = '# Inbox\n\nQuick instructions for agents.\n\n---\n\n';

  // Group by date
  const byDate = new Map<string, InboxItem[]>();

  for (const item of inbox.items) {
    const date = item.createdAt.split('T')[0];
    if (!byDate.has(date)) {
      byDate.set(date, []);
    }
    byDate.get(date)!.push(item);
  }

  // Sort dates descending
  const sortedDates = Array.from(byDate.keys()).sort().reverse();

  for (const date of sortedDates) {
    md += `## ${date}\n\n`;

    for (const item of byDate.get(date)!) {
      const status = item.status === 'done' ? '[DONE] ' : item.status === 'skipped' ? '[SKIPPED] ' : '';
      const priority = item.instruction.priority ? ` (${item.instruction.priority})` : '';
      const project = item.instruction.project ? ` @${item.instruction.project}` : '';
      const source = item.source === 'orbit' ? ' 📱' : '';

      md += `- ${status}${item.instruction.title}${priority}${project}${source}\n`;

      if (item.instruction.description && item.instruction.description !== item.instruction.title) {
        md += `  > ${item.instruction.description}\n`;
      }
    }

    md += '\n';
  }

  return md;
}

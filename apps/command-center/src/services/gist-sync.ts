/**
 * GitHub Gist Sync Service for Klarity Command Center
 *
 * Polls a private GitHub Gist for inbox items pushed from the Launchpad mobile app.
 * Merges remote items into the local ~/.taskboard/inbox.json.
 */

import { InboxItem } from '@/store';

const GIST_API = 'https://api.github.com/gists';
const GIST_FILENAME = 'klarity-inbox.json';

interface GistFileContent {
  content: string;
}

interface GistResponse {
  id: string;
  files: Record<string, GistFileContent>;
}

interface InboxSyncPayload {
  version: string;
  lastUpdated: string;
  source: 'launchpad' | 'command-center';
  items: InboxItem[];
}

/**
 * Pull inbox items from a GitHub Gist
 */
export async function pullFromGist(
  token: string,
  gistId: string
): Promise<InboxItem[]> {
  const response = await fetch(`${GIST_API}/${gistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) return [];
    throw new Error(`Gist fetch failed: ${response.status}`);
  }

  const data: GistResponse = await response.json();
  const file = data.files[GIST_FILENAME];
  if (!file) return [];

  try {
    const parsed: InboxSyncPayload = JSON.parse(file.content);
    return parsed.items || [];
  } catch {
    console.warn('[gist-sync] Failed to parse gist content');
    return [];
  }
}

/**
 * Push inbox items back to the Gist (after merge on desktop side)
 */
export async function pushToGist(
  token: string,
  gistId: string,
  items: InboxItem[]
): Promise<void> {
  const payload: InboxSyncPayload = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    source: 'command-center',
    items,
  };

  const response = await fetch(`${GIST_API}/${gistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(payload, null, 2),
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gist push failed: ${response.status}`);
  }
}

/**
 * Merge remote items into local items.
 * Returns merged list and count of new items from remote.
 */
export function mergeInboxItems(
  localItems: InboxItem[],
  remoteItems: InboxItem[]
): { merged: InboxItem[]; newCount: number } {
  const localMap = new Map<string, InboxItem>();
  for (const item of localItems) localMap.set(item.id, item);

  let newCount = 0;

  for (const remote of remoteItems) {
    const local = localMap.get(remote.id);
    if (!local) {
      // New item from mobile — mark as unread on desktop
      localMap.set(remote.id, { ...remote, read: false });
      newCount++;
    } else {
      // Existing item — merge replies additively
      const localReplies = local.replies || [];
      const remoteReplies = remote.replies || [];
      const replyMap = new Map<string, (typeof localReplies)[number]>();
      for (const r of localReplies) replyMap.set(r.id, r);
      for (const r of remoteReplies) {
        if (!replyMap.has(r.id)) replyMap.set(r.id, r);
      }
      const mergedReplies = Array.from(replyMap.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      // Status: done/skipped wins over pending
      let mergedStatus = local.status;
      if (remote.status === 'done' || local.status === 'done') mergedStatus = 'done';
      else if (remote.status === 'skipped' || local.status === 'skipped') mergedStatus = 'skipped';

      localMap.set(remote.id, {
        ...local,
        status: mergedStatus,
        replies: mergedReplies,
        read: local.read && remote.read,
      });
    }
  }

  const merged = Array.from(localMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return { merged, newCount };
}

/**
 * Start a polling loop that checks the gist at a set interval.
 * Returns a cleanup function to stop polling.
 */
export function startSyncPoller(
  token: string,
  gistId: string,
  intervalMs: number,
  onNewItems: (items: InboxItem[], newCount: number) => void
): () => void {
  let active = true;

  const poll = async () => {
    if (!active) return;
    try {
      const remoteItems = await pullFromGist(token, gistId);
      if (remoteItems.length > 0) {
        onNewItems(remoteItems, remoteItems.length);
      }
    } catch (error) {
      console.warn('[gist-sync] Poll failed:', error);
    }
  };

  // Initial poll
  poll();

  // Recurring poll
  const intervalId = setInterval(poll, intervalMs);

  return () => {
    active = false;
    clearInterval(intervalId);
  };
}

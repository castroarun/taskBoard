/**
 * GitHub Repo Sync Service for Klarity Command Center
 *
 * Polls the private .taskboard GitHub repo for changes to inbox.json.
 * Uses ETag-based conditional requests to minimize API usage.
 * When new content is detected, writes to local ~/.taskboard/ so the
 * Rust file watcher can fire Windows desktop notifications.
 */

import { InboxItem } from '@/store';
import { writeInboxJson, writeInbox, generateInboxMarkdown } from '@/lib/tauri';

const GITHUB_API = 'https://api.github.com';

// ETag cache — persists across polls within the session
const etagCache: Record<string, string> = {};

// SHA cache — needed for pushing updates back to GitHub
const shaCache: Record<string, string> = {};

interface GitHubContentResponse {
  name: string;
  path: string;
  sha: string;
  content: string; // base64 encoded
  encoding: string;
}

interface InboxFileData {
  version: string;
  lastUpdated: string;
  items: InboxItem[];
}

/**
 * Fetch a file from the .taskboard GitHub repo with ETag caching.
 * Returns null if the file hasn't changed (304), the parsed content otherwise.
 */
async function fetchRepoFile<T>(
  token: string,
  owner: string,
  filename: string
): Promise<{ data: T; changed: boolean } | null> {
  const url = `${GITHUB_API}/repos/${owner}/.taskboard/contents/${filename}`;
  const cacheKey = `${owner}/${filename}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
  };

  // Add ETag for conditional request
  if (etagCache[cacheKey]) {
    headers['If-None-Match'] = etagCache[cacheKey];
  }

  try {
    const response = await fetch(url, { headers });

    // 304 Not Modified — no changes since last poll
    if (response.status === 304) {
      return null;
    }

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`GitHub API error: ${response.status}`);
    }

    // Store new ETag for next poll
    const etag = response.headers.get('ETag');
    if (etag) {
      etagCache[cacheKey] = etag;
    }

    const content: GitHubContentResponse = await response.json();

    // Store SHA for future push operations
    shaCache[cacheKey] = content.sha;

    // Decode base64 content
    const decoded = atob(content.content.replace(/\n/g, ''));
    const parsed = JSON.parse(decoded) as T;

    return { data: parsed, changed: true };
  } catch (error) {
    console.warn(`[github-sync] Failed to fetch ${filename}:`, error);
    return null;
  }
}

/**
 * Pull inbox items from the .taskboard GitHub repo.
 * Returns items only if the file has changed since last check.
 */
export async function pullInboxFromRepo(
  token: string,
  owner: string
): Promise<{ items: InboxItem[]; changed: boolean } | null> {
  const result = await fetchRepoFile<InboxFileData>(token, owner, 'inbox.json');

  if (!result) return null;

  return {
    items: result.data.items || [],
    changed: result.changed,
  };
}

/**
 * Merge remote inbox items into local, detecting new items.
 * Same logic as gist-sync but kept here for independence.
 */
export function mergeRepoInboxItems(
  localItems: InboxItem[],
  remoteItems: InboxItem[]
): { merged: InboxItem[]; newCount: number; newItems: InboxItem[] } {
  const localMap = new Map<string, InboxItem>();
  for (const item of localItems) localMap.set(item.id, item);

  let newCount = 0;
  const newItems: InboxItem[] = [];

  for (const remote of remoteItems) {
    const local = localMap.get(remote.id);
    if (!local) {
      // New item from Orbit — mark as unread on desktop
      const newItem = { ...remote, read: false };
      localMap.set(remote.id, newItem);
      newCount++;
      newItems.push(newItem);
    } else {
      // Existing item — merge replies
      const localReplies = local.replies || [];
      const remoteReplies = remote.replies || [];
      const replyMap = new Map<string, (typeof localReplies)[number]>();
      for (const r of localReplies) replyMap.set(r.id, r);

      let hasNewReplies = false;
      for (const r of remoteReplies) {
        if (!replyMap.has(r.id)) {
          replyMap.set(r.id, r);
          hasNewReplies = true;
        }
      }

      const mergedReplies = Array.from(replyMap.values()).sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      // Status: done/skipped wins over pending
      let mergedStatus = local.status;
      if (remote.status === 'done' || local.status === 'done')
        mergedStatus = 'done';
      else if (remote.status === 'skipped' || local.status === 'skipped')
        mergedStatus = 'skipped';

      localMap.set(remote.id, {
        ...local,
        status: mergedStatus,
        replies: mergedReplies,
        // If new replies arrived, mark unread so user sees the badge
        read: hasNewReplies ? false : local.read && remote.read,
      });

      if (hasNewReplies) newCount++;
    }
  }

  const merged = Array.from(localMap.values()).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return { merged, newCount, newItems };
}

/**
 * Write merged inbox to local filesystem.
 * This triggers the Rust file watcher → Windows notification.
 */
async function writeToLocal(items: InboxItem[]): Promise<void> {
  // Write structured JSON
  await writeInboxJson({
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    items,
  });

  // Also regenerate markdown for Claude readability
  const markdown = generateInboxMarkdown(items);
  await writeInbox(markdown);
}

/**
 * Start polling the .taskboard GitHub repo for inbox changes.
 * Returns a cleanup function to stop polling.
 */
export function startGitHubSyncPoller(
  token: string,
  owner: string,
  intervalMs: number,
  onNewItems: (merged: InboxItem[], newCount: number) => void
): () => void {
  let active = true;

  const poll = async () => {
    if (!active) return;

    try {
      const result = await pullInboxFromRepo(token, owner);

      // null means 304 (no change) or error — skip
      if (!result || !result.changed) return;

      // Pass remote items to callback for merge at store level
      onNewItems(result.items, result.items.length);
    } catch (error) {
      console.warn('[github-sync] Poll failed:', error);
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

/**
 * Push local inbox data back to the .taskboard GitHub repo.
 * This closes the sync loop — Claude's replies reach Orbit.
 *
 * Uses the cached SHA from the last pull. If no SHA is cached,
 * fetches the current file first to get it.
 */
export async function pushInboxToRepo(
  token: string,
  owner: string,
  items: InboxItem[]
): Promise<boolean> {
  const filename = 'inbox.json';
  const cacheKey = `${owner}/${filename}`;
  const url = `${GITHUB_API}/repos/${owner}/.taskboard/contents/${filename}`;

  try {
    // Get current SHA (required for update)
    let sha = shaCache[cacheKey];
    if (!sha) {
      // Fetch current file to get SHA
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
        },
      });
      if (response.ok) {
        const data: GitHubContentResponse = await response.json();
        sha = data.sha;
      }
    }

    const payload: InboxFileData = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      items,
    };

    const content = btoa(JSON.stringify(payload, null, 2));

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
      },
      body: JSON.stringify({
        message: 'Sync inbox — via Klarity',
        content,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!response.ok) {
      // 409 = conflict (SHA mismatch), refetch and retry once
      if (response.status === 409) {
        console.warn('[github-sync] SHA conflict, refetching...');
        delete shaCache[cacheKey];
        delete etagCache[cacheKey];
        return false;
      }
      throw new Error(`Push failed: ${response.status}`);
    }

    // Update SHA cache with new commit's SHA
    const result = await response.json();
    if (result.content?.sha) {
      shaCache[cacheKey] = result.content.sha;
    }

    // Clear ETag so next poll picks up our own changes cleanly
    delete etagCache[cacheKey];

    console.log('[github-sync] Pushed inbox to GitHub');
    return true;
  } catch (error) {
    console.warn('[github-sync] Push failed:', error);
    return false;
  }
}

/**
 * Full sync cycle: pull from GitHub, merge with local, write back.
 * Used by the useDataLoader hook.
 */
export async function syncFromGitHub(
  token: string,
  owner: string,
  localItems: InboxItem[]
): Promise<{ merged: InboxItem[]; newCount: number } | null> {
  const result = await pullInboxFromRepo(token, owner);
  if (!result || !result.changed) return null;

  const { merged, newCount } = mergeRepoInboxItems(localItems, result.items);

  if (newCount > 0) {
    await writeToLocal(merged);
  }

  return { merged, newCount };
}

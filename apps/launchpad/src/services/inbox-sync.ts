import * as SecureStore from 'expo-secure-store';
import { InboxItem, InboxReply } from '../store/types';

// ---------- Constants ----------

const GIST_API = 'https://api.github.com/gists';
const GIST_FILENAME = 'klarity-inbox.json';

// ---------- Secure Storage Keys ----------

const GIST_TOKEN_KEY = 'gist-sync-token';
const GIST_ID_KEY = 'gist-sync-id';

// ---------- Token & Config ----------

export async function getGistToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(GIST_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setGistToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(GIST_TOKEN_KEY, token);
}

export async function clearGistToken(): Promise<void> {
  await SecureStore.deleteItemAsync(GIST_TOKEN_KEY);
}

export async function getGistId(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(GIST_ID_KEY);
  } catch {
    return null;
  }
}

export async function setGistId(id: string): Promise<void> {
  await SecureStore.setItemAsync(GIST_ID_KEY, id);
}

export async function isSyncConfigured(): Promise<boolean> {
  const token = await getGistToken();
  const gistId = await getGistId();
  return token !== null && token.length > 0 && gistId !== null && gistId.length > 0;
}

// ---------- Gist CRUD ----------

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
  source: 'orbit' | 'command-center';
  items: InboxItem[];
}

export async function createSyncGist(): Promise<string> {
  const token = await getGistToken();
  if (!token) throw new Error('GitHub token not configured');

  const payload: InboxSyncPayload = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    source: 'orbit',
    items: [],
  };

  const response = await fetch(GIST_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      description: 'Klarity Inbox Sync',
      public: false,
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(payload, null, 2),
        },
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create sync gist: ${response.status} ${errText}`);
  }

  const data: GistResponse = await response.json();
  await setGistId(data.id);
  return data.id;
}

export async function pushToGist(items: InboxItem[]): Promise<void> {
  const token = await getGistToken();
  const gistId = await getGistId();
  if (!token || !gistId) throw new Error('Sync not configured');

  const payload: InboxSyncPayload = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    source: 'orbit',
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
    const errText = await response.text();
    throw new Error(`Failed to push to gist: ${response.status} ${errText}`);
  }
}

export async function pullFromGist(): Promise<InboxItem[]> {
  const token = await getGistToken();
  const gistId = await getGistId();
  if (!token || !gistId) return [];

  const response = await fetch(`${GIST_API}/${gistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) return [];
    throw new Error(`Failed to pull from gist: ${response.status}`);
  }

  const data: GistResponse = await response.json();
  const file = data.files[GIST_FILENAME];
  if (!file) return [];

  try {
    const parsed: InboxSyncPayload = JSON.parse(file.content);
    return parsed.items || [];
  } catch {
    return [];
  }
}

// ---------- Merge Logic ----------

export interface SyncResult {
  merged: InboxItem[];
  newFromRemote: number;
  newFromLocal: number;
  conflicts: number;
}

function mergeReplies(localReplies: InboxReply[], remoteReplies: InboxReply[]): InboxReply[] {
  const byId = new Map<string, InboxReply>();
  for (const r of localReplies) byId.set(r.id, r);
  for (const r of remoteReplies) {
    if (!byId.has(r.id)) byId.set(r.id, r);
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

function resolveStatus(
  a: InboxItem['status'],
  b: InboxItem['status']
): InboxItem['status'] {
  // done and skipped take priority over pending
  if (a === 'done' || b === 'done') return 'done';
  if (a === 'skipped' || b === 'skipped') return 'skipped';
  return 'pending';
}

export function mergeInboxItems(
  localItems: InboxItem[],
  remoteItems: InboxItem[]
): SyncResult {
  const localMap = new Map<string, InboxItem>();
  const remoteMap = new Map<string, InboxItem>();

  for (const item of localItems) localMap.set(item.id, item);
  for (const item of remoteItems) remoteMap.set(item.id, item);

  const mergedMap = new Map<string, InboxItem>();
  let newFromRemote = 0;
  let newFromLocal = 0;
  let conflicts = 0;

  // Process all local items
  for (const [id, localItem] of localMap) {
    const remoteItem = remoteMap.get(id);
    if (!remoteItem) {
      mergedMap.set(id, localItem);
      newFromLocal++;
    } else {
      // Conflict: merge
      conflicts++;
      const localTime = new Date(localItem.createdAt).getTime();
      const remoteTime = new Date(remoteItem.createdAt).getTime();
      const base = localTime >= remoteTime ? localItem : remoteItem;

      mergedMap.set(id, {
        ...base,
        status: resolveStatus(localItem.status, remoteItem.status),
        read: localItem.read && remoteItem.read,
        replies: mergeReplies(localItem.replies || [], remoteItem.replies || []),
      });
    }
  }

  // Process remote-only items
  for (const [id, remoteItem] of remoteMap) {
    if (!localMap.has(id)) {
      mergedMap.set(id, remoteItem);
      newFromRemote++;
    }
  }

  // Sort by createdAt descending (newest first)
  const merged = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return { merged, newFromRemote, newFromLocal, conflicts };
}

// ---------- Full Sync ----------

export async function syncInbox(localItems: InboxItem[]): Promise<SyncResult> {
  const configured = await isSyncConfigured();
  if (!configured) {
    return { merged: localItems, newFromRemote: 0, newFromLocal: 0, conflicts: 0 };
  }

  // Pull remote
  const remoteItems = await pullFromGist();

  // Merge
  const result = mergeInboxItems(localItems, remoteItems);

  // Push merged back
  await pushToGist(result.merged);

  return result;
}

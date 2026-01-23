/**
 * Tauri API wrapper for Command Center
 *
 * Provides typed interfaces for all Tauri commands.
 */

import { invoke } from '@tauri-apps/api/core';
import { Project, Task } from '@/store';

// Check if we're running in Tauri
export const isTauri = (): boolean => {
  return '__TAURI__' in window;
};

// Dev mode in-memory image store (simulates file system)
interface DevImageStore {
  [projectPath: string]: {
    [folder: string]: Array<{ name: string; dataUrl: string }>;
  };
}
const devImageStore: DevImageStore = {};

// Data API

interface ProjectsData {
  version: string;
  lastUpdated: string;
  projects: Project[];
}

interface TasksData {
  version: string;
  lastUpdated: string;
  tasks: Task[];
}

/**
 * Read projects from ~/.taskboard/projects.json (or /data/projects.json in dev)
 */
export async function readProjects(): Promise<ProjectsData> {
  if (!isTauri()) {
    // In dev mode, fetch from public data folder
    try {
      const response = await fetch('/data/projects.json');
      if (response.ok) {
        return response.json();
      }
    } catch (e) {
      console.warn('[tauri] Failed to fetch projects.json, using fallback');
    }
    // Fallback to empty
    return { version: '1.0.0', lastUpdated: new Date().toISOString(), projects: [] };
  }

  const data = await invoke<string>('read_projects');
  return JSON.parse(data);
}

/**
 * Write projects to ~/.taskboard/projects.json
 */
export async function writeProjects(data: ProjectsData): Promise<void> {
  if (!isTauri()) {
    console.log('Mock: Writing projects', data);
    return;
  }

  await invoke('write_projects', { data: JSON.stringify(data, null, 2) });
}

/**
 * Read tasks from ~/.taskboard/tasks.json (or /data/tasks.json in dev)
 */
export async function readTasks(): Promise<TasksData> {
  if (!isTauri()) {
    // In dev mode, fetch from public data folder
    try {
      const response = await fetch('/data/tasks.json');
      if (response.ok) {
        return response.json();
      }
    } catch (e) {
      console.warn('[tauri] Failed to fetch tasks.json, using fallback');
    }
    // Fallback to empty
    return { version: '1.0.0', lastUpdated: new Date().toISOString(), tasks: [] };
  }

  const data = await invoke<string>('read_tasks');
  return JSON.parse(data);
}

/**
 * Write tasks to ~/.taskboard/tasks.json
 */
export async function writeTasks(data: TasksData): Promise<void> {
  if (!isTauri()) {
    console.log('Mock: Writing tasks', data);
    return;
  }

  await invoke('write_tasks', { data: JSON.stringify(data, null, 2) });
}

/**
 * Read inbox from ~/.taskboard/inbox.md
 */
export async function readInbox(): Promise<string> {
  if (!isTauri()) {
    return '# Inbox\n\nQuick instructions for agents.\n\n---\n';
  }

  return invoke<string>('read_inbox');
}

/**
 * Write inbox to ~/.taskboard/inbox.md
 */
export async function writeInbox(content: string): Promise<void> {
  if (!isTauri()) {
    console.log('Mock: Writing inbox', content);
    return;
  }

  await invoke('write_inbox', { data: content });
}

/**
 * Read a markdown document
 */
export async function readDocument(path: string): Promise<string> {
  if (!isTauri()) {
    // In browser dev mode, show the actual file path with instructions
    const fileName = path.split(/[/\\]/).pop() || path;
    return `# 📄 ${fileName}

> **File Path:** \`${path}\`

---

## 🖥️ Browser Dev Mode

This document cannot be loaded in browser mode because direct filesystem access is restricted.

### To view this document:

1. **Run in Tauri desktop mode:**
   \`\`\`bash
   cd apps/command-center
   npm run tauri dev
   \`\`\`

2. **Or open directly:**
   - Open the file in VS Code or your preferred editor
   - Path: \`${path}\`

### Document Info

| Property | Value |
|----------|-------|
| **File** | ${fileName} |
| **Full Path** | ${path} |
| **Type** | ${path.endsWith('.md') ? 'Markdown' : path.endsWith('.csv') ? 'CSV' : path.endsWith('.sql') ? 'SQL' : 'Document'} |

---

*Switch to Tauri desktop mode to view and edit documents directly.*
`;
  }

  return invoke<string>('read_document', { path });
}

/**
 * Write a markdown document
 */
export async function writeDocument(path: string, content: string): Promise<void> {
  if (!isTauri()) {
    console.log('Mock: Writing document', { path, content });
    return;
  }

  await invoke('write_document', { path, content });
}

// Voice API

/**
 * Check if voice capture is available
 */
export async function checkVoiceAvailable(): Promise<boolean> {
  if (!isTauri()) return false;
  return invoke<boolean>('check_voice_available');
}

/**
 * Capture voice and return transcript
 */
export async function voiceCapture(durationSecs: number): Promise<string> {
  if (!isTauri()) {
    throw new Error('Voice capture not available in browser');
  }

  return invoke<string>('voice_capture', { durationSecs });
}

// External App API

/**
 * Open a folder in VS Code
 */
export async function openInVSCode(path: string): Promise<void> {
  if (!isTauri()) {
    console.log('Mock: Opening in VS Code', path);
    // In dev, try to use window.open with vscode:// protocol
    window.open(`vscode://file/${path}`, '_blank');
    return;
  }

  await invoke('open_in_vscode', { path });
}

/**
 * Open a folder in Claude Code (terminal with claude command)
 */
export async function openInClaudeCode(path: string): Promise<void> {
  if (!isTauri()) {
    console.log('Mock: Opening in Claude Code', path);
    alert(`Would open Claude Code in: ${path}`);
    return;
  }

  await invoke('open_in_claude_code', { path });
}

/**
 * Get project screenshots by scanning the assets folder
 * Default folder: assets/ (configurable)
 * Supported formats: png, jpg, jpeg, gif, webp
 */
export async function getProjectScreenshots(repoPath: string, folder: string = 'assets'): Promise<string[]> {
  if (!isTauri()) {
    // In dev mode, return images from in-memory store
    const projectImages = devImageStore[repoPath]?.[folder] || [];
    console.log(`[tauri] Dev mode: returning ${projectImages.length} images from store`);
    // Return pseudo-paths that getAssetUrl will recognize
    return projectImages.map(img => `dev://${repoPath}/${folder}/${img.name}`);
  }

  try {
    return await invoke<string[]>('get_project_screenshots', { path: repoPath, folder });
  } catch {
    return [];
  }
}

/**
 * Convert a local file path to a Tauri asset URL for display
 */
export function getAssetUrl(path: string): string {
  if (!isTauri()) {
    // In dev mode, check if this is a dev:// pseudo-path
    if (path.startsWith('dev://')) {
      // Extract repoPath, folder, and filename from dev://repoPath/folder/filename
      const withoutProtocol = path.replace('dev://', '');
      const parts = withoutProtocol.split('/');
      const fileName = parts.pop()!;
      const folder = parts.pop()!;
      const repoPath = parts.join('/');

      // Look up the data URL from the store
      const image = devImageStore[repoPath]?.[folder]?.find(img => img.name === fileName);
      if (image) {
        return image.dataUrl;
      }
    }
    // Fallback for browser (won't work due to security)
    return `file:///${path.replace(/\\/g, '/')}`;
  }
  // Tauri asset protocol - allows loading local files
  return `asset://localhost/${path.replace(/\\/g, '/')}`;
}

/**
 * Upload an image to the project's assets folder
 * Returns the full path of the saved file
 */
export async function uploadProjectImage(
  repoPath: string,
  folder: string,
  fileName: string,
  base64Data: string
): Promise<string> {
  if (!isTauri()) {
    // In dev mode, store in memory
    if (!devImageStore[repoPath]) {
      devImageStore[repoPath] = {};
    }
    if (!devImageStore[repoPath][folder]) {
      devImageStore[repoPath][folder] = [];
    }

    // Determine MIME type from file extension
    const ext = fileName.split('.').pop()?.toLowerCase() || 'png';
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    const mimeType = mimeTypes[ext] || 'image/png';

    // Reconstruct full data URL for display
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    // Add to store (or replace if exists)
    const existingIndex = devImageStore[repoPath][folder].findIndex(img => img.name === fileName);
    if (existingIndex >= 0) {
      devImageStore[repoPath][folder][existingIndex] = { name: fileName, dataUrl };
    } else {
      devImageStore[repoPath][folder].push({ name: fileName, dataUrl });
    }

    console.log(`[tauri] Dev mode: stored image ${fileName} (total: ${devImageStore[repoPath][folder].length})`);
    return `dev://${repoPath}/${folder}/${fileName}`;
  }

  return invoke<string>('upload_project_image', {
    path: repoPath,
    folder,
    fileName,
    base64Data,
  });
}

/**
 * Add an image reference to the project's README.md
 * Inserts the image in the screenshots section or creates one
 */
export async function addImageToReadme(
  repoPath: string,
  imagePath: string,
  altText: string
): Promise<void> {
  if (!isTauri()) {
    console.log(`[tauri] Would add image to README: ${imagePath}`);
    return;
  }

  await invoke('add_image_to_readme', {
    path: repoPath,
    imagePath,
    altText,
  });
}

/**
 * Delete an image from the project's assets folder
 */
export async function deleteProjectImage(imagePath: string): Promise<void> {
  if (!isTauri()) {
    // In dev mode, remove from memory store
    if (imagePath.startsWith('dev://')) {
      const withoutProtocol = imagePath.replace('dev://', '');
      const parts = withoutProtocol.split('/');
      const fileName = parts.pop()!;
      const folder = parts.pop()!;
      const repoPath = parts.join('/');

      if (devImageStore[repoPath]?.[folder]) {
        devImageStore[repoPath][folder] = devImageStore[repoPath][folder].filter(
          img => img.name !== fileName
        );
        console.log(`[tauri] Dev mode: deleted image ${fileName}`);
      }
    }
    return;
  }

  await invoke('delete_project_image', { path: imagePath });
}

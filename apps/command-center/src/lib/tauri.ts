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
 * Read projects from ~/.taskboard/projects.json
 */
export async function readProjects(): Promise<ProjectsData> {
  if (!isTauri()) {
    // Return mock data for development
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      projects: getMockProjects(),
    };
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
 * Read tasks from ~/.taskboard/tasks.json
 */
export async function readTasks(): Promise<TasksData> {
  if (!isTauri()) {
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      tasks: getMockTasks(),
    };
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
    return `# Mock Document\n\nThis is mock content for: ${path}`;
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

// Mock Data for Development

function getMockProjects(): Project[] {
  return [
    {
      id: 'taskboard',
      name: "Arun's Task Board",
      description: 'File-based project orchestration',
      repoPath: '~/Projects/taskboard',
      githubUrl: 'https://github.com/ArunPrakashG/taskboard',
      stage: 'development',
      stageStatus: 'in-progress',
      currentPhase: 'build',
      priority: 'P1',
      complexity: 'F',
      progress: 65,
      targetDate: '2026-02-15',
      startedAt: '2026-01-10T00:00:00Z',
      createdAt: '2026-01-10T00:00:00Z',
      lastUpdated: new Date().toISOString(),
      completedAt: null,
      tags: ['desktop', 'productivity', 'tauri'],
      techStack: ['Tauri', 'React', 'TypeScript'],
      links: {
        github: 'https://github.com/ArunPrakashG/taskboard',
        docs: null,
        live: null,
      },
      metrics: {
        totalTasks: 24,
        completedTasks: 15,
        blockedTasks: 1,
      },
    },
    {
      id: 'tradevoice',
      name: 'TradeVoice',
      description: 'Voice-powered stock trading commands',
      repoPath: '~/Projects/tradevoice',
      githubUrl: null,
      stage: 'architecture',
      stageStatus: 'in-progress',
      currentPhase: 'engineering',
      priority: 'P1',
      complexity: 'F',
      progress: 45,
      targetDate: '2026-02-28',
      startedAt: '2026-01-15T00:00:00Z',
      createdAt: '2026-01-15T00:00:00Z',
      lastUpdated: new Date().toISOString(),
      completedAt: null,
      tags: ['voice', 'trading', 'mobile'],
      techStack: ['React Native', 'Whisper', 'TypeScript'],
      links: {
        github: null,
        docs: null,
        live: null,
      },
      metrics: {
        totalTasks: 12,
        completedTasks: 5,
        blockedTasks: 1,
      },
    },
    {
      id: 'reppit',
      name: 'REPPIT',
      description: 'Progressive overload fitness app',
      repoPath: '~/Projects/strength_profile_tracker',
      githubUrl: 'https://github.com/castroarun/strength-tracker',
      stage: 'announce',
      stageStatus: 'in-progress',
      currentPhase: 'launch',
      priority: 'P2',
      complexity: 'F',
      progress: 95,
      targetDate: '2026-01-30',
      startedAt: '2025-12-01T00:00:00Z',
      createdAt: '2025-12-01T00:00:00Z',
      lastUpdated: new Date().toISOString(),
      completedAt: null,
      tags: ['fitness', 'pwa', 'mobile'],
      techStack: ['Next.js', 'Supabase', 'TypeScript'],
      links: {
        github: 'https://github.com/castroarun/strength-tracker',
        docs: null,
        live: 'https://reppit.vercel.app',
      },
      metrics: {
        totalTasks: 18,
        completedTasks: 17,
        blockedTasks: 0,
      },
    },
  ];
}

function getMockTasks(): Task[] {
  return [
    {
      id: 't-20260118-a1b2',
      projectId: 'taskboard',
      title: 'Build Pipeline kanban view',
      description: 'Create the main dashboard view with drag-drop between stages',
      stage: 'development',
      phase: 'development',
      status: 'in-progress',
      priority: 'P0',
      complexity: 'L',
      assignee: 'claude',
      assignedAgent: 'dev-agent',
      dueDate: '2026-01-20',
      startedAt: '2026-01-18T08:00:00Z',
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: new Date().toISOString(),
      completedAt: null,
      dependencies: [],
      linkedDocs: ['.taskboard/docs/2-engineering/ARCHITECTURE.md'],
      subtasks: [
        { id: 'st-001', title: 'Set up Kanban grid', completed: true },
        { id: 'st-002', title: 'Create project card', completed: true },
        { id: 'st-003', title: 'Implement drag-drop', completed: false },
      ],
      tags: ['feature', 'ui'],
      comments: [],
      createdBy: 'agent',
      sourceDoc: '.taskboard/docs/2-engineering/ARCHITECTURE.md',
    },
    {
      id: 't-20260118-c3d4',
      projectId: 'taskboard',
      title: 'Implement file watchers',
      description: 'Watch JSON files for changes and update UI automatically',
      stage: 'development',
      phase: 'development',
      status: 'todo',
      priority: 'P1',
      complexity: 'M',
      assignee: 'claude',
      assignedAgent: 'dev-agent',
      dueDate: '2026-01-22',
      startedAt: null,
      createdAt: '2026-01-17T00:00:00Z',
      updatedAt: new Date().toISOString(),
      completedAt: null,
      dependencies: [],
      linkedDocs: [],
      subtasks: [],
      tags: ['feature', 'backend'],
      comments: [],
      createdBy: 'agent',
      sourceDoc: null,
    },
  ];
}

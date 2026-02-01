import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Project, Task, InboxItem, Activity } from './types';

import sampleProjects from '../../assets/data/projects.json';
import sampleTasks from '../../assets/data/tasks.json';
import sampleActivities from '../../assets/data/activities.json';
import sampleInbox from '../../assets/data/inbox.json';

interface RawProject {
  id: string;
  name: string;
  description: string;
  icon?: string | null;
  currentPhase?: string;
  stage?: string;
  priority?: string;
  complexity?: string;
  progress?: number;
  targetDate?: string | null;
  startedAt?: string | null;
  createdAt?: string;
  lastUpdated?: string;
  tags?: string[];
  techStack?: string[];
  githubUrl?: string | null;
  metrics?: {
    totalTasks: number;
    completedTasks: number;
    blockedTasks: number;
  };
}

interface RawTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  complexity?: string;
  dueDate?: string | null;
  createdAt?: string;
  completedAt?: string | null;
}

interface AppStore {
  // Data
  projects: Project[];
  tasks: Task[];
  inbox: InboxItem[];
  activities: Activity[];

  // Sync
  lastSynced: string | null;
  isSyncing: boolean;

  // Sync config
  gistId: string | null;

  // Actions
  setProjects: (projects: Project[]) => void;
  setTasks: (tasks: Task[]) => void;
  addInboxItem: (item: InboxItem) => void;
  updateInboxItem: (id: string, updates: Partial<InboxItem>) => void;
  setInbox: (items: InboxItem[]) => void;
  setActivities: (activities: Activity[]) => void;
  setLastSynced: (date: string) => void;
  setSyncing: (syncing: boolean) => void;
  setGistId: (id: string | null) => void;
  loadSampleData: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      projects: [],
      tasks: [],
      inbox: [],
      activities: [],
      lastSynced: null,
      isSyncing: false,
      gistId: null,

      setProjects: (projects) => set({ projects }),
      setTasks: (tasks) => set({ tasks }),
      addInboxItem: (item) =>
        set((state) => ({ inbox: [item, ...state.inbox] })),
      updateInboxItem: (id, updates) =>
        set((state) => ({
          inbox: state.inbox.map((i) =>
            i.id === id ? { ...i, ...updates } : i
          ),
        })),
      setInbox: (items) => set({ inbox: items }),
      setActivities: (activities) => set({ activities }),
      setLastSynced: (date) => set({ lastSynced: date }),
      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setGistId: (id) => set({ gistId: id }),
      loadSampleData: () => {
        const rawProjects = (sampleProjects as { projects: RawProject[] })
          .projects;
        const rawTasks = (sampleTasks as { tasks: RawTask[] }).tasks;

        const projects: Project[] = rawProjects.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          icon: p.icon ?? null,
          currentPhase: (p.currentPhase as Project['currentPhase']) || 'design',
          stage: p.stage || 'conception',
          priority: (p.priority as Project['priority']) || 'P2',
          complexity: (p.complexity as Project['complexity']) || 'F',
          progress: p.progress ?? 0,
          targetDate: p.targetDate ?? null,
          startedAt: p.startedAt ?? null,
          createdAt: p.createdAt || new Date().toISOString(),
          lastUpdated: p.lastUpdated || new Date().toISOString(),
          tags: p.tags || [],
          techStack: p.techStack || [],
          githubUrl: p.githubUrl ?? null,
          metrics: p.metrics || {
            totalTasks: 0,
            completedTasks: 0,
            blockedTasks: 0,
          },
        }));

        const tasks: Task[] = rawTasks.map((t) => ({
          id: t.id,
          projectId: t.projectId,
          title: t.title,
          description: t.description || '',
          status: (t.status as Task['status']) || 'todo',
          priority: (t.priority as Task['priority']) || 'P2',
          complexity: (t.complexity as Task['complexity']) || 'M',
          dueDate: t.dueDate ?? null,
          createdAt: t.createdAt || new Date().toISOString(),
          completedAt: t.completedAt ?? null,
        }));

        const rawActivities = (sampleActivities as { activities: Activity[] }).activities;
        const activities: Activity[] = rawActivities.map((a) => ({
          id: a.id,
          type: a.type,
          projectId: a.projectId,
          projectName: a.projectName,
          description: a.description,
          timestamp: a.timestamp,
        }));

        // Seed inbox from sample data if empty (inbox is persisted separately)
        const rawInbox = (sampleInbox as { items: InboxItem[] }).items;
        const inbox: InboxItem[] = rawInbox.map((item) => ({
          id: item.id,
          text: item.text,
          type: item.type,
          project: item.project,
          priority: item.priority,
          status: item.status,
          createdAt: item.createdAt,
          forClaude: item.forClaude ?? false,
          read: item.read ?? false,
          author: item.author ?? 'user',
          parentId: item.parentId ?? null,
          replies: item.replies ?? [],
          taskRef: item.taskRef ?? null,
          taskTitle: item.taskTitle ?? null,
        }));

        set((state) => {
          // Merge sample inbox: add items whose IDs don't already exist
          const existingIds = new Set(state.inbox.map((i) => i.id));
          const newItems = inbox.filter((i) => !existingIds.has(i.id));
          return {
            projects,
            tasks,
            activities,
            inbox: newItems.length > 0 ? [...newItems, ...state.inbox] : state.inbox,
            lastSynced: new Date().toISOString(),
          };
        });
      },
    }),
    {
      name: 'orbit-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        inbox: state.inbox,
        lastSynced: state.lastSynced,
        gistId: state.gistId,
      }),
    }
  )
);

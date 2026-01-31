import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Project, Task, InboxItem, Activity } from './types';

import sampleProjects from '../../assets/data/projects.json';
import sampleTasks from '../../assets/data/tasks.json';
import sampleActivities from '../../assets/data/activities.json';

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

        set({ projects, tasks, activities, lastSynced: new Date().toISOString() });
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

import { create } from 'zustand';

// Types
export type TabId = 'pipeline' | 'docs' | 'inbox';

export type ProjectStage =
  | 'conception' | 'discovery' | 'requirements'  // Design
  | 'architecture' | 'qa-planning' | 'review'    // Engineering
  | 'development' | 'testing' | 'staging'         // Build
  | 'ship' | 'announce' | 'walkthrough'           // Launch
  | 'documentation' | 'portfolio' | 'retrospective'; // Closure

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'completed' | 'blocked';
export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type Complexity = 'XS' | 'S' | 'M' | 'L' | 'XL';

export interface Project {
  id: string;
  name: string;
  description: string;
  repoPath: string;
  githubUrl: string | null;
  stage: ProjectStage;
  stageStatus: 'not-started' | 'in-progress' | 'completed';
  currentPhase: 'design' | 'engineering' | 'build' | 'launch' | 'closure';
  priority: Priority;
  complexity: 'E' | 'F';
  progress: number;
  targetDate: string | null;
  startedAt: string | null;
  createdAt: string;
  lastUpdated: string;
  completedAt: string | null;
  tags: string[];
  techStack: string[];
  links: {
    github: string | null;
    docs: string | null;
    live: string | null;
  };
  metrics: {
    totalTasks: number;
    completedTasks: number;
    blockedTasks: number;
  };
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  stage: ProjectStage;
  phase: string;
  status: TaskStatus;
  priority: Priority;
  complexity: Complexity;
  assignee: string;
  assignedAgent: string;
  dueDate: string | null;
  startedAt: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  dependencies: string[];
  linkedDocs: string[];
  subtasks: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
  tags: string[];
  comments: Array<{
    id: string;
    author: string;
    text: string;
    timestamp: string;
  }>;
  createdBy: 'agent' | 'user';
  sourceDoc: string | null;
}

export interface InboxItem {
  id: string;
  text: string;
  type: 'idea' | 'task' | 'note';
  project: string | null;
  priority: Priority | null;
  status: 'pending' | 'done' | 'skipped';
  createdAt: string;
}

export interface DocFile {
  name: string;
  path: string;
  type: 'md' | 'folder';
  children?: DocFile[];
}

// Store interface
interface AppState {
  // UI State
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // Quick Launch
  isQuickLaunchOpen: boolean;
  openQuickLaunch: () => void;
  closeQuickLaunch: () => void;
  toggleQuickLaunch: () => void;

  // Selected Project (for navigation from Quick Launch)
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;

  // Modals
  isNewProjectModalOpen: boolean;
  openNewProjectModal: () => void;
  closeNewProjectModal: () => void;

  // Settings
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;

  // Voice Capture
  isVoiceCaptureOpen: boolean;
  openVoiceCapture: () => void;
  closeVoiceCapture: () => void;

  // Projects
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;

  // Tasks
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  addTask: (task: Task) => void;

  // Inbox
  inboxItems: InboxItem[];
  setInboxItems: (items: InboxItem[]) => void;
  addInboxItem: (item: InboxItem) => void;
  updateInboxItem: (id: string, updates: Partial<InboxItem>) => void;

  // Document Viewer
  selectedDoc: DocFile | null;
  docContent: string;
  isEditMode: boolean;
  setSelectedDoc: (doc: DocFile | null) => void;
  setDocContent: (content: string) => void;
  setEditMode: (isEdit: boolean) => void;

  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Saving states
  isSaving: boolean;
  lastSaved: string | null;
  setSaving: (saving: boolean) => void;
  setLastSaved: (date: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // UI State
  activeTab: 'pipeline',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Quick Launch
  isQuickLaunchOpen: false,
  openQuickLaunch: () => set({ isQuickLaunchOpen: true }),
  closeQuickLaunch: () => set({ isQuickLaunchOpen: false }),
  toggleQuickLaunch: () => set((state) => ({ isQuickLaunchOpen: !state.isQuickLaunchOpen })),

  // Selected Project
  selectedProjectId: null,
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),

  // Modals
  isNewProjectModalOpen: false,
  openNewProjectModal: () => set({ isNewProjectModalOpen: true }),
  closeNewProjectModal: () => set({ isNewProjectModalOpen: false }),

  // Settings
  isSettingsOpen: false,
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),

  // Voice Capture
  isVoiceCaptureOpen: false,
  openVoiceCapture: () => set({ isVoiceCaptureOpen: true }),
  closeVoiceCapture: () => set({ isVoiceCaptureOpen: false }),

  // Projects
  projects: [],
  setProjects: (projects) => set({ projects }),
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map((p) =>
      p.id === id ? { ...p, ...updates, lastUpdated: new Date().toISOString() } : p
    ),
  })),

  // Tasks
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map((t) =>
      t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    ),
  })),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),

  // Inbox
  inboxItems: [],
  setInboxItems: (items) => set({ inboxItems: items }),
  addInboxItem: (item) => set((state) => ({ inboxItems: [item, ...state.inboxItems] })),
  updateInboxItem: (id, updates) => set((state) => ({
    inboxItems: state.inboxItems.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    ),
  })),

  // Document Viewer
  selectedDoc: null,
  docContent: '',
  isEditMode: false,
  setSelectedDoc: (doc) => set({ selectedDoc: doc, isEditMode: false }),
  setDocContent: (content) => set({ docContent: content }),
  setEditMode: (isEdit) => set({ isEditMode: isEdit }),

  // Loading
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),

  // Saving
  isSaving: false,
  lastSaved: null,
  setSaving: (saving) => set({ isSaving: saving }),
  setLastSaved: (date) => set({ lastSaved: date }),
}));

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type Complexity = 'XS' | 'S' | 'M' | 'L' | 'XL';
export type ProjectPhase = 'design' | 'engineering' | 'build' | 'launch' | 'closure';
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'completed' | 'blocked';

export interface Project {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  currentPhase: ProjectPhase;
  stage: string;
  priority: Priority;
  complexity: 'E' | 'F';
  progress: number;
  targetDate: string | null;
  startedAt: string | null;
  createdAt: string;
  lastUpdated: string;
  tags: string[];
  techStack: string[];
  githubUrl: string | null;
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
  status: TaskStatus;
  priority: Priority;
  complexity: Complexity;
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface InboxReply {
  id: string;
  author: 'user' | 'claude';
  text: string;
  createdAt: string;
}

export interface InboxItem {
  id: string;
  text: string;
  type: 'idea' | 'task' | 'note';
  project: string | null;
  priority: Priority | null;
  status: 'pending' | 'done' | 'skipped';
  createdAt: string;
  forClaude: boolean;
  read: boolean;
  author: 'user' | 'claude';
  parentId: string | null;
  replies: InboxReply[];
  taskRef: string | null;
  taskTitle: string | null;
}

export interface Activity {
  id: string;
  type: string;
  projectId: string;
  projectName: string;
  description: string;
  timestamp: string;
}

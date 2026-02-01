/**
 * ORBIT Block Schema
 *
 * This is the shared data contract between Command Center (desktop) and Orbit (mobile).
 * - Command Center writes this block to README.md on git push
 * - Orbit reads this block from GitHub READMEs
 */

export interface OrbitBlock {
  /** Project stage: idea → building → testing → live → paused */
  stage: 'idea' | 'building' | 'testing' | 'live' | 'paused';

  /** Progress percentage (0-100) */
  progress: number;

  /** Complexity: E = Easy/quick, F = Full effort */
  complexity?: 'E' | 'F';

  /** Last status update date (YYYY-MM-DD) */
  lastUpdated: string;

  /** Target completion date (YYYY-MM-DD) */
  targetDate?: string;

  /** What to do in next work session */
  nextAction: string;

  /** What's blocking progress (null if none) */
  blocker?: string | null;

  /** Live demo URL */
  demoUrl?: string | null;

  /** Technologies used */
  techStack?: string[];

  /** Has it been shipped/released? */
  shipped?: boolean;

  /** Has LinkedIn announcement been made? */
  linkedinPosted?: boolean;
}

/**
 * Extended project data used by Command Center
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  repoPath: string;
  githubUrl?: string;

  // Stage info
  stage: 'design' | 'engineering' | 'build' | 'launch' | 'closure';
  stageStatus: 'not-started' | 'in-progress' | 'blocked' | 'completed';
  currentPhase: string;

  // Priority & complexity
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  complexity: 'E' | 'F';
  progress: number;

  // Dates
  targetDate?: string;
  startedAt?: string;
  createdAt: string;
  lastUpdated: string;
  completedAt?: string;

  // Metadata
  tags: string[];
  techStack: string[];

  // Links
  links: {
    github?: string;
    docs?: string;
    live?: string;
  };

  // Metrics
  metrics: {
    totalTasks: number;
    completedTasks: number;
    blockedTasks: number;
  };

  // History
  stageHistory: Array<{
    stage: string;
    enteredAt: string;
    completedAt?: string;
  }>;
}

/**
 * Task schema for tasks.json
 */
export interface Task {
  id: string;
  projectId: string;

  title: string;
  description: string;

  stage: string;
  phase: string;
  status: 'todo' | 'in-progress' | 'review' | 'blocked' | 'completed';

  priority: 'P0' | 'P1' | 'P2' | 'P3';
  complexity: 'XS' | 'S' | 'M' | 'L' | 'XL';

  assignee: string;
  assignedAgent?: string;

  dueDate?: string;
  startedAt?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;

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

  createdBy: 'user' | 'agent';
  sourceDoc?: string;
}

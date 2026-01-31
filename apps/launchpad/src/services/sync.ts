import {
  getAllUserRepos,
  getGitHubUsername,
  readTaskboardFile,
  writeTaskboardFile,
  GitHubRepo,
} from './github';
import { ScannedRepo, ReadmeAnalysis } from './scanner';
import { scanSingleRepo } from './repo-agent';

// ---------- Types ----------

export interface UntrackedRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  language: string | null;
  lastPush: string;
  isPrivate: boolean;
  daysSinceLastPush: number;
}

export interface SyncResult {
  untrackedRepos: UntrackedRepo[];
  trackedCount: number;
  totalOnGitHub: number;
}

// ---------- Detect New Repos ----------

export async function detectNewRepos(): Promise<SyncResult> {
  const username = await getGitHubUsername();
  if (!username) throw new Error('Not authenticated');

  // Fetch current tracked projects from .taskboard
  const projectsFile = await readTaskboardFile(username, 'projects.json');
  const trackedIds = new Set<string>();

  if (projectsFile) {
    try {
      const data = JSON.parse(projectsFile.content);
      const projects = data.projects || [];
      for (const p of projects) {
        trackedIds.add(p.id);
        // Also match by github.repo if available
        if (p.github?.repo) trackedIds.add(p.github.repo);
      }
    } catch {
      // projects.json is malformed, treat as empty
    }
  }

  // Fetch all repos from GitHub
  const allRepos = await getAllUserRepos();
  const filteredRepos = allRepos.filter(
    (r) => r.name !== '.taskboard' && !r.fork && !r.archived
  );

  // Find untracked repos
  const untracked: UntrackedRepo[] = filteredRepos
    .filter((r) => !trackedIds.has(r.name))
    .map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      url: r.html_url,
      language: r.language,
      lastPush: r.pushed_at,
      isPrivate: r.private,
      daysSinceLastPush: daysSinceDate(r.pushed_at),
    }))
    // Sort by most recently pushed first
    .sort(
      (a, b) =>
        new Date(b.lastPush).getTime() - new Date(a.lastPush).getTime()
    );

  return {
    untrackedRepos: untracked,
    trackedCount: trackedIds.size,
    totalOnGitHub: filteredRepos.length,
  };
}

// ---------- Add Repo to Orbit (simple — no agent) ----------

export async function addRepoToOrbit(
  repo: UntrackedRepo
): Promise<void> {
  const username = await getGitHubUsername();
  if (!username) throw new Error('Not authenticated');

  const projectsFile = await readTaskboardFile(username, 'projects.json');
  let data = { projects: [] as Record<string, unknown>[] };
  let sha: string | undefined;

  if (projectsFile) {
    data = JSON.parse(projectsFile.content);
    sha = projectsFile.sha;
  }

  const now = new Date().toISOString();

  data.projects.push({
    id: repo.name,
    name: formatRepoName(repo.name),
    description: repo.description || `${formatRepoName(repo.name)} project`,
    techStack: repo.language ? [repo.language] : [],
    status: repo.daysSinceLastPush <= 30 ? 'active' : 'stale',
    github: {
      owner: username,
      repo: repo.name,
      url: repo.url,
      stars: 0,
      openIssues: 0,
      lastPush: repo.lastPush,
      archived: false,
      isPrivate: repo.isPrivate,
    },
    readme: {
      health: 'unknown',
      lineCount: 0,
      issues: [],
    },
    tracking: {
      addedAt: now,
      updatedAt: now,
    },
  });

  await writeTaskboardFile(
    username,
    'projects.json',
    JSON.stringify(data, null, 2),
    `Add ${formatRepoName(repo.name)} to Orbit`,
    sha
  );
}

// ---------- Helpers ----------

function daysSinceDate(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function formatRepoName(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

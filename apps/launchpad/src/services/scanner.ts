import {
  getAllUserRepos,
  getRepoLanguages,
  getRepoReadme,
  GitHubRepo,
} from './github';

// ---------- Types ----------

export type RepoStatus = 'active' | 'stale' | 'archived' | 'inactive';

export type ReadmeHealth = 'good' | 'weak' | 'missing';

export interface ReadmeAnalysis {
  health: ReadmeHealth;
  lineCount: number;
  hasBadges: boolean;
  hasDescription: boolean;
  hasInstallInstructions: boolean;
  hasTechStack: boolean;
  hasLicense: boolean;
  hasContributing: boolean;
  issues: string[];
  content: string | null;
}

export interface ScannedRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  language: string | null;
  languages: string[];
  stars: number;
  openIssues: number;
  lastPush: string;
  createdAt: string;
  archived: boolean;
  fork: boolean;
  isPrivate: boolean;
  defaultBranch: string;
  topics: string[];
  status: RepoStatus;
  daysSinceLastPush: number;
  selected: boolean;
  readme: ReadmeAnalysis;
}

export interface ScanProgress {
  phase: 'fetching' | 'analyzing' | 'readme' | 'complete';
  current: number;
  total: number;
  message: string;
}

// ---------- Status Detection ----------

function inferStatus(repo: GitHubRepo): RepoStatus {
  if (repo.archived) return 'archived';

  const daysSince = daysSinceDate(repo.pushed_at);
  if (daysSince <= 30) return 'active';
  if (daysSince <= 180) return 'stale';
  return 'inactive';
}

function daysSinceDate(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

// ---------- README Analysis ----------

function analyzeReadmeContent(content: string | null): ReadmeAnalysis {
  if (!content) {
    return {
      health: 'missing',
      lineCount: 0,
      hasBadges: false,
      hasDescription: false,
      hasInstallInstructions: false,
      hasTechStack: false,
      hasLicense: false,
      hasContributing: false,
      issues: ['No README.md found'],
      content: null,
    };
  }

  const lines = content.split('\n');
  const lower = content.toLowerCase();
  const issues: string[] = [];

  const hasBadges =
    content.includes('shields.io') ||
    content.includes('badge') ||
    content.includes('![') && content.includes('https://img.');

  const hasDescription =
    lines.length > 3 &&
    lines.some((l) => l.length > 50 && !l.startsWith('#') && !l.startsWith('!'));

  const hasInstallInstructions =
    lower.includes('install') ||
    lower.includes('getting started') ||
    lower.includes('quick start') ||
    lower.includes('npm') ||
    lower.includes('yarn') ||
    lower.includes('setup');

  const hasTechStack =
    lower.includes('tech stack') ||
    lower.includes('built with') ||
    lower.includes('technologies') ||
    lower.includes('dependencies');

  const hasLicense =
    lower.includes('license') || lower.includes('licence');

  const hasContributing =
    lower.includes('contributing') || lower.includes('contribute');

  if (!hasBadges) issues.push('No badges found');
  if (!hasDescription) issues.push('Missing or very short description');
  if (!hasInstallInstructions) issues.push('No install/setup instructions');
  if (!hasTechStack) issues.push('No tech stack section');
  if (lines.length < 20) issues.push('README is very short');

  let health: ReadmeHealth;
  if (issues.length === 0) {
    health = 'good';
  } else if (issues.length <= 2 && lines.length >= 20) {
    health = 'good';
  } else {
    health = 'weak';
  }

  return {
    health,
    lineCount: lines.length,
    hasBadges,
    hasDescription,
    hasInstallInstructions,
    hasTechStack,
    hasLicense,
    hasContributing,
    issues,
    content,
  };
}

// ---------- Main Scanner ----------

export async function scanRepos(
  onProgress?: (progress: ScanProgress) => void
): Promise<ScannedRepo[]> {
  // Phase 1: Fetch all repos
  onProgress?.({
    phase: 'fetching',
    current: 0,
    total: 0,
    message: 'Fetching your GitHub repos...',
  });

  const repos = await getAllUserRepos();

  // Filter out .taskboard repo itself
  const filteredRepos = repos.filter((r) => r.name !== '.taskboard');

  onProgress?.({
    phase: 'analyzing',
    current: 0,
    total: filteredRepos.length,
    message: `Found ${filteredRepos.length} repos. Analyzing...`,
  });

  // Phase 2: Analyze each repo
  const scannedRepos: ScannedRepo[] = [];

  for (let i = 0; i < filteredRepos.length; i++) {
    const repo = filteredRepos[i];
    const owner = repo.full_name.split('/')[0];

    onProgress?.({
      phase: 'analyzing',
      current: i + 1,
      total: filteredRepos.length,
      message: `Analyzing ${repo.name}...`,
    });

    // Get languages (batch — only for non-archived, non-fork repos)
    let languages: string[] = [];
    if (!repo.archived && !repo.fork) {
      try {
        const langData = await getRepoLanguages(owner, repo.name);
        languages = Object.keys(langData);
      } catch {
        languages = repo.language ? [repo.language] : [];
      }
    } else {
      languages = repo.language ? [repo.language] : [];
    }

    // Get README
    onProgress?.({
      phase: 'readme',
      current: i + 1,
      total: filteredRepos.length,
      message: `Checking README for ${repo.name}...`,
    });

    let readmeContent: string | null = null;
    if (!repo.archived) {
      try {
        readmeContent = await getRepoReadme(owner, repo.name);
      } catch {
        readmeContent = null;
      }
    }

    const status = inferStatus(repo);
    const daysSinceLastPush = daysSinceDate(repo.pushed_at);

    // Pre-select: active repos that aren't forks
    const selected = status === 'active' && !repo.fork;

    scannedRepos.push({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      language: repo.language,
      languages,
      stars: repo.stargazers_count,
      openIssues: repo.open_issues_count,
      lastPush: repo.pushed_at,
      createdAt: repo.created_at,
      archived: repo.archived,
      fork: repo.fork,
      isPrivate: repo.private,
      defaultBranch: repo.default_branch,
      topics: repo.topics || [],
      status,
      daysSinceLastPush,
      selected,
      readme: analyzeReadmeContent(readmeContent),
    });
  }

  onProgress?.({
    phase: 'complete',
    current: filteredRepos.length,
    total: filteredRepos.length,
    message: 'Scan complete!',
  });

  // Sort: active first, then by last push date
  scannedRepos.sort((a, b) => {
    const statusOrder: Record<RepoStatus, number> = {
      active: 0,
      stale: 1,
      inactive: 2,
      archived: 3,
    };
    const diff = statusOrder[a.status] - statusOrder[b.status];
    if (diff !== 0) return diff;
    return new Date(b.lastPush).getTime() - new Date(a.lastPush).getTime();
  });

  return scannedRepos;
}

// ---------- README Health Summary ----------

export function getReadmeSummary(repos: ScannedRepo[]): {
  good: number;
  weak: number;
  missing: number;
  total: number;
} {
  const selected = repos.filter((r) => r.selected);
  return {
    good: selected.filter((r) => r.readme.health === 'good').length,
    weak: selected.filter((r) => r.readme.health === 'weak').length,
    missing: selected.filter((r) => r.readme.health === 'missing').length,
    total: selected.length,
  };
}

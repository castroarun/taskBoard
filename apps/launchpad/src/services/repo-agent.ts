import {
  getRepoLanguages,
  getRepoReadme,
  getGitHubUsername,
  readTaskboardFile,
  writeTaskboardFile,
  getFileFromRepo,
  writeFileToRepo,
} from './github';
import { ScannedRepo, ReadmeAnalysis } from './scanner';
import { generateImprovedReadme } from './builder';
import { UntrackedRepo } from './sync';

// ---------- Types ----------

export interface RepoSetupResult {
  addedToOrbit: boolean;
  readmeImproved: boolean;
  readmeHealth: string;
  readmeIssues: string[];
  languages: string[];
  errors: string[];
}

export interface RepoSetupProgress {
  step: 'scanning' | 'readme' | 'adding' | 'improving' | 'complete';
  message: string;
}

// ---------- Scan Single Repo ----------

export async function scanSingleRepo(
  repoName: string,
  onProgress?: (progress: RepoSetupProgress) => void
): Promise<ScannedRepo> {
  const username = await getGitHubUsername();
  if (!username) throw new Error('Not authenticated');

  onProgress?.({ step: 'scanning', message: `Analyzing ${repoName}...` });

  // Get languages
  let languages: string[] = [];
  try {
    const langData = await getRepoLanguages(username, repoName);
    languages = Object.keys(langData);
  } catch {
    languages = [];
  }

  // Get README
  onProgress?.({ step: 'readme', message: `Checking README...` });
  let readmeContent: string | null = null;
  try {
    readmeContent = await getRepoReadme(username, repoName);
  } catch {
    readmeContent = null;
  }

  const readme = analyzeReadme(readmeContent);

  return {
    id: 0, // Not used for single-repo flow
    name: repoName,
    fullName: `${username}/${repoName}`,
    description: null,
    url: `https://github.com/${username}/${repoName}`,
    language: languages[0] || null,
    languages,
    stars: 0,
    openIssues: 0,
    lastPush: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    archived: false,
    fork: false,
    isPrivate: false,
    defaultBranch: 'main',
    topics: [],
    status: 'active',
    daysSinceLastPush: 0,
    selected: true,
    readme,
  };
}

// ---------- Full Setup (scan + add + optionally improve README) ----------

export async function setupRepo(
  repo: UntrackedRepo,
  improveReadme: boolean,
  onProgress?: (progress: RepoSetupProgress) => void
): Promise<RepoSetupResult> {
  const username = await getGitHubUsername();
  if (!username) throw new Error('Not authenticated');

  const result: RepoSetupResult = {
    addedToOrbit: false,
    readmeImproved: false,
    readmeHealth: 'unknown',
    readmeIssues: [],
    languages: [],
    errors: [],
  };

  // Step 1: Scan the repo
  onProgress?.({ step: 'scanning', message: `Analyzing ${repo.name}...` });

  let languages: string[] = [];
  try {
    const langData = await getRepoLanguages(username, repo.name);
    languages = Object.keys(langData);
    result.languages = languages;
  } catch {
    languages = repo.language ? [repo.language] : [];
    result.languages = languages;
  }

  // Step 2: Check README
  onProgress?.({ step: 'readme', message: `Checking README for ${repo.name}...` });

  let readmeContent: string | null = null;
  try {
    readmeContent = await getRepoReadme(username, repo.name);
  } catch {
    readmeContent = null;
  }

  const readme = analyzeReadme(readmeContent);
  result.readmeHealth = readme.health;
  result.readmeIssues = readme.issues;

  // Step 3: Add to .taskboard/projects.json
  onProgress?.({ step: 'adding', message: `Adding ${repo.name} to Orbit...` });

  try {
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
      techStack: languages.slice(0, 5),
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
        health: readme.health,
        lineCount: readme.lineCount,
        issues: readme.issues,
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

    result.addedToOrbit = true;
  } catch (e) {
    result.errors.push(`Failed to add to Orbit: ${(e as Error).message}`);
  }

  // Step 4: Improve README if opted in and needed
  if (
    improveReadme &&
    (readme.health === 'weak' || readme.health === 'missing')
  ) {
    onProgress?.({
      step: 'improving',
      message: `Improving README for ${repo.name}...`,
    });

    try {
      const scannedRepo: ScannedRepo = {
        id: repo.id,
        name: repo.name,
        fullName: `${username}/${repo.name}`,
        description: repo.description,
        url: repo.url,
        language: repo.language,
        languages,
        stars: 0,
        openIssues: 0,
        lastPush: repo.lastPush,
        createdAt: repo.lastPush,
        archived: false,
        fork: false,
        isPrivate: repo.isPrivate,
        defaultBranch: 'main',
        topics: [],
        status: 'active',
        daysSinceLastPush: repo.daysSinceLastPush,
        selected: true,
        readme,
      };

      const newReadme = generateImprovedReadme(scannedRepo);
      const existing = await getFileFromRepo(username, repo.name, 'README.md');

      await writeFileToRepo(
        username,
        repo.name,
        'README.md',
        newReadme,
        'Improve README structure — via Orbit',
        existing?.sha
      );

      result.readmeImproved = true;
    } catch (e) {
      result.errors.push(`Failed to improve README: ${(e as Error).message}`);
    }
  }

  onProgress?.({ step: 'complete', message: 'Done!' });

  return result;
}

// ---------- README Analysis (reused from scanner, kept local for independence) ----------

function analyzeReadme(content: string | null): ReadmeAnalysis {
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
    (content.includes('![') && content.includes('https://img.'));

  const hasDescription =
    lines.length > 3 &&
    lines.some(
      (l) => l.length > 50 && !l.startsWith('#') && !l.startsWith('!')
    );

  const hasInstallInstructions =
    lower.includes('install') ||
    lower.includes('getting started') ||
    lower.includes('quick start') ||
    lower.includes('setup');

  const hasTechStack =
    lower.includes('tech stack') ||
    lower.includes('built with') ||
    lower.includes('technologies');

  const hasLicense =
    lower.includes('license') || lower.includes('licence');

  const hasContributing =
    lower.includes('contributing') || lower.includes('contribute');

  if (!hasBadges) issues.push('No badges found');
  if (!hasDescription) issues.push('Missing or very short description');
  if (!hasInstallInstructions) issues.push('No install/setup instructions');
  if (!hasTechStack) issues.push('No tech stack section');
  if (lines.length < 20) issues.push('README is very short');

  let health: 'good' | 'weak' | 'missing';
  if (issues.length <= 2 && lines.length >= 20) {
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

// ---------- Helpers ----------

function formatRepoName(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

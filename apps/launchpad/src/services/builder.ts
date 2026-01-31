import { writeTaskboardFile, writeFileToRepo, getFileFromRepo } from './github';
import { ScannedRepo } from './scanner';

// ---------- Types ----------

export interface TaskboardProject {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  status: 'active' | 'stale' | 'inactive' | 'archived';
  github: {
    owner: string;
    repo: string;
    url: string;
    stars: number;
    openIssues: number;
    lastPush: string;
    archived: boolean;
    isPrivate: boolean;
  };
  readme: {
    health: string;
    lineCount: number;
    issues: string[];
  };
  tracking: {
    addedAt: string;
    updatedAt: string;
  };
}

export interface BuildResult {
  filesCreated: string[];
  projectCount: number;
  readmesImproved: number;
  errors: string[];
}

// ---------- Build JSON files ----------

function buildProjectsJson(repos: ScannedRepo[]): string {
  const projects: TaskboardProject[] = repos
    .filter((r) => r.selected)
    .map((repo) => {
      const owner = repo.fullName.split('/')[0];
      const now = new Date().toISOString();

      return {
        id: repo.name,
        name: formatRepoName(repo.name),
        description: repo.description || `${formatRepoName(repo.name)} project`,
        techStack: repo.languages.slice(0, 5),
        status: repo.status,
        github: {
          owner,
          repo: repo.name,
          url: repo.url,
          stars: repo.stars,
          openIssues: repo.openIssues,
          lastPush: repo.lastPush,
          archived: repo.archived,
          isPrivate: repo.isPrivate,
        },
        readme: {
          health: repo.readme.health,
          lineCount: repo.readme.lineCount,
          issues: repo.readme.issues,
        },
        tracking: {
          addedAt: now,
          updatedAt: now,
        },
      };
    });

  return JSON.stringify({ projects }, null, 2);
}

function buildTasksJson(): string {
  return JSON.stringify({ tasks: [] }, null, 2);
}

function buildInboxJson(): string {
  return JSON.stringify(
    {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      items: [],
    },
    null,
    2
  );
}

function buildConfigJson(username: string): string {
  return JSON.stringify(
    {
      version: '1.0.0',
      user: { github: username },
      sync: {
        frequency: 'manual',
        lastSync: new Date().toISOString(),
      },
      preferences: {
        theme: 'dark',
        notifications: true,
        staleThresholdDays: 7,
      },
    },
    null,
    2
  );
}

// ---------- README Generator ----------

export function generateImprovedReadme(repo: ScannedRepo): string {
  const name = formatRepoName(repo.name);
  const desc = repo.description || `A ${repo.language || 'software'} project`;
  const techBadges = repo.languages
    .slice(0, 4)
    .map((lang) => {
      const color = getTechColor(lang);
      return `![${lang}](https://img.shields.io/badge/${encodeURIComponent(lang)}-${color}?style=flat-square&logo=${lang.toLowerCase()}&logoColor=white)`;
    })
    .join(' ');

  const licenseBadge = '![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)';

  const techTable = repo.languages.length > 0
    ? repo.languages
        .slice(0, 6)
        .map((lang) => `| ${lang} | Core |`)
        .join('\n')
    : '| — | — |';

  return `<div align="center">

# ${name}

${desc}

${techBadges} ${licenseBadge}

</div>

---

## About

${desc}. ${repo.stars > 0 ? `Starred by ${repo.stars} developers.` : ''}

## Features

- Core functionality
- More features coming soon

## Quick Start

\`\`\`bash
# Clone the repository
git clone ${repo.url}.git
cd ${repo.name}

# Install dependencies
npm install

# Start development
npm run dev
\`\`\`

## Tech Stack

| Technology | Role |
|-----------|------|
${techTable}

## Project Structure

\`\`\`
${repo.name}/
├── src/           # Source code
├── tests/         # Test files
├── docs/          # Documentation
└── README.md      # This file
\`\`\`

## Contributing

1. Fork the repo
2. Create your feature branch (\`git checkout -b feature/new-feature\`)
3. Commit your changes (\`git commit -m 'Add new feature'\`)
4. Push to the branch (\`git push origin feature/new-feature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

---

<div align="center">
<sub>Built by <a href="https://github.com/${repo.fullName.split('/')[0]}">${repo.fullName.split('/')[0]}</a></sub>
</div>
`;
}

// ---------- Main Builder ----------

export async function buildTaskboardFiles(
  username: string,
  repos: ScannedRepo[],
  onProgress?: (message: string) => void
): Promise<BuildResult> {
  const result: BuildResult = {
    filesCreated: [],
    projectCount: repos.filter((r) => r.selected).length,
    readmesImproved: 0,
    errors: [],
  };

  const now = new Date().toISOString();

  // Write projects.json
  try {
    onProgress?.('Writing projects.json...');
    await writeTaskboardFile(
      username,
      'projects.json',
      buildProjectsJson(repos),
      `Add ${result.projectCount} projects — Orbit setup`
    );
    result.filesCreated.push('projects.json');
  } catch (e) {
    result.errors.push(`projects.json: ${(e as Error).message}`);
  }

  // Write tasks.json
  try {
    onProgress?.('Writing tasks.json...');
    await writeTaskboardFile(
      username,
      'tasks.json',
      buildTasksJson(),
      'Initialize empty tasks — Orbit setup'
    );
    result.filesCreated.push('tasks.json');
  } catch (e) {
    result.errors.push(`tasks.json: ${(e as Error).message}`);
  }

  // Write inbox.json
  try {
    onProgress?.('Writing inbox.json...');
    await writeTaskboardFile(
      username,
      'inbox.json',
      buildInboxJson(),
      'Initialize empty inbox — Orbit setup'
    );
    result.filesCreated.push('inbox.json');
  } catch (e) {
    result.errors.push(`inbox.json: ${(e as Error).message}`);
  }

  // Write config.json
  try {
    onProgress?.('Writing config.json...');
    await writeTaskboardFile(
      username,
      'config.json',
      buildConfigJson(username),
      'Initialize config — Orbit setup'
    );
    result.filesCreated.push('config.json');
  } catch (e) {
    result.errors.push(`config.json: ${(e as Error).message}`);
  }

  return result;
}

// ---------- README Improvement ----------

export async function improveRepoReadmes(
  repos: ScannedRepo[],
  onProgress?: (message: string, current: number, total: number) => void
): Promise<{ improved: number; errors: string[] }> {
  const toImprove = repos.filter(
    (r) => r.selected && (r.readme.health === 'weak' || r.readme.health === 'missing')
  );

  let improved = 0;
  const errors: string[] = [];

  for (let i = 0; i < toImprove.length; i++) {
    const repo = toImprove[i];
    const owner = repo.fullName.split('/')[0];

    onProgress?.(
      `Improving README for ${repo.name}...`,
      i + 1,
      toImprove.length
    );

    try {
      const newReadme = generateImprovedReadme(repo);

      // Get existing file SHA if it exists
      const existing = await getFileFromRepo(owner, repo.name, 'README.md');

      await writeFileToRepo(
        owner,
        repo.name,
        'README.md',
        newReadme,
        'Improve README structure — via Orbit setup',
        existing?.sha
      );

      improved++;
    } catch (e) {
      errors.push(`${repo.name}: ${(e as Error).message}`);
    }
  }

  return { improved, errors };
}

// ---------- Helpers ----------

function formatRepoName(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getTechColor(lang: string): string {
  const colorMap: Record<string, string> = {
    TypeScript: '3178C6',
    JavaScript: 'F7DF1E',
    Python: '3776AB',
    Rust: 'CE412B',
    Go: '00ADD8',
    Java: 'ED8B00',
    'C#': '239120',
    'C++': '00599C',
    Ruby: 'CC342D',
    Swift: 'FA7343',
    Kotlin: '7F52FF',
    Dart: '0175C2',
    PHP: '777BB4',
    HTML: 'E34F26',
    CSS: '1572B6',
    Shell: '89E051',
  };
  return colorMap[lang] || '555555';
}

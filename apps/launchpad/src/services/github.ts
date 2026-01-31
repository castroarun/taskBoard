import * as SecureStore from 'expo-secure-store';

const GITHUB_TOKEN_KEY = 'github_token';
const GITHUB_USERNAME_KEY = 'github_username';
const GITHUB_API = 'https://api.github.com';

// ---------- Token Management ----------

export async function getGitHubToken(): Promise<string | null> {
  return SecureStore.getItemAsync(GITHUB_TOKEN_KEY);
}

export async function setGitHubToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(GITHUB_TOKEN_KEY, token);
}

export async function getGitHubUsername(): Promise<string | null> {
  return SecureStore.getItemAsync(GITHUB_USERNAME_KEY);
}

export async function setGitHubUsername(username: string): Promise<void> {
  await SecureStore.setItemAsync(GITHUB_USERNAME_KEY, username);
}

export async function clearGitHubAuth(): Promise<void> {
  await SecureStore.deleteItemAsync(GITHUB_TOKEN_KEY);
  await SecureStore.deleteItemAsync(GITHUB_USERNAME_KEY);
}

export async function isGitHubAuthenticated(): Promise<boolean> {
  const token = await getGitHubToken();
  return token !== null;
}

// ---------- API Helpers ----------

async function githubFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getGitHubToken();
  if (!token) throw new Error('Not authenticated with GitHub');

  const response = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `GitHub API error: ${response.status}`
    );
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

// ---------- User ----------

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  public_repos: number;
  total_private_repos: number;
}

export async function getAuthenticatedUser(): Promise<GitHubUser> {
  return githubFetch<GitHubUser>('/user');
}

export async function validateToken(token: string): Promise<GitHubUser | null> {
  try {
    const response = await fetch(`${GITHUB_API}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

// ---------- Repos ----------

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  open_issues_count: number;
  pushed_at: string;
  created_at: string;
  updated_at: string;
  archived: boolean;
  fork: boolean;
  private: boolean;
  default_branch: string;
  topics: string[];
}

export async function getUserRepos(
  page: number = 1,
  perPage: number = 100
): Promise<GitHubRepo[]> {
  return githubFetch<GitHubRepo[]>(
    `/user/repos?per_page=${perPage}&page=${page}&sort=pushed&direction=desc&type=owner`
  );
}

export async function getAllUserRepos(): Promise<GitHubRepo[]> {
  const allRepos: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const repos = await getUserRepos(page);
    allRepos.push(...repos);
    if (repos.length < 100) break;
    page++;
  }

  return allRepos;
}

// ---------- Repo Languages ----------

export async function getRepoLanguages(
  owner: string,
  repo: string
): Promise<Record<string, number>> {
  return githubFetch<Record<string, number>>(
    `/repos/${owner}/${repo}/languages`
  );
}

// ---------- README ----------

export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  content: string;
  encoding: string;
}

export async function getRepoReadme(
  owner: string,
  repo: string
): Promise<string | null> {
  try {
    const data = await githubFetch<GitHubContent>(
      `/repos/${owner}/${repo}/readme`
    );
    return atob(data.content.replace(/\n/g, ''));
  } catch {
    return null;
  }
}

// ---------- .taskboard Repo ----------

export async function createTaskboardRepo(): Promise<GitHubRepo> {
  return githubFetch<GitHubRepo>('/user/repos', {
    method: 'POST',
    body: JSON.stringify({
      name: '.taskboard',
      description: 'Orbit workspace — project tracking data',
      private: true,
      auto_init: true,
    }),
  });
}

export async function taskboardRepoExists(
  username: string
): Promise<boolean> {
  try {
    await githubFetch(`/repos/${username}/.taskboard`);
    return true;
  } catch {
    return false;
  }
}

// ---------- .taskboard File Operations ----------

export async function readTaskboardFile(
  username: string,
  path: string
): Promise<{ content: string; sha: string } | null> {
  try {
    const data = await githubFetch<GitHubContent>(
      `/repos/${username}/.taskboard/contents/${path}`
    );
    return {
      content: atob(data.content.replace(/\n/g, '')),
      sha: data.sha,
    };
  } catch {
    return null;
  }
}

export async function writeTaskboardFile(
  username: string,
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  const body: Record<string, string> = {
    message,
    content: btoa(content),
  };
  if (sha) body.sha = sha;

  await githubFetch(`/repos/${username}/.taskboard/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

// ---------- Commit README to user's repo ----------

export async function getFileFromRepo(
  owner: string,
  repo: string,
  path: string
): Promise<{ content: string; sha: string } | null> {
  try {
    const data = await githubFetch<GitHubContent>(
      `/repos/${owner}/${repo}/contents/${path}`
    );
    return {
      content: atob(data.content.replace(/\n/g, '')),
      sha: data.sha,
    };
  } catch {
    return null;
  }
}

export async function writeFileToRepo(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  const body: Record<string, string> = {
    message,
    content: btoa(content),
  };
  if (sha) body.sha = sha;

  await githubFetch(`/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

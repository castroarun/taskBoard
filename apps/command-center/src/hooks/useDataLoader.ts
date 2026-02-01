/**
 * Hook for loading and persisting data with Tauri backend
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAppStore, Activity, InboxItem } from '@/store';
import {
  readProjects,
  readTasks,
  writeProjects,
  writeTasks,
  readInboxJson,
  writeInboxJson,
  writeInbox,
  generateInboxMarkdown,
  isTauri,
  readSyncConfig,
  MOCK_INBOX_ITEMS,
} from '@/lib/tauri';
import { mergeInboxItems, startSyncPoller } from '@/services/gist-sync';
import { startGitHubSyncPoller, mergeRepoInboxItems, pushInboxToRepo } from '@/services/github-sync';
import { notifyNewInboxItems } from '@/lib/notifications';

// Activity templates for generating sample data
const ACTIVITY_TEMPLATES = [
  { type: 'document_created', descriptions: ['README.md created', 'CHANGELOG.md created', 'DESIGN.md created', 'API_DOCS.md created', 'WALKTHROUGH.md created'] },
  { type: 'document_approved', descriptions: ['PRD approved by team', 'Architecture doc approved', 'Design specs approved', 'API contract approved'] },
  { type: 'deployed', descriptions: ['deployed to staging', 'deployed to production', 'beta release published', 'hotfix deployed'] },
  { type: 'stage_changed', descriptions: ['moved to development', 'moved to review', 'moved to testing', 'moved to design', 'moved to engineering'] },
  { type: 'code_merged', descriptions: ['feature branch merged', 'bug fix merged', 'refactor completed', 'tests added', 'CI/CD updated'] },
  { type: 'comment_added', descriptions: ['code review completed', 'feedback provided', 'discussion updated', 'blockers identified'] },
  { type: 'milestone_reached', descriptions: ['MVP completed', 'Sprint goal achieved', 'Phase 1 complete', 'Beta ready'] },
];

// Time blocks for spreading activities throughout the day
const TIME_BLOCKS = [
  { name: 'morning', hours: [7, 8, 9, 10, 11] },
  { name: 'afternoon', hours: [12, 13, 14, 15, 16] },
  { name: 'evening', hours: [17, 18, 19, 20] },
  { name: 'night', hours: [21, 22, 23] },
];

// Weighted random pick from an array using weights
function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// Generate sample activities from projects
function generateSampleActivities(projects: { id: string; name: string; lastUpdated: string; currentPhase?: string }[]): Activity[] {
  const activities: Activity[] = [];
  const now = new Date();

  if (projects.length === 0) return activities;

  // Time block weights: weekdays skew heavily toward evening/night (side-project after work)
  // Weekends spread more evenly but still favour afternoon+evening
  const weekdayWeights = [1, 2, 5, 4]; // morning=1, afternoon=2, evening=5, night=4
  const weekendWeights = [3, 4, 4, 3];  // more balanced but still active

  // Generate activities for the past 21 days (3 weeks)
  for (let daysAgo = 0; daysAgo <= 21; daysAgo++) {
    const dayDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;

    // Weekends are MORE active (personal project time), weekdays still decent
    const activityCount = isWeekend
      ? Math.floor(Math.random() * 4) + 4  // 4-7 activities on weekends
      : Math.floor(Math.random() * 5) + 2; // 2-6 activities on weekdays

    const blockWeights = isWeekend ? weekendWeights : weekdayWeights;

    for (let i = 0; i < activityCount; i++) {
      // Pick a random project
      const project = projects[Math.floor(Math.random() * Math.min(projects.length, 5))];

      // Pick a random activity type and description
      const template = ACTIVITY_TEMPLATES[Math.floor(Math.random() * ACTIVITY_TEMPLATES.length)];
      const description = template.descriptions[Math.floor(Math.random() * template.descriptions.length)];

      // Pick time block using weighted distribution
      const timeBlock = weightedPick(TIME_BLOCKS, blockWeights);
      const hour = timeBlock.hours[Math.floor(Math.random() * timeBlock.hours.length)];
      const minute = Math.floor(Math.random() * 60);

      const timestamp = new Date(dayDate);
      timestamp.setHours(hour, minute, 0, 0);

      activities.push({
        id: `activity-${project.id}-${daysAgo}-${i}-${Date.now()}`,
        type: template.type as Activity['type'],
        projectId: project.id,
        projectName: project.name,
        description: `${description} by @${['dev', 'claude', 'bot', 'user'][Math.floor(Math.random() * 4)]}`,
        timestamp: timestamp.toISOString(),
      });
    }
  }

  // Sort by timestamp (most recent first)
  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Debounce delay for saving (ms)
const SAVE_DEBOUNCE = 1000;

export function useDataLoader() {
  const {
    projects,
    tasks,
    inboxItems,
    setProjects,
    setTasks,
    setInboxItems,
    setActivities,
    setLoading,
    setSaving,
    setLastSaved,
  } = useAppStore();

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);
  const previousProjectsRef = useRef<string>('');
  const previousTasksRef = useRef<string>('');
  const previousInboxRef = useRef<string>('');

  // Save data with debouncing
  const saveData = useCallback(async () => {
    if (isInitialLoadRef.current) return;

    const projectsJson = JSON.stringify(projects);
    const tasksJson = JSON.stringify(tasks);
    const inboxJson = JSON.stringify(inboxItems);

    // Only save if data actually changed
    const projectsChanged = projectsJson !== previousProjectsRef.current;
    const tasksChanged = tasksJson !== previousTasksRef.current;
    const inboxChanged = inboxJson !== previousInboxRef.current;

    if (!projectsChanged && !tasksChanged && !inboxChanged) return;

    setSaving(true);

    try {
      const savePromises: Promise<void>[] = [];

      if (projectsChanged) {
        previousProjectsRef.current = projectsJson;
        savePromises.push(
          writeProjects({
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            projects,
          })
        );
      }

      if (tasksChanged) {
        previousTasksRef.current = tasksJson;
        savePromises.push(
          writeTasks({
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            tasks,
          })
        );
      }

      if (inboxChanged) {
        previousInboxRef.current = inboxJson;
        // Save structured JSON data
        savePromises.push(
          writeInboxJson({
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            items: inboxItems,
          })
        );
        // Also generate and save markdown for Claude readability
        const markdown = generateInboxMarkdown(inboxItems);
        savePromises.push(writeInbox(markdown));
      }

      await Promise.all(savePromises);
      setLastSaved(new Date().toISOString());
      console.log('[DataLoader] Saved:', {
        projects: projectsChanged,
        tasks: tasksChanged,
        inbox: inboxChanged,
      });

      // Push inbox changes to GitHub repo (fire-and-forget, non-blocking)
      if (inboxChanged) {
        readSyncConfig().then(async (config) => {
          if (!config?.github?.token || !config?.github?.owner) return;
          const pushed = await pushInboxToRepo(
            config.github.token,
            config.github.owner,
            inboxItems
          );
          if (pushed) {
            console.log('[DataLoader] Pushed inbox to GitHub');
          }
        }).catch((err) => {
          console.warn('[DataLoader] GitHub push skipped:', err);
        });
      }
    } catch (error) {
      console.error('[DataLoader] Save failed:', error);
    } finally {
      setSaving(false);
    }
  }, [projects, tasks, inboxItems, setSaving, setLastSaved]);

  // Debounced save effect
  useEffect(() => {
    if (isInitialLoadRef.current) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for saving
    saveTimeoutRef.current = setTimeout(saveData, SAVE_DEBOUNCE);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [projects, tasks, inboxItems, saveData]);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        // Load projects, tasks, and inbox in parallel
        const [projectsData, tasksData, inboxData] = await Promise.all([
          readProjects(),
          readTasks(),
          readInboxJson(),
        ]);

        // Load projects (empty if no data - same as dev mode)
        const loadedProjects = projectsData.projects;
        setProjects(loadedProjects);

        // Load tasks (empty if no data - same as dev mode)
        const loadedTasks = tasksData.tasks;
        setTasks(loadedTasks);

        // Load inbox items - use MOCK_INBOX_ITEMS as fallback (same as dev mode)
        const rawInboxItems = inboxData.items.length > 0 ? inboxData.items : MOCK_INBOX_ITEMS;
        const migratedInboxItems = rawInboxItems.map((item: InboxItem) => ({
          ...item,
          read: item.read ?? false,
          author: item.author ?? 'user',
          parentId: item.parentId ?? null,
          replies: item.replies ?? [],
        }));
        setInboxItems(migratedInboxItems);

        // Generate sample activities from projects
        const sampleActivities = generateSampleActivities(loadedProjects);
        setActivities(sampleActivities);

        // Store initial values for change detection
        previousProjectsRef.current = JSON.stringify(loadedProjects);
        previousTasksRef.current = JSON.stringify(loadedTasks);
        previousInboxRef.current = JSON.stringify(migratedInboxItems);

        console.log('[DataLoader] Loaded:', {
          projects: loadedProjects.length,
          tasks: loadedTasks.length,
          inbox: migratedInboxItems.length,
          activities: sampleActivities.length,
          source: isTauri() ? 'tauri' : 'dev',
        });
      } catch (error) {
        console.error('[DataLoader] Load failed:', error);
      } finally {
        setLoading(false);
        // Mark initial load as complete after a short delay
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 100);
      }
    };

    loadData();
  }, [setProjects, setTasks, setInboxItems, setLoading]);

  // Gist sync polling for mobile ↔ desktop sync
  useEffect(() => {
    let stopPoller: (() => void) | null = null;

    const startGistSync = async () => {
      const config = await readSyncConfig();
      if (!config?.gistToken || !config?.gistId) return;

      const intervalMs = config.pollIntervalMs || 60000; // Default 60s

      stopPoller = startSyncPoller(
        config.gistToken,
        config.gistId,
        intervalMs,
        (remoteItems) => {
          const currentInbox = useAppStore.getState().inboxItems;
          const { merged, newCount } = mergeInboxItems(currentInbox, remoteItems);

          if (newCount > 0) {
            useAppStore.getState().setInboxItems(merged);
            const preview = remoteItems[0]?.text;
            notifyNewInboxItems(newCount, preview);
            console.log(`[DataLoader] Synced ${newCount} new item(s) from Orbit`);
          }
        }
      );
    };

    startGistSync();

    return () => {
      if (stopPoller) stopPoller();
    };
  }, []);

  // GitHub repo sync polling (Orbit ↔ Klarity via .taskboard repo)
  useEffect(() => {
    let stopPoller: (() => void) | null = null;

    const startGitHubSync = async () => {
      const config = await readSyncConfig();
      if (!config?.github?.token || !config?.github?.owner) return;

      const intervalMs = config.github.pollIntervalMs || 120000; // Default 2 min

      stopPoller = startGitHubSyncPoller(
        config.github.token,
        config.github.owner,
        intervalMs,
        (remoteItems) => {
          const currentInbox = useAppStore.getState().inboxItems;
          const { merged, newCount } = mergeRepoInboxItems(currentInbox, remoteItems);

          if (newCount > 0) {
            useAppStore.getState().setInboxItems(merged);
            const preview = remoteItems[0]?.text;
            notifyNewInboxItems(newCount, preview);
            console.log(`[DataLoader] Synced ${newCount} new item(s) from Orbit`);
          }
        }
      );
    };

    startGitHubSync();

    return () => {
      if (stopPoller) stopPoller();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
}

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
} from '@/lib/tauri';

// Generate sample activities from projects
function generateSampleActivities(projects: { id: string; name: string; lastUpdated: string }[]): Activity[] {
  const activities: Activity[] = [];
  const now = new Date();

  // Add some sample activities based on existing projects
  projects.forEach((project, index) => {
    if (index < 5) { // Limit to 5 projects for sample data
      const daysAgo = index;
      const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 12 * 60 * 60 * 1000);

      activities.push({
        id: `activity-${project.id}-${Date.now()}-${index}`,
        type: index === 0 ? 'document_created' : index === 1 ? 'deployed' : index === 2 ? 'document_approved' : 'stage_changed',
        projectId: project.id,
        projectName: project.name,
        description: index === 0
          ? 'WALKTHROUGH.md created by @walkthrough'
          : index === 1
          ? 'deployed to production'
          : index === 2
          ? 'PRD approved'
          : 'moved to development',
        timestamp: timestamp.toISOString(),
      });
    }
  });

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

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

        setProjects(projectsData.projects);
        setTasks(tasksData.tasks);

        // Load inbox items (ensure new fields have defaults for migration)
        const migratedInboxItems = inboxData.items.map((item: InboxItem) => ({
          ...item,
          read: item.read ?? false,
          author: item.author ?? 'user',
          parentId: item.parentId ?? null,
          replies: item.replies ?? [],
        }));
        setInboxItems(migratedInboxItems);

        // Generate sample activities from projects
        const sampleActivities = generateSampleActivities(projectsData.projects);
        setActivities(sampleActivities);

        // Store initial values for change detection
        previousProjectsRef.current = JSON.stringify(projectsData.projects);
        previousTasksRef.current = JSON.stringify(tasksData.tasks);
        previousInboxRef.current = JSON.stringify(migratedInboxItems);

        console.log('[DataLoader] Loaded:', {
          projects: projectsData.projects.length,
          tasks: tasksData.tasks.length,
          inbox: migratedInboxItems.length,
          activities: sampleActivities.length,
          source: isTauri() ? 'tauri' : 'mock',
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
}

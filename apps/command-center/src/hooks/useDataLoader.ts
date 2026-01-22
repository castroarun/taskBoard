/**
 * Hook for loading and persisting data with Tauri backend
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store';
import { readProjects, readTasks, writeProjects, writeTasks, isTauri } from '@/lib/tauri';

// Debounce delay for saving (ms)
const SAVE_DEBOUNCE = 1000;

export function useDataLoader() {
  const {
    projects,
    tasks,
    setProjects,
    setTasks,
    setLoading,
    setSaving,
    setLastSaved,
  } = useAppStore();

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  const previousProjectsRef = useRef<string>('');
  const previousTasksRef = useRef<string>('');

  // Save data with debouncing
  const saveData = useCallback(async () => {
    if (isInitialLoadRef.current) return;

    const projectsJson = JSON.stringify(projects);
    const tasksJson = JSON.stringify(tasks);

    // Only save if data actually changed
    const projectsChanged = projectsJson !== previousProjectsRef.current;
    const tasksChanged = tasksJson !== previousTasksRef.current;

    if (!projectsChanged && !tasksChanged) return;

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

      await Promise.all(savePromises);
      setLastSaved(new Date().toISOString());
      console.log('[DataLoader] Saved:', {
        projects: projectsChanged,
        tasks: tasksChanged,
      });
    } catch (error) {
      console.error('[DataLoader] Save failed:', error);
    } finally {
      setSaving(false);
    }
  }, [projects, tasks, setSaving, setLastSaved]);

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
  }, [projects, tasks, saveData]);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        // Load projects and tasks in parallel
        const [projectsData, tasksData] = await Promise.all([
          readProjects(),
          readTasks(),
        ]);

        setProjects(projectsData.projects);
        setTasks(tasksData.tasks);

        // Store initial values for change detection
        previousProjectsRef.current = JSON.stringify(projectsData.projects);
        previousTasksRef.current = JSON.stringify(tasksData.tasks);

        console.log('[DataLoader] Loaded:', {
          projects: projectsData.projects.length,
          tasks: tasksData.tasks.length,
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
  }, [setProjects, setTasks, setLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
}

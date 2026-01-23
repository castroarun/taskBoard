/**
 * useNotifications Hook
 *
 * Provides easy access to notification functionality throughout the app.
 * Handles both in-app notifications and browser notifications.
 */

import { useCallback, useEffect } from 'react';
import { useAppStore } from '@/store';

// Request browser notification permission on mount
let permissionRequested = false;

export function useNotifications() {
  const { addNotification, notifications } = useAppStore();

  // Request browser notification permission once
  useEffect(() => {
    if (!permissionRequested && 'Notification' in window) {
      permissionRequested = true;
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Show browser notification if enabled
  const showBrowserNotification = useCallback((title: string, body: string, icon?: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          icon: icon || '/icon.png',
          silent: false,
        });
        setTimeout(() => notification.close(), 5000);
      } catch (e) {
        console.warn('[notifications] Browser notification failed:', e);
      }
    }
  }, []);

  // Helper functions for specific notification types
  const notifyTaskComplete = useCallback((taskTitle: string, projectName?: string) => {
    const body = projectName ? `"${taskTitle}" in ${projectName}` : `"${taskTitle}"`;
    addNotification({
      type: 'task_complete',
      title: 'Task Completed',
      body,
    });
    showBrowserNotification('✅ Task Completed', body);
  }, [addNotification, showBrowserNotification]);

  const notifyStageChange = useCallback((projectName: string, fromStage: string, toStage: string) => {
    const body = `${projectName}: ${fromStage} → ${toStage}`;
    addNotification({
      type: 'stage_change',
      title: 'Stage Updated',
      body,
    });
    showBrowserNotification('🔄 Stage Updated', body);
  }, [addNotification, showBrowserNotification]);

  const notifyStaleProject = useCallback((projectName: string, daysSinceUpdate: number) => {
    const body = `"${projectName}" hasn't been updated in ${daysSinceUpdate} days`;
    addNotification({
      type: 'project_stale',
      title: 'Project Needs Attention',
      body,
    });
    showBrowserNotification('⏰ Project Needs Attention', body);
  }, [addNotification, showBrowserNotification]);

  const notifyApprovalPending = useCallback((documentName: string, projectName: string) => {
    const body = `"${documentName}" in ${projectName} needs review`;
    addNotification({
      type: 'approval_pending',
      title: 'Approval Required',
      body,
    });
    showBrowserNotification('📋 Approval Required', body);
  }, [addNotification, showBrowserNotification]);

  const notifyBlockedTask = useCallback((taskTitle: string, reason?: string) => {
    const body = reason ? `"${taskTitle}": ${reason}` : `"${taskTitle}" is blocked`;
    addNotification({
      type: 'blocked_task',
      title: 'Task Blocked',
      body,
    });
    showBrowserNotification('🚫 Task Blocked', body);
  }, [addNotification, showBrowserNotification]);

  const notifyVoiceTranscript = useCallback((preview: string) => {
    const body = preview.length > 50 ? `${preview.substring(0, 50)}...` : preview;
    addNotification({
      type: 'voice_transcript',
      title: 'Voice Note Added',
      body,
    });
    showBrowserNotification('🎤 Voice Note Added', body);
  }, [addNotification, showBrowserNotification]);

  const notifySystem = useCallback((title: string, body: string) => {
    addNotification({
      type: 'system',
      title,
      body,
    });
    showBrowserNotification(`💡 ${title}`, body);
  }, [addNotification, showBrowserNotification]);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    notifyTaskComplete,
    notifyStageChange,
    notifyStaleProject,
    notifyApprovalPending,
    notifyBlockedTask,
    notifyVoiceTranscript,
    notifySystem,
    addNotification,
  };
}

/**
 * Notification Service for Command Center
 *
 * Uses Web Notifications API with fallback to in-app toasts.
 * Respects user notification preferences from config.
 */

// Notification types
export type NotificationType =
  | 'task_complete'
  | 'stage_change'
  | 'project_stale'
  | 'approval_pending'
  | 'blocked_task'
  | 'voice_transcript'
  | 'system';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
  onClick?: () => void;
}

// In-app notification state (for toast fallback)
interface InAppNotification extends NotificationPayload {
  id: string;
  timestamp: number;
  read: boolean;
}

let inAppNotifications: InAppNotification[] = [];
let listeners: ((notifications: InAppNotification[]) => void)[] = [];

// Notification permission state
let permissionGranted: boolean | null = null;

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('[notifications] Web Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    permissionGranted = true;
    return true;
  }

  if (Notification.permission === 'denied') {
    permissionGranted = false;
    return false;
  }

  const result = await Notification.requestPermission();
  permissionGranted = result === 'granted';
  return permissionGranted;
}

/**
 * Check if notifications are available and enabled
 */
export function isNotificationEnabled(): boolean {
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted';
}

/**
 * Get notification icon based on type
 */
function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    task_complete: '✅',
    stage_change: '🔄',
    project_stale: '⏰',
    approval_pending: '📋',
    blocked_task: '🚫',
    voice_transcript: '🎤',
    system: '💡',
  };
  return icons[type] || '📢';
}

/**
 * Show a notification
 */
export async function showNotification(payload: NotificationPayload): Promise<void> {
  const { type, title, body, tag, data, onClick } = payload;
  const icon = payload.icon || getNotificationIcon(type);

  // Add to in-app notifications first (always)
  const inAppNotif: InAppNotification = {
    ...payload,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    read: false,
  };
  inAppNotifications = [inAppNotif, ...inAppNotifications].slice(0, 50); // Keep last 50
  notifyListeners();

  // Try desktop notification
  if (isNotificationEnabled()) {
    try {
      const notification = new Notification(`${icon} ${title}`, {
        body,
        icon: '/icon.png',
        tag: tag || type,
        data,
        silent: false,
      });

      if (onClick) {
        notification.onclick = () => {
          window.focus();
          onClick();
          notification.close();
        };
      }

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch (e) {
      console.warn('[notifications] Failed to show desktop notification:', e);
    }
  }
}

/**
 * Subscribe to in-app notification updates
 */
export function subscribeToNotifications(
  callback: (notifications: InAppNotification[]) => void
): () => void {
  listeners.push(callback);
  callback(inAppNotifications);

  // Return unsubscribe function
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
}

/**
 * Get all in-app notifications
 */
export function getNotifications(): InAppNotification[] {
  return [...inAppNotifications];
}

/**
 * Get unread notification count
 */
export function getUnreadCount(): number {
  return inAppNotifications.filter(n => !n.read).length;
}

/**
 * Mark notification as read
 */
export function markAsRead(id: string): void {
  inAppNotifications = inAppNotifications.map(n =>
    n.id === id ? { ...n, read: true } : n
  );
  notifyListeners();
}

/**
 * Mark all as read
 */
export function markAllAsRead(): void {
  inAppNotifications = inAppNotifications.map(n => ({ ...n, read: true }));
  notifyListeners();
}

/**
 * Clear all notifications
 */
export function clearNotifications(): void {
  inAppNotifications = [];
  notifyListeners();
}

/**
 * Notify all listeners
 */
function notifyListeners(): void {
  listeners.forEach(l => l(inAppNotifications));
}

// ============================================================================
// Pre-built notification helpers
// ============================================================================

/**
 * Notify task completed
 */
export function notifyTaskComplete(taskTitle: string, projectName?: string): void {
  showNotification({
    type: 'task_complete',
    title: 'Task Completed',
    body: projectName ? `"${taskTitle}" in ${projectName}` : `"${taskTitle}"`,
    tag: 'task-complete',
  });
}

/**
 * Notify stage/phase change
 */
export function notifyStageChange(projectName: string, fromStage: string, toStage: string): void {
  showNotification({
    type: 'stage_change',
    title: 'Stage Updated',
    body: `${projectName}: ${fromStage} → ${toStage}`,
    tag: `stage-${projectName}`,
  });
}

/**
 * Notify stale project warning
 */
export function notifyStaleProject(projectName: string, daysSinceUpdate: number): void {
  showNotification({
    type: 'project_stale',
    title: 'Project Needs Attention',
    body: `"${projectName}" hasn't been updated in ${daysSinceUpdate} days`,
    tag: `stale-${projectName}`,
  });
}

/**
 * Notify approval pending
 */
export function notifyApprovalPending(documentName: string, projectName: string): void {
  showNotification({
    type: 'approval_pending',
    title: 'Approval Required',
    body: `"${documentName}" in ${projectName} needs review`,
    tag: `approval-${documentName}`,
  });
}

/**
 * Notify blocked task
 */
export function notifyBlockedTask(taskTitle: string, reason?: string): void {
  showNotification({
    type: 'blocked_task',
    title: 'Task Blocked',
    body: reason ? `"${taskTitle}": ${reason}` : `"${taskTitle}" is blocked`,
    tag: 'blocked-task',
  });
}

/**
 * Notify voice transcript received
 */
export function notifyVoiceTranscript(preview: string): void {
  showNotification({
    type: 'voice_transcript',
    title: 'Voice Note Added',
    body: preview.length > 50 ? `${preview.substring(0, 50)}...` : preview,
    tag: 'voice-transcript',
  });
}

/**
 * Notify generic system message
 */
export function notifySystem(title: string, body: string): void {
  showNotification({
    type: 'system',
    title,
    body,
    tag: 'system',
  });
}

// ============================================================================
// Reminder scheduler (checks for stale projects, pending approvals, etc.)
// ============================================================================

interface ReminderConfig {
  staleProject: number;
  approvalPending: number;
  blockedTask: number;
}

let reminderInterval: number | null = null;

/**
 * Start reminder scheduler
 */
export function startReminders(
  config: ReminderConfig,
  checkCallback: () => { staleProjects: Array<{ name: string; daysSinceUpdate: number }>; pendingApprovals: Array<{ doc: string; project: string }>; blockedTasks: Array<{ title: string; reason?: string }> }
): void {
  if (reminderInterval) {
    clearInterval(reminderInterval);
  }

  // Check every hour
  reminderInterval = window.setInterval(() => {
    const { staleProjects, pendingApprovals, blockedTasks } = checkCallback();

    // Stale project warnings
    staleProjects.forEach(p => {
      if (p.daysSinceUpdate >= config.staleProject) {
        notifyStaleProject(p.name, p.daysSinceUpdate);
      }
    });

    // Pending approvals
    pendingApprovals.forEach(a => {
      notifyApprovalPending(a.doc, a.project);
    });

    // Blocked tasks
    blockedTasks.forEach(t => {
      notifyBlockedTask(t.title, t.reason);
    });
  }, 60 * 60 * 1000); // Every hour

  // Also run once immediately
  const { staleProjects, pendingApprovals, blockedTasks } = checkCallback();
  staleProjects.forEach(p => {
    if (p.daysSinceUpdate >= config.staleProject) {
      notifyStaleProject(p.name, p.daysSinceUpdate);
    }
  });
}

/**
 * Stop reminder scheduler
 */
export function stopReminders(): void {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
}

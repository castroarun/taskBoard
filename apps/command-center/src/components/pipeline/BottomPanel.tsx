/**
 * BottomPanel Component
 *
 * Split panel showing:
 * - Left: Needs Attention (stale projects, pending reviews, ready to ship)
 * - Right: Recent Activity (chronological timeline)
 */

import { useMemo } from 'react';
import { useAppStore, Activity, AttentionItem, AttentionType } from '@/store';
import clsx from 'clsx';

// Calculate days since a date
function daysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

// Format timestamp for display
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

// Group activities by date
function groupActivitiesByDate(activities: Activity[]): { label: string; activities: Activity[] }[] {
  const groups: Map<string, Activity[]> = new Map();

  activities.forEach((activity) => {
    const date = new Date(activity.timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    let label: string;
    if (diffDays === 0) {
      label = 'Today';
    } else if (diffDays === 1) {
      label = 'Yesterday';
    } else {
      label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(activity);
  });

  return Array.from(groups.entries()).map(([label, activities]) => ({ label, activities }));
}

// Get attention color by type
function getAttentionColor(type: AttentionType): { dot: string; text: string; button: string } {
  switch (type) {
    case 'stale':
      return { dot: 'bg-amber-500', text: 'text-amber-500', button: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400' };
    case 'review_needed':
      return { dot: 'bg-blue-400', text: 'text-blue-400', button: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400' };
    case 'ready_to_ship':
      return { dot: 'bg-green-400', text: 'text-green-400', button: 'bg-green-500/20 hover:bg-green-500/30 text-green-400' };
    case 'blocked':
      return { dot: 'bg-red-500', text: 'text-red-500', button: 'bg-red-500/20 hover:bg-red-500/30 text-red-400' };
  }
}

// Get attention label by type
function getAttentionLabel(type: AttentionType, daysSince?: number): string {
  switch (type) {
    case 'stale':
      return `Stale ${daysSince || 0} days`;
    case 'review_needed':
      return 'PRD Ready';
    case 'ready_to_ship':
      return 'Ready to ship';
    case 'blocked':
      return 'Blocked';
  }
}

// Get activity icon by type
function getActivityIcon(type: Activity['type']): { bg: string; icon: React.ReactNode } {
  switch (type) {
    case 'project_created':
      return {
        bg: 'bg-green-500/20',
        icon: (
          <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        ),
      };
    case 'stage_changed':
      return {
        bg: 'bg-sky-500/20',
        icon: (
          <svg className="w-3 h-3 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        ),
      };
    case 'document_created':
      return {
        bg: 'bg-purple-500/20',
        icon: (
          <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      };
    case 'document_approved':
      return {
        bg: 'bg-blue-500/20',
        icon: (
          <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
    case 'deployed':
      return {
        bg: 'bg-green-500/20',
        icon: (
          <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
      };
    case 'task_completed':
      return {
        bg: 'bg-teal-500/20',
        icon: (
          <svg className="w-3 h-3 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
      };
    case 'review_submitted':
      return {
        bg: 'bg-yellow-500/20',
        icon: (
          <svg className="w-3 h-3 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ),
      };
    default:
      return {
        bg: 'bg-zinc-500/20',
        icon: (
          <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
  }
}

export function BottomPanel() {
  const { projects, activities, isBottomPanelOpen, toggleBottomPanel, setSelectedProjectId } = useAppStore();

  // Calculate attention items from projects
  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];

    projects.forEach((project) => {
      // Skip closure phase projects
      if (project.currentPhase === 'closure') return;

      const days = daysSince(project.lastUpdated);

      // Stale projects (no activity in 7+ days)
      if (days >= 7) {
        items.push({
          id: `stale-${project.id}`,
          type: 'stale',
          projectId: project.id,
          projectName: project.name,
          description: `No activity since ${new Date(project.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`,
          daysSince: days,
        });
      }

      // Projects with pending reviews
      const pendingReviews = project.reviews?.filter((r) => !r.resolved && !r.approved) || [];
      if (pendingReviews.length > 0) {
        items.push({
          id: `review-${project.id}`,
          type: 'review_needed',
          projectId: project.id,
          projectName: project.name,
          description: `${pendingReviews[0].documentName} awaiting review.`,
          documentName: pendingReviews[0].documentName,
        });
      }

      // Ready to ship (launch phase with high progress)
      if (project.currentPhase === 'launch' && project.progress >= 85) {
        items.push({
          id: `ship-${project.id}`,
          type: 'ready_to_ship',
          projectId: project.id,
          projectName: project.name,
          description: `Progress at ${project.progress}%. Ready to ship?`,
        });
      }
    });

    return items.slice(0, 10); // Limit to 10 items
  }, [projects]);

  // Group activities
  const groupedActivities = useMemo(() => {
    return groupActivitiesByDate(activities.slice(0, 20));
  }, [activities]);

  // Collapsed state - just show toggle bar
  if (!isBottomPanelOpen) {
    return (
      <div className="mt-4 border border-zinc-800 rounded-xl bg-zinc-900/50 backdrop-blur-sm">
        <button
          onClick={toggleBottomPanel}
          className="w-full flex items-center justify-center gap-2 py-3 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors rounded-xl"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          <span>Latest Activity & Needs Attention</span>
          {attentionItems.length > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px] font-medium">
              {attentionItems.length}
            </span>
          )}
          <span className="text-zinc-600">Ctrl+B</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 border border-zinc-800 rounded-xl bg-zinc-900/50 backdrop-blur-sm overflow-hidden">
      {/* Panel Header - labels centered above their respective columns */}
      <div
        className="flex items-center px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/80 cursor-pointer hover:bg-zinc-800/50 transition-colors"
        onClick={toggleBottomPanel}
      >
        {/* Left half - Latest Activity label positioned toward right */}
        <div className="flex-1 flex items-center justify-end pr-8 border-r border-zinc-800/50">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Latest Activity
          </div>
        </div>

        {/* Right half - Needs Attention label centered above right content */}
        <div className="flex-1 flex items-center justify-between pl-4">
          <span className="flex items-center gap-2 text-xs font-medium text-white">
            <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Needs Attention
            {attentionItems.length > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px] font-semibold">
                {attentionItems.length}
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500">Ctrl+B</span>
            <div className="p-1 text-zinc-500 hover:text-zinc-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Panel Content: Split View - Activity LEFT, Needs Attention RIGHT */}
      <div className="flex">
        {/* LEFT: Recent Activity - content right-aligned toward center */}
        <div className="flex-1 border-r border-zinc-800/50 p-3 flex flex-col">
          {/* Content - right aligned */}
          <div className="flex-1 flex justify-end">
            {activities.length === 0 ? (
              <div className="flex items-center justify-center w-full text-zinc-600 text-sm">
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  No recent activity
                </div>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50 max-w-md w-full">
                {groupedActivities.map((group) => (
                  <div key={group.label}>
                    {group.activities.map((activity, index) => {
                      const icon = getActivityIcon(activity.type);
                      return (
                        <div
                          key={activity.id}
                          className={clsx(
                            'py-2 hover:bg-zinc-800/30 transition-colors cursor-pointer',
                            index > 0 && 'border-t border-zinc-800/50'
                          )}
                          onClick={() => setSelectedProjectId(activity.projectId)}
                        >
                          {/* Time + Date label row - right aligned together */}
                          <div className="flex items-center justify-end gap-3 px-1 mb-1">
                            <span className="text-[10px] text-zinc-500">{formatTime(activity.timestamp)}</span>
                            {index === 0 && (
                              <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                                {group.label}
                              </span>
                            )}
                          </div>
                          {/* Activity content row */}
                          <div className="flex flex-row-reverse items-center gap-3 px-1">
                            <div className={clsx('w-6 h-6 rounded flex items-center justify-center flex-shrink-0', icon.bg)}>
                              {icon.icon}
                            </div>
                            <div className="flex-1 min-w-0 text-right">
                              <span className="text-[11px] text-zinc-300">
                                <span className="text-white font-medium">{activity.projectName}</span> {activity.description}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Needs Attention - normal left-aligned */}
        <div className="flex-1 p-3 flex flex-col">
          {/* Content - normal left-aligned */}
          <div className="flex-1 flex justify-start">
            {attentionItems.length === 0 ? (
              <div className="flex items-center justify-center w-full text-zinc-600 text-sm">
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  All caught up!
                </div>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50 max-w-md w-full">
                {attentionItems.map((item) => {
                  const colors = getAttentionColor(item.type);
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 py-3 hover:bg-zinc-800/30 transition-colors cursor-pointer px-1"
                      onClick={() => setSelectedProjectId(item.projectId)}
                    >
                      <div className={clsx('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', colors.dot)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-white">{item.projectName}</span>
                          <span className={clsx('text-[10px]', colors.text)}>
                            {getAttentionLabel(item.type, item.daysSince)}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{item.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button className={clsx('px-2 py-1 text-[10px] font-medium rounded transition-colors', colors.button)}>
                            {item.type === 'stale' ? 'Resume' : item.type === 'review_needed' ? 'Review' : 'Ship'}
                          </button>
                          <button className="px-2 py-1 text-zinc-500 hover:text-zinc-300 text-[10px] transition-colors">
                            {item.type === 'stale' ? 'Snooze' : 'Defer'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

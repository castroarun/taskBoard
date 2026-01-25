import { useRef, useEffect } from 'react';
import { useAppStore, TabId } from '@/store';
import clsx from 'clsx';

// SVG Icons for tabs
const TabIcons = {
  projects: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
    </svg>
  ),
  docs: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  inbox: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
    </svg>
  ),
  help: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
  ),
};

const tabs: { id: TabId; label: string; shortcut: string }[] = [
  { id: 'projects', label: 'Project Board', shortcut: 'Ctrl+1' },
  { id: 'docs', label: 'Docs', shortcut: 'Ctrl+2' },
  { id: 'inbox', label: 'Inbox', shortcut: 'Ctrl+3' },
  { id: 'help', label: 'Help', shortcut: 'Ctrl+4' },
];

// Klarity Lens K Logo
function KlarityLogo() {
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800">
      <svg className="w-6 h-6" viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="klarity-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        {/* Magnifying glass ring */}
        <circle cx="32" cy="28" r="20" fill="none" stroke="url(#klarity-gradient)" strokeWidth="3" />
        {/* K letter - vertical bar */}
        <rect x="24" y="14" width="4" height="28" fill="#a78bfa" />
        {/* K letter - arms */}
        <path d="M28 28 L40 14 L44 14 L44 18 L32 28 L44 38 L44 42 L40 42 L28 28" fill="#6366f1" />
        {/* Handle */}
        <line x1="46" y1="42" x2="58" y2="54" stroke="#a78bfa" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function Header() {
  const {
    activeTab,
    setActiveTab,
    setSelectedProjectId,
    openQuickLaunch,
    openSettings,
    isSaving,
    lastSaved,
    notifications,
    isNotificationPanelOpen,
    openNotificationPanel,
    closeNotificationPanel,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
    inboxItems,
  } = useAppStore();

  const notificationRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Calculate unread inbox count - only count items FROM Claude or with unread Claude replies
  const unreadInboxCount = inboxItems.filter(item => {
    if (item.status !== 'pending') return false;
    // Count if item is from Claude and unread
    if (item.author === 'claude' && !item.read) return true;
    // Count if item has any unread Claude replies (check if item was read AFTER latest Claude reply)
    const claudeReplies = item.replies?.filter(r => r.author === 'claude') || [];
    if (claudeReplies.length > 0 && !item.read) return true;
    return false;
  }).length;

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        closeNotificationPanel();
      }
    };
    if (isNotificationPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationPanelOpen, closeNotificationPanel]);

  // Format notification time
  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  // Notification type icons
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_complete': return '✅';
      case 'stage_change': return '🔄';
      case 'project_stale': return '⏰';
      case 'approval_pending': return '📋';
      case 'blocked_task': return '🚫';
      case 'voice_transcript': return '🎤';
      default: return '💡';
    }
  };

  // Format last saved time
  const formatLastSaved = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo / Title */}
        <div className="flex items-center gap-3">
          <KlarityLogo />
          <span className="text-base font-semibold text-zinc-100 font-display">Klarity</span>
          <span className="text-[10px] text-zinc-400 font-medium tracking-wide">DECLUTTER. DESIGN. DEPLOY.</span>
          {/* Save Status Indicator */}
          <div className="flex items-center gap-1.5 ml-2">
            {isSaving ? (
              <>
                <div className="w-2 h-2 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-zinc-500">Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span className="text-xs text-zinc-600">{formatLastSaved(lastSaved)}</span>
              </>
            ) : null}
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                // Clear selected project when navigating to Project Board tab
                if (tab.id === 'projects') {
                  setSelectedProjectId(null);
                }
              }}
              className={clsx(
                'relative px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2',
                activeTab === tab.id
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              )}
              title={tab.shortcut}
            >
              {TabIcons[tab.id]}
              <span>{tab.label}</span>
              {/* Unread inbox badge - subtle circle */}
              {tab.id === 'inbox' && unreadInboxCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-700 text-zinc-300 text-[10px] font-medium rounded-full flex items-center justify-center">
                  {unreadInboxCount > 9 ? '9+' : unreadInboxCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Launch Button */}
          <button
            onClick={openQuickLaunch}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
          >
            <span className="text-zinc-400 text-sm">Quick Launch</span>
            <kbd className="px-1.5 py-0.5 bg-zinc-900 text-zinc-500 text-xs rounded border border-zinc-700 font-mono">
              Ctrl+K
            </kbd>
          </button>

          {/* Notification Bell */}
          <div ref={notificationRef} className="relative">
            <button
              onClick={() => isNotificationPanelOpen ? closeNotificationPanel() : openNotificationPanel()}
              className={clsx(
                'relative p-2 rounded-lg transition-colors',
                isNotificationPanelOpen
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              )}
              title="Notifications"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Panel Dropdown */}
            {isNotificationPanelOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden animate-slide-in">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-100">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Mark all read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-xs text-zinc-500 hover:text-zinc-400"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Notification List */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-zinc-500 text-sm">
                      <div className="text-2xl mb-2">🔔</div>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationRead(notif.id);
                          if (notif.onClick) notif.onClick();
                        }}
                        className={clsx(
                          'px-4 py-3 border-b border-zinc-800 cursor-pointer transition-colors',
                          notif.read ? 'bg-transparent' : 'bg-blue-500/5',
                          'hover:bg-zinc-800/50'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg">{getNotificationIcon(notif.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={clsx(
                                'text-sm font-medium truncate',
                                notif.read ? 'text-zinc-400' : 'text-zinc-100'
                              )}>
                                {notif.title}
                              </span>
                              {!notif.read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 truncate mt-0.5">{notif.body}</p>
                            <span className="text-[10px] text-zinc-600 mt-1 block">
                              {formatTime(notif.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-zinc-800 text-center">
                    <span className="text-xs text-zinc-500">
                      {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Settings Button */}
          <button
            onClick={openSettings}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

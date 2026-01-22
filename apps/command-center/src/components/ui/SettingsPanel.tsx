import { useState } from 'react';
import { useAppStore } from '@/store';
import clsx from 'clsx';

interface SettingsPanelProps {
  onClose: () => void;
}

type SettingsTab = 'general' | 'appearance' | 'notifications' | 'shortcuts';

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Settings state (would typically come from store)
  const [dataPath, setDataPath] = useState('~/.taskboard');
  const [autoSave, setAutoSave] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(1000);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [accentColor, setAccentColor] = useState('blue');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'general',
      label: 'General',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      id: 'shortcuts',
      label: 'Shortcuts',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
    },
  ];

  const shortcuts = [
    { action: 'Open Quick Launch', keys: '⌘ K' },
    { action: 'Pipeline View', keys: 'Ctrl 1' },
    { action: 'Docs View', keys: 'Ctrl 2' },
    { action: 'Inbox View', keys: 'Ctrl 3' },
    { action: 'Close Modal', keys: 'Esc' },
    { action: 'Save Document', keys: '⌘ S' },
  ];

  const accentColors = [
    { id: 'blue', color: 'bg-blue-500' },
    { id: 'indigo', color: 'bg-indigo-500' },
    { id: 'purple', color: 'bg-purple-500' },
    { id: 'pink', color: 'bg-pink-500' },
    { id: 'red', color: 'bg-red-500' },
    { id: 'orange', color: 'bg-orange-500' },
    { id: 'green', color: 'bg-green-500' },
    { id: 'teal', color: 'bg-teal-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-zinc-600 to-zinc-700 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex min-h-[400px]">
          {/* Sidebar */}
          <div className="w-48 border-r border-zinc-800 p-3">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                    activeTab === tab.id
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-4">Data Storage</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-2">Data Directory</label>
                      <input
                        type="text"
                        value={dataPath}
                        onChange={(e) => setDataPath(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-zinc-300">Auto-save</div>
                        <div className="text-xs text-zinc-500">Automatically save changes</div>
                      </div>
                      <button
                        onClick={() => setAutoSave(!autoSave)}
                        className={clsx(
                          'w-10 h-6 rounded-full transition-colors relative',
                          autoSave ? 'bg-blue-600' : 'bg-zinc-700'
                        )}
                      >
                        <div
                          className={clsx(
                            'w-4 h-4 bg-white rounded-full absolute top-1 transition-transform',
                            autoSave ? 'translate-x-5' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </div>
                    {autoSave && (
                      <div>
                        <label className="block text-xs text-zinc-400 mb-2">Save Delay (ms)</label>
                        <input
                          type="number"
                          value={autoSaveInterval}
                          onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
                          min={500}
                          max={5000}
                          step={100}
                          className="w-32 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-4">Theme</h3>
                  <div className="flex gap-2">
                    {(['dark', 'light', 'system'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={clsx(
                          'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                          theme === t
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-4">Accent Color</h3>
                  <div className="flex gap-2">
                    {accentColors.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setAccentColor(color.id)}
                        className={clsx(
                          'w-8 h-8 rounded-full transition-transform',
                          color.color,
                          accentColor === color.id && 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110'
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200 mb-4">Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-zinc-300">Enable Notifications</div>
                        <div className="text-xs text-zinc-500">Get notified about task updates</div>
                      </div>
                      <button
                        onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                        className={clsx(
                          'w-10 h-6 rounded-full transition-colors relative',
                          notificationsEnabled ? 'bg-blue-600' : 'bg-zinc-700'
                        )}
                      >
                        <div
                          className={clsx(
                            'w-4 h-4 bg-white rounded-full absolute top-1 transition-transform',
                            notificationsEnabled ? 'translate-x-5' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-zinc-300">Sound Effects</div>
                        <div className="text-xs text-zinc-500">Play sounds on actions</div>
                      </div>
                      <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={clsx(
                          'w-10 h-6 rounded-full transition-colors relative',
                          soundEnabled ? 'bg-blue-600' : 'bg-zinc-700'
                        )}
                      >
                        <div
                          className={clsx(
                            'w-4 h-4 bg-white rounded-full absolute top-1 transition-transform',
                            soundEnabled ? 'translate-x-5' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Shortcuts */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-200 mb-4">Keyboard Shortcuts</h3>
                <div className="space-y-2">
                  {shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.action}
                      className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
                    >
                      <span className="text-sm text-zinc-300">{shortcut.action}</span>
                      <kbd className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs rounded border border-zinc-700 font-mono">
                        {shortcut.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

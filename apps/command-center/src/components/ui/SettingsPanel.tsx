import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useAppStore } from '../../store';

// Icon components
const MoonIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const SunIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

interface SettingsPanelProps {
  onClose: () => void;
}

type SettingsTab = 'profile' | 'integrations' | 'workflow' | 'agents' | 'appearance' | 'notifications' | 'advanced' | 'shortcuts';

// Config types
interface Config {
  version: string;
  user: {
    name: string;
    email: string;
    timezone: string;
    preferences: {
      theme: string;
      language: string;
      defaultFramework: string;
      defaultStyling: string;
      defaultStateManagement: string;
    };
  };
  paths: {
    projects: string;
    dataFolder: string;
    screenshotsFolder: string;
  };
  workflow: {
    phases: Array<{ id: string; name: string; color: string; stages: string[] }>;
    priorities: Array<{ id: string; name: string; color: string }>;
    complexities: Array<{ id: string; name: string; hours: string }>;
  };
  documents: {
    categories: Array<{ id: string; name: string; icon: string; defaultFiles: string[] }>;
    approvalMandatory: {
      beforeEngineering: string[];
      beforeBuild: string[];
      beforeLaunch: string[];
    };
  };
  agents: {
    enabled: boolean;
    templates: Record<string, string>;
  };
  integrations: {
    groq: { enabled: boolean; apiKey: string; model: string };
    github: { enabled: boolean; username: string | null };
    jira: { enabled: boolean; url: string | null; email: string | null; apiToken: string | null; defaultProject: string | null };
  };
  notifications: {
    enabled: boolean;
    desktop: boolean;
    sound: boolean;
    reminders: { staleProject: number; approvalPending: number; blockedTask: number };
  };
  ui: {
    theme: string;
    accentColor: string;
    compactMode: boolean;
    defaultView: string;
    cardSize: string;
  };
  advanced: {
    logActions: boolean;
    fileWatchDebounce: number;
    autoSaveInterval: number;
    maxRecentProjects: number;
    backupEnabled: boolean;
  };
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Get theme from global store
  const { theme, setTheme } = useAppStore();

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/data/config.json');
      if (response.ok) {
        const fileConfig = await response.json();

        // Merge with localStorage overrides (for browser mode persistence)
        const savedOverrides = localStorage.getItem('taskboard-config-overrides');
        if (savedOverrides) {
          const overrides = JSON.parse(savedOverrides);
          // Deep merge overrides into file config
          const merged = deepMerge(fileConfig, overrides) as unknown as Config;
          setConfig(merged);
        } else {
          setConfig(fileConfig as Config);
        }
      } else {
        // Fallback to default config
        setConfig(getDefaultConfig());
      }
    } catch (e) {
      console.warn('[settings] Failed to load config, using defaults');
      setConfig(getDefaultConfig());
    }
    setLoading(false);
  };

  // Deep merge helper
  const deepMerge = (target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> => {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(
          (target[key] as Record<string, unknown>) || {},
          source[key] as Record<string, unknown>
        );
      } else {
        result[key] = source[key];
      }
    }
    return result;
  };

  const getDefaultConfig = (): Config => ({
    version: '1.0.0',
    user: {
      name: '',
      email: '',
      timezone: 'UTC',
      preferences: {
        theme: 'dark',
        language: 'TypeScript',
        defaultFramework: 'Next.js',
        defaultStyling: 'Tailwind',
        defaultStateManagement: 'Zustand',
      },
    },
    paths: {
      projects: '~/Documents/Projects',
      dataFolder: '~/.taskboard',
      screenshotsFolder: 'assets',
    },
    workflow: {
      phases: [],
      priorities: [],
      complexities: [],
    },
    documents: {
      categories: [],
      approvalMandatory: { beforeEngineering: [], beforeBuild: [], beforeLaunch: [] },
    },
    agents: { enabled: true, templates: {} },
    integrations: {
      groq: { enabled: false, apiKey: '', model: 'whisper-large-v3-turbo' },
      github: { enabled: false, username: null },
      jira: { enabled: false, url: null, email: null, apiToken: null, defaultProject: null },
    },
    notifications: {
      enabled: true,
      desktop: true,
      sound: false,
      reminders: { staleProject: 7, approvalPending: 1, blockedTask: 1 },
    },
    ui: {
      theme: 'dark',
      accentColor: '#6366f1',
      compactMode: false,
      defaultView: 'projects',
      cardSize: 'medium',
    },
    advanced: {
      logActions: true,
      fileWatchDebounce: 500,
      autoSaveInterval: 30000,
      maxRecentProjects: 10,
      backupEnabled: true,
    },
  });

  const updateConfig = <K extends keyof Config>(section: K, updates: Partial<Config[K]>) => {
    if (!config) return;
    const currentSection = config[section];
    if (typeof currentSection === 'object' && currentSection !== null) {
      setConfig({
        ...config,
        [section]: { ...currentSection, ...updates },
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);

    // Save to localStorage for browser mode persistence
    // This stores user changes that override the base config.json
    if (config) {
      localStorage.setItem('taskboard-config-overrides', JSON.stringify(config));
      console.log('[settings] Config saved to localStorage:', config);
    }

    await new Promise((r) => setTimeout(r, 300));
    setSaving(false);
    onClose();
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <UserIcon />,
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: <PlugIcon />,
    },
    {
      id: 'workflow',
      label: 'Workflow',
      icon: <FlowIcon />,
    },
    {
      id: 'agents',
      label: 'Agents',
      icon: <BotIcon />,
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: <PaletteIcon />,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <BellIcon />,
    },
    {
      id: 'advanced',
      label: 'Advanced',
      icon: <CogIcon />,
    },
    {
      id: 'shortcuts',
      label: 'Shortcuts',
      icon: <KeyboardIcon />,
    },
  ];

  const shortcuts = [
    { action: 'Open Quick Launch', keys: 'Ctrl+K' },
    { action: 'Projects View', keys: 'Ctrl 1' },
    { action: 'Docs View', keys: 'Ctrl 2' },
    { action: 'Inbox View', keys: 'Ctrl 3' },
    { action: 'Help View', keys: 'Ctrl 4' },
    { action: 'Close Modal', keys: 'Esc' },
    { action: 'Save Document', keys: 'Ctrl+S' },
  ];

  const accentColors = [
    { id: '#6366f1', label: 'Indigo' },
    { id: '#8b5cf6', label: 'Purple' },
    { id: '#ec4899', label: 'Pink' },
    { id: '#ef4444', label: 'Red' },
    { id: '#f97316', label: 'Orange' },
    { id: '#22c55e', label: 'Green' },
    { id: '#14b8a6', label: 'Teal' },
    { id: '#3b82f6', label: 'Blue' },
  ];

  if (loading || !config) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative bg-zinc-900 rounded-2xl p-8">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl mx-4 bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-zinc-600 to-zinc-700 rounded-lg flex items-center justify-center">
              <CogIcon />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">Settings</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="flex min-h-[500px] max-h-[70vh]">
          {/* Sidebar */}
          <div className="w-44 border-r border-zinc-800 p-3 overflow-y-auto">
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
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <SectionHeader title="User Profile" description="Your personal information" />
                <div className="space-y-4">
                  <InputField
                    label="Name"
                    value={config.user.name}
                    onChange={(v) => updateConfig('user', { name: v })}
                    placeholder="Your Name"
                  />
                  <InputField
                    label="Email"
                    type="email"
                    value={config.user.email}
                    onChange={(v) => updateConfig('user', { email: v })}
                    placeholder="you@example.com"
                  />
                  <InputField
                    label="Timezone"
                    value={config.user.timezone}
                    onChange={(v) => updateConfig('user', { timezone: v })}
                    placeholder="UTC"
                  />
                </div>

                <SectionHeader title="Paths" description="Where your data is stored" />
                <div className="space-y-4">
                  <InputField
                    label="Projects Folder"
                    value={config.paths.projects}
                    onChange={(v) => updateConfig('paths', { projects: v })}
                    placeholder="~/Documents/Projects"
                  />
                  <InputField
                    label="Data Folder"
                    value={config.paths.dataFolder}
                    onChange={(v) => updateConfig('paths', { dataFolder: v })}
                    placeholder="~/.taskboard"
                  />
                  <InputField
                    label="Screenshots Folder"
                    value={config.paths.screenshotsFolder}
                    onChange={(v) => updateConfig('paths', { screenshotsFolder: v })}
                    placeholder="assets"
                  />
                </div>
              </div>
            )}

            {/* Integrations */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                {/* Groq */}
                <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                        <span className="text-orange-400 text-lg">G</span>
                      </div>
                      <div>
                        <div className="font-medium text-zinc-200">Groq</div>
                        <div className="text-xs text-zinc-500">Voice transcription (Whisper)</div>
                      </div>
                    </div>
                    <Toggle
                      enabled={config.integrations.groq.enabled}
                      onChange={(v) => updateConfig('integrations', { groq: { ...config.integrations.groq, enabled: v } })}
                    />
                  </div>
                  {config.integrations.groq.enabled && (
                    <div className="space-y-3 pt-3 border-t border-zinc-700">
                      <div className="relative">
                        <InputField
                          label="API Key"
                          type={showApiKey ? 'text' : 'password'}
                          value={config.integrations.groq.apiKey}
                          onChange={(v) => updateConfig('integrations', { groq: { ...config.integrations.groq, apiKey: v } })}
                          placeholder="gsk_..."
                        />
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-8 text-zinc-500 hover:text-zinc-300"
                        >
                          {showApiKey ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                      <SelectField
                        label="Model"
                        value={config.integrations.groq.model}
                        onChange={(v) => updateConfig('integrations', { groq: { ...config.integrations.groq, model: v } })}
                        options={[
                          { value: 'whisper-large-v3-turbo', label: 'Whisper Large v3 Turbo (Fast)' },
                          { value: 'whisper-large-v3', label: 'Whisper Large v3 (Accurate)' },
                        ]}
                      />
                      <a
                        href="https://console.groq.com/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                      >
                        Get API key from Groq Console <ExternalLinkIcon />
                      </a>
                    </div>
                  )}
                </div>

                {/* GitHub */}
                <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                        <GithubIcon />
                      </div>
                      <div>
                        <div className="font-medium text-zinc-200">GitHub</div>
                        <div className="text-xs text-zinc-500">Repository integration</div>
                      </div>
                    </div>
                    <Toggle
                      enabled={config.integrations.github.enabled}
                      onChange={(v) => updateConfig('integrations', { github: { ...config.integrations.github, enabled: v } })}
                    />
                  </div>
                  {config.integrations.github.enabled && (
                    <div className="pt-3 border-t border-zinc-700">
                      <InputField
                        label="Username"
                        value={config.integrations.github.username || ''}
                        onChange={(v) => updateConfig('integrations', { github: { ...config.integrations.github, username: v } })}
                        placeholder="your-username"
                      />
                    </div>
                  )}
                </div>

                {/* Jira */}
                <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <span className="text-blue-400 text-lg font-bold">J</span>
                      </div>
                      <div>
                        <div className="font-medium text-zinc-200">Jira</div>
                        <div className="text-xs text-zinc-500">Issue tracking sync</div>
                      </div>
                    </div>
                    <Toggle
                      enabled={config.integrations.jira.enabled}
                      onChange={(v) => updateConfig('integrations', { jira: { ...config.integrations.jira, enabled: v } })}
                    />
                  </div>
                  {config.integrations.jira.enabled && (
                    <div className="space-y-3 pt-3 border-t border-zinc-700">
                      <InputField
                        label="Jira URL"
                        value={config.integrations.jira.url || ''}
                        onChange={(v) => updateConfig('integrations', { jira: { ...config.integrations.jira, url: v } })}
                        placeholder="https://your-org.atlassian.net"
                      />
                      <InputField
                        label="Email"
                        value={config.integrations.jira.email || ''}
                        onChange={(v) => updateConfig('integrations', { jira: { ...config.integrations.jira, email: v } })}
                        placeholder="you@example.com"
                      />
                      <InputField
                        label="API Token"
                        type="password"
                        value={config.integrations.jira.apiToken || ''}
                        onChange={(v) => updateConfig('integrations', { jira: { ...config.integrations.jira, apiToken: v } })}
                        placeholder="Your API token"
                      />
                      <InputField
                        label="Default Project"
                        value={config.integrations.jira.defaultProject || ''}
                        onChange={(v) => updateConfig('integrations', { jira: { ...config.integrations.jira, defaultProject: v } })}
                        placeholder="PROJ"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Workflow */}
            {activeTab === 'workflow' && (
              <div className="space-y-6">
                {/* Phases - Simple List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <SectionHeader title="Phases" description="Project lifecycle stages" />
                    <button
                      onClick={() => {
                        const newPhase = {
                          id: `phase-${Date.now()}`,
                          name: 'New Phase',
                          color: '#6b7280',
                          stages: ['stage-1'],
                        };
                        updateConfig('workflow', {
                          phases: [...config.workflow.phases, newPhase],
                        });
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      + Add Phase
                    </button>
                  </div>
                  <div className="space-y-2">
                    {config.workflow.phases.map((phase, phaseIndex) => (
                      <div key={phase.id} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        {/* Phase row */}
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="color"
                            value={phase.color}
                            onChange={(e) => {
                              const newPhases = [...config.workflow.phases];
                              newPhases[phaseIndex] = { ...phase, color: e.target.value };
                              updateConfig('workflow', { phases: newPhases });
                            }}
                            className="w-6 h-6 rounded cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={phase.name}
                            onChange={(e) => {
                              const newPhases = [...config.workflow.phases];
                              newPhases[phaseIndex] = { ...phase, name: e.target.value };
                              updateConfig('workflow', { phases: newPhases });
                            }}
                            className="flex-1 px-2 py-1 bg-transparent border-b border-transparent hover:border-zinc-600 focus:border-blue-500 text-sm text-zinc-200 focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              if (config.workflow.phases.length > 1) {
                                const newPhases = config.workflow.phases.filter((_, i) => i !== phaseIndex);
                                updateConfig('workflow', { phases: newPhases });
                              }
                            }}
                            className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                        {/* Stages as tags */}
                        <div className="flex flex-wrap gap-1 pl-8">
                          {phase.stages.map((stage, stageIndex) => (
                            <span
                              key={stageIndex}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded"
                              style={{ backgroundColor: `${phase.color}20`, color: phase.color }}
                            >
                              <input
                                type="text"
                                value={stage}
                                onChange={(e) => {
                                  const newPhases = [...config.workflow.phases];
                                  const newStages = [...phase.stages];
                                  newStages[stageIndex] = e.target.value;
                                  newPhases[phaseIndex] = { ...phase, stages: newStages };
                                  updateConfig('workflow', { phases: newPhases });
                                }}
                                className="w-20 bg-transparent focus:outline-none text-xs"
                              />
                              <button
                                onClick={() => {
                                  if (phase.stages.length > 1) {
                                    const newPhases = [...config.workflow.phases];
                                    const newStages = phase.stages.filter((_, i) => i !== stageIndex);
                                    newPhases[phaseIndex] = { ...phase, stages: newStages };
                                    updateConfig('workflow', { phases: newPhases });
                                  }
                                }}
                                className="hover:text-red-400"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <button
                            onClick={() => {
                              const newPhases = [...config.workflow.phases];
                              newPhases[phaseIndex] = { ...phase, stages: [...phase.stages, 'new'] };
                              updateConfig('workflow', { phases: newPhases });
                            }}
                            className="px-2 py-0.5 text-xs text-zinc-500 hover:text-zinc-300"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priorities Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <SectionHeader title="Priorities" description="Task priority levels" />
                    <button
                      onClick={() => {
                        const newPriority = {
                          id: `P${config.workflow.priorities.length}`,
                          name: 'New Priority',
                          color: '#6b7280',
                        };
                        updateConfig('workflow', {
                          priorities: [...config.workflow.priorities, newPriority],
                        });
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs rounded transition-colors"
                    >
                      <PlusIcon /> Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {config.workflow.priorities.map((priority, index) => (
                      <div key={priority.id} className="flex items-center gap-3 p-2 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <input
                          type="color"
                          value={priority.color}
                          onChange={(e) => {
                            const newPriorities = [...config.workflow.priorities];
                            newPriorities[index] = { ...priority, color: e.target.value };
                            updateConfig('workflow', { priorities: newPriorities });
                          }}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <input
                          type="text"
                          value={priority.id}
                          onChange={(e) => {
                            const newPriorities = [...config.workflow.priorities];
                            newPriorities[index] = { ...priority, id: e.target.value };
                            updateConfig('workflow', { priorities: newPriorities });
                          }}
                          className="w-16 px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="ID"
                        />
                        <input
                          type="text"
                          value={priority.name}
                          onChange={(e) => {
                            const newPriorities = [...config.workflow.priorities];
                            newPriorities[index] = { ...priority, name: e.target.value };
                            updateConfig('workflow', { priorities: newPriorities });
                          }}
                          className="flex-1 px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Name"
                        />
                        <button
                          onClick={() => {
                            const newPriorities = config.workflow.priorities.filter((_, i) => i !== index);
                            updateConfig('workflow', { priorities: newPriorities });
                          }}
                          className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Complexity Levels Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <SectionHeader title="Complexity Levels" description="Effort estimates for tasks" />
                    <button
                      onClick={() => {
                        const newComplexity = {
                          id: 'NEW',
                          name: 'New Size',
                          hours: '?h',
                        };
                        updateConfig('workflow', {
                          complexities: [...config.workflow.complexities, newComplexity],
                        });
                      }}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs rounded transition-colors"
                    >
                      <PlusIcon /> Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {config.workflow.complexities.map((complexity, index) => (
                      <div key={complexity.id} className="flex items-center gap-3 p-2 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <input
                          type="text"
                          value={complexity.id}
                          onChange={(e) => {
                            const newComplexities = [...config.workflow.complexities];
                            newComplexities[index] = { ...complexity, id: e.target.value };
                            updateConfig('workflow', { complexities: newComplexities });
                          }}
                          className="w-16 px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-sm text-zinc-200 font-bold text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="ID"
                        />
                        <input
                          type="text"
                          value={complexity.name}
                          onChange={(e) => {
                            const newComplexities = [...config.workflow.complexities];
                            newComplexities[index] = { ...complexity, name: e.target.value };
                            updateConfig('workflow', { complexities: newComplexities });
                          }}
                          className="flex-1 px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Name"
                        />
                        <input
                          type="text"
                          value={complexity.hours}
                          onChange={(e) => {
                            const newComplexities = [...config.workflow.complexities];
                            newComplexities[index] = { ...complexity, hours: e.target.value };
                            updateConfig('workflow', { complexities: newComplexities });
                          }}
                          className="w-24 px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-sm text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Hours"
                        />
                        <button
                          onClick={() => {
                            const newComplexities = config.workflow.complexities.filter((_, i) => i !== index);
                            updateConfig('workflow', { complexities: newComplexities });
                          }}
                          className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Agents */}
            {activeTab === 'agents' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <SectionHeader title="AI Agents" description="Prompt templates for automation" />
                  <Toggle
                    enabled={config.agents.enabled}
                    onChange={(v) => updateConfig('agents', { enabled: v })}
                  />
                </div>

                {config.agents.enabled && (
                  <div className="space-y-2">
                    {Object.entries(config.agents.templates).map(([name, path]) => (
                      <div key={name} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                            <BotIcon className="w-4 h-4 text-purple-400" />
                          </div>
                          <div>
                            <div className="font-medium text-zinc-200 capitalize">{name}</div>
                            <div className="text-xs text-zinc-500 font-mono">{path}</div>
                          </div>
                        </div>
                        <a
                          href={`vscode://file/${path}`}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Open
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                  <p className="text-sm text-zinc-400">
                    Agents are Markdown templates that guide AI assistants for specific tasks like
                    design, architecture, development, QA, and documentation.
                  </p>
                </div>
              </div>
            )}

            {/* Appearance */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <SectionHeader title="Theme" description="Choose your preferred appearance" />
                <div className="flex gap-2">
                  <button
                    onClick={() => setTheme('dark')}
                    className={clsx(
                      'px-4 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center gap-2',
                      theme === 'dark'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                    )}
                  >
                    <MoonIcon />
                    Dark
                  </button>
                  <button
                    onClick={() => setTheme('light')}
                    className={clsx(
                      'px-4 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center gap-2',
                      theme === 'light'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                    )}
                  >
                    <SunIcon />
                    Light
                  </button>
                </div>

                <SectionHeader title="Accent Color" description="Primary UI color" />
                <div className="flex gap-2">
                  {accentColors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => updateConfig('ui', { accentColor: color.id })}
                      className={clsx(
                        'w-8 h-8 rounded-full transition-transform',
                        config.ui.accentColor === color.id && 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110'
                      )}
                      style={{ backgroundColor: color.id }}
                      title={color.label}
                    />
                  ))}
                </div>

                <SectionHeader title="Layout" description="UI preferences" />
                <div className="space-y-4">
                  <ToggleRow
                    label="Compact Mode"
                    description="Reduce padding and spacing"
                    enabled={config.ui.compactMode}
                    onChange={(v) => updateConfig('ui', { compactMode: v })}
                  />
                  <SelectField
                    label="Default View"
                    value={config.ui.defaultView}
                    onChange={(v) => updateConfig('ui', { defaultView: v })}
                    options={[
                      { value: 'projects', label: 'Projects' },
                      { value: 'docs', label: 'Documents' },
                      { value: 'inbox', label: 'Inbox' },
                    ]}
                  />
                  <SelectField
                    label="Card Size"
                    value={config.ui.cardSize}
                    onChange={(v) => updateConfig('ui', { cardSize: v })}
                    options={[
                      { value: 'small', label: 'Small' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'large', label: 'Large' },
                    ]}
                  />
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <SectionHeader title="Notifications" description="How you get alerted" />
                <div className="space-y-4">
                  <ToggleRow
                    label="Enable Notifications"
                    description="Get notified about task updates"
                    enabled={config.notifications.enabled}
                    onChange={(v) => updateConfig('notifications', { enabled: v })}
                  />
                  <ToggleRow
                    label="Desktop Notifications"
                    description="Show system notifications"
                    enabled={config.notifications.desktop}
                    onChange={(v) => updateConfig('notifications', { desktop: v })}
                  />
                  <ToggleRow
                    label="Sound Effects"
                    description="Play sounds on actions"
                    enabled={config.notifications.sound}
                    onChange={(v) => updateConfig('notifications', { sound: v })}
                  />
                </div>

                {/* Test Notification */}
                <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-zinc-200">Test Notifications</div>
                      <div className="text-xs text-zinc-500">Send a test notification to verify it's working</div>
                    </div>
                    <button
                      onClick={() => {
                        // Request permission if needed
                        if ('Notification' in window && Notification.permission === 'default') {
                          Notification.requestPermission();
                        }
                        // Show test notification
                        if ('Notification' in window && Notification.permission === 'granted') {
                          new Notification('🔔 Test Notification', {
                            body: 'Notifications are working! You will see alerts here.',
                            icon: '/icon.png',
                          });
                        } else {
                          alert('Please enable browser notifications to receive alerts.');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Send Test
                    </button>
                  </div>
                </div>

                <SectionHeader title="Reminders" description="Days before reminder" />
                <div className="space-y-4">
                  <InputField
                    label="Stale Project Warning"
                    type="number"
                    value={String(config.notifications.reminders.staleProject)}
                    onChange={(v) => updateConfig('notifications', { reminders: { ...config.notifications.reminders, staleProject: Number(v) } })}
                    placeholder="7"
                  />
                  <InputField
                    label="Approval Pending"
                    type="number"
                    value={String(config.notifications.reminders.approvalPending)}
                    onChange={(v) => updateConfig('notifications', { reminders: { ...config.notifications.reminders, approvalPending: Number(v) } })}
                    placeholder="1"
                  />
                  <InputField
                    label="Blocked Task"
                    type="number"
                    value={String(config.notifications.reminders.blockedTask)}
                    onChange={(v) => updateConfig('notifications', { reminders: { ...config.notifications.reminders, blockedTask: Number(v) } })}
                    placeholder="1"
                  />
                </div>

                {/* Notification Triggers */}
                <SectionHeader title="When You'll Get Notified" description="Automatic notification triggers" />
                <div className="space-y-2">
                  {[
                    { icon: '✅', label: 'Task completed', desc: 'When a task is marked as done' },
                    { icon: '🔄', label: 'Stage change', desc: 'When a project moves to a new stage' },
                    { icon: '🎤', label: 'Voice note added', desc: 'After voice transcript is saved' },
                    { icon: '⏰', label: 'Stale project', desc: 'Projects not updated for X days' },
                    { icon: '📋', label: 'Approval pending', desc: 'Documents awaiting review' },
                    { icon: '🚫', label: 'Blocked task', desc: 'Tasks marked as blocked' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg">
                      <span className="text-lg">{item.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm text-zinc-200">{item.label}</div>
                        <div className="text-xs text-zinc-500">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Advanced */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <SectionHeader title="Advanced Settings" description="For power users" />
                <div className="space-y-4">
                  <ToggleRow
                    label="Log Actions"
                    description="Enable debug logging"
                    enabled={config.advanced.logActions}
                    onChange={(v) => updateConfig('advanced', { logActions: v })}
                  />
                  <ToggleRow
                    label="Automatic Backups"
                    description="Back up data daily"
                    enabled={config.advanced.backupEnabled}
                    onChange={(v) => updateConfig('advanced', { backupEnabled: v })}
                  />
                  <InputField
                    label="File Watch Debounce (ms)"
                    type="number"
                    value={String(config.advanced.fileWatchDebounce)}
                    onChange={(v) => updateConfig('advanced', { fileWatchDebounce: Number(v) })}
                    placeholder="500"
                  />
                  <InputField
                    label="Auto-save Interval (ms)"
                    type="number"
                    value={String(config.advanced.autoSaveInterval)}
                    onChange={(v) => updateConfig('advanced', { autoSaveInterval: Number(v) })}
                    placeholder="30000"
                  />
                  <InputField
                    label="Max Recent Projects"
                    type="number"
                    value={String(config.advanced.maxRecentProjects)}
                    onChange={(v) => updateConfig('advanced', { maxRecentProjects: Number(v) })}
                    placeholder="10"
                  />
                </div>
              </div>
            )}

            {/* Shortcuts */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-4">
                <SectionHeader title="Keyboard Shortcuts" description="Quick access keys" />
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
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <p className="text-xs text-zinc-500">{description}</p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-zinc-600"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={clsx(
        'w-10 h-6 rounded-full transition-colors relative',
        enabled ? 'bg-blue-600' : 'bg-zinc-700'
      )}
    >
      <div
        className={clsx(
          'w-4 h-4 bg-white rounded-full absolute top-1 transition-transform',
          enabled ? 'translate-x-5' : 'translate-x-1'
        )}
      />
    </button>
  );
}

function ToggleRow({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-zinc-300">{label}</div>
        <div className="text-xs text-zinc-500">{description}</div>
      </div>
      <Toggle enabled={enabled} onChange={onChange} />
    </div>
  );
}

// Icons
function PlusIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function PlugIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function FlowIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

function BotIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function CogIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function KeyboardIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}


function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg className="w-5 h-5 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  );
}



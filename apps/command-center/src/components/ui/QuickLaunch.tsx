import { useState, useEffect, useRef, useMemo } from 'react';
import { useAppStore } from '@/store';
import clsx from 'clsx';

interface Command {
  id: string;
  label: string;
  icon: string;
  description: string;
  category: 'command' | 'project' | 'task';
  action: () => void;
}

export function QuickLaunch() {
  const {
    closeQuickLaunch,
    projects,
    tasks,
    setActiveTab,
    setSelectedProjectId,
    openNewProjectModal,
    openSettings,
    openVoiceCapture,
  } = useAppStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Build commands list
  const commands: Command[] = useMemo(() => {
    const baseCommands: Command[] = [
      {
        id: 'newproject',
        label: 'New Project',
        icon: '➕',
        description: 'Create a new project',
        category: 'command',
        action: () => {
          openNewProjectModal();
        },
      },
      {
        id: 'pipeline',
        label: 'Pipeline',
        icon: '📊',
        description: 'Open pipeline kanban view',
        category: 'command',
        action: () => {
          setSelectedProjectId(null);
          setActiveTab('pipeline');
        },
      },
      {
        id: 'docs',
        label: 'Documents',
        icon: '📄',
        description: 'Browse project documentation',
        category: 'command',
        action: () => setActiveTab('docs'),
      },
      {
        id: 'inbox',
        label: 'Inbox',
        icon: '📥',
        description: 'Quick capture notes & ideas',
        category: 'command',
        action: () => setActiveTab('inbox'),
      },
      {
        id: 'voice',
        label: 'Voice Capture',
        icon: '🎤',
        description: 'Record voice instruction',
        category: 'command',
        action: () => openVoiceCapture(),
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: '⚙️',
        description: 'Configure preferences',
        category: 'command',
        action: () => openSettings(),
      },
    ];

    // Add projects - clicking navigates to project detail
    const projectCommands: Command[] = projects.map((p) => ({
      id: `project-${p.id}`,
      label: p.name,
      icon: p.currentPhase === 'launch' ? '🚀' : p.currentPhase === 'build' ? '🔧' : '📋',
      description: `${p.currentPhase} phase • ${p.progress}%`,
      category: 'project',
      action: () => {
        setSelectedProjectId(p.id);
        setActiveTab('pipeline');
      },
    }));

    // Add P0/P1 tasks - clicking shows task in project
    const taskCommands: Command[] = tasks
      .filter((t) => (t.priority === 'P0' || t.priority === 'P1') && t.status !== 'completed')
      .slice(0, 5)
      .map((t) => {
        const project = projects.find((p) => p.id === t.projectId);
        return {
          id: `task-${t.id}`,
          label: t.title,
          icon: t.priority === 'P0' ? '🔴' : '🟠',
          description: `${project?.name || t.projectId} • ${t.status}`,
          category: 'task',
          action: () => {
            setSelectedProjectId(t.projectId);
            setActiveTab('pipeline');
          },
        };
      });

    return [...baseCommands, ...projectCommands, ...taskCommands];
  }, [projects, tasks, setActiveTab, setSelectedProjectId, openNewProjectModal]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lower) ||
        cmd.description.toLowerCase().includes(lower)
    );
  }, [query, commands]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {
      command: [],
      project: [],
      task: [],
    };
    filteredCommands.forEach((cmd) => {
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          closeQuickLaunch();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, closeQuickLaunch]);

  let currentIndex = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 quick-launch-overlay"
        onClick={closeQuickLaunch}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl mx-4 bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl overflow-hidden animate-slide-in">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <span className="text-zinc-500 text-lg">⌘</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 outline-none text-sm"
          />
          <kbd className="px-2 py-1 text-xs text-zinc-500 bg-zinc-800 rounded border border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {/* Commands */}
          {groupedCommands.command.length > 0 && (
            <div className="mb-2">
              <div className="px-4 py-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Commands
              </div>
              {groupedCommands.command.map((cmd) => {
                currentIndex++;
                const idx = currentIndex;
                return (
                  <CommandItem
                    key={cmd.id}
                    command={cmd}
                    isSelected={idx === selectedIndex}
                    onClick={() => {
                      cmd.action();
                      closeQuickLaunch();
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Projects */}
          {groupedCommands.project.length > 0 && (
            <div className="mb-2">
              <div className="px-4 py-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Projects
              </div>
              {groupedCommands.project.map((cmd) => {
                currentIndex++;
                const idx = currentIndex;
                return (
                  <CommandItem
                    key={cmd.id}
                    command={cmd}
                    isSelected={idx === selectedIndex}
                    onClick={() => {
                      cmd.action();
                      closeQuickLaunch();
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Tasks */}
          {groupedCommands.task.length > 0 && (
            <div className="mb-2">
              <div className="px-4 py-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Tasks (P0/P1)
              </div>
              {groupedCommands.task.map((cmd) => {
                currentIndex++;
                const idx = currentIndex;
                return (
                  <CommandItem
                    key={cmd.id}
                    command={cmd}
                    isSelected={idx === selectedIndex}
                    onClick={() => {
                      cmd.action();
                      closeQuickLaunch();
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {filteredCommands.length === 0 && (
            <div className="px-4 py-8 text-center text-zinc-500 text-sm">
              No commands found for "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 bg-zinc-800/50 border-t border-zinc-800 text-xs text-zinc-500">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
}

function CommandItem({
  command,
  isSelected,
  onClick,
}: {
  command: Command;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
        isSelected
          ? 'bg-blue-500/10 text-blue-400'
          : 'text-zinc-300 hover:bg-zinc-800'
      )}
    >
      <span className="text-lg">{command.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{command.label}</div>
        <div className="text-xs text-zinc-500 truncate">{command.description}</div>
      </div>
    </button>
  );
}

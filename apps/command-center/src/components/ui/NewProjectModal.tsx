import { useState } from 'react';
import { useAppStore, Project, Priority } from '@/store';
import clsx from 'clsx';

export function NewProjectModal() {
  const { closeNewProjectModal, projects, setProjects } = useAppStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('P1');
  const [complexity, setComplexity] = useState<'E' | 'F'>('F');
  const [repoPath, setRepoPath] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProject: Project = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name: name.trim(),
      description: description.trim() || 'New project',
      repoPath: repoPath.trim() || `~/Projects/${name.toLowerCase().replace(/\s+/g, '-')}`,
      githubUrl: null,
      stage: 'conception',
      stageStatus: 'not-started',
      currentPhase: 'design',
      priority,
      complexity,
      progress: 0,
      targetDate: null,
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      completedAt: null,
      tags: [],
      techStack: [],
      links: {
        github: null,
        docs: null,
        live: null,
      },
      metrics: {
        totalTasks: 0,
        completedTasks: 0,
        blockedTasks: 0,
      },
    };

    setProjects([...projects, newProject]);
    closeNewProjectModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeNewProjectModal}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">➕</span>
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">New Project</h2>
          </div>
          <button
            onClick={closeNewProjectModal}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Project"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this project do?"
              rows={2}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Repo Path */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Repository Path
            </label>
            <input
              type="text"
              value={repoPath}
              onChange={(e) => setRepoPath(e.target.value)}
              placeholder="~/Projects/my-project"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
          </div>

          {/* Priority & Complexity */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Priority
              </label>
              <div className="flex gap-2">
                {(['P0', 'P1', 'P2', 'P3'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={clsx(
                      'flex-1 py-2 rounded-lg text-xs font-semibold transition-colors border',
                      priority === p
                        ? p === 'P0'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : p === 'P1'
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                          : p === 'P2'
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-600'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Complexity */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Complexity
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'E', label: 'Easy' },
                  { value: 'F', label: 'Full' },
                ].map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setComplexity(c.value as 'E' | 'F')}
                    className={clsx(
                      'flex-1 py-2 rounded-lg text-xs font-semibold transition-colors border',
                      complexity === c.value
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-600'
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={closeNewProjectModal}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

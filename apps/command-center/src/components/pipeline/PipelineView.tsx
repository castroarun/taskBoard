import { useState } from 'react';
import { useAppStore, Project } from '@/store';
import { ProjectDetailView } from './ProjectDetailView';
import { BottomPanel } from './BottomPanel';
import clsx from 'clsx';

// Chevron icons for collapsible sections
const ChevronDown = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);
const ChevronRight = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// Define the 5 main phases with their stages
const PHASES = [
  { id: 'design', label: 'Design', color: 'pink', stages: ['conception', 'discovery', 'requirements'] },
  { id: 'engineering', label: 'Engineering', color: 'sky', stages: ['architecture', 'qa-planning', 'review'] },
  { id: 'build', label: 'Build', color: 'yellow', stages: ['development', 'testing', 'staging'] },
  { id: 'launch', label: 'Launch', color: 'green', stages: ['ship', 'announce', 'walkthrough'] },
  { id: 'closure', label: 'Closure', color: 'teal', stages: ['documentation', 'portfolio', 'retrospective'] },
];

// Phase colors - aligned with PhaseColumn colorClasses
const phaseColors = {
  pink: { dot: 'bg-pink-400', text: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
  sky: { dot: 'bg-sky-400', text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  yellow: { dot: 'bg-yellow-400', text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  green: { dot: 'bg-green-400', text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  teal: { dot: 'bg-teal-300', text: 'text-teal-300', bg: 'bg-teal-500/10', border: 'border-teal-500/30' },
};

export function PipelineView() {
  const { projects, selectedProjectId, setSelectedProjectId } = useAppStore();
  const [activePhase, setActivePhase] = useState<string | null>(null); // null = show all
  const [isPhaseBoardOpen, setIsPhaseBoardOpen] = useState(true);

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId) || null
    : null;

  // Group projects by their current phase
  const projectsByPhase = PHASES.reduce((acc, phase) => {
    acc[phase.id] = projects.filter((p) => p.currentPhase === phase.id);
    return acc;
  }, {} as Record<string, Project[]>);

  // Total count for "All" tab
  const totalProjects = projects.length;

  if (selectedProject) {
    return (
      <ProjectDetailView
        project={selectedProject}
        onBack={() => setSelectedProjectId(null)}
      />
    );
  }

  // Get projects to display based on active filter
  const displayedPhases = activePhase
    ? PHASES.filter(p => p.id === activePhase)
    : PHASES;

  // Calculate total width of kanban board: 5 columns × 288px + 4 gaps × 12px = 1488px
  const boardWidth = 'max-w-[1488px]';

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col w-full">
      {/* Compact Header with Phase Tabs - entire bar is clickable except tabs */}
      <div
        className="flex-shrink-0 border-b border-zinc-800 bg-zinc-900/50 cursor-pointer hover:bg-zinc-800/30 transition-colors"
        onClick={() => setIsPhaseBoardOpen(!isPhaseBoardOpen)}
      >
        <div className={clsx('h-14 flex items-center justify-between mx-auto px-4', boardWidth)}>
          {/* Left - Title */}
          <div className="flex-shrink-0">
            <h1 className="text-base font-medium text-zinc-100">Project Board</h1>
            <p className="text-[11px] text-zinc-500">{totalProjects} projects across 5 phases</p>
          </div>

          {/* Center - Phase Tabs (stop propagation so clicks don't collapse) */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {/* All tab */}
            <button
              onClick={() => setActivePhase(null)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                activePhase === null
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              )}
            >
              All
              <span className="ml-1.5 text-zinc-500">{totalProjects}</span>
            </button>

            {/* Phase tabs */}
            {PHASES.map((phase) => {
              const count = projectsByPhase[phase.id]?.length || 0;
              const isActive = activePhase === phase.id;
              const colors = phaseColors[phase.color as keyof typeof phaseColors];
              return (
                <button
                  key={phase.id}
                  onClick={() => setActivePhase(isActive ? null : phase.id)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                    isActive ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
                  )}
                >
                  <div className={clsx('w-2 h-2 rounded-full', colors.dot)} />
                  <span className={colors.text}>{phase.label}</span>
                  <span className="text-zinc-500">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Right - Collapse toggle icon */}
          <div className="flex-shrink-0 w-32 flex justify-end">
            <div className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors">
              {isPhaseBoardOpen ? <ChevronDown /> : <ChevronRight />}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-auto p-4">
        <div className={clsx('mx-auto', boardWidth)}>
          {/* Collapsible Phase Board */}
          {isPhaseBoardOpen && (
            <>
              {activePhase ? (
                // Single phase view - larger cards in grid
                <SinglePhaseView
                  phase={PHASES.find(p => p.id === activePhase)!}
                  projects={projectsByPhase[activePhase] || []}
                  onProjectClick={(project) => setSelectedProjectId(project.id)}
                />
              ) : (
                // All phases - compact kanban columns
                <div className="flex gap-3">
                  {displayedPhases.map((phase) => (
                    <PhaseColumn
                      key={phase.id}
                      phase={phase}
                      projects={projectsByPhase[phase.id] || []}
                      onProjectClick={(project) => setSelectedProjectId(project.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Bottom Panel - Latest Activity + Needs Attention (below phase boards) */}
          <BottomPanel />
        </div>
      </div>
    </div>
  );
}

// Single phase expanded view
function SinglePhaseView({
  phase,
  projects,
  onProjectClick
}: {
  phase: typeof PHASES[0];
  projects: Project[];
  onProjectClick: (project: Project) => void;
}) {
  const colors = phaseColors[phase.color as keyof typeof phaseColors];

  return (
    <div>
      {/* Phase header with stages */}
      <div className="mb-4 flex items-center gap-3">
        <div className={clsx('w-3 h-3 rounded-full', colors.dot)} />
        <h2 className={clsx('text-sm font-medium', colors.text)}>{phase.label}</h2>
        <div className="flex gap-1.5">
          {phase.stages.map((stage) => (
            <span key={stage} className="text-[10px] text-zinc-500 px-2 py-0.5 bg-zinc-800/50 rounded">
              {stage}
            </span>
          ))}
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-zinc-600 text-sm border border-dashed border-zinc-800 rounded-lg">
          No projects in {phase.label} phase
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((project) => (
            <ProjectCardLarge
              key={project.id}
              project={project}
              phaseColor={phase.color}
              onClick={() => onProjectClick(project)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Large project card for single phase view
function ProjectCardLarge({ project, phaseColor, onClick }: { project: Project; phaseColor: string; onClick: () => void }) {
  const colors = phaseColors[phaseColor as keyof typeof phaseColors];
  const health = getProjectHealth(project);
  const projectAge = getProjectAge(project);

  return (
    <div
      onClick={onClick}
      className={clsx(
        'p-4 rounded-lg border cursor-pointer transition-all hover:scale-[1.01]',
        colors.border,
        'bg-zinc-900/50 hover:bg-zinc-800/50'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-zinc-100">{project.name}</h3>
          <div
            className={clsx('w-2 h-2 rounded-full', health.color)}
            title={`${health.label} (${health.days}d since update)`}
          />
        </div>
        <span className={clsx('text-[10px] px-1.5 py-0.5 rounded', colors.bg, colors.text)}>
          {project.stage}
        </span>
      </div>
      <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{project.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500" title={project.completedAt ? 'Total duration' : 'Days since started'}>
            {projectAge}d
          </span>
          <div className="flex gap-1">
            {project.techStack?.slice(0, 2).map((tech) => (
              <span key={tech} className="text-[9px] text-zinc-600 px-1.5 py-0.5 bg-zinc-800 rounded">
                {tech}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={clsx('h-full rounded-full', colors.dot)}
              style={{ width: `${project.progress || 0}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-500">{project.progress || 0}%</span>
        </div>
      </div>
    </div>
  );
}

interface PhaseColumnProps {
  phase: {
    id: string;
    label: string;
    color: string;
    stages: string[];
  };
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

function PhaseColumn({ phase, projects, onProjectClick }: PhaseColumnProps) {
  const colorClasses = {
    pink: {
      border: 'border-pink-500/30',
      bg: 'bg-pink-500/5',
      text: 'text-pink-400',
      badge: 'bg-pink-500/20 text-pink-400',
    },
    sky: {
      border: 'border-sky-500/30',
      bg: 'bg-sky-500/5',
      text: 'text-sky-400',
      badge: 'bg-sky-500/20 text-sky-400',
    },
    yellow: {
      border: 'border-yellow-500/30',
      bg: 'bg-yellow-500/5',
      text: 'text-yellow-400',
      badge: 'bg-yellow-500/20 text-yellow-400',
    },
    green: {
      border: 'border-green-500/30',
      bg: 'bg-green-500/5',
      text: 'text-green-400',
      badge: 'bg-green-500/20 text-green-400',
    },
    teal: {
      border: 'border-teal-500/30',
      bg: 'bg-teal-500/5',
      text: 'text-teal-300',
      badge: 'bg-teal-500/20 text-teal-300',
    },
  };

  const colors = colorClasses[phase.color as keyof typeof colorClasses];

  return (
    <div
      className={clsx(
        'flex-shrink-0 w-72 rounded-xl border',
        colors.border,
        colors.bg
      )}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-zinc-800/50">
        <div className="flex items-center justify-between">
          <h2 className={clsx('text-sm font-semibold', colors.text)}>
            {phase.label}
          </h2>
          <span
            className={clsx(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              colors.badge
            )}
          >
            {projects.length}
          </span>
        </div>
        <div className="flex gap-1 mt-2">
          {phase.stages.map((stage) => (
            <span
              key={stage}
              className="text-[10px] text-zinc-600 px-1.5 py-0.5 bg-zinc-800/50 rounded"
            >
              {stage}
            </span>
          ))}
        </div>
      </div>

      {/* Projects */}
      <div className="p-2 space-y-2 min-h-[300px]">
        {projects.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-zinc-600 text-sm">
            No projects
          </div>
        ) : (
          projects.map((project) => (
            <ProjectCard key={project.id} project={project} phaseColor={phase.color} onClick={() => onProjectClick(project)} />
          ))
        )}
      </div>
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  phaseColor: string;
  onClick: () => void;
}

// Calculate project health based on staleness
function getProjectHealth(project: Project): { color: string; label: string; days: number } {
  const now = new Date();
  const lastUpdated = new Date(project.lastUpdated);
  const daysSinceUpdate = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));

  // Closure phase projects don't need health tracking - show gray (neutral)
  if (project.currentPhase === 'closure') {
    return { color: 'bg-zinc-500', label: project.completedAt ? 'Completed' : 'Closing', days: daysSinceUpdate };
  }

  // Health based on days since last update (for active projects only)
  if (daysSinceUpdate <= 3) {
    return { color: 'bg-green-500', label: 'Active', days: daysSinceUpdate };
  } else if (daysSinceUpdate <= 7) {
    return { color: 'bg-yellow-500', label: 'Needs attention', days: daysSinceUpdate };
  } else if (daysSinceUpdate <= 14) {
    return { color: 'bg-orange-500', label: 'Stale', days: daysSinceUpdate };
  } else {
    return { color: 'bg-red-500', label: 'Critical', days: daysSinceUpdate };
  }
}

// Calculate days since project started
function getProjectAge(project: Project): number {
  const start = project.startedAt ? new Date(project.startedAt) : new Date(project.createdAt);
  const end = project.completedAt ? new Date(project.completedAt) : new Date();
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function ProjectCard({ project, phaseColor, onClick }: ProjectCardProps) {
  const health = getProjectHealth(project);
  const projectAge = getProjectAge(project);

  return (
    <div onClick={onClick} className="project-card bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 cursor-pointer hover:border-zinc-600">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-zinc-100 truncate">
            {project.name}
          </h3>
          <p className="text-xs text-zinc-500 truncate mt-0.5">
            {project.description}
          </p>
        </div>
        <div
          className={clsx('w-2 h-2 rounded-full ml-2 mt-1', health.color)}
          title={`${health.label} (${health.days}d since update)`}
        />
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-zinc-500">{project.stage}</span>
          <span className="text-zinc-400">{project.progress}%</span>
        </div>
        <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={clsx('h-full rounded-full transition-all', {
              'bg-pink-400': phaseColor === 'pink',
              'bg-sky-400': phaseColor === 'sky',
              'bg-yellow-400': phaseColor === 'yellow',
              'bg-green-400': phaseColor === 'green',
              'bg-teal-300': phaseColor === 'teal',
            })}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {project.techStack.slice(0, 2).map((tech) => (
            <span
              key={tech}
              className="text-[10px] px-1.5 py-0.5 bg-zinc-700/50 text-zinc-400 rounded"
            >
              {tech}
            </span>
          ))}
          {project.techStack.length > 2 && (
            <span className="text-[10px] text-zinc-500">
              +{project.techStack.length - 2}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          <span title={project.completedAt ? 'Total duration' : 'Days since started'}>
            {projectAge}d
          </span>
          <span className="text-zinc-600">•</span>
          <span>{project.metrics.completedTasks}/{project.metrics.totalTasks}</span>
        </div>
      </div>
    </div>
  );
}

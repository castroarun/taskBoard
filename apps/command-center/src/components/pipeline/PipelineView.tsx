import { useAppStore, Project } from '@/store';
import { ProjectDetailView } from './ProjectDetailView';
import clsx from 'clsx';

// Define the 5 main phases with their stages
const PHASES = [
  {
    id: 'design',
    label: 'Design',
    color: 'purple',
    stages: ['conception', 'discovery', 'requirements'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.083-2.75m-2.166-2.623L12 9.757l2.906-2.906a2.25 2.25 0 013.182 0l2.063 2.063a2.25 2.25 0 010 3.182l-8.153 8.153a4.5 4.5 0 01-2.892 1.26l-3.1.31.31-3.1a4.5 4.5 0 011.26-2.892l2.057-2.057z" />
      </svg>
    ),
  },
  {
    id: 'engineering',
    label: 'Engineering',
    color: 'blue',
    stages: ['architecture', 'qa-planning', 'review'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.048.58.024 1.194-.14 1.743" />
      </svg>
    ),
  },
  {
    id: 'build',
    label: 'Build',
    color: 'amber',
    stages: ['development', 'testing', 'staging'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
  },
  {
    id: 'launch',
    label: 'Launch',
    color: 'green',
    stages: ['ship', 'announce', 'walkthrough'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
  },
  {
    id: 'closure',
    label: 'Closure',
    color: 'emerald',
    stages: ['documentation', 'portfolio', 'retrospective'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

// Stage summary bar styling
const summaryColors = {
  purple: { border: 'border-purple-500/30', icon: 'bg-purple-500/20 text-purple-400', text: 'text-purple-400' },
  blue: { border: 'border-blue-500/30', icon: 'bg-blue-500/20 text-blue-400', text: 'text-blue-400' },
  amber: { border: 'border-amber-500/30', icon: 'bg-amber-500/20 text-amber-400', text: 'text-amber-400' },
  green: { border: 'border-green-500/30', icon: 'bg-green-500/20 text-green-400', text: 'text-green-400' },
  emerald: { border: 'border-emerald-500/30', icon: 'bg-emerald-500/20 text-emerald-400', text: 'text-emerald-400' },
};

export function PipelineView() {
  const { projects, selectedProjectId, setSelectedProjectId } = useAppStore();

  // Find selected project from store
  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId) || null
    : null;

  // Group projects by their current phase
  const projectsByPhase = PHASES.reduce((acc, phase) => {
    acc[phase.id] = projects.filter((p) => p.currentPhase === phase.id);
    return acc;
  }, {} as Record<string, Project[]>);

  // Show project detail view if a project is selected
  if (selectedProject) {
    return (
      <ProjectDetailView
        project={selectedProject}
        onBack={() => setSelectedProjectId(null)}
      />
    );
  }

  return (
    <div className="p-4">
      {/* Pipeline Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-100">Pipeline</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Track projects through the 15-stage workflow
        </p>
      </div>

      {/* Stage Summary Bar */}
      <div className="flex gap-2 mb-6">
        {PHASES.map((phase) => {
          const count = projectsByPhase[phase.id]?.length || 0;
          const colors = summaryColors[phase.color as keyof typeof summaryColors];
          return (
            <div
              key={phase.id}
              className={clsx(
                'flex-1 flex items-center gap-2 rounded-lg border px-3 py-2 transition-all hover:scale-[1.01] cursor-pointer',
                colors.border,
                'bg-zinc-900/50'
              )}
            >
              <div className={clsx('w-7 h-7 rounded flex items-center justify-center', colors.icon)}>
                {phase.icon}
              </div>
              <span className={clsx('text-xs font-medium', colors.text)}>
                {phase.label}
              </span>
              <span className="ml-auto text-lg font-bold text-zinc-100">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PHASES.map((phase) => (
          <PhaseColumn
            key={phase.id}
            phase={phase}
            projects={projectsByPhase[phase.id] || []}
            onProjectClick={(project) => setSelectedProjectId(project.id)}
          />
        ))}
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
    icon: React.ReactNode;
  };
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

function PhaseColumn({ phase, projects, onProjectClick }: PhaseColumnProps) {
  const colorClasses = {
    purple: {
      border: 'border-purple-500/30',
      bg: 'bg-purple-500/5',
      text: 'text-purple-400',
      badge: 'bg-purple-500/20 text-purple-400',
    },
    blue: {
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/5',
      text: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-400',
    },
    amber: {
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/5',
      text: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-400',
    },
    green: {
      border: 'border-green-500/30',
      bg: 'bg-green-500/5',
      text: 'text-green-400',
      badge: 'bg-green-500/20 text-green-400',
    },
    emerald: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/5',
      text: 'text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-400',
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
          <div className="flex items-center gap-2">
            <h2 className={clsx('text-sm font-semibold', colors.text)}>
              {phase.label}
            </h2>
            <span className={colors.text}>{phase.icon}</span>
          </div>
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

function ProjectCard({ project, phaseColor, onClick }: ProjectCardProps) {
  const priorityColors = {
    P0: 'bg-red-500',
    P1: 'bg-orange-500',
    P2: 'bg-yellow-500',
    P3: 'bg-zinc-500',
  };

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
          className={clsx(
            'w-2 h-2 rounded-full ml-2 mt-1',
            priorityColors[project.priority]
          )}
          title={project.priority}
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
              'bg-purple-500': phaseColor === 'purple',
              'bg-blue-500': phaseColor === 'blue',
              'bg-amber-500': phaseColor === 'amber',
              'bg-green-500': phaseColor === 'green',
              'bg-emerald-500': phaseColor === 'emerald',
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
        <div className="flex items-center gap-1 text-[10px] text-zinc-500">
          <span>{project.metrics.completedTasks}/{project.metrics.totalTasks}</span>
          <span>tasks</span>
        </div>
      </div>
    </div>
  );
}

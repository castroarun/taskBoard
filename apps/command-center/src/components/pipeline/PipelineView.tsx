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
  },
  {
    id: 'engineering',
    label: 'Engineering',
    color: 'blue',
    stages: ['architecture', 'qa-planning', 'review'],
  },
  {
    id: 'build',
    label: 'Build',
    color: 'amber',
    stages: ['development', 'testing', 'staging'],
  },
  {
    id: 'launch',
    label: 'Launch',
    color: 'green',
    stages: ['ship', 'announce', 'walkthrough'],
  },
  {
    id: 'closure',
    label: 'Closure',
    color: 'zinc',
    stages: ['documentation', 'portfolio', 'retrospective'],
  },
];

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
    zinc: {
      border: 'border-zinc-500/30',
      bg: 'bg-zinc-500/5',
      text: 'text-zinc-400',
      badge: 'bg-zinc-500/20 text-zinc-400',
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
              'bg-zinc-400': phaseColor === 'zinc',
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

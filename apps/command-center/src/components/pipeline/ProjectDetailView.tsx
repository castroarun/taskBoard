import { useState, useEffect } from 'react';
import { useAppStore, Project, Task, ProjectStage } from '@/store';
import { readDocument, writeDocument } from '@/lib/tauri';
import { TaskModal } from '@/components/ui/TaskModal';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';

// Phase configuration
const PHASES = [
  { id: 'design', label: 'Design', color: 'rose', stages: ['Idea & Discovery', 'Requirements (PRD)'] },
  { id: 'engineering', label: 'Engineering', color: 'indigo', stages: ['Architecture', 'QA Planning', 'Review'] },
  { id: 'build', label: 'Build', color: 'emerald', stages: ['Development', 'Testing', 'Staging'] },
  { id: 'launch', label: 'Launch', color: 'amber', stages: ['Ship', 'Announce', 'Walkthrough'] },
  { id: 'closure', label: 'Closure', color: 'violet', stages: ['Documentation', 'Portfolio', 'Retrospective'] },
];

interface ProjectDetailViewProps {
  project: Project;
  onBack: () => void;
}

export function ProjectDetailView({ project, onBack }: ProjectDetailViewProps) {
  const { tasks, updateTask } = useAppStore();
  const projectTasks = tasks.filter((t) => t.projectId === project.id);

  // Document viewer state
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [docContent, setDocContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Task modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [defaultTaskStage, setDefaultTaskStage] = useState<ProjectStage>('development');

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverPhase, setDragOverPhase] = useState<string | null>(null);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent, phaseId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverPhase(phaseId);
  };

  const handleDragLeave = () => {
    setDragOverPhase(null);
  };

  const handleDrop = (e: React.DragEvent, phaseId: string) => {
    e.preventDefault();
    setDragOverPhase(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId || !draggedTaskId) return;

    // Get the default stage for the phase
    const stageMap: Record<string, ProjectStage> = {
      design: 'requirements',
      engineering: 'architecture',
      build: 'development',
      launch: 'ship',
      closure: 'documentation',
    };

    const newStage = stageMap[phaseId];
    if (newStage) {
      updateTask(taskId, { stage: newStage });
    }
    setDraggedTaskId(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverPhase(null);
  };

  const handleAddTask = (stage: ProjectStage) => {
    setSelectedTask(null);
    setDefaultTaskStage(stage);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleToggleTaskStatus = (task: Task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    updateTask(task.id, {
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : null,
    });
  };

  // Load document content when selected
  useEffect(() => {
    if (selectedDoc) {
      setIsLoading(true);
      const docPath = `${project.repoPath}/.taskboard/docs/${selectedDoc}`;
      readDocument(docPath)
        .then((content) => {
          setDocContent(content);
          setEditContent(content);
        })
        .catch(() => {
          setDocContent(`# ${selectedDoc}\n\nDocument content will appear here.`);
          setEditContent(`# ${selectedDoc}\n\nDocument content will appear here.`);
        })
        .finally(() => setIsLoading(false));
    }
  }, [selectedDoc, project.repoPath]);

  // Save document
  const handleSave = async () => {
    if (selectedDoc) {
      const docPath = `${project.repoPath}/.taskboard/docs/${selectedDoc}`;
      await writeDocument(docPath, editContent);
      setDocContent(editContent);
      setIsEditing(false);
    }
  };

  // Get current phase index
  const currentPhaseIndex = PHASES.findIndex((p) => p.id === project.currentPhase);

  // Priority colors
  const priorityConfig = {
    P0: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/20' },
    P1: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/20' },
    P2: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/20' },
    P3: { bg: 'bg-zinc-500/20', text: 'text-zinc-400', border: 'border-zinc-500/20' },
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Pipeline
      </button>

      {/* Project Header */}
      <div className="flex items-center justify-between gap-6 mb-6">
        {/* Left: Project Info */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-white uppercase tracking-wide">{project.name}</h2>
              <span className={clsx('px-2.5 py-1 rounded-full text-xs font-semibold border', priorityConfig[project.priority].bg, priorityConfig[project.priority].text, priorityConfig[project.priority].border)}>
                {project.priority}
              </span>
            </div>
            <p className="text-zinc-500 text-sm mt-1">{project.description}</p>
          </div>
        </div>

        {/* Center: Progress Bar */}
        <div className="flex-1 max-w-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-semibold rounded-full uppercase">
              {project.currentPhase} Phase
            </span>
            <span className="text-zinc-500 text-xs">
              {project.metrics.completedTasks}/{project.metrics.totalTasks} tasks
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 via-blue-500 to-blue-500 rounded-full transition-all"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[9px] text-zinc-600 uppercase tracking-wider">
            {PHASES.map((phase, idx) => (
              <span key={phase.id} className={clsx(idx < currentPhaseIndex ? 'text-zinc-500' : idx === currentPhaseIndex ? 'text-blue-400' : '')}>
                {phase.label.slice(0, 3)}{idx < currentPhaseIndex && '✓'}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Circular Progress */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#3f3f46"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeDasharray={`${project.progress}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{project.progress}%</div>
            <div className="text-xs text-zinc-500">Complete</div>
          </div>
        </div>
      </div>

      {/* Pipeline Phases */}
      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 mb-6">
        {/* Phase Headers - Using grid for consistent alignment */}
        <div className="grid grid-cols-5 gap-6">
          {PHASES.map((phase, idx) => {
            const isCompleted = idx < currentPhaseIndex;
            const isActive = idx === currentPhaseIndex;
            const isFuture = idx > currentPhaseIndex;

            return (
              <div key={phase.id} className="relative">
                <div
                  className={clsx(
                    'rounded-xl p-3 relative border h-full',
                    isCompleted && 'bg-zinc-800/30 border-zinc-700/30 opacity-70',
                    isActive && 'bg-blue-500/10 border-blue-500/50 ring-2 ring-blue-500/20',
                    isFuture && 'bg-zinc-800/20 border-zinc-700/20 opacity-40'
                  )}
                >
                  {/* Status Badge */}
                  {isCompleted && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                  )}

                  <div className={clsx('text-[11px] font-semibold uppercase tracking-wider mb-2', isActive ? 'text-blue-400' : 'text-zinc-500')}>
                    {phase.label}
                  </div>
                  <div className="space-y-1.5">
                    {phase.stages.map((stage) => (
                      <div key={stage} className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                        <div className={clsx('w-3 h-3 rounded-full border-2 flex-shrink-0', isCompleted ? 'border-green-500 bg-green-500' : isActive ? 'border-blue-500' : 'border-zinc-600')} />
                        <span className={clsx('truncate', isActive && 'text-zinc-300')}>{stage}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Arrow between phases */}
                {idx < PHASES.length - 1 && (
                  <div className={clsx('absolute top-1/2 -right-5 transform -translate-y-1/2 z-10', isFuture && 'opacity-30')}>
                    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tasks Separator */}
        <div className="flex items-center gap-4 py-4 mt-2">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-700 to-zinc-700" />
          <span className="text-[11px] text-zinc-500 font-semibold tracking-widest uppercase">Tasks</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-zinc-700 to-zinc-700" />
        </div>

        {/* Tasks Grid - Same grid as phases for alignment */}
        <div className="grid grid-cols-5 gap-6">
          {PHASES.map((phase, phaseIdx) => {
            const phaseTasks = projectTasks.filter((t) => {
              // Map task phase to our phase structure
              if (phase.id === 'design') return ['conception', 'discovery', 'requirements'].includes(t.stage);
              if (phase.id === 'engineering') return ['architecture', 'qa-planning', 'review'].includes(t.stage);
              if (phase.id === 'build') return ['development', 'testing', 'staging'].includes(t.stage);
              if (phase.id === 'launch') return ['ship', 'announce', 'walkthrough'].includes(t.stage);
              if (phase.id === 'closure') return ['documentation', 'portfolio', 'retrospective'].includes(t.stage);
              return false;
            });

            const isCompleted = phaseIdx < currentPhaseIndex;
            const isActive = phaseIdx === currentPhaseIndex;
            const isFuture = phaseIdx > currentPhaseIndex;

            // Get default stage for this phase
            const defaultStage = (
              phase.id === 'design' ? 'requirements' :
              phase.id === 'engineering' ? 'architecture' :
              phase.id === 'build' ? 'development' :
              phase.id === 'launch' ? 'ship' :
              'documentation'
            ) as ProjectStage;

            return (
              <div
                key={phase.id}
                className={clsx(
                  'space-y-2 p-2 -m-2 rounded-xl transition-colors',
                  isFuture && 'opacity-40',
                  dragOverPhase === phase.id && 'bg-blue-500/10 ring-2 ring-blue-500/30'
                )}
                onDragOver={(e) => handleDragOver(e, phase.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, phase.id)}
              >
                {phaseTasks.length === 0 ? (
                  <div className={clsx(
                    'text-xs text-center py-4 rounded-lg border-2 border-dashed transition-colors',
                    dragOverPhase === phase.id ? 'text-blue-400 border-blue-500/30' : 'text-zinc-600 border-transparent'
                  )}>
                    {dragOverPhase === phase.id ? 'Drop here' : 'No tasks'}
                  </div>
                ) : (
                  phaseTasks.slice(0, 4).map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isCompleted={isCompleted}
                      isActive={isActive}
                      onEdit={() => handleEditTask(task)}
                      onToggle={() => handleToggleTaskStatus(task)}
                      isDragging={draggedTaskId === task.id}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                    />
                  ))
                )}
                {phaseTasks.length > 4 && (
                  <div className="text-center py-1">
                    <span className="text-[10px] text-zinc-600">+{phaseTasks.length - 4} more</span>
                  </div>
                )}
                {/* Add Task Button */}
                <button
                  onClick={() => handleAddTask(defaultStage)}
                  className="w-full py-2 border border-dashed border-zinc-700 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors flex items-center justify-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <TaskModal
          projectId={project.id}
          task={selectedTask}
          defaultStage={defaultTaskStage}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedTask(null);
          }}
        />
      )}

      {/* Bottom Section: Documents, Tech Stack, Details */}
      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
        <div className="grid grid-cols-3 gap-8">
          {/* Documents */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Documents
            </h4>
            <div className="space-y-2">
              {['idea.md', 'discovery.md', 'APP_PRD.md', 'ARCHITECTURE.md'].map((doc) => (
                <div
                  key={doc}
                  onClick={() => setSelectedDoc(selectedDoc === doc ? null : doc)}
                  className={clsx(
                    'flex items-center gap-2 p-2 rounded-lg cursor-pointer group transition-colors',
                    selectedDoc === doc
                      ? 'bg-blue-500/20 border border-blue-500/30'
                      : 'bg-zinc-800/50 hover:bg-zinc-800'
                  )}
                >
                  <svg className={clsx('w-3.5 h-3.5', selectedDoc === doc ? 'text-blue-400' : 'text-blue-400')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className={clsx('text-xs flex-1', selectedDoc === doc ? 'text-blue-300' : 'text-zinc-300 group-hover:text-white')}>{doc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Tech Stack
            </h4>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <span key={tech} className="px-3 py-1.5 bg-zinc-800 rounded-lg text-xs font-medium text-zinc-300 border border-zinc-700">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Details & Actions */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Details
            </h4>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-zinc-500">Started</span>
                <span className="font-medium text-zinc-200">
                  {project.startedAt ? new Date(project.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Target</span>
                <span className="font-medium text-zinc-200">
                  {project.targetDate ? new Date(project.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Complexity</span>
                <span className="font-medium text-zinc-200">{project.complexity === 'F' ? 'Full Effort' : 'Easy'}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-medium text-zinc-300 transition-colors">
                VS Code
              </button>
              <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-medium text-white transition-colors shadow-lg shadow-blue-500/20">
                Work on Project
              </button>
            </div>
          </div>
        </div>

        {/* Document Viewer - Shows below when a document is selected */}
        {selectedDoc && (
          <div className="mt-6 pt-6 border-t border-zinc-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-zinc-200">{selectedDoc}</span>
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium text-white transition-colors"
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs font-medium text-zinc-300 transition-colors"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="bg-zinc-800/50 rounded-xl border border-zinc-700/50 p-4 max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-64 bg-transparent text-zinc-300 text-sm font-mono resize-none outline-none"
                  placeholder="Write markdown content..."
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{docContent}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  isCompleted,
  isActive,
  onEdit,
  onToggle,
  isDragging = false,
  onDragStart,
  onDragEnd
}: {
  task: Task;
  isCompleted: boolean;
  isActive: boolean;
  onEdit: () => void;
  onToggle: () => void;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}) {
  const isDone = task.status === 'completed';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onEdit}
      className={clsx(
        'p-2.5 rounded-lg cursor-pointer transition-all border',
        isDragging && 'opacity-50 scale-95 ring-2 ring-blue-500',
        isDone
          ? 'bg-zinc-800/30 border-zinc-700/30 opacity-60'
          : isActive
          ? 'bg-blue-500/10 border-blue-500/40 hover:bg-blue-500/20'
          : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
      )}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="flex-shrink-0 hover:scale-110 transition-transform"
        >
          {isDone ? (
            <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : task.status === 'in-progress' ? (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            </div>
          ) : (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-600 hover:border-zinc-400" />
          )}
        </button>
        <span className={clsx('text-xs', isDone ? 'text-zinc-500 line-through' : isActive ? 'text-zinc-200' : 'text-zinc-400')}>
          {task.title}
        </span>
      </div>
      {task.status === 'in-progress' && <div className="text-[10px] text-blue-400/70 ml-5 mt-1">In Progress</div>}
    </div>
  );
}

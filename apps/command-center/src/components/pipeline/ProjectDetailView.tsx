import { useState, useEffect, useRef } from 'react';
import { useAppStore, Project, Task, ProjectStage, DocumentReview } from '@/store';
import { readDocument, writeDocument, openInVSCode, openInClaudeCode, getProjectScreenshots, getAssetUrl, uploadProjectImage, addImageToReadme, deleteProjectImage } from '@/lib/tauri';
import { TaskModal } from '@/components/ui/TaskModal';
import { TaskDetailModal } from '@/components/ui/TaskDetailModal';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { transcribeAudio } from '@/lib/groq';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';

// Tech stack descriptions - why, where, and learn more link
const TECH_DESCRIPTIONS: Record<string, { why: string; where: string; link: string }> = {
  'React': { why: 'Component-based UI library', where: 'All UI components and views', link: 'https://react.dev' },
  'TypeScript': { why: 'Type safety and better DX', where: 'Entire codebase', link: 'https://typescriptlang.org' },
  'Tauri': { why: 'Native desktop app with Rust backend', where: 'App shell, file system, OS integration', link: 'https://tauri.app' },
  'Tailwind CSS': { why: 'Utility-first styling', where: 'All component styling', link: 'https://tailwindcss.com' },
  'Tailwind': { why: 'Utility-first styling', where: 'All component styling', link: 'https://tailwindcss.com' },
  'Zustand': { why: 'Lightweight state management', where: 'Global app state (store/index.ts)', link: 'https://zustand-demo.pmnd.rs' },
  'Vite': { why: 'Fast dev server and bundling', where: 'Build tooling', link: 'https://vitejs.dev' },
  'Groq': { why: 'Fast AI inference for voice', where: 'Voice transcription (Whisper)', link: 'https://groq.com' },
  'Node.js': { why: 'JavaScript runtime', where: 'Build scripts, tooling', link: 'https://nodejs.org' },
  'Rust': { why: 'Native performance & security', where: 'Tauri backend commands', link: 'https://rust-lang.org' },
  'PostgreSQL': { why: 'Relational database', where: 'Data persistence', link: 'https://postgresql.org' },
  'Supabase': { why: 'Backend-as-a-service', where: 'Auth, database, storage', link: 'https://supabase.com' },
  'Next.js': { why: 'React framework with SSR', where: 'Web app routing and pages', link: 'https://nextjs.org' },
  'Next.js 14': { why: 'React framework with App Router', where: 'Web app routing and pages', link: 'https://nextjs.org' },
  'Prisma': { why: 'Type-safe ORM', where: 'Database queries', link: 'https://prisma.io' },
  'tRPC': { why: 'End-to-end type safety', where: 'API layer', link: 'https://trpc.io' },
  'Redux': { why: 'Predictable state container', where: 'Global state management', link: 'https://redux.js.org' },
  'GraphQL': { why: 'Flexible data querying', where: 'API layer', link: 'https://graphql.org' },
  'REST API': { why: 'Standard HTTP endpoints', where: 'Backend communication', link: 'https://restfulapi.net' },
  'WebSocket': { why: 'Real-time communication', where: 'Live updates', link: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API' },
  'Docker': { why: 'Containerization', where: 'Deployment, dev environment', link: 'https://docker.com' },
  'AWS': { why: 'Cloud infrastructure', where: 'Hosting, storage, services', link: 'https://aws.amazon.com' },
  'Vercel': { why: 'Frontend deployment', where: 'Production hosting', link: 'https://vercel.com' },
  'GitHub Actions': { why: 'CI/CD automation', where: 'Build, test, deploy pipelines', link: 'https://github.com/features/actions' },
  'Recharts': { why: 'Composable charting library', where: 'Data visualizations, graphs', link: 'https://recharts.org' },
  'Chart.js': { why: 'Simple chart library', where: 'Data visualizations', link: 'https://chartjs.org' },
  'D3.js': { why: 'Data-driven documents', where: 'Complex visualizations', link: 'https://d3js.org' },
  'Framer Motion': { why: 'Animation library', where: 'UI animations, transitions', link: 'https://framer.com/motion' },
  'React Query': { why: 'Server state management', where: 'API data fetching, caching', link: 'https://tanstack.com/query' },
  'SWR': { why: 'React hooks for data fetching', where: 'API calls, caching', link: 'https://swr.vercel.app' },
  'Zod': { why: 'TypeScript-first schema validation', where: 'Form validation, API schemas', link: 'https://zod.dev' },
  'React Hook Form': { why: 'Performant forms', where: 'Form handling', link: 'https://react-hook-form.com' },
  'Radix UI': { why: 'Unstyled accessible components', where: 'UI primitives', link: 'https://radix-ui.com' },
  'shadcn/ui': { why: 'Re-usable component collection', where: 'UI components', link: 'https://ui.shadcn.com' },
};

// AI Badge Component
function AIBadge({ model, purpose }: { model: string; purpose: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/30 rounded text-[10px]">
      <span className="w-3 h-3 bg-purple-500 rounded flex items-center justify-center">
        <span className="text-[6px] text-white font-bold">AI</span>
      </span>
      <span className="text-purple-400 font-medium">{model}</span>
      <span className="text-zinc-500">• {purpose}</span>
    </span>
  );
}

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
  const { tasks, updateTask, addDocumentReview, updateDocumentReview, deleteDocumentReview, revokeApproval } = useAppStore();
  const projectTasks = tasks.filter((t) => t.projectId === project.id);

  // Document viewer state
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [docContent, setDocContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Review/Comment state
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [lastVoiceSuccess, setLastVoiceSuccess] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingReviewContent, setEditingReviewContent] = useState('');
  const { isRecording, isSupported, startRecording, stopRecording, error: recorderError } = useVoiceRecorder();

  // Task modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [defaultTaskStage, setDefaultTaskStage] = useState<ProjectStage>('development');

  // Task detail modal state (for viewing and comments)
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  // Screenshots state - auto-scan assets folder
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastUploadedFiles, setLastUploadedFiles] = useState<string[]>([]);
  const [showReadmePrompt, setShowReadmePrompt] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Load screenshots from project's assets folder
  useEffect(() => {
    getProjectScreenshots(project.repoPath, 'assets')
      .then((images) => setScreenshots(images))
      .catch(() => setScreenshots([]));
  }, [project.repoPath]);

  // Process multiple files for upload
  const processFiles = async (files: FileList | File[]) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    const fileArray = Array.from(files);

    // Filter valid files
    const validFiles = fileArray.filter(file => validTypes.includes(file.type));
    if (validFiles.length === 0) {
      setUploadError('Please select valid images (PNG, JPG, GIF, WebP)');
      return;
    }

    if (validFiles.length < fileArray.length) {
      setUploadError(`${fileArray.length - validFiles.length} file(s) skipped (invalid type)`);
    } else {
      setUploadError(null);
    }

    setIsUploading(true);
    setShowReadmePrompt(false);
    setLastUploadedFiles([]);

    const uploadedFiles: string[] = [];

    // Upload each file
    for (const file of validFiles) {
      try {
        const base64 = await readFileAsBase64(file);
        const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        await uploadProjectImage(project.repoPath, 'assets', fileName, base64);
        uploadedFiles.push(fileName);
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
      }
    }

    // Refresh screenshots list
    const images = await getProjectScreenshots(project.repoPath, 'assets');
    setScreenshots(images);
    setIsUploading(false);

    if (uploadedFiles.length > 0) {
      setLastUploadedFiles(uploadedFiles);
      setShowReadmePrompt(true);
      // Auto-hide prompt after 10 seconds (longer for multiple files)
      setTimeout(() => setShowReadmePrompt(false), 10000);
    }
  };

  // Helper to read file as base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Handle image upload from file input
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
    }
    // Reset the input
    e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeaveDropZone = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the drop zone entirely
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDraggingOver(false);
    }
  };

  const handleDragOverDropZone = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDropFiles = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
  };

  // Handle adding uploaded images to README
  const handleAddToReadme = async (fileName?: string) => {
    const filesToAdd = fileName ? [fileName] : lastUploadedFiles;
    for (const file of filesToAdd) {
      await addImageToReadme(project.repoPath, `assets/${file}`, file.split('.')[0]);
    }
    if (!fileName) {
      setShowReadmePrompt(false);
      setLastUploadedFiles([]);
    }
  };

  // Image reorder drag handlers
  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation();
    setDraggedImageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `image-${index}`);
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedImageIndex !== null && draggedImageIndex !== index) {
      setDragOverImageIndex(index);
    }
  };

  const handleImageDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDragOverImageIndex(null);
  };

  const handleImageDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedImageIndex !== null && draggedImageIndex !== targetIndex) {
      // Reorder the screenshots array
      const newScreenshots = [...screenshots];
      const [draggedItem] = newScreenshots.splice(draggedImageIndex, 1);
      newScreenshots.splice(targetIndex, 0, draggedItem);
      setScreenshots(newScreenshots);
    }

    setDraggedImageIndex(null);
    setDragOverImageIndex(null);
  };

  const handleImageDragEnd = () => {
    setDraggedImageIndex(null);
    setDragOverImageIndex(null);
  };

  // Delete image handler
  const handleDeleteImage = async (imagePath: string) => {
    if (!confirm('Delete this image?')) return;

    setIsDeleting(imagePath);
    try {
      await deleteProjectImage(imagePath);
      // Remove from local state immediately
      setScreenshots(prev => prev.filter(img => img !== imagePath));
      // Clear selection if deleted image was selected
      if (selectedScreenshot === imagePath) {
        setSelectedScreenshot(null);
      }
    } catch (err) {
      console.error('Failed to delete image:', err);
      setUploadError('Failed to delete image');
    } finally {
      setIsDeleting(null);
    }
  };

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

  const handleViewTask = (task: Task) => {
    // Get the latest version of the task from store
    const latestTask = tasks.find((t) => t.id === task.id) || task;
    setDetailTask(latestTask);
    setIsTaskDetailOpen(true);
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

  // Get reviews for the selected document
  const getDocReviews = () => {
    if (!selectedDoc) return [];
    const docPath = `${project.repoPath}/.taskboard/docs/${selectedDoc}`;
    return project.reviews?.filter((r) =>
      r.documentPath === docPath || r.documentName === selectedDoc
    ) || [];
  };

  const existingReviews = getDocReviews();
  const isApproved = existingReviews.some((r) => r.approved && !r.resolved);
  const latestApproval = existingReviews.find((r) => r.approved && !r.resolved);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  // Handle approve document
  const handleApprove = () => {
    if (!selectedDoc) return;
    const docPath = `${project.repoPath}/.taskboard/docs/${selectedDoc}`;

    const review: DocumentReview = {
      id: `r-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'approval',
      author: 'arun',
      documentPath: docPath,
      documentName: selectedDoc,
      content: `Approved: ${selectedDoc}`,
      createdAt: new Date().toISOString(),
      forClaude: true,
      resolved: false,
      approved: true,
      source: 'text',
    };

    addDocumentReview(project.id, review);
  };

  // Handle revoke approval
  const handleRevokeApproval = () => {
    if (!latestApproval) return;
    revokeApproval(project.id, latestApproval.id);
  };

  // Handle delete review
  const handleDeleteReview = (reviewId: string) => {
    if (confirm('Delete this comment?')) {
      deleteDocumentReview(project.id, reviewId);
    }
  };

  // Handle edit review
  const handleEditReview = (review: DocumentReview) => {
    setEditingReviewId(review.id);
    setEditingReviewContent(review.content);
  };

  const handleSaveEditReview = () => {
    if (!editingReviewId || !editingReviewContent.trim()) return;
    updateDocumentReview(project.id, editingReviewId, { content: editingReviewContent.trim() });
    setEditingReviewId(null);
    setEditingReviewContent('');
  };

  const handleCancelEditReview = () => {
    setEditingReviewId(null);
    setEditingReviewContent('');
  };

  // Handle text comment
  const handleComment = () => {
    if (!selectedDoc || !commentText.trim()) return;
    const docPath = `${project.repoPath}/.taskboard/docs/${selectedDoc}`;

    const review: DocumentReview = {
      id: `r-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'feedback',
      author: 'arun',
      documentPath: docPath,
      documentName: selectedDoc,
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
      forClaude: true,
      resolved: false,
      approved: false,
      source: 'text',
    };

    addDocumentReview(project.id, review);
    setCommentText('');
    setShowCommentInput(false);
  };

  // Handle voice comment
  const handleVoiceComment = async () => {
    setVoiceError(null);

    if (!isSupported) {
      setVoiceError('Voice recording not supported');
      return;
    }

    if (isRecording) {
      const audioBlob = await stopRecording();
      if (audioBlob && selectedDoc) {
        setIsTranscribing(true);
        const result = await transcribeAudio(audioBlob);
        setIsTranscribing(false);

        if (result.error) {
          setVoiceError(result.error);
          setLastVoiceSuccess(false);
        } else if (result.text) {
          const docPath = `${project.repoPath}/.taskboard/docs/${selectedDoc}`;
          const review: DocumentReview = {
            id: `r-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            type: 'feedback',
            author: 'arun',
            documentPath: docPath,
            documentName: selectedDoc,
            content: result.text,
            createdAt: new Date().toISOString(),
            forClaude: true,
            resolved: false,
            approved: false,
            source: 'voice',
          };
          addDocumentReview(project.id, review);
          setLastVoiceSuccess(true);
          setTimeout(() => setLastVoiceSuccess(false), 3000);
        }
      }
    } else {
      await startRecording();
    }
  };

  // Open project in VS Code
  const handleOpenVSCode = () => {
    openInVSCode(project.repoPath);
  };

  // Open project in Claude Code
  const handleWorkOnProject = () => {
    openInClaudeCode(project.repoPath);
  };

  // Check if a document is approved
  const isDocApproved = (docName: string) => {
    const docPath = `${project.repoPath}/.taskboard/docs/${docName}`;
    return project.reviews?.some((r) =>
      (r.documentPath === docPath || r.documentName === docName) && r.approved && !r.resolved
    ) || false;
  };

  // Get review count for a document
  const getDocReviewCount = (docName: string) => {
    const docPath = `${project.repoPath}/.taskboard/docs/${docName}`;
    return project.reviews?.filter((r) =>
      (r.documentPath === docPath || r.documentName === docName) && !r.approved
    ).length || 0;
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
                      <div key={stage} className="flex items-center gap-1.5 text-[11px]">
                        <div className={clsx('w-3 h-3 rounded-full border-2 flex-shrink-0', isCompleted ? 'border-green-500 bg-green-500' : isActive ? 'border-blue-500' : 'border-zinc-600')} />
                        <span className={clsx('truncate', isCompleted ? 'text-zinc-300' : isActive ? 'text-white' : 'text-zinc-200')}>{stage}</span>
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
                      onView={() => handleViewTask(task)}
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

      {/* Task Modal (for editing) */}
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

      {/* Task Detail Modal (for viewing and comments) */}
      {isTaskDetailOpen && detailTask && (
        <TaskDetailModal
          task={detailTask}
          onClose={() => {
            setIsTaskDetailOpen(false);
            setDetailTask(null);
          }}
        />
      )}

      {/* Hidden file input for image upload (multiple) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />

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
              {['idea.md', 'discovery.md', 'APP_PRD.md', 'ARCHITECTURE.md'].map((doc) => {
                const approved = isDocApproved(doc);
                const reviewCount = getDocReviewCount(doc);
                return (
                  <div
                    key={doc}
                    onClick={() => setSelectedDoc(selectedDoc === doc ? null : doc)}
                    className={clsx(
                      'flex items-center gap-2 p-2 rounded-lg cursor-pointer group transition-colors',
                      selectedDoc === doc
                        ? 'bg-blue-500/20 border border-blue-500/30'
                        : approved
                          ? 'bg-green-500/10 border border-green-500/20 hover:bg-green-500/20'
                          : 'bg-zinc-800/50 hover:bg-zinc-800'
                    )}
                  >
                    {/* Approval indicator */}
                    {approved ? (
                      <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className={clsx('w-3.5 h-3.5 flex-shrink-0', selectedDoc === doc ? 'text-blue-400' : 'text-zinc-500')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    <span className={clsx(
                      'text-xs flex-1',
                      selectedDoc === doc
                        ? 'text-blue-300'
                        : approved
                          ? 'text-green-300'
                          : 'text-zinc-300 group-hover:text-white'
                    )}>{doc}</span>
                    {/* Review count badge */}
                    {reviewCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] rounded-full">
                        {reviewCount}
                      </span>
                    )}
                  </div>
                );
              })}
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
              {project.techStack.map((tech) => {
                const info = TECH_DESCRIPTIONS[tech];
                return (
                  <div key={tech} className="relative group">
                    <span className="px-3 py-1.5 bg-zinc-800 rounded-lg text-xs font-medium text-zinc-300 border border-zinc-700 cursor-help inline-block hover:border-zinc-500 transition-colors">
                      {tech}
                    </span>
                    {/* Tooltip */}
                    {info && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[220px]">
                        <div className="text-xs font-semibold text-zinc-200 mb-1">{tech}</div>
                        <div className="text-[11px] text-zinc-400 mb-1">
                          <span className="text-blue-400">Why:</span> {info.why}
                        </div>
                        <div className="text-[11px] text-zinc-400 mb-2">
                          <span className="text-green-400">Where:</span> {info.where}
                        </div>
                        <a
                          href={info.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                        >
                          Learn more →
                        </a>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-zinc-600" />
                      </div>
                    )}
                  </div>
                );
              })}
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
              <button
                onClick={handleOpenVSCode}
                className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-medium text-zinc-300 transition-colors flex items-center justify-center gap-1.5"
                title="Open project folder in VS Code"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.583 0L6.167 10.572l-4.583-3.5 0 9.855 4.583-3.5L17.583 24l4.667-2.355v-19.29L17.583 0zm-1.167 4.5v15l-8.5-7.5 8.5-7.5z"/>
                </svg>
                VS Code
              </button>
              <button
                onClick={handleWorkOnProject}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-medium text-white transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-1.5"
                title="Open Claude Code terminal in project directory"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Work on Project
              </button>
            </div>
          </div>
        </div>

        {/* Document Viewer - Shows below when a document is selected */}
        {selectedDoc && (
          <div className="mt-6 pt-6 border-t border-zinc-700/50">
            {/* Header with document name and action buttons */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-zinc-200">{selectedDoc}</span>
                {isApproved && latestApproval && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                    ✓ Approved
                    <button
                      onClick={handleRevokeApproval}
                      className="ml-1 text-green-400 hover:text-red-400 transition-colors"
                      title="Revoke approval"
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <>
                    {/* Approve Button */}
                    <button
                      onClick={handleApprove}
                      disabled={isApproved}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        isApproved
                          ? 'bg-green-500/20 text-green-400 cursor-default'
                          : 'bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20'
                      )}
                    >
                      {isApproved ? '✓ Approved' : '✓ Approve'}
                    </button>
                    {/* Comment Button */}
                    <button
                      onClick={() => setShowCommentInput(!showCommentInput)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-700 text-zinc-300 border border-zinc-600 hover:bg-zinc-600 transition-colors"
                    >
                      💬 Comment
                    </button>
                    {/* Voice Button */}
                    <button
                      onClick={handleVoiceComment}
                      disabled={isTranscribing || !isSupported}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors relative',
                        isRecording
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                          : isTranscribing
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-zinc-700 text-zinc-300 border border-zinc-600 hover:bg-zinc-600'
                      )}
                      title={isRecording ? 'Click to stop & transcribe' : 'Voice comment'}
                    >
                      {isTranscribing ? (
                        <span className="w-3 h-3 inline-block border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                      ) : isRecording ? (
                        '⏹️'
                      ) : (
                        '🎤'
                      )}
                      {isTranscribing ? 'Transcribing...' : isRecording ? 'Stop' : 'Voice'}
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-[8px] text-white font-bold">AI</span>
                      </span>
                    </button>
                  </>
                )}
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

            {/* Voice Success Message */}
            {lastVoiceSuccess && (
              <div className="mb-3 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
                <span className="text-xs text-green-400">✓ Voice comment added</span>
                <AIBadge model="Groq Whisper" purpose="Voice transcription" />
              </div>
            )}

            {/* Voice Error */}
            {(voiceError || recorderError) && !lastVoiceSuccess && (
              <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-400">⚠️ {voiceError || recorderError}</p>
              </div>
            )}

            {/* Comment Input */}
            {showCommentInput && (
              <div className="mb-3 p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                    placeholder="Add feedback for Claude..."
                    className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    autoFocus
                  />
                  <button
                    onClick={handleComment}
                    disabled={!commentText.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Send
                  </button>
                  <button
                    onClick={() => setShowCommentInput(false)}
                    className="px-3 py-2 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  💡 This feedback will be read by Claude Code on next session
                </p>
              </div>
            )}

            {/* Document Content */}
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

            {/* Reviews Section - Shows existing reviews */}
            {existingReviews.length > 0 && !isEditing && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Reviews ({existingReviews.length})
                  </span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {existingReviews.map((review) => (
                    <div
                      key={review.id}
                      className={clsx(
                        'p-3 rounded-lg border group',
                        review.approved
                          ? 'bg-green-500/10 border-green-500/20'
                          : 'bg-zinc-800/50 border-zinc-700'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-zinc-300 capitalize">
                            {review.author}
                          </span>
                          {review.approved && (
                            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-semibold">
                              APPROVED
                            </span>
                          )}
                          {review.forClaude && !review.approved && (
                            <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px] font-semibold">
                              FOR CLAUDE
                            </span>
                          )}
                          {review.source === 'voice' && (
                            <span className="text-zinc-500 text-xs">🎤</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500">{formatDate(review.createdAt)}</span>
                          {/* Edit/Delete buttons - only for non-approval reviews */}
                          {!review.approved && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditReview(review)}
                                className="p-1 text-zinc-500 hover:text-blue-400 transition-colors"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteReview(review.id)}
                                className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                          {/* Revoke button for approvals */}
                          {review.approved && (
                            <button
                              onClick={() => revokeApproval(project.id, review.id)}
                              className="p-1 text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                              title="Revoke approval"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Editing mode */}
                      {editingReviewId === review.id ? (
                        <div className="flex gap-2 mt-1">
                          <input
                            type="text"
                            value={editingReviewContent}
                            onChange={(e) => setEditingReviewContent(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEditReview()}
                            className="flex-1 px-2 py-1 bg-zinc-900 border border-zinc-600 rounded text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEditReview}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEditReview}
                            className="px-2 py-1 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-300">{review.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Review Toolbar */}
            {!isEditing && (
              <div className="mt-4 flex items-center justify-between pt-4 border-t border-zinc-700/50">
                <span className="text-xs text-zinc-500">
                  💡 Comments will be read by Claude Code on next session
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleApprove}
                    disabled={isApproved}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      isApproved
                        ? 'bg-green-500/20 text-green-400 cursor-default'
                        : 'bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20'
                    )}
                  >
                    {isApproved ? '✓ Approved' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => setShowCommentInput(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-700 text-zinc-300 border border-zinc-600 hover:bg-zinc-600 transition-colors"
                  >
                    💬 Add Comment
                  </button>
                  <button
                    onClick={handleVoiceComment}
                    disabled={isTranscribing || !isSupported}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors relative',
                      isRecording
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                        : isTranscribing
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-zinc-700 text-zinc-300 border border-zinc-600 hover:bg-zinc-600'
                    )}
                  >
                    {isTranscribing ? (
                      <span className="w-3 h-3 inline-block border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                    ) : isRecording ? (
                      '⏹️'
                    ) : (
                      '🎤'
                    )}
                    {isTranscribing ? 'Transcribing...' : isRecording ? 'Stop' : 'Voice'}
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-[8px] text-white font-bold">AI</span>
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Screenshots Section - Last section */}
      {screenshots.length > 0 ? (
        <div
          ref={dropZoneRef}
          className={clsx(
            'bg-zinc-900/50 rounded-2xl border-2 p-6 mt-6 transition-all relative',
            isDraggingOver
              ? 'border-blue-500 bg-blue-500/5'
              : 'border-zinc-800'
          )}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOverDropZone}
          onDragLeave={handleDragLeaveDropZone}
          onDrop={handleDropFiles}
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Project Screenshots
              <span className="text-[10px] text-zinc-500 font-normal">({screenshots.length})</span>
              <span className="text-[10px] text-zinc-600 font-normal ml-1">• Drag to reorder</span>
            </h4>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <span className="w-3 h-3 border-2 border-zinc-500/30 border-t-zinc-400 rounded-full animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
              {isUploading ? 'Uploading...' : 'Add'}
            </button>
          </div>
          {/* Drag indicator overlay */}
          {isDraggingOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-500/10 rounded-2xl z-10 pointer-events-none">
              <div className="flex flex-col items-center gap-2 text-blue-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="text-sm font-medium">Drop images here</span>
              </div>
            </div>
          )}
          {/* Success toast with README option */}
          {showReadmePrompt && lastUploadedFiles.length > 0 && (
            <div className="flex items-center justify-between mb-3 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg animate-fade-in">
              <span className="text-xs text-green-400">
                ✓ {lastUploadedFiles.length === 1
                    ? `${lastUploadedFiles[0]} uploaded`
                    : `${lastUploadedFiles.length} images uploaded`} to assets/
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAddToReadme()}
                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  Add {lastUploadedFiles.length > 1 ? 'all ' : ''}to README
                </button>
                <button
                  onClick={() => setShowReadmePrompt(false)}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          {uploadError && (
            <p className="text-xs text-red-400 mb-3">⚠️ {uploadError}</p>
          )}
          <div className="grid grid-cols-4 gap-3">
            {screenshots.slice(0, 8).map((img, idx) => (
              <div
                key={img}
                draggable
                onDragStart={(e) => handleImageDragStart(e, idx)}
                onDragOver={(e) => handleImageDragOver(e, idx)}
                onDragLeave={handleImageDragLeave}
                onDrop={(e) => handleImageDrop(e, idx)}
                onDragEnd={handleImageDragEnd}
                className={clsx(
                  'aspect-video rounded-lg overflow-hidden cursor-grab border-2 transition-all relative group',
                  draggedImageIndex === idx && 'opacity-50 scale-95',
                  dragOverImageIndex === idx && 'ring-2 ring-blue-500 border-blue-500',
                  selectedScreenshot === img
                    ? 'border-blue-500 ring-2 ring-blue-500/30'
                    : 'border-zinc-700 hover:border-zinc-500'
                )}
              >
                <img
                  src={getAssetUrl(img)}
                  alt={`Screenshot ${idx + 1}`}
                  className="w-full h-full object-cover pointer-events-none"
                  onError={(e) => {
                    // Fallback for broken images
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><rect fill="%2327272a" width="100" height="60"/><text x="50" y="35" text-anchor="middle" fill="%2371717a" font-size="10">No Image</text></svg>';
                  }}
                />
                {/* Hover overlay with actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {/* View button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedScreenshot(selectedScreenshot === img ? null : img);
                    }}
                    className="p-2 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg text-zinc-300 hover:text-white transition-colors"
                    title="View"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(img);
                    }}
                    disabled={isDeleting === img}
                    className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {isDeleting === img ? (
                      <span className="w-4 h-4 block border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
                {/* Drag handle indicator */}
                <div className="absolute top-1 left-1 p-1 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-3 h-3 text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-2 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm8-14a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-2 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm2 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                  </svg>
                </div>
                {/* Position badge */}
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-zinc-400 font-medium">
                  {idx + 1}
                </div>
              </div>
            ))}
          </div>
          {screenshots.length > 8 && (
            <div className="text-center mt-2">
              <span className="text-xs text-zinc-500">+{screenshots.length - 8} more in assets/</span>
            </div>
          )}
          {/* Expanded screenshot view */}
          {selectedScreenshot && (
            <div className="mt-4 bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden">
              {/* Actions bar */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700 bg-zinc-800/50">
                <span className="text-xs text-zinc-400 truncate max-w-[200px]">
                  {selectedScreenshot.split(/[/\\]/).pop()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const fileName = selectedScreenshot.split(/[/\\]/).pop() || '';
                      handleAddToReadme(fileName);
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs rounded transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add to README
                  </button>
                  <button
                    onClick={() => handleDeleteImage(selectedScreenshot)}
                    disabled={isDeleting === selectedScreenshot}
                    className="flex items-center gap-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded transition-colors disabled:opacity-50"
                  >
                    {isDeleting === selectedScreenshot ? (
                      <span className="w-3 h-3 block border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedScreenshot(null)}
                    className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-2">
                <img
                  src={getAssetUrl(selectedScreenshot)}
                  alt="Expanded screenshot"
                  className="w-full rounded-lg"
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          ref={dropZoneRef}
          className={clsx(
            'mt-6 p-4 rounded-xl border-2 border-dashed transition-all',
            isDraggingOver
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-zinc-800/50 hover:border-zinc-700'
          )}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOverDropZone}
          onDragLeave={handleDragLeaveDropZone}
          onDrop={handleDropFiles}
        >
          {isDraggingOver ? (
            <div className="flex flex-col items-center justify-center py-4 text-blue-400">
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-sm font-medium">Drop images here</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 text-xs text-zinc-500">
              <span>💡 Drag & drop images here, add to <code className="text-zinc-400">assets/</code> folder, or</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1 px-2 py-1 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {isUploading ? (
                  <span className="w-3 h-3 border-2 border-zinc-500/30 border-t-zinc-400 rounded-full animate-spin" />
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                )}
                {isUploading ? 'Uploading...' : 'browse files'}
              </button>
            </div>
          )}
          {uploadError && <p className="text-xs text-red-400 mt-2 text-center">⚠️ {uploadError}</p>}
          {/* Success toast with README option */}
          {showReadmePrompt && lastUploadedFiles.length > 0 && (
            <div className="flex items-center justify-between mt-3 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg animate-fade-in">
              <span className="text-xs text-green-400">
                ✓ {lastUploadedFiles.length === 1
                    ? `${lastUploadedFiles[0]} uploaded`
                    : `${lastUploadedFiles.length} images uploaded`} to assets/
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAddToReadme()}
                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  Add {lastUploadedFiles.length > 1 ? 'all ' : ''}to README
                </button>
                <button
                  onClick={() => setShowReadmePrompt(false)}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  isCompleted,
  isActive,
  onView,
  onToggle,
  isDragging = false,
  onDragStart,
  onDragEnd
}: {
  task: Task;
  isCompleted: boolean;
  isActive: boolean;
  onView: () => void;
  onToggle: () => void;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}) {
  const isDone = task.status === 'completed';
  const hasComments = task.comments && task.comments.length > 0;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onView}
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
        <span className={clsx('text-xs flex-1', isDone ? 'text-zinc-500 line-through' : isActive ? 'text-zinc-200' : 'text-zinc-400')}>
          {task.title}
        </span>
        {hasComments && (
          <span className="flex items-center gap-0.5 text-[10px] text-purple-400">
            💬 {task.comments.length}
          </span>
        )}
      </div>
      {task.status === 'in-progress' && <div className="text-[10px] text-blue-400/70 ml-5 mt-1">In Progress</div>}
    </div>
  );
}

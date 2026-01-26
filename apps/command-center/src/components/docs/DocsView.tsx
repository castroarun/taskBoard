import { useState, useEffect } from 'react';
import { useAppStore, DocFile, Project, DocumentReview } from '@/store';
import { readDocument, writeDocument } from '@/lib/tauri';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { transcribeAudio } from '@/lib/groq';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';

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

// Known document mappings per project (based on actual docs/ folders)
// This maps project IDs to their actual documentation structure
const PROJECT_DOC_MAPPINGS: Record<string, { design: string[]; engineering: string[]; build: string[]; launch: string[]; other: string[] }> = {
  'anycalc': {
    design: ['APP_PRD.md', 'Design/DESIGN.md'],
    engineering: ['DEVELOPMENT-PLAN.md', 'TEST-PLAN.csv'],
    build: ['DEV-CLOCK.md', 'PROJECT-STATUS.md'],
    launch: ['LINKEDIN-POSTS.md', 'TECH-STACK-WALKTHROUGH.md'],
    other: ['GLOSSARY.md'],
  },
  'portfolio': {
    design: ['Design/DESIGN.md', 'PORTFOLIO-FEATURES.md'],
    engineering: ['CASE-STUDY-TEMPLATE.md'],
    build: ['PROJECT-STATUS.md'],
    launch: ['LINKEDIN-POSTS-PORTFOLIO.md'],
    other: ['PORTFOLIO-REVIEW.md'],
  },
  'noteapp': {
    design: ['NOTE-APP-PRD.md', 'DESIGN.md', 'UI-PROTOTYPES.md'],
    engineering: ['DATABASE-SCHEMA.sql', 'TEST-PLAN.csv'],
    build: ['DEV-CLOCK.md', 'BUILD-INSTRUCTIONS.md', 'CODE-WALKTHROUGH.md'],
    launch: ['linked-in-instructions.md'],
    other: ['NOTE-APP-PROJECT.md', 'TIME-SPENT.md'],
  },
  'primmo': {
    design: ['Design/APP_PRD.md'],
    engineering: ['DEVELOPMENT-PLAN.md', 'TEST-PLAN.csv'],
    build: ['DEV-CLOCK.md', 'PROJECT-STATUS.md', 'TWILIO-SETUP.md'],
    launch: ['PLAY_STORE_LISTING.md', 'PRIVACY_POLICY.md'],
    other: ['GLOSSARY.md'],
  },
  'reppit': {
    design: ['APP_PRD.md', 'strength_profile_tracker_PRD.md', 'COACHING_FEATURES.md'],
    engineering: ['DEVELOPMENT-PLAN.md', 'PROJECT-SETUP.md', 'TEST-PLAN.csv'],
    build: ['DEV-CLOCK.md', 'PROJECT-STATUS.md', 'ANDROID_BUILD_GUIDE.md', 'SUPABASE-SETUP.md'],
    launch: ['PLAY_STORE_LISTING.md', 'linkedin-post.md', 'linkedin-article-draft.md', 'PRIVACY_POLICY.md'],
    other: [],
  },
  'covered-calls': {
    design: ['APP_PRD.md', 'Design/DESIGN.md'],
    engineering: ['DEVELOPMENT-PLAN.md', 'TEST-PLAN.csv', 'TEST-PLAN-SUMMARY.md'],
    build: ['DEV-CLOCK.md', 'PROJECT-STATUS.md'],
    launch: ['BEST-STRATEGIES.md', 'CLAUDE-CODE-PORTFOLIO.md'],
    other: ['GLOSSARY.md'],
  },
  'conexus': {
    design: ['APP_PRD.md', 'DESIGN-SPEC.md'],
    engineering: ['DEVELOPMENT-PLAN.md', 'TEST-PLAN.csv'],
    build: ['DEV-CLOCK.md', 'PROJECT-STATUS.md'],
    launch: [],
    other: ['GLOSSARY.md'],
  },
  'taskboard': {
    design: ['docs/Design/APP_PRD.md'],
    engineering: ['docs/Design/ARCHITECTURE.md', 'docs/QA_PLAN.md'],
    build: ['docs/DEV-CLOCK.md', 'docs/PROJECT-STATUS.md'],
    launch: ['docs/marketing/LINKEDIN-ARTICLE.md', 'docs/marketing/LINKEDIN-POSTS.md'],
    other: [],
  },
};

// Build document tree from projects using real document mappings
function buildDocTree(projects: Project[]): DocFile[] {
  return projects.map((project) => {
    const mapping = PROJECT_DOC_MAPPINGS[project.id];
    const docsBase = project.id === 'taskboard' ? project.repoPath : `${project.repoPath}/docs`;

    // Helper to create doc entries
    const createDocEntries = (files: string[]): DocFile[] => {
      return files.map((file) => ({
        name: file.split('/').pop() || file,
        path: project.id === 'taskboard' ? `${project.repoPath}/${file}` : `${docsBase}/${file}`,
        type: 'md' as const,
      }));
    };

    // If we have a mapping, use it; otherwise show README
    if (mapping) {
      const children: DocFile[] = [];

      if (mapping.design.length > 0) {
        children.push({
          name: '📐 Design',
          path: `${docsBase}/design`,
          type: 'folder' as const,
          children: createDocEntries(mapping.design),
        });
      }

      if (mapping.engineering.length > 0) {
        children.push({
          name: '⚙️ Engineering',
          path: `${docsBase}/engineering`,
          type: 'folder' as const,
          children: createDocEntries(mapping.engineering),
        });
      }

      if (mapping.build.length > 0) {
        children.push({
          name: '🔨 Build',
          path: `${docsBase}/build`,
          type: 'folder' as const,
          children: createDocEntries(mapping.build),
        });
      }

      if (mapping.launch.length > 0) {
        children.push({
          name: '🚀 Launch',
          path: `${docsBase}/launch`,
          type: 'folder' as const,
          children: createDocEntries(mapping.launch),
        });
      }

      if (mapping.other.length > 0) {
        children.push({
          name: '📎 Other',
          path: `${docsBase}/other`,
          type: 'folder' as const,
          children: createDocEntries(mapping.other),
        });
      }

      // Always add README at root level
      children.unshift({
        name: 'README.md',
        path: `${project.repoPath}/README.md`,
        type: 'md' as const,
      });

      return {
        name: project.name,
        path: docsBase,
        type: 'folder' as const,
        children,
      };
    }

    // Fallback: just show README
    return {
      name: project.name,
      path: docsBase,
      type: 'folder' as const,
      children: [
        { name: 'README.md', path: `${project.repoPath}/README.md`, type: 'md' as const },
      ],
    };
  });
}

// No mock content needed - readDocument now provides meaningful dev mode content

export function DocsView() {
  const { projects, selectedDoc, setSelectedDoc, docContent, setDocContent, isEditMode, setEditMode } = useAppStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Get project from store (reactive to changes)
  const selectedProjectForDoc = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId) || null
    : null;

  // Build doc tree from projects
  const docTree = buildDocTree(projects);

  // Auto-expand first project folder
  useEffect(() => {
    if (projects.length > 0 && expandedFolders.size === 0) {
      const firstProject = projects[0];
      const docsBase = firstProject.id === 'taskboard' ? firstProject.repoPath : `${firstProject.repoPath}/docs`;
      setExpandedFolders(new Set([docsBase]));
    }
  }, [projects, expandedFolders.size]);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleDocSelect = async (doc: DocFile) => {
    setSelectedDoc(doc);
    setIsLoading(true);

    // Find which project this doc belongs to
    const project = projects.find((p) => doc.path.includes(p.repoPath));
    setSelectedProjectId(project?.id || null);

    try {
      const content = await readDocument(doc.path);
      setDocContent(content);
    } catch (err) {
      // Show error with file path
      setDocContent(`# ❌ Error Loading Document\n\n**Path:** \`${doc.path}\`\n\n**Error:** ${err instanceof Error ? err.message : 'Unknown error'}\n\nPlease check if the file exists and try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDocument = async (content: string) => {
    if (!selectedDoc) return;
    setIsSaving(true);
    try {
      await writeDocument(selectedDoc.path, content);
      setDocContent(content);
      setEditMode(false);
    } catch (err) {
      console.error('Failed to save document:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-100">Documents</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Browse and edit project documentation
        </p>
      </div>

      {/* File Tree */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar - File Tree */}
        <div className="lg:col-span-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
            Project Documents
          </div>
          <div className="space-y-1">
            {docTree.length === 0 ? (
              <div className="text-xs text-zinc-600 text-center py-4">
                No projects yet
              </div>
            ) : (
              docTree.map((doc) => (
                <FileTreeItem
                  key={doc.path}
                  doc={doc}
                  depth={0}
                  expandedFolders={expandedFolders}
                  onToggle={toggleFolder}
                  onSelect={handleDocSelect}
                  selectedPath={selectedDoc?.path}
                />
              ))
            )}
          </div>
        </div>

        {/* Main Content - Document Reader/Editor */}
        <div className="lg:col-span-3">
          {selectedDoc ? (
            <DocumentViewer
              doc={selectedDoc}
              content={docContent}
              isEditMode={isEditMode}
              isLoading={isLoading}
              isSaving={isSaving}
              project={selectedProjectForDoc}
              onSave={handleSaveDocument}
              onModeChange={setEditMode}
              onClose={() => setSelectedDoc(null)}
            />
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-zinc-400 text-sm">
                Select a document from the tree to view
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface FileTreeItemProps {
  doc: DocFile;
  depth: number;
  expandedFolders: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (doc: DocFile) => void;
  selectedPath?: string;
}

function FileTreeItem({
  doc,
  depth,
  expandedFolders,
  onToggle,
  onSelect,
  selectedPath,
}: FileTreeItemProps) {
  const isFolder = doc.type === 'folder';
  const isExpanded = expandedFolders.has(doc.path);
  const isSelected = doc.path === selectedPath;

  return (
    <div>
      <button
        onClick={() => (isFolder ? onToggle(doc.path) : onSelect(doc))}
        className={clsx(
          'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors text-left',
          isSelected
            ? 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30'
            : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
        )}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        <span className="text-base">
          {isFolder ? (isExpanded ? '📂' : '📁') : '📄'}
        </span>
        <span className="truncate">{doc.name}</span>
      </button>

      {isFolder && isExpanded && doc.children && (
        <div>
          {doc.children.map((child) => (
            <FileTreeItem
              key={child.path}
              doc={child}
              depth={depth + 1}
              expandedFolders={expandedFolders}
              onToggle={onToggle}
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface DocumentViewerProps {
  doc: DocFile;
  content: string;
  isEditMode: boolean;
  isLoading: boolean;
  isSaving: boolean;
  project: Project | null;
  onSave: (content: string) => void;
  onModeChange: (isEdit: boolean) => void;
  onClose: () => void;
}

function DocumentViewer({
  doc,
  content,
  isEditMode,
  isLoading,
  isSaving,
  project,
  onSave,
  onModeChange,
  onClose,
}: DocumentViewerProps) {
  const { addDocumentReview, updateDocumentReview, deleteDocumentReview, revokeApproval } = useAppStore();
  const [editContent, setEditContent] = useState(content);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [lastVoiceSuccess, setLastVoiceSuccess] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingReviewContent, setEditingReviewContent] = useState('');
  const { isRecording, isSupported, startRecording, stopRecording, error: recorderError } = useVoiceRecorder();

  // Update edit content when content changes
  useEffect(() => {
    setEditContent(content);
  }, [content]);

  // Check if this document has been approved - match by path or name
  const existingReviews = project?.reviews?.filter((r) =>
    r.documentPath === doc.path || r.documentName === doc.name
  ) || [];
  const isApproved = existingReviews.some((r) => r.approved && !r.resolved);
  const latestApproval = existingReviews.find((r) => r.approved && !r.resolved);

  const handleSave = () => {
    onSave(editContent);
  };

  const handleCancel = () => {
    setEditContent(content);
    onModeChange(false);
  };

  const handleApprove = () => {
    if (!project) return;

    const review: DocumentReview = {
      id: `r-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'approval',
      author: 'arun',
      documentPath: doc.path,
      documentName: doc.name,
      content: `Approved: ${doc.name}`,
      createdAt: new Date().toISOString(),
      forClaude: true,
      resolved: false,
      approved: true,
      source: 'text',
    };

    addDocumentReview(project.id, review);
  };

  const handleRevokeApproval = () => {
    if (!project || !latestApproval) return;
    revokeApproval(project.id, latestApproval.id);
  };

  const handleDeleteReview = (reviewId: string) => {
    if (!project) return;
    if (confirm('Delete this comment?')) {
      deleteDocumentReview(project.id, reviewId);
    }
  };

  const handleEditReview = (review: DocumentReview) => {
    setEditingReviewId(review.id);
    setEditingReviewContent(review.content);
  };

  const handleSaveEditReview = () => {
    if (!project || !editingReviewId || !editingReviewContent.trim()) return;
    updateDocumentReview(project.id, editingReviewId, { content: editingReviewContent.trim() });
    setEditingReviewId(null);
    setEditingReviewContent('');
  };

  const handleCancelEditReview = () => {
    setEditingReviewId(null);
    setEditingReviewContent('');
  };

  const handleComment = () => {
    if (!project || !commentText.trim()) return;

    const review: DocumentReview = {
      id: `r-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'feedback',
      author: 'arun',
      documentPath: doc.path,
      documentName: doc.name,
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

  const handleVoiceComment = async () => {
    setVoiceError(null);

    if (!isSupported) {
      setVoiceError('Voice recording not supported in this browser');
      return;
    }

    if (isRecording) {
      // Stop recording and transcribe
      const audioBlob = await stopRecording();
      if (audioBlob) {
        setIsTranscribing(true);
        const result = await transcribeAudio(audioBlob);
        setIsTranscribing(false);

        if (result.error) {
          setVoiceError(result.error);
          setLastVoiceSuccess(false);
        } else if (result.text && project) {
          // Create voice comment review
          const review: DocumentReview = {
            id: `r-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            type: 'feedback',
            author: 'arun',
            documentPath: doc.path,
            documentName: doc.name,
            content: result.text,
            createdAt: new Date().toISOString(),
            forClaude: true,
            resolved: false,
            approved: false,
            source: 'voice',
          };
          addDocumentReview(project.id, review);
          setLastVoiceSuccess(true);
          // Auto-hide success after 3 seconds
          setTimeout(() => setLastVoiceSuccess(false), 3000);
        }
      }
    } else {
      // Start recording
      await startRecording();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden animate-fade-in">
      {/* Header with Document Info */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <span className="text-lg">📄</span>
          <span className="text-sm font-medium text-zinc-200">{doc.name}</span>
          {isApproved && latestApproval && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full group">
              ✓ Approved by {latestApproval.author} ({formatDate(latestApproval.createdAt)})
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
          {/* View/Edit Toggle */}
          <div className="flex items-center bg-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => onModeChange(false)}
              className={clsx(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                !isEditMode
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              View
            </button>
            <button
              onClick={() => {
                setEditContent(content);
                onModeChange(true);
              }}
              className={clsx(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                isEditMode
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              Edit
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Review Toolbar */}
      {project && !isEditMode && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800/50 bg-zinc-800/30">
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
            onClick={() => setShowCommentInput(!showCommentInput)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-700 text-zinc-300 border border-zinc-600 hover:bg-zinc-600 transition-colors"
          >
            💬 Comment
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
            title={isRecording ? 'Click to stop & transcribe' : 'Click to start recording'}
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
          <span className="ml-auto text-xs text-zinc-500">
            {existingReviews.length > 0 && `${existingReviews.length} review(s)`}
          </span>
        </div>
      )}

      {/* Voice Success */}
      {lastVoiceSuccess && !isEditMode && (
        <div className="px-4 py-2 bg-green-500/10 border-b border-green-500/20 flex items-center gap-2">
          <span className="text-xs text-green-400">✓ Voice comment added</span>
          <AIBadge model="Groq Whisper" purpose="Voice transcription" />
        </div>
      )}

      {/* Voice Error */}
      {(voiceError || recorderError) && !isEditMode && !lastVoiceSuccess && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20">
          <p className="text-xs text-red-400">⚠️ {voiceError || recorderError}</p>
        </div>
      )}

      {/* Comment Input */}
      {showCommentInput && (
        <div className="px-4 py-3 border-b border-zinc-800/50 bg-zinc-800/20">
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

      {/* Reviews Section - Shows existing reviews */}
      {existingReviews.length > 0 && !isEditMode && (
        <div className="px-4 py-3 border-b border-zinc-800/50 bg-zinc-800/20">
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
                    {/* Edit/Delete buttons - only show for non-approval reviews */}
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
                        onClick={() => {
                          if (project) revokeApproval(project.id, review.id);
                        }}
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

      {/* Content */}
      {isLoading ? (
        <div className="p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : isEditMode ? (
        <div className="p-4">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full h-96 bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-zinc-200 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            placeholder="Enter markdown content..."
          />
          <div className="flex items-center justify-end gap-2 mt-3">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {isSaving && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 prose prose-sm max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

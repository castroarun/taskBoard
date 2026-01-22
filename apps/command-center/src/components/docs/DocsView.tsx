import { useState, useEffect } from 'react';
import { useAppStore, DocFile, Project } from '@/store';
import { readDocument, writeDocument } from '@/lib/tauri';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';

// Build document tree from projects
function buildDocTree(projects: Project[]): DocFile[] {
  return projects.map((project) => ({
    name: project.name,
    path: `${project.repoPath}/.taskboard/docs`,
    type: 'folder' as const,
    children: [
      {
        name: '1-design',
        path: `${project.repoPath}/.taskboard/docs/1-design`,
        type: 'folder' as const,
        children: [
          { name: 'idea.md', path: `${project.repoPath}/.taskboard/docs/1-design/idea.md`, type: 'md' as const },
          { name: 'discovery.md', path: `${project.repoPath}/.taskboard/docs/1-design/discovery.md`, type: 'md' as const },
          { name: 'APP_PRD.md', path: `${project.repoPath}/.taskboard/docs/1-design/APP_PRD.md`, type: 'md' as const },
        ],
      },
      {
        name: '2-engineering',
        path: `${project.repoPath}/.taskboard/docs/2-engineering`,
        type: 'folder' as const,
        children: [
          { name: 'ARCHITECTURE.md', path: `${project.repoPath}/.taskboard/docs/2-engineering/ARCHITECTURE.md`, type: 'md' as const },
          { name: 'TEST_CASES.md', path: `${project.repoPath}/.taskboard/docs/2-engineering/TEST_CASES.md`, type: 'md' as const },
        ],
      },
      {
        name: '3-build',
        path: `${project.repoPath}/.taskboard/docs/3-build`,
        type: 'folder' as const,
        children: [
          { name: 'CHANGELOG.md', path: `${project.repoPath}/.taskboard/docs/3-build/CHANGELOG.md`, type: 'md' as const },
        ],
      },
    ],
  }));
}

// Mock markdown content for development
const MOCK_CONTENT = `# Project Architecture

## Overview

This document outlines the technical architecture for the Command Center application.

## Tech Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Desktop App** | Tauri 2.0 + Rust | 3MB binary, native performance |
| **Frontend** | React 18 + TypeScript | Familiar ecosystem |
| **Styling** | Tailwind CSS | Utility-first, dark theme |
| **State** | Zustand | Minimal, no boilerplate |

## Core Components

### 1. Pipeline View
The main kanban board showing projects across 5 phases:
- Design (conception, discovery, requirements)
- Engineering (architecture, qa-planning, review)
- Build (development, testing, staging)
- Launch (ship, announce, walkthrough)
- Closure (documentation, portfolio, retrospective)

### 2. Quick Launch
Command palette accessible via \`Cmd+K\`:
- Search projects and tasks
- Execute commands
- Navigate between views

### 3. Document Viewer
Inline markdown reader and editor for project documentation.

## Data Flow

\`\`\`
User Input → Zustand Store → JSON Files → File Watcher → UI Update
\`\`\`

## Next Steps

- [ ] Implement file watchers
- [ ] Add drag-drop to kanban
- [ ] Build agent invocation
`;

export function DocsView() {
  const { projects, selectedDoc, setSelectedDoc, docContent, setDocContent, isEditMode, setEditMode } = useAppStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Build doc tree from projects
  const docTree = buildDocTree(projects);

  // Auto-expand first project folder
  useEffect(() => {
    if (projects.length > 0 && expandedFolders.size === 0) {
      setExpandedFolders(new Set([`${projects[0].repoPath}/.taskboard/docs`]));
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
    try {
      const content = await readDocument(doc.path);
      setDocContent(content);
    } catch {
      // Fallback to mock content for demo
      setDocContent(MOCK_CONTENT);
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
  onSave,
  onModeChange,
  onClose,
}: DocumentViewerProps) {
  const [editContent, setEditContent] = useState(content);

  // Update edit content when content changes
  useEffect(() => {
    setEditContent(content);
  }, [content]);

  const handleSave = () => {
    onSave(editContent);
  };

  const handleCancel = () => {
    setEditContent(content);
    onModeChange(false);
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <span className="text-lg">📄</span>
          <span className="text-sm font-medium text-zinc-200">{doc.name}</span>
          <span className="text-xs text-zinc-500">{doc.path}</span>
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

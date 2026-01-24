/**
 * HelpView Component
 *
 * Self-contained help documentation with indexed navigation.
 */

import { useState } from 'react';
import clsx from 'clsx';

type HelpSection = 'getting-started' | 'features' | 'workflow' | 'shortcuts' | 'configuration' | 'agents' | 'about';

const sections: { id: HelpSection; label: string; icon: React.ReactNode }[] = [
  { id: 'getting-started', label: 'Getting Started', icon: <RocketIcon /> },
  { id: 'features', label: 'Features', icon: <SparklesIcon /> },
  { id: 'workflow', label: '9-Step Workflow', icon: <FlowIcon /> },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: <KeyboardIcon /> },
  { id: 'configuration', label: 'Configuration', icon: <CogIcon /> },
  { id: 'agents', label: 'AI Agents', icon: <BotIcon /> },
  { id: 'about', label: 'About', icon: <InfoIcon /> },
];

export function HelpView() {
  const [activeSection, setActiveSection] = useState<HelpSection>('getting-started');

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar Navigation */}
      <nav className="w-48 border-r border-zinc-800 p-3 overflow-y-auto">
        <div className="mb-3">
          <h2 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Documentation</h2>
        </div>
        <ul className="space-y-0.5">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                onClick={() => setActiveSection(section.id)}
                className={clsx(
                  'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors text-left',
                  activeSection === section.id
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                )}
              >
                <span className="w-3.5 h-3.5">{section.icon}</span>
                {section.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-xl">
          {activeSection === 'getting-started' && <GettingStartedSection />}
          {activeSection === 'features' && <FeaturesSection />}
          {activeSection === 'workflow' && <WorkflowSection />}
          {activeSection === 'shortcuts' && <ShortcutsSection />}
          {activeSection === 'configuration' && <ConfigurationSection />}
          {activeSection === 'agents' && <AgentsSection />}
          {activeSection === 'about' && <AboutSection />}
        </div>
      </main>
    </div>
  );
}

// === SECTION COMPONENTS ===

function GettingStartedSection() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-base font-semibold text-zinc-100 mb-1">Getting Started</h1>
        <p className="text-xs text-zinc-500">Welcome to Task Board Command Center.</p>
      </header>

      <Section title="What is Task Board?">
        <p>
          A file-based project orchestration system with a structured 9-step workflow.
          Local file storage, full control over your data.
        </p>
      </Section>

      <Section title="Quick Start">
        <ol className="list-decimal list-inside space-y-1.5 text-zinc-300">
          <li><strong>Create a Project</strong> — <Kbd>+ New Project</Kbd> or <Kbd>Ctrl+K</Kbd></li>
          <li><strong>Set Up Workflow</strong> — Settings → Workflow</li>
          <li><strong>Add Tasks</strong> — Open project, create tasks</li>
          <li><strong>Track Progress</strong> — Move tasks through stages</li>
          <li><strong>Review Docs</strong> — Use the Docs tab</li>
        </ol>
      </Section>

      <Section title="Data Storage">
        <p className="mb-2">All data stored locally in JSON files.</p>
        <div className="bg-zinc-800/50 rounded p-2.5 font-mono text-[11px]">
          <div className="text-zinc-500 mb-1"># Data files</div>
          <div className="text-zinc-400">projects.json · tasks.json · inbox.md · config.json</div>
        </div>
      </Section>
    </div>
  );
}

function FeaturesSection() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-base font-semibold text-zinc-100 mb-1">Features</h1>
        <p className="text-xs text-zinc-500">Everything you can do with Command Center.</p>
      </header>

      <div className="grid gap-2">
        <FeatureCard icon={<PipelineIcon />} title="Project Board" description="Kanban board for projects by workflow phase. Drag & drop, drill into details." />
        <FeatureCard icon={<DocsIcon />} title="Document Viewer" description="Markdown viewer/editor. Navigate docs, edit files, real-time preview." />
        <FeatureCard icon={<InboxIcon />} title="Inbox" description="Quick capture for ideas & notes. Voice capture supported." />
        <FeatureCard icon={<SearchIcon />} title="Quick Launch" description="Ctrl+K to search projects, switch tabs, trigger actions." />
        <FeatureCard icon={<MicIcon />} title="Voice Capture" description="Voice notes transcribed via Groq Whisper API." />
        <FeatureCard icon={<BellIcon />} title="Notifications" description="Desktop alerts for task completion, stale projects, approvals." />
      </div>
    </div>
  );
}

function WorkflowSection() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-base font-semibold text-zinc-100 mb-1">9-Step Workflow</h1>
        <p className="text-xs text-zinc-500">Structured approach from idea to completion.</p>
      </header>

      <div className="space-y-3">
        <PhaseBlock phase="Design" color="#8b5cf6" stages={[
          { name: 'Conception', desc: 'Idea, problem, audience' },
          { name: 'Discovery', desc: 'Research, analysis, needs' },
          { name: 'Requirements', desc: 'PRD, user stories' },
        ]} />
        <PhaseBlock phase="Engineering" color="#3b82f6" stages={[
          { name: 'Architecture', desc: 'Tech design, diagrams' },
          { name: 'QA Planning', desc: 'Test strategy, cases' },
          { name: 'Review', desc: 'Approval, sign-off' },
        ]} />
        <PhaseBlock phase="Build" color="#22c55e" stages={[
          { name: 'Development', desc: 'Implementation, coding' },
          { name: 'Testing', desc: 'Unit/integration tests' },
          { name: 'Staging', desc: 'Pre-prod, UAT' },
        ]} />
        <PhaseBlock phase="Launch" color="#f59e0b" stages={[
          { name: 'Ship', desc: 'Deploy, release notes' },
          { name: 'Announce', desc: 'Marketing, social' },
          { name: 'Walkthrough', desc: 'Demo, onboarding' },
        ]} />
        <PhaseBlock phase="Closure" color="#ec4899" stages={[
          { name: 'Documentation', desc: 'Final docs, README' },
          { name: 'Portfolio', desc: 'Case study, screenshots' },
          { name: 'Retrospective', desc: 'Lessons, celebration' },
        ]} />
      </div>
    </div>
  );
}

function ShortcutsSection() {
  const shortcuts = [
    { category: 'Navigation', items: [
      { keys: '⌘ K', action: 'Quick Launch' },
      { keys: 'Ctrl 1', action: 'Projects' },
      { keys: 'Ctrl 2', action: 'Docs' },
      { keys: 'Ctrl 3', action: 'Inbox' },
      { keys: 'Ctrl 4', action: 'Help' },
    ]},
    { category: 'Actions', items: [
      { keys: '⌘ S', action: 'Save Document' },
      { keys: '⌘ N', action: 'New Project' },
      { keys: 'Esc', action: 'Close/Cancel' },
    ]},
    { category: 'Quick Launch', items: [
      { keys: '> new', action: 'New project' },
      { keys: '> settings', action: 'Settings' },
      { keys: '> voice', action: 'Voice capture' },
    ]},
  ];

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-base font-semibold text-zinc-100 mb-1">Keyboard Shortcuts</h1>
        <p className="text-xs text-zinc-500">Navigate faster with shortcuts.</p>
      </header>

      <div className="space-y-3">
        {shortcuts.map((group) => (
          <div key={group.category}>
            <h3 className="text-[11px] font-medium text-zinc-400 mb-1.5">{group.category}</h3>
            <div className="bg-zinc-800/50 rounded border border-zinc-700/50 overflow-hidden">
              {group.items.map((shortcut, i) => (
                <div
                  key={shortcut.action}
                  className={clsx(
                    'flex items-center justify-between px-2.5 py-1.5 text-xs',
                    i !== group.items.length - 1 && 'border-b border-zinc-700/30'
                  )}
                >
                  <span className="text-zinc-400">{shortcut.action}</span>
                  <Kbd>{shortcut.keys}</Kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfigurationSection() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-base font-semibold text-zinc-100 mb-1">Configuration</h1>
        <p className="text-xs text-zinc-500">Customize Task Board to fit your workflow.</p>
      </header>

      <Section title="Settings Panel">
        <p className="mb-2">Access via gear icon or <Kbd>⌘ ,</Kbd></p>
        <div className="space-y-1.5">
          <ConfigItem title="Profile" desc="Name, email, timezone, paths" />
          <ConfigItem title="Integrations" desc="Groq, GitHub, Jira" />
          <ConfigItem title="Workflow" desc="Phases, stages, priorities" />
          <ConfigItem title="Agents" desc="AI agent templates" />
          <ConfigItem title="Appearance" desc="Theme, accent, compact mode" />
          <ConfigItem title="Notifications" desc="Alerts, sound, timing" />
          <ConfigItem title="Advanced" desc="Debug, auto-save, backup" />
        </div>
      </Section>

      <Section title="Config File">
        <p className="mb-2">Settings stored in <code className="text-blue-400 text-[11px]">config.json</code></p>
        <div className="bg-zinc-800/50 rounded p-2 font-mono text-[10px] overflow-x-auto">
          <pre className="text-zinc-500">{`{ "user": {...}, "workflow": {...}, "integrations": {...} }`}</pre>
        </div>
      </Section>

      <Section title="Integrations">
        <div className="space-y-2">
          <div className="p-2.5 bg-zinc-800/50 rounded border border-zinc-700/50">
            <h4 className="text-xs font-medium text-zinc-300 mb-1">Groq (Voice)</h4>
            <p className="text-[11px] text-zinc-500">Get key from console.groq.com → Settings → Integrations</p>
          </div>
          <div className="p-2.5 bg-zinc-800/50 rounded border border-zinc-700/50">
            <h4 className="text-xs font-medium text-zinc-300 mb-1">Jira</h4>
            <p className="text-[11px] text-zinc-500">Token from id.atlassian.com → Settings → Integrations</p>
          </div>
        </div>
      </Section>
    </div>
  );
}

const GITHUB_BASE = 'https://github.com/castroarun/_claude-shared/blob/main';

const unifiedAgents = [
  {
    id: 'designer',
    name: 'Designer',
    invocation: '@designer',
    file: 'agents/designer.md',
    desc: 'Requirements via deep research',
    capabilities: ['WebSearch for research', 'Skill discovery', 'Systematic questioning', 'Creates idea.md, discovery.md, APP_PRD.md'],
    phase: 'Design',
  },
  {
    id: 'architect',
    name: 'Architect',
    invocation: '@architect',
    file: 'agents/architect.md',
    desc: 'System design, PRD, mockups',
    capabilities: ['Two-phase approach (Discovery → PRD)', 'HTML mockups generation', '.drawio diagrams', 'Jira integration', 'Creates ARCHITECTURE.md'],
    phase: 'Engineering',
  },
  {
    id: 'qa',
    name: 'QA',
    invocation: '@qa',
    file: 'agents/qa.md',
    desc: 'Test planning and execution',
    capabilities: ['TEST-PLAN.csv (Excel format)', 'TEST_CASES.md (Markdown)', 'test-results.md', 'Quality gates', 'Staging checklist'],
    phase: 'Engineering / Build',
  },
  {
    id: 'dev',
    name: 'Dev',
    invocation: '@dev',
    file: 'agents/dev.md',
    desc: 'Development tracking',
    capabilities: ['Task execution tracking', 'dev-log.md maintenance', 'Progress updates', 'Bug discovery workflow', 'Code standards'],
    phase: 'Build',
  },
  {
    id: 'walkthrough',
    name: 'Walkthrough',
    invocation: '@walkthrough',
    file: 'agents/walkthrough.md',
    desc: 'Code walkthroughs',
    capabilities: ['Live code explanation', 'WALKTHROUGH.md generation', 'Feature documentation'],
    phase: 'Launch',
  },
];

const unifiedCommands = [
  {
    id: 'readme',
    name: 'README',
    invocation: '/readme',
    file: 'commands/readme.md',
    desc: 'README quality scoring',
    capabilities: ['Quality score 0-100', 'Badge generation', 'LAUNCHPAD validation', 'Roadmap sync', 'Auto-fix suggestions'],
  },
  {
    id: 'git',
    name: 'Git',
    invocation: '/git',
    file: 'commands/git.md',
    desc: 'Git operations',
    capabilities: ['Commit standards', 'LAUNCHPAD sync on push', 'Branch management', 'README check before push'],
  },
  {
    id: 'docs',
    name: 'Docs',
    invocation: '/docs',
    file: 'commands/docs.md',
    desc: 'Documentation generation',
    capabilities: ['README.md', 'CHANGELOG.md', 'WALKTHROUGH.md', 'portfolio-entry.md', 'linkedin-post.md', 'retro.md'],
  },
  {
    id: 'deploy',
    name: 'Deploy',
    invocation: '/deploy',
    file: 'commands/deploy.md',
    desc: 'Deployment workflows',
    capabilities: ['Production deploy', 'Staging deploy', 'Environment configuration'],
  },
  {
    id: 'newproject',
    name: 'New Project',
    invocation: '/newproject',
    file: 'commands/newproject.md',
    desc: 'Project initialization',
    capabilities: ['9-step workflow setup', 'Folder structure', 'Template files', 'DEV-CLOCK.md', 'PROJECT-STATUS.md'],
  },
];

function AgentsSection() {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [expandedCommand, setExpandedCommand] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-base font-semibold text-zinc-100 mb-1">AI Agents</h1>
        <p className="text-xs text-zinc-500">Unified agents from <code className="text-blue-400/70">_claude-shared</code> for AI-assisted development.</p>
      </header>

      <Section title="What are Agents?">
        <p>Markdown templates that guide AI assistants. Use <code className="text-blue-400">@agent</code> in Claude Code IDE or automatically via inbox.md.</p>
      </Section>

      <Section title="Agents (@invocation)">
        <div className="space-y-1.5">
          {unifiedAgents.map((agent) => (
            <ExpandableAgentCard
              key={agent.id}
              agent={agent}
              isExpanded={expandedAgent === agent.id}
              onToggle={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
              githubUrl={`${GITHUB_BASE}/${agent.file}`}
            />
          ))}
        </div>
      </Section>

      <Section title="Commands (/invocation)">
        <div className="space-y-1.5">
          {unifiedCommands.map((cmd) => (
            <ExpandableCommandCard
              key={cmd.id}
              command={cmd}
              isExpanded={expandedCommand === cmd.id}
              onToggle={() => setExpandedCommand(expandedCommand === cmd.id ? null : cmd.id)}
              githubUrl={`${GITHUB_BASE}/${cmd.file}`}
            />
          ))}
        </div>
      </Section>

      <Section title="Execution Modes">
        <div className="space-y-1.5 text-zinc-400">
          <div className="flex items-center gap-2 px-2 py-1.5 bg-zinc-800/30 rounded">
            <div className="w-1.5 h-1.5 bg-green-500/70 rounded-full flex-shrink-0" />
            <span className="text-xs"><strong>Manual</strong> — Type @agent or /command in Claude Code</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 bg-zinc-800/30 rounded">
            <div className="w-1.5 h-1.5 bg-blue-500/70 rounded-full flex-shrink-0" />
            <span className="text-xs"><strong>Auto</strong> — App detects inbox.md changes, spawns agents</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 bg-zinc-800/30 rounded">
            <div className="w-1.5 h-1.5 bg-purple-500/70 rounded-full flex-shrink-0" />
            <span className="text-xs"><strong>Hybrid</strong> — Both modes enabled (default)</span>
          </div>
        </div>
      </Section>

      <Section title="Source">
        <a
          href="https://github.com/castroarun/_claude-shared"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-2.5 py-2 bg-zinc-800/50 rounded border border-zinc-700/50 hover:bg-zinc-800 transition-colors group"
        >
          <GitHubIcon className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
          <span className="text-xs text-zinc-400 group-hover:text-zinc-300">castroarun/_claude-shared</span>
          <ExternalLinkIcon className="w-3 h-3 text-zinc-600 ml-auto" />
        </a>
      </Section>
    </div>
  );
}

interface AgentData {
  id: string;
  name: string;
  invocation: string;
  file: string;
  desc: string;
  capabilities: string[];
  phase: string;
}

interface CommandData {
  id: string;
  name: string;
  invocation: string;
  file: string;
  desc: string;
  capabilities: string[];
}

function ExpandableAgentCard({
  agent,
  isExpanded,
  onToggle,
  githubUrl,
}: {
  agent: AgentData;
  isExpanded: boolean;
  onToggle: () => void;
  githubUrl: string;
}) {
  return (
    <div className="bg-zinc-800/30 rounded border border-zinc-800/50 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-2.5 py-2 flex items-center gap-2 text-left hover:bg-zinc-800/50 transition-colors"
      >
        <ChevronIcon className={clsx('w-3 h-3 text-zinc-500 transition-transform', isExpanded && 'rotate-90')} />
        <span className="text-xs font-medium text-zinc-300">{agent.name}</span>
        <code className="text-[10px] text-blue-400/70 bg-blue-500/10 px-1.5 py-0.5 rounded">{agent.invocation}</code>
        <span className="text-[10px] text-zinc-600 ml-auto">{agent.phase}</span>
      </button>
      {isExpanded && (
        <div className="px-2.5 pb-2.5 pt-1 border-t border-zinc-800/50">
          <p className="text-[11px] text-zinc-500 mb-2">{agent.desc}</p>
          <div className="mb-2">
            <h4 className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Capabilities</h4>
            <ul className="space-y-0.5">
              {agent.capabilities.map((cap, i) => (
                <li key={i} className="text-[11px] text-zinc-400 flex items-start gap-1.5">
                  <span className="text-green-500/70 mt-0.5">•</span>
                  {cap}
                </li>
              ))}
            </ul>
          </div>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-blue-400 transition-colors"
          >
            <DownloadIcon className="w-3 h-3" />
            View on GitHub
          </a>
        </div>
      )}
    </div>
  );
}

function ExpandableCommandCard({
  command,
  isExpanded,
  onToggle,
  githubUrl,
}: {
  command: CommandData;
  isExpanded: boolean;
  onToggle: () => void;
  githubUrl: string;
}) {
  return (
    <div className="bg-zinc-800/30 rounded border border-zinc-800/50 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-2.5 py-2 flex items-center gap-2 text-left hover:bg-zinc-800/50 transition-colors"
      >
        <ChevronIcon className={clsx('w-3 h-3 text-zinc-500 transition-transform', isExpanded && 'rotate-90')} />
        <span className="text-xs font-medium text-zinc-300">{command.name}</span>
        <code className="text-[10px] text-emerald-400/70 bg-emerald-500/10 px-1.5 py-0.5 rounded">{command.invocation}</code>
      </button>
      {isExpanded && (
        <div className="px-2.5 pb-2.5 pt-1 border-t border-zinc-800/50">
          <p className="text-[11px] text-zinc-500 mb-2">{command.desc}</p>
          <div className="mb-2">
            <h4 className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Outputs</h4>
            <ul className="space-y-0.5">
              {command.capabilities.map((cap, i) => (
                <li key={i} className="text-[11px] text-zinc-400 flex items-start gap-1.5">
                  <span className="text-emerald-500/70 mt-0.5">•</span>
                  {cap}
                </li>
              ))}
            </ul>
          </div>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-blue-400 transition-colors"
          >
            <DownloadIcon className="w-3 h-3" />
            View on GitHub
          </a>
        </div>
      )}
    </div>
  );
}

function AboutSection() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-base font-semibold text-zinc-100 mb-1">About</h1>
        <p className="text-xs text-zinc-500">Version and credits.</p>
      </header>

      <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-sm font-bold text-white">TB</span>
          </div>
          <div>
            <div className="text-sm font-medium text-zinc-100">Task Board</div>
            <div className="text-[11px] text-zinc-500">Command Center v1.0.0</div>
          </div>
        </div>
        <p className="text-xs text-zinc-500 mb-3">File-based project orchestration with AI agent integration.</p>
        <div className="flex items-center gap-4 pt-2 border-t border-zinc-700/50 text-[11px]">
          <a href="https://github.com/castroarun/taskboard" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300">GitHub</a>
          <a href="https://github.com/castroarun/taskboard/issues" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300">Issues</a>
        </div>
      </div>

      <Section title="Tech Stack">
        <div className="flex flex-wrap gap-1.5">
          {['Tauri 2.0', 'React 18', 'TypeScript', 'Tailwind', 'Zustand', 'Vite'].map((tech) => (
            <span key={tech} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] rounded border border-zinc-700/50">
              {tech}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Links">
        <div className="space-y-1.5">
          <ExternalLink href="https://console.groq.com" label="Groq Console" desc="Voice API" />
          <ExternalLink href="https://tauri.app" label="Tauri" desc="Desktop framework" />
          <ExternalLink href="https://id.atlassian.com/manage-profile/security/api-tokens" label="Atlassian" desc="Jira tokens" />
        </div>
      </Section>
    </div>
  );
}

// === HELPER COMPONENTS ===

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs font-medium text-zinc-300 mb-1.5">{title}</h2>
      <div className="text-xs text-zinc-500 leading-relaxed">{children}</div>
    </section>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] rounded border border-zinc-700 font-mono">
      {children}
    </kbd>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-2.5 p-2 bg-zinc-800/30 rounded border border-zinc-800/50">
      <div className="w-7 h-7 bg-zinc-800 rounded flex items-center justify-center text-zinc-500 flex-shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">
        {icon}
      </div>
      <div>
        <h3 className="text-xs font-medium text-zinc-300">{title}</h3>
        <p className="text-[11px] text-zinc-500">{description}</p>
      </div>
    </div>
  );
}

function PhaseBlock({ phase, color, stages }: { phase: string; color: string; stages: { name: string; desc: string }[] }) {
  return (
    <div className="rounded border border-zinc-800/50 overflow-hidden">
      <div className="px-2.5 py-1.5 flex items-center gap-1.5" style={{ backgroundColor: `${color}15` }}>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-medium text-zinc-300">{phase}</span>
      </div>
      <div className="divide-y divide-zinc-800/50">
        {stages.map((stage, i) => (
          <div key={stage.name} className="px-2.5 py-1.5 flex items-center gap-2">
            <span className="text-[10px] text-zinc-600 font-mono w-3">{i + 1}</span>
            <span className="text-xs text-zinc-400">{stage.name}</span>
            <span className="text-[11px] text-zinc-600">— {stage.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfigItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-zinc-800/30 rounded">
      <div className="w-1.5 h-1.5 bg-blue-500/70 rounded-full flex-shrink-0" />
      <span className="text-xs text-zinc-400">{title}</span>
      <span className="text-[11px] text-zinc-600">— {desc}</span>
    </div>
  );
}

function ExternalLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between px-2 py-1.5 bg-zinc-800/30 rounded hover:bg-zinc-800/50 transition-colors group"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400 group-hover:text-zinc-300">{label}</span>
        <span className="text-[10px] text-zinc-600">{desc}</span>
      </div>
      <ExternalLinkIcon className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />
    </a>
  );
}

// === ICONS (all w-3.5 h-3.5 for sidebar, feature cards override via parent) ===

function RocketIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function FlowIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

function KeyboardIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3h6m-6 0v2m6-2v2M9 21h6m-6 0v-2m6 2v-2M4 7h16a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z" />
    </svg>
  );
}

function CogIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function BotIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PipelineIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}

function DocsIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
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

function ExternalLinkIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function ChevronIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function DownloadIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function GitHubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}
